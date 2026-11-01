package api

import (
	"context"
	"log"
	"strings"
	"sync"

	"sourcebook/internal/arxiv"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/utils"
)

type categorizedURLs struct {
	web     []string
	youtube []string
	arxiv   []string
	reddit  []string
	social  []string
}

func categorizeURLs(urls []string) categorizedURLs {
	var cat categorizedURLs
	for _, u := range urls {
		if strings.Contains(u, "youtube.com") || strings.Contains(u, "youtu.be") {
			cat.youtube = append(cat.youtube, u)
		} else if arxiv.IsArxivURL(u) {
			cat.arxiv = append(cat.arxiv, u)
		} else if utils.IsRedditURL(u) {
			cat.reddit = append(cat.reddit, u)
		} else if utils.IsSocialURL(u) {
			cat.social = append(cat.social, u)
		} else {
			cat.web = append(cat.web, u)
		}
	}
	return cat
}

func scrapeYouTubeURLs(ctx context.Context, urls []string) []synthesis.ScrapedDoc {
	var docs []synthesis.ScrapedDoc
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, yu := range urls {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			log.Printf("[Pipeline] Intercepted YouTube URL for transcript extraction: %s", url)
			transcript, ytErr := FetchSingleYouTubeTranscript(ctx, url)
			if ytErr == nil && transcript != "" {
				cleanText := utils.CleanText(transcript)
				if cleanText != "" {
					title := FetchYouTubeTitle(ctx, url)
					mu.Lock()
					docs = append(docs, synthesis.ScrapedDoc{
						Title:   title,
						URL:     url,
						Content: cleanText,
					})
					mu.Unlock()
				}
			} else {
				log.Printf("[Pipeline] Failed to extract YouTube transcript for %s: %v", url, ytErr)
			}
		}(yu)
	}
	wg.Wait()
	return docs
}

func scrapeArxivURLs(ctx context.Context, urls []string) []synthesis.ScrapedDoc {
	var docs []synthesis.ScrapedDoc
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, au := range urls {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			log.Printf("[Pipeline] Intercepted arXiv URL for paper extraction: %s", url)
			title, content, axErr := arxiv.FetchSingleArxivDocument(ctx, url)
			if axErr == nil && content != "" {
				if title == "" {
					title = "arXiv Paper"
				}
				mu.Lock()
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   title,
					URL:     url,
					Content: content,
				})
				mu.Unlock()
			} else {
				log.Printf("[Pipeline] Failed to extract arXiv paper for %s: %v", url, axErr)
			}
		}(au)
	}
	wg.Wait()
	return docs
}

func scrapeRedditURLs(ctx context.Context, urls []string) []synthesis.ScrapedDoc {
	if len(urls) == 0 {
		return nil
	}
	log.Printf("[Pipeline] Intercepted %d Reddit URL(s) for microservice extraction", len(urls))
	res, err := utils.ScrapeWithReddit(ctx, urls)
	if err != nil {
		log.Printf("[Pipeline] Reddit microservice call failed: %v", err)
		return nil
	}
	var docs []synthesis.ScrapedDoc
	for _, item := range res {
		if item.Success && item.Markdown != "" {
			cleanText := utils.CleanText(item.Markdown)
			if cleanText != "" {
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   item.Title,
					URL:     item.URL,
					Content: cleanText,
				})
			}
		} else {
			log.Printf("[Pipeline] Reddit scrape failed for %s: %s", item.URL, item.Error)
		}
	}
	return docs
}

func scrapeSocialURLs(ctx context.Context, urls []string) []synthesis.ScrapedDoc {
	if len(urls) == 0 {
		return nil
	}
	log.Printf("[Pipeline] Intercepted %d Social/Feed URL(s) for microservice extraction", len(urls))
	res, err := utils.ScrapeWithSocial(ctx, urls)
	if err != nil {
		log.Printf("[Pipeline] Social microservice call failed: %v", err)
		return nil
	}
	var docs []synthesis.ScrapedDoc
	for _, item := range res {
		if item.Success && item.Markdown != "" {
			cleanText := utils.CleanText(item.Markdown)
			if cleanText != "" {
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   item.Title,
					URL:     item.URL,
					Content: cleanText,
				})
			}
		} else {
			log.Printf("[Pipeline] Social scrape failed for %s: %s", item.URL, item.Error)
		}
	}
	return docs
}
