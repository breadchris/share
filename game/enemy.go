package game

import (
	"fmt"
	"image"
	"math/rand"

	"github.com/google/uuid"
)

func updateNpc(npcID string, npc *Player) {
	command := rand.Intn(4)

	xMove := 0.0
	yMove := 0.0
	err := fmt.Errorf("")
	for _, player := range players {
		//pursue player
		xMove, yMove, err = moveTowards(npc.Position.X, npc.Position.Y, player.Position.X, player.Position.Y, 10000)
		if err == nil {
			command = 4
		}
		//attack player
		if (colliders[player.ID].Min.X < int(npc.Position.X) && int(npc.Position.X) < colliders[player.ID].Max.X && colliders[player.ID].Min.Y < int(npc.Position.Y) && int(npc.Position.Y) < colliders[player.ID].Max.Y) {
			player.Health -= npc.Attack
			if player.Health <= 0 {
				delete(players, player.ID)
			}
		}
		// distance := calculateDistance(player.Position.X, player.Position.Y, npc.Position.X, npc.Position.Y)
		// if distance < 100 {
		// 	player.Health -= npc.Attack
		// 	if player.Health <= 0 {
		// 		delete(players, player.ID)
		// 	}
		// }
	}

	switch command {
	case 0:
		npc.Position.X -= 5
	case 1:
		npc.Position.X += 5
	case 2:
		npc.Position.Y -= 5
	case 3:
		npc.Position.Y += 5
	case 4:
		npc.Position.X += float64(xMove)
		npc.Position.Y += float64(yMove)

	}
	// Keep NPCs within bounds (optional)
	if npc.Position.X < 0 {
		npc.Position.X = 0
	}
	if npc.Position.X > 800 {
		npc.Position.X = 800
	}
	if npc.Position.Y < 0 {
		npc.Position.Y = 0
	}
	if npc.Position.Y > 600 {
		npc.Position.Y = 600
	}
	npcs[npcID] = npc
	colliders[npcID] = image.Rect(int(npc.Position.X), int(npc.Position.Y), int(npc.Position.X)+10, int(npc.Position.Y)+10)
}

// Function to initialize NPCs
func initializeNPCs() {
	playersMutex.Lock()
	defer playersMutex.Unlock()
	for i := 0; i < 10; i++ {
		newNPC()
	}
}

func newNPC() {
	uuid := uuid.New().String()

	npcs[uuid] = &Player{
		ID:         uuid,
		Position:   Position{X: rand.Float64() * 800, Y: rand.Float64() * 600},
		Color:      Color{H: 0, S: 0, L: 50},
		Health:     100,
		Attack:     10,
		MaxSpecial: 100,
	}
	colliders[uuid] = image.Rect(int(npcs[uuid].Position.X), int(npcs[uuid].Position.Y), int(npcs[uuid].Position.X)+10, int(npcs[uuid].Position.Y)+10)
}

func nearestNpc(playerID string) string {

	var nearestNPC string
	var nearestDistance float64
	player, exists := players[playerID]

	if !exists {
		return ""
	}
	for npcID, npc := range npcs {
		distance := calculateDistance(player.Position.X, player.Position.Y, npc.Position.X, npc.Position.Y)
		if nearestNPC == "" || distance < nearestDistance {
			nearestNPC = npcID
			nearestDistance = distance
		}
	}
	return nearestNPC
}
