package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"time"
)

type Competition struct {
	ID         string `gorm:"primarykey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  gorm.DeletedAt `gorm:"index"`
	Name       string
	Graph      string
	Active     bool
	Challenges []Challenge
}

type Challenge struct {
	gorm.Model
	Name          string
	Description   string
	Value         int
	Flag          string
	CompetitionID string
	Competition   Competition `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

type Comment struct {
	gorm.Model
	Id        uint32 `gorm:"uniqueIndex;autoIncrement"`
	Username  string
	CommentId uint32
	Content   string
	Quote     string
}

type HighlightArea struct {
	gorm.Model
	Id        uint32 `gorm:"uniqueIndex;autoIncrement"`
	Username  string
	CommentId uint32
	Height    float32
	Width     float32
	PageIndex uint32
	Top       float32
	Left      float32
}

type Evidence struct {
	gorm.Model
	Name        string
	ChallengeID *int      `gorm:""`
	Challenge   Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	UserID      int       `gorm:""`
	User        User
	PositionX   int  `gorm:"default:0"`
	PositionY   int  `gorm:"default:0"`
	IsFlag      bool `gorm:"default:false"`
}

type EvidenceConnection struct {
	gorm.Model
	SourceID      int      `gorm:"index:evidence_connection_idx"`
	Source        Evidence `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	DestinationID int      `gorm:"index:evidence_connection_idx"`
	Destination   Evidence `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	UserID        int      `gorm:"index:evidence_connection_idx"`
	User          User     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

type EvidenceReport struct {
	gorm.Model
	UserID int  `gorm:"uniqueIndex"`
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	URL    string
}

type HomePage struct {
	gorm.Model
	Id      string `gorm:"uniqueIndex"`
	Content string
}

type Page struct {
	gorm.Model
	Route   string `gorm:"uniqueIndex"`
	Title   string
	Content string
}

type User struct {
	gorm.Model
	Username         string `gorm:"unique"`
	Email            string `gorm:"unique"`
	Password         string
	Type             string `gorm:"default:user"`
	HasWriteup       bool   `gorm:"default:false"`
	Grade            int    `gorm:"default:0"`
	ComputerID       string
	ComputerPassword string
}

func (user *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		return err
	}
	user.Password = string(bytes)
	return nil
}

func (user *User) CheckPassword(providedPassword string) error {
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(providedPassword))
	if err != nil {
		return err
	}
	return nil
}

type Writeup struct {
	gorm.Model
	UserID  uint `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	User    User
	Content string
	Type    string
}
