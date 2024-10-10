package game

import (
	"encoding/json"
	"fmt"
	"image"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/google/uuid"
)

type Player struct {
	ID           string    `json:"id"`
	Position     Position  `json:"position"`
	Color        Color     `json:"color"`
	Health       int       `json:"health"`
	MaxHealth    int       `json:"max_health"`
	HealthRegen  time.Time `json:"regen_time"`
	Attack       int       `json:"attack"`
	Special      int       `json:"special"`
	MaxSpecial   int       `json:"max_special"`
	SpecialRegen time.Time `json:"special_regen_time"`
	Experience   int       `json:"experience"`
	Width        int       `json:"width"`
}

func initializePlayer(playerID string) *Player {
	player, exists := players[playerID]
	if !exists {
		color := randomColor()
		// Initialize the player if not exists
		player = &Player{
			ID:           playerID,
			Color:        color,
			Position:     Position{X: float64(rand.Intn(400)), Y: float64(rand.Intn(400))},
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
	colliders[playerID] = image.Rect(int(player.Position.X), int(player.Position.Y), int(player.Position.X)+player.Width, int(player.Position.Y)+player.Width)
	return player
}

func updatePlayer(playerID string, command string) {
	// Update player's position
	playersMutex.Lock()
	player := initializePlayer(playerID)

	switch command {
	case "left":
		player.Position.X -= 5
	case "right":
		player.Position.X += 5
	case "up":
		player.Position.Y -= 5
	case "down":
		player.Position.Y += 5
	case "attack":
		var enemyUuid string
		for uuid, collider := range colliders {
			if collider.Overlaps(colliders[playerID]) {
				enemyUuid = uuid
				break
			}
		}

		if enemyUuid != ""  && enemyUuid != playerID && npcs[enemyUuid] != nil {
			npcs[enemyUuid].Health -= player.Attack
			if npcs[enemyUuid].Health <= 0 {
				player.Experience += 10
			}
		}
		// for _, npc := range npcs {
		// 	if calculateDistance(player.Position.X, player.Position.Y, npc.Position.X, npc.Position.Y) < 150 {
		// 		npc.Health -= player.Attack
		// 		if npc.Health <= 0 {
		// 			player.Experience += 10
		// 		}
		// 	}
		// }
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
	if player.Position.X < 0 {
		player.Position.X = 0
	}
	if player.Position.X > 800 {
		player.Position.X = 800
	}
	if player.Position.Y < 0 {
		player.Position.Y = 0
	}
	if player.Position.Y > 600 {
		player.Position.Y = 600
	}
	playersMutex.Unlock()

	// Save the position to a file
	savePosition(playerID)

	// Update the player's collider
	colliders[playerID] = image.Rect(int(player.Position.X), int(player.Position.Y), int(player.Position.X)+player.Width, int(player.Position.Y)+player.Width)
}

func specialAttack(player *Player) {
	if player.Special >= 10 {
		nearest := nearestNpc(player.ID)
		if nearest != "" {
			projectiles[uuid.New().String()] = &Projectile{
				ID:       uuid.New().String(),
				Position: player.Position,
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
	file, err := json.MarshalIndent(player.Position, "", " ")
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
