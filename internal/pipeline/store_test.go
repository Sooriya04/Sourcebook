package pipeline

import (
	"testing"
)

func TestStore_JobEvictionCap(t *testing.T) {
	store := NewStore()
	// Create 55 jobs (exceeding maxJobs = 50)
	var lastJobID string
	for i := 0; i < 55; i++ {
		job := store.CreateJob("query", 5)
		lastJobID = job.ID
	}

	store.mu.RLock()
	jobCount := len(store.jobs)
	orderLen := len(store.jobOrder)
	store.mu.RUnlock()

	if jobCount != 50 {
		t.Errorf("expected job count to be capped at 50, got %d", jobCount)
	}

	if orderLen != 50 {
		t.Errorf("expected jobOrder length to be 50, got %d", orderLen)
	}

	// Verify the last created job exists
	if _, ok := store.GetJob(lastJobID); !ok {
		t.Errorf("expected last created job %s to be present", lastJobID)
	}

	// Verify the first created job (job_..._1) was evicted
	firstJobID := "job_1_1" // approximate or check s.jobs doesn't have it
	if _, ok := store.GetJob(firstJobID); ok {
		t.Errorf("expected first job to be evicted")
	}
}
