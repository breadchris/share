package models

import (
	"gorm.io/datatypes"
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
