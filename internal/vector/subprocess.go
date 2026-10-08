package vector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

// Subprocess concurrency limiter: prevent spawning too many python processes at once
var (
	subprocSem    = make(chan struct{}, 4)
	subprocInitMu sync.Mutex
	cachedPyBin   string
	cachedScript  string
)

func resolvePaths() (string, string) {
	subprocInitMu.Lock()
	defer subprocInitMu.Unlock()
	if cachedPyBin != "" && cachedScript != "" {
		return cachedPyBin, cachedScript
	}

	dir, err := os.Getwd()
	if err != nil {
		dir = "."
	}

	for i := 0; i < 5; i++ {
		candidateScript := filepath.Join(dir, "services", "embedding", "embed.py")
		if _, err := os.Stat(candidateScript); err == nil {
			cachedScript = candidateScript
			candidatePy := filepath.Join(dir, ".venv", "bin", "python")
			if _, err := os.Stat(candidatePy); err == nil {
				cachedPyBin = candidatePy
			} else {
				cachedPyBin = "python3"
			}
			return cachedPyBin, cachedScript
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	cachedPyBin = ".venv/bin/python"
	cachedScript = "services/embedding/embed.py"
	return cachedPyBin, cachedScript
}

// RunEmbeddingSubprocess executes the local python embedding script with bounded concurrency.
func RunEmbeddingSubprocess(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	// Acquire concurrency slot (max 4 concurrent python processes)
	select {
	case subprocSem <- struct{}{}:
		defer func() { <-subprocSem }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	subCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	payload, err := json.Marshal(map[string]interface{}{"texts": texts})
	if err != nil {
		return nil, fmt.Errorf("failed to encode subprocess payload: %w", err)
	}

	pyBin, scriptPath := resolvePaths()
	cmd := exec.CommandContext(subCtx, pyBin, scriptPath)
	cmd.Stdin = bytes.NewReader(payload)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("subprocess execution failed: %w, stderr: %s", err, stderr.String())
	}

	var res struct {
		Embeddings [][]float32 `json:"embeddings"`
		Error      string      `json:"error"`
	}
	if err := json.Unmarshal(stdout.Bytes(), &res); err != nil {
		return nil, fmt.Errorf("failed to parse subprocess JSON output: %w", err)
	}
	if res.Error != "" {
		return nil, fmt.Errorf("subprocess returned error: %s", res.Error)
	}
	if len(res.Embeddings) != len(texts) {
		return nil, fmt.Errorf("expected %d embeddings from subprocess, got %d", len(texts), len(res.Embeddings))
	}

	return res.Embeddings, nil
}
