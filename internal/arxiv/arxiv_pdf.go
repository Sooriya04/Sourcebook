package arxiv

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"sourcebook/internal/utils"

	"github.com/PuerkitoBio/goquery"
	"github.com/ledongthuc/pdf"
)

func tryFetchArxivPDF(ctx context.Context, id string) (string, string, error) {
	pdfURL := fmt.Sprintf("%s/pdf/%s.pdf", arxivBaseURL, id)
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

	limitedReader := io.LimitReader(resp.Body, maxArxivPDFSize+1)
	copied, err := io.Copy(tmpFile, limitedReader)
	if err != nil {
		tmpFile.Close()
		return "", "", err
	}
	if copied > maxArxivPDFSize {
		tmpFile.Close()
		return "", "", fmt.Errorf("PDF download exceeded maximum size limit of %d bytes", maxArxivPDFSize)
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
	absURL := fmt.Sprintf("%s/abs/%s", arxivBaseURL, id)
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
