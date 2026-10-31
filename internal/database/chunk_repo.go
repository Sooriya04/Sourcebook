package database

import (
	"fmt"
	"sourcebook/internal/models"
	"sourcebook/internal/vector"
	"time"

	"github.com/google/uuid"
)

// SaveChunks persists a list of document chunks to the database.
// It cleans up old chunks only for the specific sources being updated,
// preserving all other sources' chunks in the notebook.
func (r *Repository) SaveChunks(notebookID string, chunks []models.DocumentChunk) error {
	if len(chunks) == 0 {
		return nil
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete old chunks only for the sources present in this chunk batch
	sourceIDs := make(map[string]bool)
	for _, chunk := range chunks {
		if chunk.SourceID != "" {
			sourceIDs[chunk.SourceID] = true
		}
	}

	if len(sourceIDs) > 0 {
		delStmt, err := tx.Prepare(`DELETE FROM document_chunks WHERE notebook_id = ? AND source_id = ?`)
		if err != nil {
			return fmt.Errorf("failed to prepare chunk cleanup statement: %w", err)
		}
		defer delStmt.Close()

		for sID := range sourceIDs {
			if _, err := delStmt.Exec(notebookID, sID); err != nil {
				return fmt.Errorf("failed to clean up old chunks for source %s: %w", sID, err)
			}
		}
	}

	query := `INSERT INTO document_chunks (id, notebook_id, source_id, chunk_index, content, embedding, created_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?)`
	stmt, err := tx.Prepare(query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now().UTC()
	for _, chunk := range chunks {
		id := chunk.ID
		if id == "" {
			id = uuid.NewString()
		}

		// Serialize embedding []float32 to []byte
		embeddingBytes := vector.Float32SliceToBytes(chunk.Embedding)

		_, err := stmt.Exec(id, notebookID, chunk.SourceID, chunk.ChunkIndex, chunk.Content, embeddingBytes, now)
		if err != nil {
			return fmt.Errorf("failed to insert chunk: %w", err)
		}
	}

	return tx.Commit()
}

// GetChunksByNotebook retrieves all chunks associated with a specific notebook.
func (r *Repository) GetChunksByNotebook(notebookID string) ([]models.DocumentChunk, error) {
	query := `SELECT id, notebook_id, source_id, chunk_index, content, embedding, created_at 
	          FROM document_chunks WHERE notebook_id = ?`
	rows, err := r.db.Query(query, notebookID)
	if err != nil {
		return nil, fmt.Errorf("failed to query chunks: %w", err)
	}
	defer rows.Close()

	var chunks []models.DocumentChunk
	for rows.Next() {
		var chunk models.DocumentChunk
		var embeddingBytes []byte
		err := rows.Scan(&chunk.ID, &chunk.NotebookID, &chunk.SourceID, &chunk.ChunkIndex, &chunk.Content, &embeddingBytes, &chunk.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan chunk row: %w", err)
		}
		// Deserialize embedding []byte to []float32
		chunk.Embedding = vector.BytesToFloat32Slice(embeddingBytes)
		chunks = append(chunks, chunk)
	}
	return chunks, nil
}

// DeleteChunksBySource deletes all chunks associated with a specific source.
func (r *Repository) DeleteChunksBySource(sourceID string) error {
	query := `DELETE FROM document_chunks WHERE source_id = ?`
	_, err := r.db.Exec(query, sourceID)
	return err
}
