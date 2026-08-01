package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

// InitDB initializes the SQLite database and creates the necessary tables.
func InitDB(dataSourceName string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	log.Println("SQLite database initialized successfully")
	return db, nil
}

func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS notebooks (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS sources (
			id TEXT PRIMARY KEY,
			notebook_id TEXT,
			job_id TEXT,
			query TEXT,
			provider TEXT,
			title TEXT,
			url TEXT,
			canonical_url TEXT,
			snippet TEXT,
			image_url TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS notes (
			id TEXT PRIMARY KEY,
			notebook_id TEXT,
			content TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS chat_messages (
			id TEXT PRIMARY KEY,
			notebook_id TEXT,
			role TEXT,
			content TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
		);`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("error executing schema query %q: %w", query, err)
		}
	}

	return nil
}
