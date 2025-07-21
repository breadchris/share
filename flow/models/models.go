package models

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kkdai/youtube/v2"
	"github.com/sashabaranov/go-openai"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type JSONField[T any] struct {
	Data T
}

func MakeJSONField[T any](data T) *JSONField[T] {
	return &JSONField[T]{
		Data: data,
	}
}

func (j *JSONField[T]) Scan(src any) error {
	if src == nil {
		var empty T
		j.Data = empty
		return nil
	}
	srcByte, ok := src.([]byte)
	if !ok {
		return errors.New("JSONField underlying type must be []byte (some kind of Blob/JSON/JSONB field)")
	}
	if err := json.Unmarshal(srcByte, &j.Data); err != nil {
		return err
	}
	return nil
}

func (j JSONField[T]) Value() (driver.Value, error) {
	return json.Marshal(j.Data)
}

func (j JSONField[T]) MarshalJSON() ([]byte, error) {
	return json.Marshal(j.Data)
}

func (j *JSONField[T]) UnmarshalJSON(b []byte) error {
	if bytes.Equal(b, []byte("null")) {
		// According to docs, this is a no-op by convention
		//var empty T
		//j.Data = empty
		return nil
	}
	if err := json.Unmarshal(b, &j.Data); err != nil {
		return err
	}
	return nil
}

type Model struct {
	ID        string         `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type User struct {
	ID               string `gorm:"primaryKey"`
	CreatedAt        time.Time
	Username         string             `gorm:"unique"`
	Identities       []*Identity        `gorm:"foreignKey:UserID"`
	GroupMemberships []*GroupMembership `gorm:"foreignKey:UserID"`
	Secrets          []*UserSecret      `gorm:"foreignKey:UserID"`
	Password         string
}

type UserSecret struct {
	ID        string `gorm:"primaryKey"`
	CreatedAt time.Time
	Secret    string
	UserID    string `gorm:"index"`
	User      *User  `gorm:"foreignKey:UserID"`
}

type Identity struct {
	ID        string `gorm:"primaryKey"`
	CreatedAt time.Time
	Provider  string
	UserID    string
	User      *User `gorm:"foreignKey:UserID"`
}

type Group struct {
	ID        string             `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time          `json:"created_at"`
	Name      string             `gorm:"unique;not null" json:"name"`
	JoinCode  string             `gorm:"unique" json:"join_code"`
	Members   []*GroupMembership `gorm:"foreignKey:GroupID" json:"members,omitempty"`
	Pages     []*Page            `gorm:"foreignKey:GroupID" json:"pages,omitempty"`
}

type GroupMembership struct {
	ID        string `gorm:"primaryKey"`
	CreatedAt time.Time
	UserID    string `gorm:"index"`
	GroupID   string `gorm:"index"`
	Role      string
	User      *User  `gorm:"foreignKey:UserID"`
	Group     *Group `gorm:"foreignKey:GroupID"`
}

type Food struct {
	FDCID       int64 `gorm:"primaryKey"`
	CreatedAt   time.Time
	Description string         `gorm:"index"`
	Raw         datatypes.JSON `gorm:"type:jsonb"`
}

type FoodName struct {
	FDCID int64
	Food  *Food `gorm:"foreignKey:FDCID"`
	Name  string
}

type Direction struct {
	Model
	Text      string `json:"text" description:"The direction text."`
	StartTime int    `json:"start_time" description:"The time in seconds when direction starts in the transcript."`
	EndTime   int    `json:"end_time" description:"The time in seconds when direction ends in the transcript."`
	RecipeID  string `json:"recipe_id" description:"The ID of the recipe."`
}

type Ingredient struct {
	Model
	Name     string `json:"name" description:"The name of the ingredient."`
	Amount   string `json:"amount" description:"The amount of the ingredient."`
	Unit     string `json:"unit" description:"The unit of the ingredient."`
	Comment  string `json:"comment" description:"The comment of the ingredient."`
	RecipeID string `json:"recipe_id" description:"The ID of the recipe."`
}

type Equipment struct {
	Model
	Name     string `json:"name" description:"The name of the equipment."`
	Comment  string `json:"comment" description:"The comment of the equipment."`
	RecipeID string `json:"recipe_id" description:"The ID of the recipe."`
}

type Recipe struct {
	Model
	Domain      string        `json:"domain" description:"The domain of the recipe."`
	URL         string        `json:"url" description:"The url of the recipe."`
	Name        string        `json:"name"`
	Ingredients []*Ingredient `json:"ingredients" gorm:"foreignKey:RecipeID"`
	Directions  []*Direction  `json:"directions" gorm:"foreignKey:RecipeID"`
	Equipment   []*Equipment  `json:"equipment" description:"The equipment used while making the recipe."`
	Transcript  *JSONField[youtube.VideoTranscript]
}

type PromptContext struct {
	Model
	ID        string `gorm:"primaryKey"`
	ContextID string
	Request   *JSONField[openai.ChatCompletionRequest]
	Response  *JSONField[openai.ChatCompletionResponse]
}

type Prompt struct {
	Model
	Title    string
	Content  string `gorm:"type:text"`
	UserID   string
	ParentID string
	Forks    []Prompt `gorm:"foreignKey:ParentID"`
	Runs     []PromptRun
}

type PromptRun struct {
	Model
	PromptID string
	Input    string `gorm:"type:text"`
	Output   string `gorm:"type:text"`
}

type Page struct {
	Model
	URL       string `json:"url"`
	Title     string `json:"title"`
	HTML      string `json:"html"`
	CreatedAt int64  `json:"created_at"`
	Article   string `json:"article"`
	HitCount  int    `json:"hit_count"`
	GroupID   string `json:"group_id"`
}

type AIRecipe struct {
	Name        string        `json:"name" description:"The name of the recipe."`
	Ingredients []*Ingredient `json:"ingredients" description:"The ingredients used in the recipe."`
	Directions  []*Direction  `json:"directions" description:"The steps to make the recipe."`
	Equipment   []*Equipment  `json:"equipment" description:"The equipment used while making the recipe."`
}

func AIRecipeToModel(ar AIRecipe, id, domain string, ts youtube.VideoTranscript) Recipe {
	var r Recipe
	r.Model.ID = id
	r.Name = ar.Name
	r.URL = fmt.Sprintf("https://www.youtube.com/watch?v=%s", id)

	for i, ing := range ar.Ingredients {
		r.Ingredients = append(r.Ingredients, ing)
		r.Ingredients[i].ID = uuid.NewString()
		r.Ingredients[i].RecipeID = r.Model.ID
	}

	for i, dir := range ar.Directions {
		r.Directions = append(r.Directions, dir)
		r.Directions[i].ID = uuid.NewString()
		r.Directions[i].RecipeID = r.Model.ID
	}

	for i, eq := range ar.Equipment {
		r.Equipment = append(r.Equipment, eq)
		r.Equipment[i].ID = uuid.NewString()
		r.Equipment[i].RecipeID = r.Model.ID
	}

	r.Domain = domain
	r.Transcript = MakeJSONField(ts)
	return r
}

type DockerHost struct {
	Model
	Name      string `json:"name" gorm:"unique;not null"`
	Endpoint  string `json:"endpoint" gorm:"not null"`
	TLSCert   string `json:"tls_cert,omitempty"`
	TLSKey    string `json:"tls_key,omitempty"`
	TLSCA     string `json:"tls_ca,omitempty"`
	TLSVerify bool   `json:"tls_verify"`
	IsDefault bool   `json:"is_default"`
	UserID    string `json:"user_id" gorm:"index"`
	User      *User  `gorm:"foreignKey:UserID"`
}

type Container struct {
	Model
	ContainerID  string                        `json:"container_id" gorm:"unique;not null"`
	Name         string                        `json:"name" gorm:"not null"`
	Image        string                        `json:"image" gorm:"not null"`
	Status       string                        `json:"status"`
	Command      string                        `json:"command"`
	Ports        *JSONField[map[string]string] `json:"ports"`
	Environment  *JSONField[map[string]string] `json:"environment"`
	UserID       string                        `json:"user_id" gorm:"index"`
	DockerHostID string                        `json:"docker_host_id" gorm:"index"`
	SessionID    string                        `json:"session_id,omitempty" gorm:"index"`
	User         *User                         `gorm:"foreignKey:UserID"`
	DockerHost   *DockerHost                   `gorm:"foreignKey:DockerHostID"`
}

type ContainerSession struct {
	Model
	ContainerID string     `json:"container_id" gorm:"index"`
	SessionID   string     `json:"session_id" gorm:"unique;not null"`
	Command     string     `json:"command"`
	UserID      string     `json:"user_id" gorm:"index"`
	Container   *Container `gorm:"foreignKey:ContainerID"`
	User        *User      `gorm:"foreignKey:UserID"`
}

// JustShare Models

type Content struct {
	Model
	Type     string                             `json:"type" gorm:"not null"`  // text, image, audio, clipboard
	Data     string                             `json:"data" gorm:"type:text"` // Text content or file path
	MediaURL string                             `json:"media_url,omitempty"`   // URL for media files
	MimeType string                             `json:"mime_type,omitempty"`   // MIME type for media
	FileSize int64                              `json:"file_size,omitempty"`   // File size in bytes
	GroupID  string                             `json:"group_id" gorm:"index;not null"`
	UserID   string                             `json:"user_id" gorm:"index;not null"`
	Group    *Group                             `gorm:"foreignKey:GroupID"`
	User     *User                              `gorm:"foreignKey:UserID"`
	Tags     []*Tag                             `gorm:"many2many:content_tags;"`
	Metadata *JSONField[map[string]interface{}] `json:"metadata,omitempty"` // Additional metadata
}

type Tag struct {
	Model
	Name     string     `json:"name" gorm:"unique;not null;index"`
	Color    string     `json:"color,omitempty"`               // Hex color for display
	UserID   string     `json:"user_id" gorm:"index;not null"` // Tag creator
	User     *User      `gorm:"foreignKey:UserID"`
	Contents []*Content `gorm:"many2many:content_tags;"`
}

type ContentTag struct {
	ContentID string    `json:"content_id" gorm:"primaryKey"`
	TagID     string    `json:"tag_id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	Content   *Content  `gorm:"foreignKey:ContentID"`
	Tag       *Tag      `gorm:"foreignKey:TagID"`
}

// NewContent creates a new Content instance with proper initialization
func NewContent(contentType, data, groupID, userID string, metadata map[string]interface{}) *Content {
	return &Content{
		Model: Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Type:     contentType,
		Data:     data,
		GroupID:  groupID,
		UserID:   userID,
		Metadata: MakeJSONField(metadata),
	}
}

// API Key Models for mobile app authentication

type ApiKey struct {
	Model
	Name        string    `json:"name" gorm:"not null"`                    // Human-readable name for the key
	Token       string    `json:"token,omitempty" gorm:"unique;not null"`  // The actual API key token
	TokenHash   string    `json:"-" gorm:"not null"`                       // Hashed version stored in DB
	UserID      string    `json:"user_id" gorm:"index;not null"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	Scopes      string    `json:"scopes" gorm:"default:'read,write'"`       // Comma-separated permissions
	User        *User     `gorm:"foreignKey:UserID"`
}

// NewApiKey creates a new API key with secure token generation
func NewApiKey(name, userID string, scopes []string) *ApiKey {
	token := generateSecureToken()
	return &ApiKey{
		Model: Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Name:      name,
		Token:     token,
		TokenHash: hashToken(token),
		UserID:    userID,
		IsActive:  true,
		Scopes:    strings.Join(scopes, ","),
	}
}

// ValidateToken checks if the provided token matches this API key
func (ak *ApiKey) ValidateToken(token string) bool {
	return ak.IsActive && ak.TokenHash == hashToken(token) && (ak.ExpiresAt == nil || ak.ExpiresAt.After(time.Now()))
}

// HasScope checks if the API key has the specified scope
func (ak *ApiKey) HasScope(scope string) bool {
	scopes := strings.Split(ak.Scopes, ",")
	for _, s := range scopes {
		if strings.TrimSpace(s) == scope {
			return true
		}
	}
	return false
}

// UpdateLastUsed updates the last used timestamp
func (ak *ApiKey) UpdateLastUsed() {
	now := time.Now()
	ak.LastUsedAt = &now
}

// generateSecureToken creates a cryptographically secure random token
func generateSecureToken() string {
	// Generate 32 random bytes (256 bits)
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Sprintf("failed to generate secure token: %v", err))
	}
	// Return as hex string with "ak_" prefix for identification
	return "ak_" + hex.EncodeToString(bytes)
}

// HashToken creates a SHA-256 hash of the token for secure storage
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// hashToken is the internal version for package use
func hashToken(token string) string {
	return HashToken(token)
}

// CLAUDE.md Document Models

type ClaudeDoc struct {
	Model
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description"`
	Content     string `json:"content" gorm:"type:text"`
	UserID      string `json:"user_id" gorm:"index;not null"`
	IsPublic    bool   `json:"is_public" gorm:"default:true"`
	Downloads   int    `json:"downloads" gorm:"default:0"`
	Stars       int    `json:"stars" gorm:"default:0"`
	Views       int    `json:"views" gorm:"default:0"`
	User        *User  `gorm:"foreignKey:UserID"`
	Tags        []*Tag `gorm:"many2many:claude_doc_tags;"`
}

type ClaudeDocTag struct {
	ClaudeDocID string     `json:"claude_doc_id" gorm:"primaryKey"`
	TagID       string     `json:"tag_id" gorm:"primaryKey"`
	CreatedAt   time.Time  `json:"created_at"`
	ClaudeDoc   *ClaudeDoc `gorm:"foreignKey:ClaudeDocID"`
	Tag         *Tag       `gorm:"foreignKey:TagID"`
}

type ClaudeDocStar struct {
	Model
	ClaudeDocID string     `json:"claude_doc_id" gorm:"index;not null"`
	UserID      string     `json:"user_id" gorm:"index;not null"`
	ClaudeDoc   *ClaudeDoc `gorm:"foreignKey:ClaudeDocID"`
	User        *User      `gorm:"foreignKey:UserID"`
}

type ClaudeSession struct {
	Model
	SessionID string                             `json:"session_id" gorm:"unique;not null;index"`
	UserID    string                             `json:"user_id" gorm:"index;not null"`
	User      *User                              `gorm:"foreignKey:UserID"`
	Title     string                             `json:"title"`
	Messages  JSONField[interface{}]             `json:"messages" gorm:"type:json"`
	Metadata  *JSONField[map[string]interface{}] `json:"metadata,omitempty"`
}

// SlackSession represents a Claude session tied to a Slack thread (database version)
type SlackSession struct {
	Model
	ThreadTS     string    `json:"thread_ts" gorm:"index;not null"`
	ChannelID    string    `json:"channel_id" gorm:"index;not null"`
	UserID       string    `json:"user_id" gorm:"index;not null"`
	User         *User     `gorm:"foreignKey:UserID"`
	SessionID    string    `json:"session_id" gorm:"index"`
	ProcessID    string    `json:"process_id"`
	LastActivity time.Time `json:"last_activity"`
	Context      string    `json:"context"` // Working directory context
	Active       bool      `json:"active" gorm:"default:true"`
	Resumed      bool      `json:"resumed" gorm:"default:false"`
}

// ThreadContext represents a context summary for a Slack thread (database version)
type ThreadContext struct {
	Model
	ThreadTS       string                            `json:"thread_ts" gorm:"index;not null"`
	ChannelID      string                            `json:"channel_id" gorm:"index;not null"`
	SessionType    string                            `json:"session_type"` // "ideation", "claude", "worklet"
	OriginalPrompt string                            `json:"original_prompt"`
	LastActivity   time.Time                         `json:"last_activity"`
	Summary        string                            `json:"summary"`
	NextSteps      JSONField[[]string]               `json:"next_steps" gorm:"type:json"`
	KeyMetrics     JSONField[map[string]interface{}] `json:"key_metrics" gorm:"type:json"`
	PinnedMessage  string                            `json:"pinned_message"` // Timestamp of pinned context message
	UserID         string                            `json:"user_id" gorm:"index;not null"`
	User           *User                             `gorm:"foreignKey:UserID"`
	Active         bool                              `json:"active" gorm:"default:true"`
}

// SlackUserActivity tracks user activity patterns in threads (database version)
type SlackUserActivity struct {
	Model
	UserID       string    `json:"user_id" gorm:"index;not null"`
	User         *User     `gorm:"foreignKey:UserID"`
	ThreadTS     string    `json:"thread_ts" gorm:"index;not null"`
	LastSeen     time.Time `json:"last_seen"`
	MessageCount int       `json:"message_count"`
	SessionStart time.Time `json:"session_start"`
}

// SlackIdeationSession represents an ideation session tied to a Slack thread (database version)
type SlackIdeationSession struct {
	Model
	SessionID     string                            `json:"session_id" gorm:"unique;not null;index"`
	ThreadID      string                            `json:"thread_id" gorm:"index;not null"`
	ChannelID     string                            `json:"channel_id" gorm:"index;not null"`
	UserID        string                            `json:"user_id" gorm:"index;not null"`
	User          *User                             `gorm:"foreignKey:UserID"`
	OriginalIdea  string                            `json:"original_idea"`
	Features      JSONField[[]Feature]              `json:"features" gorm:"type:json"`
	Preferences   JSONField[map[string]int]         `json:"preferences" gorm:"type:json"` // emoji -> count
	ChatHistory   JSONField[[]ChatMessage]          `json:"chat_history" gorm:"type:json"`
	LastActivity  time.Time                         `json:"last_activity"`
	Active        bool                              `json:"active" gorm:"default:true"`
	MessageTS     JSONField[map[string]string]      `json:"message_ts" gorm:"type:json"` // feature_id -> message timestamp
}

// SlackFileUpload represents a file uploaded to a Slack thread
type SlackFileUpload struct {
	Model
	ThreadTS     string    `json:"thread_ts" gorm:"index;not null"`
	ChannelID    string    `json:"channel_id" gorm:"index;not null"`
	UserID       string    `json:"user_id" gorm:"index;not null"`
	User         *User     `gorm:"foreignKey:UserID"`
	SlackFileID  string    `json:"slack_file_id" gorm:"index;not null"` // Slack's file ID
	FileName     string    `json:"file_name" gorm:"not null"`
	OriginalName string    `json:"original_name" gorm:"not null"`
	MimeType     string    `json:"mime_type"`
	Category     string    `json:"category" gorm:"index"` // File category: image, document, code, text, archive, etc.
	FileSize     int64     `json:"file_size"`
	LocalPath    string    `json:"local_path" gorm:"not null"` // Path where file is stored locally
	UploadedAt   time.Time `json:"uploaded_at"`
	Downloaded   bool      `json:"downloaded" gorm:"default:false"`
	DownloadedAt *time.Time `json:"downloaded_at"`
	SessionID    string    `json:"session_id" gorm:"index"` // Associated Claude session ID if any
}

// Feature represents a feature in ideation sessions
type Feature struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Priority    string `json:"priority"`
	Complexity  string `json:"complexity"`
}

// ChatMessage represents a message in the ideation chat history
type ChatMessage struct {
	Role      string    `json:"role"`      // "user" or "assistant"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Type      string    `json:"type"`      // "initial", "expansion", "reaction", etc.
}

type PinnedFile struct {
	Model
	UserID   string `json:"user_id" gorm:"index;not null;uniqueIndex:idx_user_file"`
	FilePath string `json:"file_path" gorm:"not null;uniqueIndex:idx_user_file"`
	User     *User  `gorm:"foreignKey:UserID"`
}

// SessionKVStore represents key-value data for session-based prototypes
type SessionKVStore struct {
	Model
	SessionID string                             `json:"session_id" gorm:"index;not null"`
	Namespace string                             `json:"namespace" gorm:"not null;default:'default'"`
	Key       string                             `json:"key" gorm:"not null"`
	Value     *JSONField[map[string]interface{}] `json:"value" gorm:"type:jsonb;not null"`
	// Composite unique constraint: session_id + namespace + key
	// This ensures no key collisions within the same session and namespace
}

// WorkletKVStore represents key-value data for worklet prototypes
// DEPRECATED: Use SessionKVStore instead
type WorkletKVStore struct {
	Model
	WorkletID string                             `json:"worklet_id" gorm:"index;not null"`
	Namespace string                             `json:"namespace" gorm:"not null;default:'default'"`
	Key       string                             `json:"key" gorm:"not null"`
	Value     *JSONField[map[string]interface{}] `json:"value" gorm:"type:jsonb;not null"`
	// Composite unique constraint: worklet_id + namespace + key
	// This ensures no key collisions within the same worklet and namespace
}

// WorkletKVEntry represents a single key-value entry for API responses
type WorkletKVEntry struct {
	Key       string                 `json:"key"`
	Value     map[string]interface{} `json:"value"`
	Namespace string                 `json:"namespace"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
}

// ToEntry converts a WorkletKVStore model to a WorkletKVEntry response
func (kv *WorkletKVStore) ToEntry() WorkletKVEntry {
	var value map[string]interface{}
	if kv.Value != nil {
		value = kv.Value.Data
	}
	
	return WorkletKVEntry{
		Key:       kv.Key,
		Value:     value,
		Namespace: kv.Namespace,
		CreatedAt: kv.CreatedAt,
		UpdatedAt: kv.UpdatedAt,
	}
}

// NewSessionKVStore creates a new SessionKVStore entry
func NewSessionKVStore(sessionID, namespace, key string, value map[string]interface{}) *SessionKVStore {
	if namespace == "" {
		namespace = "default"
	}
	
	return &SessionKVStore{
		Model: Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		Namespace: namespace,
		Key:       key,
		Value:     MakeJSONField(value),
	}
}

// NewWorkletKVStore creates a new WorkletKVStore entry
// DEPRECATED: Use NewSessionKVStore instead
func NewWorkletKVStore(workletID, namespace, key string, value map[string]interface{}) *WorkletKVStore {
	if namespace == "" {
		namespace = "default"
	}
	
	return &WorkletKVStore{
		Model: Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		WorkletID: workletID,
		Namespace: namespace,
		Key:       key,
		Value:     MakeJSONField(value),
	}
}
