package searx

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

type SearXNGProvider struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewSearXNGProvider(baseURL string) *SearXNGProvider {
	return &SearXNGProvider{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *SearXNGProvider) Name() string {
	return "searxng"
}

func (s *SearXNGProvider) Search(ctx context.Context, query string, options models.SearchOptions) ([]models.SearchResult, error) {
	reqURL, err := url.Parse(s.BaseURL + "/search")
	if err != nil {
		return nil, err
	}

	q := reqURL.Query()
	q.Set("q", query)

	if options.Language != "" {
		q.Set("language", options.Language)
	}

	var categories []string
	if options.Web {
		categories = append(categories, "general")
	}
	if options.Images {
		categories = append(categories, "images")
	}
	if options.News {
		categories = append(categories, "news")
	}
	if options.Videos {
		categories = append(categories, "videos")
	}

	if len(categories) == 0 {
		categories = append(categories, "general")
	}

	for _, cat := range categories {
		q.Add("categories", cat)
	}

	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL.String(), nil)
	if err != nil {
		return nil, err
	}

	// Use a browser-like User-Agent to reduce basic blocking.
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SourceBook/1.0")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("searxng returned status %d", resp.StatusCode)
	}

	// Parse the HTML search page into normalized SourceBook results.
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}

	var results []models.SearchResult

	// Parse web results from the SearXNG HTML layout.
	doc.Find("article.result").Each(func(i int, s *goquery.Selection) {
		title := strings.TrimSpace(s.Find("h3 > a").Text())
		if title == "" {
			title = strings.TrimSpace(s.Find("h4 > a").Text())
		}
		link, _ := s.Find("h3 > a").Attr("href")
		if link == "" {
			link, _ = s.Find("h4 > a").Attr("href")
		}
		content := strings.TrimSpace(s.Find("p.content").Text())

		// Theme layouts vary slightly, so fall back to alternate selectors.
		if content == "" {
			content = strings.TrimSpace(s.Find(".snippet").Text())
		}

		engine := strings.TrimSpace(s.Find(".engines span").Text())

		if title != "" && link != "" {
			res := models.SearchResult{
				Title:   title,
				URL:     link,
				Snippet: content,
				Source:  engine,
			}

			// Capture images when the result includes them.
			if img, ok := s.Find("img.image").Attr("src"); ok {
				res.ImageURL = img
			}

			results = append(results, res)
		}
	})

	return results, nil
}
