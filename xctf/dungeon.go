package xctf

import (
	"context"
	"net/http"
	"strings"
	"sync"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

// GameState holds a player’s current progress in the dungeon.
type GameState struct {
	CurrentLevel int
	CurrentRoom  int
	Inventory    map[string]bool
	Message      string
	GameOver     bool
	Victory      bool
}

// Room now distinguishes between an Item and a Monster.
// An item may be picked up while a monster must be defeated.
type Room struct {
	Description     string
	Item            string // e.g., "sword", "key", "ladder"
	Monster         string // e.g., "monster", "boss"
	ItemTaken       bool   // true if the item has been picked up
	MonsterDefeated bool   // true if the monster has been defeated
	Locked          bool   // true if a door is locked (used for level 3)
}

// dungeon holds the layout of levels and rooms.
// It is reinitialized via resetDungeon() when needed.
var dungeon [][]Room

func init() {
	resetDungeon()
}

// resetDungeon reinitializes the dungeon layout to its starting state.
func resetDungeon() {
	dungeon = [][]Room{
		{
			{Description: "A dark room with a snarling enemy.", Monster: "monster"},
			{Description: "A quiet room with a shiny sword on the wall.", Item: "sword"},
			{Description: "A room with a ladder leading to the next level.", Item: "ladder"},
		},
		{
			{Description: "A damp room with a lurking foe.", Monster: "monster"},
			{Description: "A room that glows with a mysterious key on a pedestal.", Item: "key"},
			{Description: "A room with a creaky ladder to ascend further.", Item: "ladder"},
		},
		{
			{Description: "A grand door stands before you. It appears locked.", Locked: true},
			{Description: "You enter a cavernous chamber. The boss awaits!", Monster: "boss"},
		},
	}
}

// gameStates holds the current state for each player, keyed by user ID.
var gameStates = map[string]*GameState{}
var mu sync.Mutex

// getGameState retrieves or creates a GameState for a given user.
func getGameState(userID string) *GameState {
	mu.Lock()
	defer mu.Unlock()
	gs, ok := gameStates[userID]
	if !ok {
		gs = &GameState{
			CurrentLevel: 0,
			CurrentRoom:  0,
			Inventory:    make(map[string]bool),
			Message:      "Welcome to the dungeon!",
		}
		gameStates[userID] = gs
	}
	return gs
}

// New returns an HTTP ServeMux handling our text-based dungeon game.
func NewDungeon(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/dungeon")

		// Retrieve the current user (or session) ID.
		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		gs := getGameState(userID)

		// If the player has finished all levels, mark victory.
		if gs.CurrentLevel >= len(dungeon) {
			gs.Message = "Congratulations, you have completed the dungeon!"
			gs.Victory = true
		}

		// Retrieve the current room (unless game over or victory).
		var currentRoom *Room
		if !gs.GameOver && !gs.Victory {
			level := dungeon[gs.CurrentLevel]
			if gs.CurrentRoom >= len(level) {
				gs.CurrentRoom = len(level) - 1
			}
			currentRoom = &dungeon[gs.CurrentLevel][gs.CurrentRoom]
		}

		// Process commands sent via POST.
		if r.Method == http.MethodPost {
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			command := strings.ToLower(strings.TrimSpace(r.FormValue("command")))
			if !gs.GameOver && !gs.Victory {
				processCommand(gs, currentRoom, command)
			} else if command == "reset" {
				processCommand(gs, currentRoom, command)
			}
		}

		// Build the page content.
		var content *Node
		if gs.GameOver {
			content = Div(
				Class("p-5 max-w-lg mx-auto"),
				Div(Class("alert alert-error"), Text("Game Over! Enter 'reset' to start a new adventure.")),
				Form(
					Class("flex flex-col space-y-4"),
					HxPost(""),
					HxTarget("body"),
					Input(Class("input"), Type("text"), Name("command"), Placeholder("Enter command")),
					Button(Class("btn"), Type("submit"), Text("Submit")),
				),
			)
		} else if gs.Victory {
			content = Div(
				Class("p-5 max-w-lg mx-auto"),
				Div(Class("alert alert-success"), Text("Victory! You have conquered the dungeon. Enter 'reset' to play again.")),
				Form(
					Class("flex flex-col space-y-4"),
					HxPost(""),
					HxTarget("body"),
					Input(Class("input"), Type("text"), Name("command"), Placeholder("Enter command")),
					Button(Class("btn"), Type("submit"), Text("Submit")),
				),
			)
		} else {
			// Build a description of the current room.
			roomDesc := currentRoom.Description
			if currentRoom.Monster != "" && !currentRoom.MonsterDefeated {
				roomDesc += " A " + currentRoom.Monster + " is here."
			}
			if currentRoom.Item != "" && !currentRoom.ItemTaken {
				roomDesc += " You see a " + currentRoom.Item + "."
			}
			if currentRoom.Locked {
				roomDesc += " The door is locked."
			}
			content = Div(
				Class("p-5 max-w-lg mx-auto"),
				Div(Class("my-4"), Text(gs.Message)),
				Div(Class("my-4"), Text(roomDesc)),
				Div(Class("my-4"), Text("Inventory: "+getInventory(gs.Inventory))),
				Form(
					Class("flex flex-col space-y-4"),
					HxPost(""),
					HxTarget("body"),
					Input(Class("input"), Type("text"), Name("command"), Placeholder("Enter command")),
					Button(Class("btn"), Type("submit"), Text("Submit")),
				),
			)
		}

		DefaultLayout(content).RenderPageCtx(ctx, w, r)
	})
	return mux
}

// getInventory returns a string listing the items in the inventory.
func getInventory(inv map[string]bool) string {
	if len(inv) == 0 {
		return "empty"
	}
	var list string
	for item := range inv {
		list += item + " "
	}
	return strings.TrimSpace(list)
}

// processCommand updates the GameState based on the input command.
func processCommand(gs *GameState, room *Room, command string) {
	switch {
	case command == "look":
		gs.Message = "You carefully observe your surroundings."
		if room.Monster != "" && !room.MonsterDefeated {
			gs.Message += " A " + room.Monster + " is here."
		}
		if room.Item != "" && !room.ItemTaken {
			gs.Message += " You see a " + room.Item + "."
		}
		if room.Locked {
			gs.Message += " The door is locked."
		}
	case command == "reset":
		resetGame(gs)
		gs.Message = "Game has been reset. Welcome back to the dungeon!"
	case strings.HasPrefix(command, "pickup"):
		if room.Item != "" && !room.ItemTaken {
			// Only certain items are pickable.
			if room.Item == "sword" || room.Item == "key" || room.Item == "ladder" {
				gs.Inventory[room.Item] = true
				room.ItemTaken = true
				gs.Message = "You picked up the " + room.Item + "."
			} else {
				gs.Message = "That item cannot be picked up."
			}
		} else {
			gs.Message = "Nothing to pick up here."
		}
	case command == "attack":
		if room.Monster != "" && !room.MonsterDefeated {
			if gs.Inventory["sword"] {
				room.MonsterDefeated = true
				if room.Monster == "boss" {
					gs.Message = "You defeat the boss and conquer the dungeon!"
					gs.Victory = true
				} else {
					gs.Message = "You slay the " + room.Monster + " with your sword."
				}
			} else {
				gs.Message = "Without a sword, the " + room.Monster + " overpowers you. You perish."
				gs.GameOver = true
			}
		} else {
			gs.Message = "There's nothing here to attack."
		}
	case command == "go":
		// Use a ladder to move up a level.
		if room.Item == "ladder" && !room.ItemTaken {
			gs.CurrentLevel++
			gs.CurrentRoom = 0
			gs.Message = "You ascend to the next level."
		} else if gs.CurrentRoom < len(dungeon[gs.CurrentLevel])-1 {
			gs.CurrentRoom++
			gs.Message = "You move to the next room."
		} else {
			gs.Message = "There's nowhere to go from here."
		}
	case command == "unlock":
		if room.Locked {
			if gs.Inventory["key"] {
				room.Locked = false
				delete(gs.Inventory, "key")
				gs.Message = "You unlock the door with your key."
				if gs.CurrentRoom+1 < len(dungeon[gs.CurrentLevel]) {
					gs.CurrentRoom++
				}
			} else {
				gs.Message = "The door is locked and you don't have the key."
			}
		} else {
			gs.Message = "There's nothing here to unlock."
		}
	default:
		gs.Message = "Unknown command. Try 'look', 'pickup', 'attack', 'go', 'unlock', or 'reset'."
	}
}

// resetGame resets the player's GameState and the dungeon layout.
func resetGame(gs *GameState) {
	gs.CurrentLevel = 0
	gs.CurrentRoom = 0
	gs.Inventory = make(map[string]bool)
	gs.Message = "Welcome to the dungeon!"
	gs.GameOver = false
	gs.Victory = false
	resetDungeon()
}
