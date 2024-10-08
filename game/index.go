package game

import (
	"fmt"

	. "github.com/breadchris/share/html"
)

// list of keys paired with directions
var keys = []keyBinding{{key: "a", directions: "left"},
	{key: "d", directions: "right"},
	{key: "w", directions: "up"},
	{key: "s", directions: "down"},
	{key: "n", directions: "attack"},
	{key: "m", directions: "special"},
	{key: "1", directions: "one"},
	{key: "2", directions: "two"},
	{key: "3", directions: "three"},
}

func specialMeter(special int, specialTotal int, x int, y int) *Node {
	return Div(
		Id("specialMeter"),
		Attr("style", fmt.Sprintf("width: %d%%; background-color: blue; left:%dpx; top:%dpx; height:3px;", special*100/specialTotal, x, y)),
	)
}

func experienceMeter(experience int, experienceTotal int, x int, y int) *Node {
	return Div(
		Id("experienceMeter"),
		Attr("style", fmt.Sprintf("width: %d%%; background-color: green; left:%dpx; top:%dpx; height:3px;", experience*100/experienceTotal, x, y+10)),
	)
}

func generatePlayerDiv(playerID string, x, y float64, color string) *Node {
	special := Div()
	experience := Div()
	width := 10

	if _, exists := players[playerID]; exists {
		player := players[playerID]
		special = specialMeter(player.Special, player.MaxSpecial, int(player.Object.Position.X), int(player.Object.Position.Y))
		experience = experienceMeter(player.Experience, 200, int(player.Object.Position.X), int(player.Object.Position.Y))
		width = players[playerID].MaxHealth / 10
		player.Width = width
	}

	return Div(
		// HxTarget(fmt.Sprintf("#player-%s", playerID)),
		Id("player-"+playerID),
		Attr("style", fmt.Sprintf("position:absolute; left:%dpx; top:%dpx; width:%dpx; height:%dpx; background-color:%s;", int(x), int(y), width, width, color)),
		special,
		experience,
	)
}

func generateProjectileDiv(projectileID string, x, y int) *Node {
	return Div(
		Id("projectile-"+projectileID),
		Attr("style", fmt.Sprintf("position:absolute; left:%dpx; top:%dpx; width:10px; height:10px; background-color:red;", x, y)),
	)
}

func MovementPage(players map[string]*Player, npcs map[string]*Player) *Node {
	PlayersDiv := Div(Id("chat_room"),
		Attr("hx-swap-oob", "innerHTML"))
	for playerID, player := range players {
		color := fmt.Sprintf("hsl(%d, %d%%, %d%%)", player.Color.H, player.Color.S, 100-player.Health)
		PlayersDiv.Children = append(PlayersDiv.Children, generatePlayerDiv(playerID, player.Object.Position.X, player.Object.Position.Y, color))
	}
	for npcID, npc := range npcs {
		color := fmt.Sprintf("hsl(%d, %d%%, %d%%)", npc.Color.H, npc.Color.S, 100-npc.Health)
		PlayersDiv.Children = append(PlayersDiv.Children, generatePlayerDiv(npcID, npc.Object.Position.X, npc.Object.Position.Y, color))
	}
	controls, forms := jsControls()

	return Html(
		Head(
			Title(
				Text("PixelWars"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
		),
		Body(
			Div(
				Attr("hx-ext", "ws"),
				Attr("ws-connect", "/game/move"),
				PlayersDiv,
				forms,
			),
			Script(
				Text(controls),
			),
		),
	)
}

type keyBinding struct {
	key        string
	directions string
}

func createForm(command string) *Node {
	return Form(
		Id("form"),
		Attr("ws-send", "submit"),
		Input(
			Attr("readonly", ""),
			Attr("hidden", ""),
			Name("chat_message"),
			Attr("autocomplete", "off"),
			Attr("autofocus", ""),
			Value(command),
		),
		Input(
			Attr("hidden", ""),
			Id(command+"Button"),
			Type("submit"),
			Value("Send"),
		),
	)
}

func jsControls() (string, *Node) {
	stringKeys := fmt.Sprintf("'%s'", keys[0].key)
	keyPresses := fmt.Sprintf("if (keysPressed['%s']) {\n\tdirections.push('%s');\n}", keys[0].key, keys[0].directions)
	directions := fmt.Sprintf("if (directions.includes('%s')) {\n\tdocument.getElementById('%sButton').click();\n}", keys[0].directions, keys[0].directions)
	forms := Div(createForm(keys[0].directions))
	for i := 1; i < len(keys); i++ {
		stringKeys = fmt.Sprintf("%s, '%s'", stringKeys, keys[i].key)
		keyPresses = fmt.Sprintf("%s\nif (keysPressed['%s']) {\n\tdirections.push('%s');\n}", keyPresses, keys[i].key, keys[i].directions)
		directions = fmt.Sprintf("%s\nif (directions.includes('%s')) {\n\tdocument.getElementById('%sButton').click();\n}", directions, keys[i].directions, keys[i].directions)
		forms.Children = append(forms.Children, createForm(keys[i].directions))
	}
	stringKeys = fmt.Sprintf("[%s]", stringKeys)

	buttons := fmt.Sprintf(`
		// Key state tracking
		var keysPressed = {};

		// Start moving when keys are pressed
		document.addEventListener('keydown', function(event) {
			var key = event.key;
			console.log('key pressed');
			if (%s.includes(key)) {
				keysPressed[key] = true;
				console.log('key pressed');
				event.preventDefault(); // prevent default scrolling
			}
		});

		// Stop moving when keys are released
		document.addEventListener('keyup', function(event) {
			var key = event.key;
			if (%s.includes(key)) {
				keysPressed[key] = false;
				event.preventDefault(); // prevent default scrolling
			}
		});
		
		// Movement function
		function movePlayer() {
			var directions = [];
			%s
			if (directions.length > 0) {
				%s
			}
		}

		// Call movePlayer at regular intervals
		setInterval(movePlayer, 50);
		`, stringKeys, stringKeys, keyPresses, directions)
	return buttons, forms
}
