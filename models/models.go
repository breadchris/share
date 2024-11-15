package models

import (
	"gorm.io/gorm"
	"time"
)

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
	Name      string `gorm:"unique;not null"`
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
