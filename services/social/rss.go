package main

import (
	"context"
	"encoding/xml"
	"fmt"
	"html"
	"io"
	"net/http"
	"strings"
	"time"
)

type RSSFeed struct {
	XMLName xml.Name `xml:"rss"`
	Channel struct {
		Title       string `xml:"title"`
		Link        string `xml:"link"`
		Description string `xml:"description"`
		Items       []struct {
			Title       string `xml:"title"`
			Link        string `xml:"link"`
			Description string `xml:"description"`
			PubDate     string `xml:"pubDate"`
		} `xml:"item"`
	} `xml:"channel"`
}

type AtomFeed struct {
	XMLName xml.Name `xml:"feed"`
	Title   string   `xml:"title"`
	Entries []struct {
		Title     string `xml:"title"`
		Link      struct {
			Href string `xml:"href,attr"`
		} `xml:"link"`
		Summary   string `xml:"summary"`
		Content   string `xml:"content"`
		Published string `xml:"published"`
	} `xml:"entry"`
}

func isFeedURL(url string) bool {
	lower := strings.ToLower(url)
	return strings.HasSuffix(lower, ".xml") ||
		strings.HasSuffix(lower, ".rss") ||
		strings.Contains(lower, "/feed") ||
		strings.Contains(lower, "/rss") ||
		strings.Contains(lower, "/atom") ||
		strings.Contains(lower, "?atom") ||
		strings.Contains(lower, "format=atom")
}

func scrapeFeedURL(ctx context.Context, url string) (string, string, error) {
	reqCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "GET", url, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml, */*")

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("feed server returned status %d", resp.StatusCode)
	}

	xmlData, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024)) // 5MB limit
	if err != nil {
		return "", "", err
	}

	return parseFeed(xmlData)
}

func parseFeed(xmlData []byte) (string, string, error) {
	// Try RSS
	var rss RSSFeed
	if err := xml.Unmarshal(xmlData, &rss); err == nil && rss.Channel.Title != "" {
		title := rss.Channel.Title
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("# %s\n\n", title))
		if rss.Channel.Description != "" {
			sb.WriteString(fmt.Sprintf("> %s\n\n", rss.Channel.Description))
		}
		for i, item := range rss.Channel.Items {
			sb.WriteString(fmt.Sprintf("## [%d] %s\n", i+1, strings.TrimSpace(item.Title)))
			if item.PubDate != "" {
				sb.WriteString(fmt.Sprintf("*Published: %s*\n\n", item.PubDate))
			}
			if item.Link != "" {
				sb.WriteString(fmt.Sprintf("[Read Original Article](%s)\n\n", item.Link))
			}
			desc := stripHTML(item.Description)
			if desc != "" {
				desc = truncateRunes(desc, 500)
				sb.WriteString(desc + "\n\n")
			}
			sb.WriteString("---\n\n")
		}
		return title, sb.String(), nil
	}

	// Try Atom
	var atom AtomFeed
	if err := xml.Unmarshal(xmlData, &atom); err == nil && atom.Title != "" {
		title := atom.Title
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("# %s\n\n", title))
		for i, entry := range atom.Entries {
			sb.WriteString(fmt.Sprintf("## [%d] %s\n", i+1, strings.TrimSpace(entry.Title)))
			if entry.Published != "" {
				sb.WriteString(fmt.Sprintf("*Published: %s*\n\n", entry.Published))
			}
			if entry.Link.Href != "" {
				sb.WriteString(fmt.Sprintf("[Read Original Article](%s)\n\n", entry.Link.Href))
			}
			body := entry.Content
			if body == "" {
				body = entry.Summary
			}
			body = stripHTML(body)
			if body != "" {
				body = truncateRunes(body, 500)
				sb.WriteString(body + "\n\n")
			}
			sb.WriteString("---\n\n")
		}
		return title, sb.String(), nil
	}

	return "", "", fmt.Errorf("unable to parse xml data as RSS or Atom feed")
}

func stripHTML(s string) string {
	var sb strings.Builder
	inTag := false
	for _, r := range s {
		if r == '<' {
			inTag = true
		} else if r == '>' {
			inTag = false
		} else if !inTag {
			sb.WriteRune(r)
		}
	}
	res := html.UnescapeString(sb.String())
	return strings.TrimSpace(res)
}

// truncateRunes safely truncates a string to maxRunes characters, appending "..." if truncated.
func truncateRunes(s string, maxRunes int) string {
	runes := []rune(s)
	if len(runes) <= maxRunes {
		return s
	}
	return string(runes[:maxRunes]) + "..."
}
