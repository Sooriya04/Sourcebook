package database

import (
	"database/sql"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// DB returns the underlying *sql.DB for use by background agents.
func (r *Repository) DB() *sql.DB {
	return r.db
}
