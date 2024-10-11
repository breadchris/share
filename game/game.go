package game

import (
	"fmt"
	"net/http"
	"time"

	. "github.com/breadchris/share/html"
)

type Projectile struct {
	ID       string   `json:"id"`
	Target   string   `json:"target"`
	Distance int      `json:"distance"`
	PlayerID string   `json:"player_id"`
	Damage   int      `json:"damage"`
	Position Position `json:"position"`
}

// The game loop that updates NPCs and broadcasts their positions
func gameLoop() {
	initializeNPCs()
	for {
		time.Sleep(100 * time.Millisecond)
		update()
		Draw()
	}
}

func collisionDetection(x, y int) string {
	for uuid, collider := range colliders {
		if collider.Min.X < x && x < collider.Max.X && collider.Min.Y < y && y < collider.Max.Y {
			return uuid
		}
	}
	return ""
}

func update() {
	playersMutex.Lock()
	for projectileID, projectile := range projectiles {
		npc, exists := npcs[projectile.Target]
		if !exists {
			delete(projectiles, projectileID)
			continue
		}
		if calculateDistance(float64(projectile.Position.X), float64(projectile.Position.Y), npc.Position.X, npc.Position.Y) < 100 {
			npc.Health -= projectile.Damage
			if npc.Health <= 0 {
				players[projectile.PlayerID].Experience += 10
			}
			delete(projectiles, projectileID)
		} else if calculateDistance(float64(projectile.Position.X), float64(projectile.Position.Y), npc.Position.X, npc.Position.Y) >= float64(projectile.Distance) {
			delete(projectiles, projectileID)
		} else {
			xMove, yMove, _ := moveTowards(float64(projectile.Position.X), float64(projectile.Position.Y), npc.Position.X, npc.Position.Y, float64(projectile.Distance))
			projectile.Position.X += xMove
			projectile.Position.Y += yMove
		}
	}
	for npcID, npc := range npcs {
		if npc.Health <= 0 {
			delete(npcs, npcID)
		} else {
			updateNpc(npcID, npc)
		}
	}
	if len(npcs) < 5 {
		for i := 0; i < 5; i++ {
			newNPC()
		}
	}

	for playersID := range players {
		regenHealth(playersID)
		regenSpecial(playersID)
	}

	playersMutex.Unlock()
}

func Draw() {
	gameDiv := Div(Id("chat_room"),
		Attr("hx-swap-oob", "innerHTML"))

	playersMutex.Lock()
	for pID, player := range players {
		color := fmt.Sprintf("hsl(%d, %d%%, %d%%)", player.Color.H, player.Color.S, 100-player.Health)
		gameDiv.Children = append(gameDiv.Children, generatePlayerDiv(pID, player.Position.X, player.Position.Y, color))
		// npcDivs.Children = append(npcDivs.Children, updateHealth(player.ID, player.Health, player.Attack, player.Position.X, player.Position.Y))

	}
	for npcID, npc := range npcs {
		color := "hsl(0, 0%, " + fmt.Sprint(100-npc.Health) + "%)"
		gameDiv.Children = append(gameDiv.Children, generatePlayerDiv(npcID, npc.Position.X, npc.Position.Y, color))
	}

	for projectileID, projectile := range projectiles {
		gameDiv.Children = append(gameDiv.Children, generateProjectileDiv(projectileID, int(projectile.Position.X), int(projectile.Position.Y)))
	}

	playersMutex.Unlock()

	messageHTML := gameDiv.Render()
	hub.broadcast <- []byte(messageHTML)
}

// =====================================================================================================================
// Abilities
// =====================================================================================================================

func regenHealth(playerID string) {
	// playersMutex.Lock()
	player, exists := players[playerID]
	if !exists {
		return
	}
	if player.HealthRegen.Before(time.Now()) {
		player.Health += 1
		if player.Health > player.MaxHealth {
			player.Health = player.MaxHealth
		}
		player.HealthRegen = time.Now().Add(1 * time.Second)
	}
	// playersMutex.Unlock()
}

func regenSpecial(playerID string) {
	// playersMutex.Lock()
	player, exists := players[playerID]
	if !exists {
		return
	}
	if player.SpecialRegen.Before(time.Now()) {
		player.Special += 10
		if player.Special > 100 {
			player.Special = 100
		}
		player.SpecialRegen = time.Now().Add(2 * time.Second)
	}
}

// =====================================================================================================================
// Utils
// =====================================================================================================================

func moveTowards(X, Y, targetX, targetY, distance float64) (float64, float64, error) {
	xMove := 0.0
	yMove := 0.0
	if calculateDistance(X, Y, targetX, targetY) < float64(distance) {
		if X > targetX {
			xMove = -5
		} else {
			xMove = 5
		}
		if Y > targetY {
			yMove = -5
		} else {
			yMove = 5
		}
	} else {
		return 0, 0, fmt.Errorf("Target is too far")
	}
	return xMove, yMove, nil
}

func calculateDistance(x1, y1, x2, y2 float64) float64 {
	return float64((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2))
}

func calculateDirection(x1, y1, x2, y2 int) int {
	if x1 == x2 {
		if y1 > y2 {
			return 0
		} else {
			return 1
		}
	}
	if y1 == y2 {
		if x1 > x2 {
			return 2
		} else {
			return 3
		}
	}
	return -1
}
