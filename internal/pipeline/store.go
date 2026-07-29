package pipeline

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"sourcebook/internal/models"
)

type Store struct {
	mu sync.RWMutex

	seq uint64

	jobs        map[string]*models.PipelineJob
	sources     map[string]*models.SourceRecord
	documents   map[string]*models.DocumentRecord
	chunks      map[string]*models.ChunkRecord
	sourceIndex map[string]string

	jobSources   map[string][]string
	jobDocuments map[string][]string
	jobChunks    map[string][]string
}

func NewStore() *Store {
	return &Store{
		jobs:         make(map[string]*models.PipelineJob),
		sources:      make(map[string]*models.SourceRecord),
		documents:    make(map[string]*models.DocumentRecord),
		chunks:       make(map[string]*models.ChunkRecord),
		sourceIndex:  make(map[string]string),
		jobSources:   make(map[string][]string),
		jobDocuments: make(map[string][]string),
		jobChunks:    make(map[string][]string),
	}
}

func (s *Store) nextID(prefix string) string {
	n := atomic.AddUint64(&s.seq, 1)
	return fmt.Sprintf("%s_%d_%d", prefix, time.Now().UnixNano(), n)
}

func (s *Store) CreateJob(query string, maxSources int) *models.PipelineJob {
	now := time.Now().UTC()
	job := &models.PipelineJob{
		ID:         s.nextID("job"),
		Query:      query,
		MaxSources: maxSources,
		Status:     models.JobStatusPending,
		Attempt:    1,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	s.mu.Lock()
	s.jobs[job.ID] = job
	s.mu.Unlock()

	return cloneJob(job)
}

func (s *Store) RetryJob(jobID string) (*models.PipelineJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, ok := s.jobs[jobID]
	if !ok {
		return nil, fmt.Errorf("job %s not found", jobID)
	}

	job.Attempt++
	job.Status = models.JobStatusPending
	job.Error = ""
	job.Result = nil
	job.StartedAt = time.Time{}
	job.FinishedAt = time.Time{}
	job.UpdatedAt = time.Now().UTC()

	return cloneJob(job), nil
}

func (s *Store) MarkRunning(jobID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, ok := s.jobs[jobID]
	if !ok {
		return fmt.Errorf("job %s not found", jobID)
	}

	if job.StartedAt.IsZero() {
		job.StartedAt = time.Now().UTC()
	}
	job.Status = models.JobStatusRunning
	job.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *Store) MarkSucceeded(jobID string, result []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, ok := s.jobs[jobID]
	if !ok {
		return fmt.Errorf("job %s not found", jobID)
	}

	job.Status = models.JobStatusSucceeded
	job.Result = append([]byte(nil), result...)
	job.FinishedAt = time.Now().UTC()
	job.UpdatedAt = job.FinishedAt
	job.Error = ""
	return nil
}

func (s *Store) MarkFailed(jobID string, err error) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, ok := s.jobs[jobID]
	if !ok {
		return fmt.Errorf("job %s not found", jobID)
	}

	job.Status = models.JobStatusFailed
	job.Error = err.Error()
	job.FinishedAt = time.Now().UTC()
	job.UpdatedAt = job.FinishedAt
	return nil
}

func (s *Store) GetJob(jobID string) (*models.PipelineJob, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	job, ok := s.jobs[jobID]
	if !ok {
		return nil, false
	}

	return cloneJob(job), true
}

func (s *Store) ListJobSources(jobID string) []models.SourceRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.jobSources[jobID]
	out := make([]models.SourceRecord, 0, len(ids))
	for _, id := range ids {
		if src, ok := s.sources[id]; ok {
			out = append(out, *cloneSource(src))
		}
	}
	return out
}

func (s *Store) ListJobDocuments(jobID string) []models.DocumentRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.jobDocuments[jobID]
	out := make([]models.DocumentRecord, 0, len(ids))
	for _, id := range ids {
		if doc, ok := s.documents[id]; ok {
			out = append(out, *cloneDocument(doc))
		}
	}
	return out
}

func (s *Store) ListJobChunks(jobID string) []models.ChunkRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.jobChunks[jobID]
	out := make([]models.ChunkRecord, 0, len(ids))
	for _, id := range ids {
		if chunk, ok := s.chunks[id]; ok {
			out = append(out, *cloneChunk(chunk))
		}
	}
	return out
}

func (s *Store) UpsertSource(jobID string, src models.SearchResult, query string) *models.SourceRecord {
	now := time.Now().UTC()
	canonical := NormalizeURL(src.URL)
	if canonical == "" {
		canonical = src.URL
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if existingID, ok := s.sourceIndex[canonical]; ok {
		existing := s.sources[existingID]
		existing.Title = firstNonEmpty(src.Title, existing.Title)
		existing.Snippet = firstNonEmpty(src.Snippet, existing.Snippet)
		existing.Provider = firstNonEmpty(src.Source, existing.Provider)
		existing.ImageURL = firstNonEmpty(src.ImageURL, existing.ImageURL)
		existing.Query = firstNonEmpty(query, existing.Query)
		existing.UpdatedAt = now
		s.attachJobSource(jobID, existing.ID)
		return cloneSource(existing)
	}

	record := &models.SourceRecord{
		ID:           s.nextID("src"),
		JobID:        jobID,
		Query:        query,
		Provider:     src.Source,
		Title:        src.Title,
		URL:          src.URL,
		CanonicalURL: canonical,
		Snippet:      src.Snippet,
		ImageURL:     src.ImageURL,
		Metadata: map[string]interface{}{
			"score":        src.Score,
			"language":     src.Language,
			"category":     src.Category,
			"author":       src.Author,
			"published_at": src.PublishedAt,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.sources[record.ID] = record
	s.sourceIndex[canonical] = record.ID
	s.attachJobSource(jobID, record.ID)

	return cloneSource(record)
}

func (s *Store) SaveDocument(jobID string, doc models.DocumentRecord) *models.DocumentRecord {
	now := time.Now().UTC()
	doc.ID = s.nextID("doc")
	doc.JobID = jobID
	doc.CreatedAt = now
	doc.UpdatedAt = now

	s.mu.Lock()
	defer s.mu.Unlock()

	s.documents[doc.ID] = &doc
	s.attachJobDocument(jobID, doc.ID)
	return cloneDocument(&doc)
}

func (s *Store) SaveChunk(jobID string, chunk models.ChunkRecord) *models.ChunkRecord {
	now := time.Now().UTC()
	chunk.ID = s.nextID("chk")
	chunk.JobID = jobID
	chunk.CreatedAt = now
	chunk.UpdatedAt = now

	s.mu.Lock()
	defer s.mu.Unlock()

	s.chunks[chunk.ID] = &chunk
	s.attachJobChunk(jobID, chunk.ID)
	return cloneChunk(&chunk)
}

func (s *Store) attachJobSource(jobID, sourceID string) {
	ids := s.jobSources[jobID]
	for _, id := range ids {
		if id == sourceID {
			return
		}
	}
	s.jobSources[jobID] = append(ids, sourceID)
	if job, ok := s.jobs[jobID]; ok {
		job.SourceIDs = appendUnique(job.SourceIDs, sourceID)
		job.UpdatedAt = time.Now().UTC()
	}
}

func (s *Store) attachJobDocument(jobID, documentID string) {
	ids := s.jobDocuments[jobID]
	for _, id := range ids {
		if id == documentID {
			return
		}
	}
	s.jobDocuments[jobID] = append(ids, documentID)
	if job, ok := s.jobs[jobID]; ok {
		job.DocumentIDs = appendUnique(job.DocumentIDs, documentID)
		job.UpdatedAt = time.Now().UTC()
	}
}

func (s *Store) attachJobChunk(jobID, chunkID string) {
	ids := s.jobChunks[jobID]
	for _, id := range ids {
		if id == chunkID {
			return
		}
	}
	s.jobChunks[jobID] = append(ids, chunkID)
	if job, ok := s.jobs[jobID]; ok {
		job.ChunkIDs = appendUnique(job.ChunkIDs, chunkID)
		job.UpdatedAt = time.Now().UTC()
	}
}

func cloneJob(job *models.PipelineJob) *models.PipelineJob {
	if job == nil {
		return nil
	}
	copyJob := *job
	copyJob.SourceIDs = append([]string(nil), job.SourceIDs...)
	copyJob.DocumentIDs = append([]string(nil), job.DocumentIDs...)
	copyJob.ChunkIDs = append([]string(nil), job.ChunkIDs...)
	copyJob.Result = append([]byte(nil), job.Result...)
	return &copyJob
}

func cloneSource(src *models.SourceRecord) *models.SourceRecord {
	if src == nil {
		return nil
	}
	copySrc := *src
	copySrc.Metadata = cloneMap(src.Metadata)
	return &copySrc
}

func cloneDocument(doc *models.DocumentRecord) *models.DocumentRecord {
	if doc == nil {
		return nil
	}
	copyDoc := *doc
	copyDoc.Metadata = cloneMap(doc.Metadata)
	return &copyDoc
}

func cloneChunk(chunk *models.ChunkRecord) *models.ChunkRecord {
	if chunk == nil {
		return nil
	}
	copyChunk := *chunk
	copyChunk.Metadata = cloneMap(chunk.Metadata)
	return &copyChunk
}
