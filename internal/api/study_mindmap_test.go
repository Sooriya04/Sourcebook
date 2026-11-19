package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleMindMap(t *testing.T) {
	mockJSON := `{
		"id": "root",
		"label": "AI Architecture",
		"desc": "Foundational overview of AI and RAG systems.",
		"children": [
			{
				"id": "node_1",
				"label": "Vector Search",
				"desc": "Dense retrieval via embeddings.",
				"children": [
					{
						"id": "node_1_1",
						"label": "Cosine Similarity",
						"desc": "Calculates semantic closeness."
					}
				]
			}
		]
	}`

	api, nb, cleanup := setupTestStudyEnv(t, mockJSON)
	defer cleanup()

	body, _ := json.Marshal(map[string]string{"notebook_id": nb.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/mindmap", bytes.NewReader(body))
	w := httptest.NewRecorder()

	api.HandleMindMap(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}

	var resp MindMapResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if resp.Root.ID != "root" || resp.Root.Label != "AI Architecture" {
		t.Errorf("unexpected root node: %+v", resp.Root)
	}
	if len(resp.Root.Children) != 1 || resp.Root.Children[0].Label != "Vector Search" {
		t.Errorf("unexpected children: %+v", resp.Root.Children)
	}
}
