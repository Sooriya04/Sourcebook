package ddg

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"sourcebook/internal/models"
)

type DuckDuckGoProvider struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewDuckDuckGoProvider() *DuckDuckGoProvider {
	return &DuckDuckGoProvider{
		BaseURL: "https://html.duckduckgo.com/html/",
		HTTPClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

func (d *DuckDuckGoProvider) Name() string {
	return "duckduckgo"
}

func (d *DuckDuckGoProvider) Search(ctx context.Context, query string, options models.SearchOptions) ([]models.SearchResult, error) {
	reqURL, err := url.Parse(d.BaseURL)
	if err != nil {
		return nil, err
	}

	q := reqURL.Query()
	q.Set("q", query)
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL.String(), nil)
	if err != nil {
		return nil, err
	}

	// Use exact headers that mimic Python requests/normal browsers to avoid the CAPTCHA block page
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Referer", "https://duckduckgo.com/")

	resp, err := d.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("duckduckgo returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}

	var results []models.SearchResult

	doc.Find(".result__body").Each(func(i int, s *goquery.Selection) {
		titleAnchor := s.Find("a.result__a")
		title := strings.TrimSpace(titleAnchor.Text())
		rawHref, _ := titleAnchor.Attr("href")

		snippet := strings.TrimSpace(s.Find(".result__snippet").Text())

		if title != "" && rawHref != "" {
			targetURL := cleanDDGURL(rawHref)
			if targetURL != "" {
				results = append(results, models.SearchResult{
					Title:   title,
					URL:     targetURL,
					Snippet: snippet,
					Source:  "duckduckgo",
				})
			}
		}
	})

	return results, nil
}

func cleanDDGURL(raw string) string {
	if !strings.Contains(raw, "uddg=") {
		if strings.HasPrefix(raw, "//") {
			return "https:" + raw
		}
		return raw
	}

	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}

	target := u.Query().Get("uddg")
	if target != "" {
		return target
	}

	return raw
}
