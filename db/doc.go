package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"

	_ "github.com/glebarez/go-sqlite"
)

type DocumentStore struct {
	db         *sql.DB
	collection string
}

func NewSqliteDocumentStore(p string) *DocumentStore {
	db, err := sql.Open("sqlite", p)
	if err != nil {
		panic(fmt.Sprintf("failed to open sqlite db: %v", err))
	}
	return NewDocumentStore(db)
}

func NewDocumentStore(db *sql.DB) *DocumentStore {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS document (
			id UUID PRIMARY KEY,
			collection TEXT,
			value JSONB
		)`)
	if err != nil {
		panic(fmt.Sprintf("failed to create documents table: %v", err))
	}
	return &DocumentStore{db: db, collection: "default"}
}

func (ds *DocumentStore) WithCollection(collection string) *DocumentStore {
	return &DocumentStore{db: ds.db, collection: collection}
}

func (ds *DocumentStore) SetBytes(id string, b []byte) error {
	query := `
			INSERT INTO document (id, collection, value) 
			VALUES ($1, $2, $3) 
			ON CONFLICT (id) 
			DO UPDATE SET value = EXCLUDED.value`
	_, err := ds.db.ExecContext(context.Background(), query, id, ds.collection, b)
	if err != nil {
		return fmt.Errorf("failed to set document: %v", err)
	}
	return err
}

func (ds *DocumentStore) Set(id string, value any) error {
	jsonValue, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %v", err)
	}

	query := `
			INSERT INTO document (id, collection, value) 
			VALUES ($1, $2, $3) 
			ON CONFLICT (id) 
			DO UPDATE SET value = EXCLUDED.value`
	_, err = ds.db.ExecContext(context.Background(), query, id, ds.collection, jsonValue)
	if err != nil {
		return fmt.Errorf("failed to set document: %v", err)
	}
	return err
}

func (ds *DocumentStore) GetBytes(id string) ([]byte, error) {
	query := `SELECT value FROM document WHERE id = $1 AND collection = $2`
	row := ds.db.QueryRowContext(context.Background(), query, id, ds.collection)

	var value []byte
	if err := row.Scan(&value); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found")
		}
		return nil, err
	}

	return value, nil
}

func (ds *DocumentStore) Get(id string, val any) error {
	query := `SELECT value FROM document WHERE id = $1 AND collection = $2`
	row := ds.db.QueryRowContext(context.Background(), query, id, ds.collection)

	var value []byte
	if err := row.Scan(&value); err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("document not found")
		}
		return err
	}

	if err := json.Unmarshal(value, val); err != nil {
		return fmt.Errorf("failed to unmarshal value: %v", err)
	}
	return nil
}

type Document struct {
	ID   string          `json:"id"`
	Data json.RawMessage `json:"data"`
}

func (ds *DocumentStore) List() ([]Document, error) {
	query := `SELECT id, value FROM document WHERE collection = $1`
	rows, err := ds.db.QueryContext(context.Background(), query, ds.collection)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []Document
	for rows.Next() {
		var (
			id        string
			jsonValue json.RawMessage
		)
		if err := rows.Scan(&id, &jsonValue); err != nil {
			return nil, err
		}
		documents = append(documents, Document{ID: id, Data: jsonValue})
	}
	return documents, nil
}

func (ds *DocumentStore) Find(ctx context.Context, key, value string) ([]any, error) {
	if !isValidKey(key) {
		return nil, fmt.Errorf("invalid key: %s", key)
	}

	query := `
        SELECT id, value 
        FROM document 
        WHERE collection = ? AND json_extract(value, ?) = ?`

	jsonPath := fmt.Sprintf("$.%s", key)
	rows, err := ds.db.QueryContext(ctx, query, ds.collection, jsonPath, value)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []any
	for rows.Next() {
		var (
			id        string
			jsonValue string
		)
		if err := rows.Scan(&id, &jsonValue); err != nil {
			return nil, err
		}

		var value any
		if err := json.Unmarshal([]byte(jsonValue), &value); err != nil {
			return nil, err
		}
		documents = append(documents, value)
	}
	return documents, nil
}

func isValidKey(key string) bool {
	validKeyPattern := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	return validKeyPattern.MatchString(key)
}

func (ds *DocumentStore) Delete(id string) error {
	query := `DELETE FROM document WHERE id = $1 AND collection = $2`
	_, err := ds.db.ExecContext(context.Background(), query, id, ds.collection)
	if err != nil {
		return fmt.Errorf("failed to delete document: %v", err)
	}
	return nil
}

func (ds *DocumentStore) DeleteAll() error {
	query := `DELETE FROM document WHERE collection = $1`
	_, err := ds.db.ExecContext(context.Background(), query, ds.collection)
	if err != nil {
		return fmt.Errorf("failed to delete all documents: %v", err)
	}
	return nil
}