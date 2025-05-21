package models

import (
	"bytes"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"github.com/kkdai/youtube/v2"
	"github.com/sashabaranov/go-openai"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"time"
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
	ID        string `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
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
	ID        string `gorm:"primaryKey"`
	CreatedAt time.Time
	Name      string             `gorm:"unique;not null"`
	JoinCode  string             `gorm:"unique"`
	Members   []*GroupMembership `gorm:"foreignKey:GroupID"`
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
}
