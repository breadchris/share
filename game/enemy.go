package game

import (
	"fmt"
	"math/rand"

	"github.com/google/uuid"
	"github.com/solarlune/resolv"
)

func updateNpc(npcID string, npc *Player) {
	command := rand.Intn(4)

	xMove := 0.0
	yMove := 0.0
	err := fmt.Errorf("")
	for _, player := range players {
		//pursue player
		xMove, yMove, err = moveTowards(npc.Object.Position.X, npc.Object.Position.Y, player.Object.Position.X, player.Object.Position.Y, 10000)
		if err == nil {
			command = 4
		}
		//attack player
		distance := calculateDistance(player.Object.Position.X, player.Object.Position.Y, npc.Object.Position.X, npc.Object.Position.Y)
		if distance < 100 {
			player.Health -= npc.Attack
			if player.Health <= 0 {
				delete(players, player.ID)
			}
		}
	}

	switch command {
	case 0:
		npc.Object.Position.X -= 5
	case 1:
		npc.Object.Position.X += 5
	case 2:
		npc.Object.Position.Y -= 5
	case 3:
		npc.Object.Position.Y += 5
	case 4:
		npc.Object.Position.X += float64(xMove)
		npc.Object.Position.Y += float64(yMove)

	}
	// Keep NPCs within bounds (optional)
	if npc.Object.Position.X < 0 {
		npc.Object.Position.X = 0
	}
	if npc.Object.Position.X > 800 {
		npc.Object.Position.X = 800
	}
	if npc.Object.Position.Y < 0 {
		npc.Object.Position.Y = 0
	}
	if npc.Object.Position.Y > 600 {
		npc.Object.Position.Y = 600
	}
	npcs[npcID] = npc
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
	obj := resolv.NewObject(float64(rand.Intn(600)), float64(rand.Intn(600)), 16, 16, "npc")
	obj.Data = uuid
	space.Add(obj)
	npcs[uuid] = &Player{
		ID:         uuid,
		Object:     obj,
		Color:      Color{H: 0, S: 0, L: 50},
		Health:     100,
		Attack:     10,
		MaxSpecial: 100,
	}
}

func nearestNpc(playerID string) string {

	var nearestNPC string
	var nearestDistance float64
	player, exists := players[playerID]

	if !exists {
		return ""
	}
	for npcID, npc := range npcs {
		distance := calculateDistance(player.Object.Position.X, player.Object.Position.Y, npc.Object.Position.X, npc.Object.Position.Y)
		if nearestNPC == "" || distance < nearestDistance {
			nearestNPC = npcID
			nearestDistance = distance
		}
	}
	return nearestNPC
}
