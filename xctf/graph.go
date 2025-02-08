package xctf

import (
	"encoding/json"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"net/http"
)

type Graph struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

type Msg struct {
	Type  string `json:"type"`
	Value any    `json:"value"`
}

func NewGraph(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	graphs := d.Docs.WithCollection("graphs")

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		switch r.Method {
		case http.MethodGet:
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
				return
			}

			type Props struct {
				Id    string `json:"id"`
				Graph Graph  `json:"graph"`
			}

			p := Props{
				Id: id,
			}

			err := graphs.Get(id, &p.Graph)
			if err != nil {
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}

			sg, err := json.Marshal(p)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			Html(
				Title(T("Graph")),
				Link(Attr("rel", "stylesheet"), Attr("type", "text/css"), Attr("href", "/static/graph/graph.css")),
				Style(Text(style)),
				Div(Id("graph"), Attr("data-props", string(sg))),
				Script(Src("/static/graph/graph.js"), Attr("type", "module")),
			).RenderPage(w, r)
		case http.MethodPut:
			var g Graph
			if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			if err := graphs.Set(id, g); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusNoContent)
		}
	})
	return mux
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
