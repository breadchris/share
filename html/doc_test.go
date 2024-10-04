package html

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/google/uuid"
	"log"
	"testing"
)

func TestDoc(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	store := NewDocumentStore(db)

	id := uuid.New()
	value := map[string]any{"key": "value", "name": "example"}

	if err := store.Set(context.Background(), id, value); err != nil {
		log.Fatalf("Failed to set document: %v", err)
	}

	doc, err := store.Get(context.Background(), id)
	if err != nil {
		log.Fatalf("Failed to get document: %v", err)
	}
	fmt.Printf("Retrieved document: %v\n", doc)

	docs, err := store.Find(context.Background(), "name", "example")
	if err != nil {
		log.Fatalf("Failed to find documents: %v", err)
	}
	fmt.Printf("Found documents: %v\n", docs)
}

func TestDocumentStoreWithUser(t *testing.T) {
	// simulate a user interacting with the document store
	// create users, documents, and associate them. then query the documents associated with a user

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		log.Fatal(err)
	}

	users := NewDocumentStore(db).WithCollection("users")
	docs := NewDocumentStore(db).WithCollection("documents")

	// create a user
	userID := uuid.New()
	user := map[string]any{"name": "Alice"}
	if err := users.Set(context.Background(), userID, user); err != nil {
		log.Fatalf("Failed to set user: %v", err)
	}

	// create a document
	docID := uuid.New()
	doc := map[string]any{"key": "value", "name": "example"}
	if err := docs.Set(context.Background(), docID, doc); err != nil {
		log.Fatalf("Failed to set document: %v", err)
	}

	// associate the user with the document
	assoc := map[string]any{"user_id": userID, "document_id": docID}
	if err := docs.Set(context.Background(), docID, assoc); err != nil {
		log.Fatalf("Failed to associate user with document: %v", err)
	}

	// query the documents associated with the user
	assocs, err := docs.Find(context.Background(), "user_id", userID.String())
	if err != nil {
		log.Fatalf("Failed to find documents: %v", err)
	}
	fmt.Printf("Found documents associated with user: %v\n", assocs)
}
