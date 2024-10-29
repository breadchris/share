package graph

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/yjs"
	jsonpatch "github.com/evanphx/json-patch/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/sashabaranov/go-openai"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/parser"
	"io"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Graph struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

type Msg struct {
	Type  string `json:"type"`
	Value any    `json:"value"`
}

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	graphs := d.Docs.WithCollection("graphs")

	g := Graph{
		Nodes: []GraphNode{},
		Edges: []GraphEdge{},
	}
	bg, err := json.Marshal(g)
	if err != nil {
		log.Println("Failed to marshal graph", err)
		return mux
	}
	bgs := string(bg)
	doc := yjs.NewComplexDocument(&bgs)

	mux.HandleFunc("/yjs/{id...}", func(w http.ResponseWriter, r *http.Request) {
		_ = r.PathValue("id")

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to set websocket upgrade", err)
			return
		}
		defer conn.Close()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("Failed to read message", err)
				return
			}
			// to base64
			base := base64.StdEncoding.EncodeToString(msg)
			if err = doc.ApplyUpdate(base); err != nil {
				log.Println("Failed to apply update", err)
				return
			}
		}
	})

	mux.HandleFunc("/ws/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to set websocket upgrade", err)
			return
		}
		defer conn.Close()

		sg, err := graphs.GetBytes(id)
		if err != nil {
			log.Println("Failed to get document", err)
			return
		}

		msg := Msg{
			Type:  "graph",
			Value: string(sg),
		}
		b, err := json.Marshal(msg)
		if err != nil {
			log.Println("Failed to marshal message", err)
			return
		}

		if err = conn.WriteMessage(websocket.TextMessage, b); err != nil {
			log.Println("Failed to write message", err)
			return
		}

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("Failed to read message", err)
				return
			}

			var m Msg
			if err = json.Unmarshal(msg, &m); err != nil {
				log.Println("Failed to unmarshal message", err)
				return
			}

			switch m.Type {
			case "ai":
				s := m.Value.(map[string]any)
				req := openai.ChatCompletionRequest{
					Model:     openai.GPT4o20240513,
					MaxTokens: 1024,
					Messages: []openai.ChatCompletionMessage{
						//{Role: "system", Content: "You are a helpful assistant."},
						{Role: "user", Content: s["text"].(string)},
					},
				}
				resp, err := d.AI.CreateChatCompletionStream(context.TODO(), req)
				if err != nil {
					log.Println("Failed to create chat completion stream", err)
					return
				}
				defer resp.Close()

				var buf string
				for {
					re, err := resp.Recv()
					if errors.Is(err, io.EOF) {
						break
					}

					if err != nil {
						log.Println("Failed to receive chat completion", err)
						return
					}

					buf += re.Choices[0].Delta.Content
					ctx := parser.NewContext()

					md := goldmark.New()

					var c bytes.Buffer
					if err := md.Convert([]byte(buf), &c, parser.WithContext(ctx)); err != nil {
						log.Println("Failed to convert markdown", err)
						return
					}

					m := Msg{
						Type: "ai",
						Value: map[string]string{
							"text": c.String(),
							"id":   s["id"].(string),
						},
					}
					b, err := json.Marshal(m)
					if err != nil {
						log.Println("Failed to marshal message", err)
						return
					}

					if err = conn.WriteMessage(websocket.TextMessage, b); err != nil {
						log.Println("Failed to write message", err)
						return
					}

					//c += re.Choices[0].Delta.Content
				}
			case "graph":
				s := m.Value.(string)
				p, err := jsonpatch.CreateMergePatch(sg, []byte(s))
				if err != nil {
					log.Println("Failed to create merge patch", err)
					return
				}

				sg, err = jsonpatch.MergePatch(sg, p)
				if err != nil {
					log.Println("Failed to merge patch", err)
					return
				}

				if err = graphs.SetBytes(id, sg); err != nil {
					log.Println("Failed to set document", err)
					return
				}

				//for _, c := range d.Clients {
				//	err := c.WriteJSON(message)
				//	if err != nil {
				//		d.Logger.Error(err)
				//		return
				//	}
				//}
			default:
				log.Println("Unknown message type", m.Type)
			}
		}
	})
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			id = uuid.NewString()
			graph := Graph{
				Nodes: []GraphNode{},
				Edges: []GraphEdge{},
			}
			if err := graphs.Set(id, graph); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, "/graph/"+id, http.StatusFound)
		}
		Html(
			Title(T("Graph")),
			Link(Attr("rel", "stylesheet"), Attr("type", "text/css"), Attr("href", "/dist/graph/graph.css")),
			Style(Text(style)),
			Div(Id("graph"), Attr("data-id", id)),
			Script(Src("/dist/graph/graph.js"), Attr("type", "module")),
		).RenderPage(w, r)
	})
	return mux
}

type JSONPatchOp string

const (
	JSONPatchOpAdd     JSONPatchOp = "add"
	JSONPatchOpRemove  JSONPatchOp = "remove"
	JSONPatchOpReplace JSONPatchOp = "replace"
)

type JSONPatch struct {
	Op    JSONPatchOp `json:"op"`
	Path  string      `json:"path"`
	Value any         `json:"value"`
}

func ApplyJSONPatch(original, new any, patch []JSONPatch) error {
	originalJSON, err := json.Marshal(original)
	if err != nil {
		return fmt.Errorf("failed to marshal original data: %w", err)
	}

	p, err := json.Marshal(patch)
	if err != nil {
		return fmt.Errorf("failed to marshal patch data: %w", err)
	}
	obj, err := jsonpatch.DecodePatch(p)
	if err != nil {
		return fmt.Errorf("failed to decode JSON patch: %w", err)
	}

	modifiedJSON, err := obj.Apply(originalJSON)
	if err != nil {
		return fmt.Errorf("failed to apply JSON patch: %w", err)
	}

	err = json.Unmarshal(modifiedJSON, new)
	if err != nil {
		return fmt.Errorf("failed to unmarshal patched data: %w", err)
	}

	return nil
}

type GraphEdge struct {
	ID     string         `json:"id"`
	Source string         `json:"source"`
	Target string         `json:"target"`
	Data   map[string]any `json:"data"`
	Type   *string        `json:"type,omitempty"`
}

type GraphNode struct {
	ID       string         `json:"id"`
	Position XYPosition     `json:"position"`
	Data     map[string]any `json:"data"`
	Type     *string        `json:"type,omitempty"`

	// Controls source position for default, source, and target node types
	// Example: 'right', 'left', 'top', 'bottom'
	SourcePosition *Position `json:"sourcePosition,omitempty"`

	// Controls target position for default, source, and target node types
	TargetPosition *Position `json:"targetPosition,omitempty"`

	Hidden        *bool    `json:"hidden,omitempty"`
	Selected      *bool    `json:"selected,omitempty"`
	Dragging      *bool    `json:"dragging,omitempty"`
	Draggable     *bool    `json:"draggable,omitempty"`
	Selectable    *bool    `json:"selectable,omitempty"`
	Connectable   *bool    `json:"connectable,omitempty"`
	Deletable     *bool    `json:"deletable,omitempty"`
	DragHandle    *string  `json:"dragHandle,omitempty"`
	Width         *float64 `json:"width,omitempty"`
	Height        *float64 `json:"height,omitempty"`
	InitialWidth  *float64 `json:"initialWidth,omitempty"`
	InitialHeight *float64 `json:"initialHeight,omitempty"`

	// Parent node id, used for creating sub-flows
	ParentID *string `json:"parentId,omitempty"`

	ZIndex *int `json:"zIndex,omitempty"`

	// Boundary a node can be moved in
	// Example: 'parent' or [[0, 0], [100, 100]]
	Extent *Extent `json:"extent,omitempty"`

	ExpandParent *bool   `json:"expandParent,omitempty"`
	AriaLabel    *string `json:"ariaLabel,omitempty"`

	// Origin of the node relative to its position
	// Example: [0.5, 0.5] for center, [0, 0] for top left, [1, 1] for bottom right
	Origin *NodeOrigin `json:"origin,omitempty"`

	Handles *[]NodeHandle `json:"handles,omitempty"`

	// Measurements for node dimensions
	Measured *Measured `json:"measured,omitempty"`
}

type XYPosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Position string

type Extent struct {
	Parent *string           `json:"parent,omitempty"`
	Bounds *CoordinateExtent `json:"bounds,omitempty"`
}

type CoordinateExtent [2][2]float64

type NodeOrigin [2]float64

type NodeHandle struct {
	// Define node handle structure as per your requirements
}

type Measured struct {
	Width  *float64 `json:"width,omitempty"`
	Height *float64 `json:"height,omitempty"`
}

var style = `
body, html {
	margin: 0;
	padding: 0;
	height: 100%;
	overflow: hidden;
}
#graph {
	overscroll-behavior-x: contain;
}
#board {
	width: 200%;
	height: 200%;
	position: relative;
	background-color: #f0f0f0;
}
.node {
	width: 100px;
	height: 50px;
	background-color: #4CAF50;
	position: absolute;
	cursor: move;
	color: white;
	text-align: center;
	line-height: 50px;
}
.edge {
	position: absolute;
	background-color: #000;
	height: 2px;
}
`
