package arxiv

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"sourcebook/internal/utils"

	"github.com/PuerkitoBio/goquery"
	"github.com/ledongthuc/pdf"
)

var arxivIDRegex = regexp.MustCompile(`arxiv\.org/(?:abs|pdf|html)/([a-zA-Z0-9.\-]+?)(?:\.pdf)?(?:/|$)`)

// ExtractArxivID extracts the paper ID from any arXiv URL.
func ExtractArxivID(rawURL string) string {
	matches := arxivIDRegex.FindStringSubmatch(rawURL)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

// IsArxivURL checks if a given URL is an arXiv link.
func IsArxivURL(rawURL string) bool {
	return strings.Contains(rawURL, "arxiv.org") || ExtractArxivID(rawURL) != ""
}

// FetchSingleArxivDocument retrieves and extracts full text/markdown for an arXiv paper.
func FetchSingleArxivDocument(ctx context.Context, rawURL string) (string, string, error) {
	id := ExtractArxivID(rawURL)
	if id == "" {
		return "", "", fmt.Errorf("invalid arXiv URL: %s", rawURL)
	}

	log.Printf("[ArXiv] Processing arXiv paper ID: %s (Original URL: %s)", id, rawURL)

	// 1. Try Jina Reader Microservice first
	log.Printf("[ArXiv] Trying Jina Reader microservice for arXiv paper: %s", rawURL)
	jinaResults, err := utils.ScrapeWithJina(ctx, []string{rawURL})
	if err == nil && len(jinaResults) > 0 && jinaResults[0].Success && jinaResults[0].Markdown != "" {
		log.Printf("[ArXiv] Successfully extracted %d chars from Jina Reader for %s", len(jinaResults[0].Markdown), id)
		title := jinaResults[0].Title
		if title == "" {
			title = fmt.Sprintf("arXiv Paper %s", id)
		}
		return title, jinaResults[0].Markdown, nil
	} else {
		log.Printf("[ArXiv] Jina Reader microservice fallback triggered (err=%v)", err)
	}

	// 2. Try HTML Version (https://arxiv.org/html/<id>)
	title, content, err := tryFetchArxivHTML(ctx, id)
	if err == nil && content != "" {
		log.Printf("[ArXiv] Successfully extracted %d chars from arXiv HTML for %s", len(content), id)
		return title, content, nil
	}

	// 3. Try PDF Version (https://arxiv.org/pdf/<id>.pdf)
	pdfTitle, pdfContent, err := tryFetchArxivPDF(ctx, id)
	if err == nil && pdfContent != "" {
		if title == "" {
			title = pdfTitle
		}
		log.Printf("[ArXiv] Successfully extracted %d chars from arXiv PDF for %s", len(pdfContent), id)
		return title, pdfContent, nil
	}

	// 4. Fallback to Abstract Metadata (https://arxiv.org/abs/<id>)
	absTitle, absContent, err := tryFetchArxivAbstract(ctx, id)
	if err == nil && absContent != "" {
		log.Printf("[ArXiv] Extracted abstract fallback (%d chars) for %s", len(absContent), id)
		return absTitle, absContent, nil
	}

	return "", "", fmt.Errorf("failed to extract arXiv content for ID %s", id)
}

func tryFetchArxivHTML(ctx context.Context, id string) (string, string, error) {
	htmlURL := fmt.Sprintf("https://arxiv.org/html/%s", id)
	req, err := http.NewRequestWithContext(ctx, "GET", htmlURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("HTML version returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", "", err
	}

	title := strings.TrimSpace(doc.Find("title").Text())
	title = strings.TrimPrefix(title, "[arXiv] ")

	bodyText := doc.Find("article, main, body").Text()
	cleanText := utils.CleanText(bodyText)

	if len(cleanText) < 200 {
		return "", "", fmt.Errorf("extracted HTML text too short")
	}

	return title, cleanText, nil
}

func tryFetchArxivPDF(ctx context.Context, id string) (string, string, error) {
	pdfURL := fmt.Sprintf("https://arxiv.org/pdf/%s.pdf", id)
	req, err := http.NewRequestWithContext(ctx, "GET", pdfURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	client := &http.Client{Timeout: 45 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("PDF download status %d", resp.StatusCode)
	}

	tmpFile, err := os.CreateTemp("", "arxiv-*.pdf")
	if err != nil {
		return "", "", err
	}
	defer os.Remove(tmpFile.Name())

	_, err = io.Copy(tmpFile, resp.Body)
	if err != nil {
		tmpFile.Close()
		return "", "", err
	}
	tmpFile.Close()

	f, r, err := pdf.Open(tmpFile.Name())
	if err != nil {
		return "", "", err
	}
	defer f.Close()

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		return "", "", err
	}
	buf.ReadFrom(b)

	text := utils.CleanText(buf.String())
	if len(text) < 100 {
		return "", "", fmt.Errorf("PDF text too short or empty")
	}

	title := fmt.Sprintf("arXiv Paper %s", id)
	return title, text, nil
}

func tryFetchArxivAbstract(ctx context.Context, id string) (string, string, error) {
	absURL := fmt.Sprintf("https://arxiv.org/abs/%s", id)
	req, err := http.NewRequestWithContext(ctx, "GET", absURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("Abstract page status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", "", err
	}

	title := strings.TrimSpace(doc.Find("meta[name='citation_title']").AttrOr("content", ""))
	if title == "" {
		title = strings.TrimSpace(doc.Find("meta[property='og:title']").AttrOr("content", ""))
	}

	abstract := strings.TrimSpace(doc.Find("meta[name='citation_abstract']").AttrOr("content", ""))
	if abstract == "" {
		abstract = strings.TrimSpace(doc.Find("blockquote.abstract").Text())
	}

	var authors []string
	doc.Find("meta[name='citation_author']").Each(func(_ int, s *goquery.Selection) {
		if auth := strings.TrimSpace(s.AttrOr("content", "")); auth != "" {
			authors = append(authors, auth)
		}
	})

	var fullContent strings.Builder
	if title != "" {
		fullContent.WriteString(fmt.Sprintf("# %s\n\n", title))
	}
	if len(authors) > 0 {
		fullContent.WriteString(fmt.Sprintf("**Authors**: %s\n\n", strings.Join(authors, ", ")))
	}
	if abstract != "" {
		fullContent.WriteString(fmt.Sprintf("## Abstract\n\n%s", abstract))
	}

	cleanText := utils.CleanText(fullContent.String())
	return title, cleanText, nil
}
