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
	Type            string                             `json:"type" gorm:"not null"`  // text, image, audio, clipboard
	Data            string                             `json:"data" gorm:"type:text"` // Text content or file path
	MediaURL        string                             `json:"media_url,omitempty"`   // URL for media files
	MimeType        string                             `json:"mime_type,omitempty"`   // MIME type for media
	FileSize        int64                              `json:"file_size,omitempty"`   // File size in bytes
	GroupID         string                             `json:"group_id" gorm:"index;not null"`
	UserID          string                             `json:"user_id" gorm:"index;not null"`
	ParentContentID *string                            `json:"parent_content_id,omitempty" gorm:"index"` // For threading - nullable for root content
	ReplyCount      int                                `json:"reply_count" gorm:"default:0"`             // Cache of direct reply count
	Group           *Group                             `gorm:"foreignKey:GroupID"`
	User            *User                              `gorm:"foreignKey:UserID"`
	ParentContent   *Content                           `gorm:"foreignKey:ParentContentID"`                          // Parent content for threads
	ThreadReplies   []*Content                         `gorm:"foreignKey:ParentContentID"`                          // Direct replies to this content
	Tags            []*Tag                             `gorm:"many2many:content_tags;"`
	Metadata        *JSONField[map[string]interface{}] `json:"metadata,omitempty"` // Additional metadata
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
		Type:        contentType,
		Data:        data,
		GroupID:     groupID,
		UserID:      userID,
		ReplyCount:  0,
		Metadata:    MakeJSONField(metadata),
	}
}

// NewContentReply creates a new Content instance as a reply to parent content
func NewContentReply(contentType, data, groupID, userID, parentContentID string, metadata map[string]interface{}) *Content {
	return &Content{
		Model: Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Type:            contentType,
		Data:            data,
		GroupID:         groupID,
		UserID:          userID,
		ParentContentID: &parentContentID,
		ReplyCount:      0,
		Metadata:        MakeJSONField(metadata),
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

type PinnedFile struct {
	Model
	UserID   string `json:"user_id" gorm:"index;not null;uniqueIndex:idx_user_file"`
	FilePath string `json:"file_path" gorm:"not null;uniqueIndex:idx_user_file"`
	User     *User  `gorm:"foreignKey:UserID"`
}
