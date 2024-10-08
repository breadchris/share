package game

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/solarlune/resolv"
)

type Player struct {
	ID           string         `json:"id"`
	Object       *resolv.Object `json:"object"`
	Color        Color          `json:"color"`
	Health       int            `json:"health"`
	MaxHealth    int            `json:"max_health"`
	HealthRegen  time.Time      `json:"regen_time"`
	Attack       int            `json:"attack"`
	Special      int            `json:"special"`
	MaxSpecial   int            `json:"max_special"`
	SpecialRegen time.Time      `json:"special_regen_time"`
	Experience   int            `json:"experience"`
	Width        int            `json:"width"`
}

func initializePlayer(playerID string) *Player {
	player, exists := players[playerID]
	obj := resolv.NewObject(float64(rand.Intn(400)), float64(rand.Intn(400)), 16, 16, "npc")
	space.Add(obj)
	if !exists {
		color := randomColor()
		// Initialize the player if not exists
		player = &Player{
			ID:           playerID,
			Object:       obj,
			Color:        color,
			Health:       100,
			MaxHealth:    100,
			Attack:       5,
			Special:      100,
			MaxSpecial:   100,
			HealthRegen:  time.Now().Add(1 * time.Second),
			SpecialRegen: time.Now().Add(5 * time.Second),
			Experience:   0,
		}
		players[playerID] = player
	}

	return player
}

func updatePlayer(playerID string, command string) {
	// Update player's position
	playersMutex.Lock()
	player := initializePlayer(playerID)
	
	if collision := player.Object.Check(1.0, 0, "npc"); collision != nil {
		// dx := collision.ContactWithObject(collision.Objects[0]).X
		// dy := collision.ContactWithObject(collision.Objects[0]).Y
	}
	switch command {
	case "left":
		player.Object.Position.X -= 5
	case "right":
		player.Object.Position.X += 5
	case "up":
		player.Object.Position.Y -= 5
	case "down":
		player.Object.Position.Y += 5
	case "attack":
		for _, npc := range npcs {
			if calculateDistance(player.Object.Position.X, player.Object.Position.Y, npc.Object.Position.X, npc.Object.Position.Y) < 150 {
				npc.Health -= player.Attack
				if npc.Health <= 0 {
					player.Experience += 10
				}
			}
		}
	case "special":
		specialAttack(player)
	case "one":
		if player.Experience >= 10 {
			player.Attack += 5
			player.Experience -= 10
		}
	case "two":
		if player.Experience >= 10 {
			player.MaxHealth += 10
			player.Health += 10
			player.Experience -= 10
		}
	case "three":
		if player.Experience >= 10 {
			player.MaxSpecial += 10
			player.Special += 10
			player.Experience -= 10
		}
	}

	// Keep players within bounds (optional)
	if player.Object.Position.X < 0 {
		player.Object.Position.X = 0
	}
	if player.Object.Position.X > 800 {
		player.Object.Position.X = 800
	}
	if player.Object.Position.Y < 0 {
		player.Object.Position.Y = 0
	}
	if player.Object.Position.Y > 600 {
		player.Object.Position.Y = 600
	}
	playersMutex.Unlock()

	player.Object.Update()
	// Save the position to a file
	savePosition(playerID)
}

func specialAttack(player *Player) {
	if player.Special >= 10 {
		nearest := nearestNpc(player.ID)
		if nearest != "" {
			projectiles[uuid.New().String()] = &Projectile{
				ID:       uuid.New().String(),
				Object: *resolv.NewObject(player.Object.Position.X, player.Object.Position.Y, 10, 10),
				Target:   nearest,
				Distance: 20000,
				PlayerID: player.ID,
				Damage:   player.Attack,
			}
		}
		player.Special -= 10
	}
}

func randomColor() Color {
	color := colors[rand.Intn(len(colors))]
	return color
}

// Function to save player's position to a file
func savePosition(playerID string) {
	playersMutex.Lock()
	defer playersMutex.Unlock()

	player, exists := players[playerID]
	if !exists {
		return
	}
	file, err := json.MarshalIndent(player.Object.Position, "", " ")
	if err != nil {
		log.Println("Error marshalling position:", err)
		return
	}
	filename := fmt.Sprintf("%s.json", playerID)
	err = os.WriteFile(filename, file, 0644)
	if err != nil {
		log.Println("Error writing position to file:", err)
	}
}

// func savePlayer(playerID string) {
// 	playersMutex.Lock()
// 	defer playersMutex.Unlock()

// 	player, exists := players[playerID]
// 	if !exists {
// 		return
// 	}
// 	file, err := json.MarshalIndent(player, "", " ")
// 	if err != nil {
// 		log.Println("Error marshalling player:", err)
// 		return
// 	}
// 	filename := fmt.Sprintf("%s.json", playerID)
// 	err = os.WriteFile(filename, file, 0644)
// 	if err != nil {
// 		log.Println("Error writing player to file:", err)
// 	}
// }

// func loadPlayer(playerID string) {
// 	playersMutex.Lock()
// 	defer playersMutex.Unlock()

// 	filename := fmt.Sprintf("%s.json", playerID)
// 	file, err := os.ReadFile(filename)
// 	if err != nil {
// 		log.Println("Error reading file:", err)
// 		return
// 	}
// 	var player Player
// 	err = json.Unmarshal(file, &player)
// 	if err != nil {
// 		log.Println("Error unmarshalling player:", err)
// 		return
// 	}
// 	players[playerID] = &player
// }
