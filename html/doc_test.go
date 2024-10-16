package html

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"log"
	"reflect"
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

	if err := store.SetMap(context.Background(), id, value); err != nil {
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

	userID := uuid.New()
	user := map[string]any{"name": "Alice"}
	if err := users.SetMap(context.Background(), userID, user); err != nil {
		log.Fatalf("Failed to set user: %v", err)
	}

	docID := uuid.New()
	doc := map[string]any{"key": "value", "name": "example"}
	if err := docs.SetMap(context.Background(), docID, doc); err != nil {
		log.Fatalf("Failed to set document: %v", err)
	}

	assoc := map[string]any{"user_id": userID, "document_id": docID}
	if err := docs.SetMap(context.Background(), docID, assoc); err != nil {
		log.Fatalf("Failed to associate user with document: %v", err)
	}

	assocs, err := docs.Find(context.Background(), "user_id", userID.String())
	if err != nil {
		log.Fatalf("Failed to find documents: %v", err)
	}
	fmt.Printf("Found documents associated with user: %v\n", assocs)
}

func TestDocumentStoreWithStructs(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		log.Fatal(err)
	}

	store := NewDocumentStore(db)

	type User struct {
		ID   uuid.UUID `json:"id"`
		Name string    `json:"name"`
	}

	type Doc struct {
		ID   uuid.UUID `json:"id"`
		Text string    `json:"text"`
	}

	type Assoc struct {
		ID         uuid.UUID `json:"id"`
		UserID     uuid.UUID `json:"user_id"`
		DocumentID uuid.UUID `json:"document_id"`
	}

	user := User{ID: uuid.New(), Name: "Alice"}
	if err := store.Set(context.Background(), user.ID, user); err != nil {
		log.Fatalf("Failed to set user: %v", err)
	}

	user2 := User{ID: uuid.New(), Name: "Bob"}
	if err := store.Set(context.Background(), user2.ID, user2); err != nil {
		log.Fatalf("Failed to set user: %v", err)
	}

	doc := Doc{ID: uuid.New(), Text: "asdf"}
	if err := store.Set(context.Background(), doc.ID, doc); err != nil {
		log.Fatalf("Failed to set document: %v", err)
	}

	assoc := Assoc{ID: uuid.New(), UserID: user.ID, DocumentID: doc.ID}
	if err := store.Set(context.Background(), assoc.ID, assoc); err != nil {
		log.Fatalf("Failed to associate user with document: %v", err)
	}

	assoc2 := Assoc{ID: uuid.New(), UserID: user2.ID, DocumentID: doc.ID}
	if err := store.Set(context.Background(), assoc2.ID, assoc2); err != nil {
		log.Fatalf("Failed to associate user with document: %v", err)
	}

	u := User{
		ID: user.ID,
	}
	err = store.GetStruct(context.Background(), &u)
	if err != nil {
		log.Fatalf("Failed to get user: %v", err)
	}

	if u.Name != user.Name {
		t.Fatalf("expected %s, got %s", user.Name, u.Name)
	}

	assocs, err := store.Find(context.Background(), "user_id", user.ID.String())
	if err != nil {
		log.Fatalf("Failed to find documents: %v", err)
	}

	// TODO breadchris need to clean up the API
	var as []Assoc
	for _, a := range assocs {
		var ass Assoc
		if err := json.Unmarshal(a.Value, &ass); err != nil {
			log.Fatalf("Failed to unmarshal assoc: %v", err)
		}
		as = append(as, assoc)
	}

	expected := []Assoc{
		assoc,
	}
	if !reflect.DeepEqual(as, expected) {
		t.Fatalf("expected %v, got %v", expected, assocs)
	}
}
