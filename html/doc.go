package html

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/glebarez/go-sqlite"
	"github.com/google/uuid"
	"math"
	"regexp"
	"time"
)

// Document represents a stored document with an ID and JSONB value.
type Document struct {
	ID    uuid.UUID       `json:"id"`
	Value json.RawMessage `json:"value"`
}

// DocumentStore provides methods to interact with a document storage database.
type DocumentStore struct {
	db         *sql.DB
	collection string
}

// NewDocumentStore initializes a new DocumentStore.
func NewDocumentStore(db *sql.DB) *DocumentStore {
	// Create the documents table if it doesn't exist
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

// SetMap inserts or updates a document with the given ID and JSON value.
func (ds *DocumentStore) SetMap(ctx context.Context, id uuid.UUID, value map[string]any) error {
	return ds.Set(ctx, id, value)
}

func (ds *DocumentStore) Set(ctx context.Context, id uuid.UUID, value any) error {
	jsonValue, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %v", err)
	}

	for i := 0; i < 5; i++ {
		query := `
			INSERT INTO document (id, collection, value) 
			VALUES ($1, $2, $3) 
			ON CONFLICT (id) 
			DO UPDATE SET value = EXCLUDED.value`
		_, err = ds.db.ExecContext(ctx, query, id, ds.collection, jsonValue)
		if err == nil {
			break
		}
		time.Sleep(time.Duration(math.Pow(2, float64(i))) * time.Second)
	}
	return err
}

// Get retrieves a document by its ID.
func (ds *DocumentStore) Get(ctx context.Context, id uuid.UUID) (*Document, error) {
	query := `SELECT id, value FROM document WHERE id = $1 AND collection = $2`
	row := ds.db.QueryRowContext(ctx, query, id, ds.collection)

	var doc Document
	var value []byte

	if err := row.Scan(&doc.ID, &value); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found")
		}
		return nil, err
	}

	if err := json.Unmarshal(value, &doc.Value); err != nil {
		return nil, fmt.Errorf("failed to unmarshal value: %v", err)
	}
	return &doc, nil
}

// Find performs a search on the value JSONB field for a given key-value pair.
func (ds *DocumentStore) Find(ctx context.Context, key, value string) ([]Document, error) {
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

	var documents []Document
	for rows.Next() {
		var doc Document
		var jsonValue string

		if err := rows.Scan(&doc.ID, &jsonValue); err != nil {
			return nil, err
		}

		documents = append(documents, Document{
			ID:    doc.ID,
			Value: json.RawMessage(jsonValue),
		})
	}
	return documents, nil
}

func isValidKey(key string) bool {
	validKeyPattern := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	return validKeyPattern.MatchString(key)
}
