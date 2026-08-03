package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"
)

type PlannedQuery struct {
	Query    string `json:"query"`
	Provider string `json:"provider"`
}

type SearchPlan struct {
	Intent    string         `json:"intent"`
	Objective string         `json:"objective"`
	Entities  []string       `json:"entities"`
	Keywords  []string       `json:"keywords"`
	Queries   []PlannedQuery `json:"queries"`
}

type SearchServiceResponse struct {
	Query       string       `json:"query"`
	Plan        SearchPlan   `json:"plan"`
	ResultCount int          `json:"result_count"`
}

// CallSearchServicePlanner invokes the Python search microservice to plan search queries for a given text.
func CallSearchServicePlanner(ctx context.Context, text string) (*SearchPlan, error) {
	searchServiceURL := os.Getenv("SEARCH_SERVICE_URL")
	if searchServiceURL == "" {
		return nil, fmt.Errorf("SEARCH_SERVICE_URL environment variable is not configured")
	}

	endpoint := fmt.Sprintf("%s/api/sourcebook/v1/search", searchServiceURL)

	reqPayload := map[string]interface{}{
		"query": text,
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search planning request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	timeout := 60 * time.Second
	if timeoutStr := os.Getenv("SEARCH_SERVICE_TIMEOUT_SECONDS"); timeoutStr != "" {
		if parsed, err := strconv.Atoi(timeoutStr); err == nil && parsed > 0 {
			timeout = time.Duration(parsed) * time.Second
		}
	}

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http call to search microservice failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("search microservice returned non-200 status: %d", resp.StatusCode)
	}

	var respPayload SearchServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&respPayload); err != nil {
		return nil, fmt.Errorf("failed to decode search service response: %w", err)
	}

	return &respPayload.Plan, nil
}
