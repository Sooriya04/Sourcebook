package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

func isSocialMediaURL(url string) bool {
	lower := strings.ToLower(url)
	return strings.Contains(lower, "weixin.qq.com") ||
		strings.Contains(lower, "weibo.com") ||
		strings.Contains(lower, "weibo.cn") ||
		strings.Contains(lower, "bilibili.com") ||
		strings.Contains(lower, "b23.tv") ||
		strings.Contains(lower, "facebook.com") ||
		strings.Contains(lower, "fb.com") ||
		strings.Contains(lower, "fb.watch") ||
		strings.Contains(lower, "linkedin.com")
}

func scrapeSocialMediaURL(ctx context.Context, targetURL string) (string, string, error) {
	url := strings.TrimSpace(targetURL)
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	jinaURL := fmt.Sprintf("https://r.jina.ai/%s", url)
	reqCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "GET", jinaURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	req.Header.Set("Accept", "text/plain")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		rawErr, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", "", fmt.Errorf("Jina Reader returned status %d: %s", resp.StatusCode, string(rawErr))
	}

	title := ""
	if tHeader := resp.Header.Get("X-Title"); tHeader != "" {
		title = tHeader
	} else {
		parts := strings.Split(url, "/")
		if len(parts) > 2 {
			title = parts[2]
		} else {
			title = url
		}
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 10*1024*1024)) // 10MB limit
	if err != nil {
		return "", "", err
	}

	return title, string(body), nil
}
