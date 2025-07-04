package figma

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/config"
	"io/ioutil"
	"net/http"
)

const (
	figmaAPIURL = "https://api.figma.com/v1/files/"
)

type FigmaDocument struct {
	Name     string    `json:"name"`
	Document FigmaNode `json:"document"`
}

type FigmaNode struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Type     string      `json:"type"`
	Children []FigmaNode `json:"children,omitempty"`
}

type Global struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Visible *bool    `json:"visible,omitempty"`
	Type    NodeType `json:"type"`
}

// StyleType represents the different types of styles available.
type StyleType string

const (
	FillStyle   StyleType = "FILL"
	TextStyle   StyleType = "TEXT"
	EffectStyle StyleType = "EFFECT"
	GridStyle   StyleType = "GRID"
)

// StyleKeyType represents the ways styles can be applied.
type StyleKeyType string

const (
	FillKey       StyleKeyType = "fill"
	StrokeKey     StyleKeyType = "stroke"
	EffectKey     StyleKeyType = "effect"
	GridKey       StyleKeyType = "grid"
	TextKey       StyleKeyType = "text"
	BackgroundKey StyleKeyType = "background"
)

// StylesObject represents a map of styles applied.
type StylesObject map[StyleKeyType]map[StyleKeyType]string

// ScaleMode represents how scaling is applied.
type ScaleMode string

const (
	FillScaleMode    ScaleMode = "FILL"
	FitScaleMode     ScaleMode = "FIT"
	TileScaleMode    ScaleMode = "TILE"
	StretchScaleMode ScaleMode = "STRETCH"
)

// PaintType definitions.
type PaintType string

const (
	PaintTypeSolid    PaintType = "SOLID"
	PaintTypeGradient PaintType = "GRADIENT_LINEAR"
	PaintTypeRadial   PaintType = "GRADIENT_RADIAL"
	PaintTypeAngular  PaintType = "GRADIENT_ANGULAR"
	PaintTypeDiamond  PaintType = "GRADIENT_DIAMOND"
	PaintTypeImage    PaintType = "IMAGE"
	PaintTypeEmoji    PaintType = "EMOJI"
)

// BlendMode defines how a layer blends with layers below.
type BlendMode string

const (
	BlendModePassThrough BlendMode = "PASS_THROUGH"
	BlendModeNormal      BlendMode = "NORMAL"
	// Darken Modes
	BlendModeDarken     BlendMode = "DARKEN"
	BlendModeMultiply   BlendMode = "MULTIPLY"
	BlendModeLinearBurn BlendMode = "LINEAR_BURN"
	BlendModeColorBurn  BlendMode = "COLOR_BURN"
	// Lighten Modes
	BlendModeLighten     BlendMode = "LIGHTEN"
	BlendModeScreen      BlendMode = "SCREEN"
	BlendModeLinearDodge BlendMode = "LINEAR_DODGE"
	BlendModeColorDodge  BlendMode = "COLOR_DODGE"
	// Contrast Modes
	BlendModeOverlay   BlendMode = "OVERLAY"
	BlendModeSoftLight BlendMode = "SOFT_LIGHT"
	BlendModeHardLight BlendMode = "HARD_LIGHT"
	// Inversion Modes
	BlendModeDifference BlendMode = "DIFFERENCE"
	BlendModeExclusion  BlendMode = "EXCLUSION"
	// Component Modes
	BlendModeHue        BlendMode = "HUE"
	BlendModeSaturation BlendMode = "SATURATION"
	BlendModeColor      BlendMode = "COLOR"
	BlendModeLuminosity BlendMode = "LUMINOSITY"
)

// EasingType defines the easing for animations.
type EasingType string

const (
	EaseIn    EasingType = "EASE_IN"
	EaseOut   EasingType = "EASE_OUT"
	EaseInOut EasingType = "EASE_IN_AND_OUT"
)

// RoleType defines the user roles.
type RoleType string

const (
	Viewer RoleType = "viewer"
	Editor RoleType = "editor"
	Owner  RoleType = "owner"
)

// NodeType defines the different node types in Figma.
type NodeType string

const (
	NodeTypeDocument       NodeType = "DOCUMENT"
	NodeTypeCanvas         NodeType = "CANVAS"
	NodeTypeFrame          NodeType = "FRAME"
	NodeTypeGroup          NodeType = "GROUP"
	NodeTypeVector         NodeType = "VECTOR"
	NodeTypeBoolean        NodeType = "BOOLEAN"
	NodeTypeStar           NodeType = "STAR"
	NodeTypeLine           NodeType = "LINE"
	NodeTypeEllipse        NodeType = "ELLIPSE"
	NodeTypeRegularPolygon NodeType = "REGULAR_POLYGON"
	NodeTypeRectangle      NodeType = "RECTANGLE"
	NodeTypeText           NodeType = "TEXT"
	NodeTypeSlice          NodeType = "SLICE"
	NodeTypeComponent      NodeType = "COMPONENT"
	NodeTypeInstance       NodeType = "INSTANCE"
)

// TODO breadchris Node is Node = Document | Canvas | Frame | Group | Vector | BooleanGroup | Star | Line | Ellipse | RegularPolygon | Rectangle | Text | Slice | Component | Instance
type Node any

// Document represents the root node.
type Document struct {
	Global
	Type     NodeType `json:"type"`
	Children []Node   `json:"children"`
}

// Canvas represents a single page.
type Canvas struct {
	Global
	Type                 NodeType        `json:"type"`
	Children             []Node          `json:"children"`
	BackgroundColor      Color           `json:"backgroundColor"`
	PrototypeStartNodeID *string         `json:"prototypeStartNodeID,omitempty"`
	ExportSettings       []ExportSetting `json:"exportSettings,omitempty"`
}

// FrameBase contains common fields for frame types.
type FrameBase struct {
	Global
	Children            []Node           `json:"children"`
	Background          []Paint          `json:"background"`
	BackgroundColor     Color            `json:"backgroundColor"`
	ExportSettings      []ExportSetting  `json:"exportSettings,omitempty"`
	BlendMode           BlendMode        `json:"blendMode"`
	PreserveRatio       *bool            `json:"preserveRatio,omitempty"`
	Constraints         LayoutConstraint `json:"constraints"`
	TransitionNodeID    *string          `json:"transitionNodeID,omitempty"`
	TransitionDuration  *int             `json:"transitionDuration,omitempty"`
	TransitionEasing    *EasingType      `json:"transitionEasing,omitempty"`
	Opacity             *float64         `json:"opacity,omitempty"`
	AbsoluteBoundingBox Rect             `json:"absoluteBoundingBox"`
	Size                *Vector2         `json:"size,omitempty"`
	RelativeTransform   *Transform       `json:"relativeTransform,omitempty"`
	ClipsContent        bool             `json:"clipsContent"`
	LayoutGrids         []LayoutGrid     `json:"layoutGrids,omitempty"`
	Effects             []Effect         `json:"effects"`
	IsMask              *bool            `json:"isMask,omitempty"`
	Styles              *StylesObject    `json:"styles,omitempty"`
}

// VectorBase contains common fields for vector types.
type VectorBase struct {
	Global
	ExportSettings      []ExportSetting  `json:"exportSettings,omitempty"`
	BlendMode           BlendMode        `json:"blendMode"`
	PreserveRatio       *bool            `json:"preserveRatio,omitempty"`
	Constraints         LayoutConstraint `json:"constraints"`
	TransitionNodeID    *string          `json:"transitionNodeID,omitempty"`
	TransitionDuration  *int             `json:"transitionDuration,omitempty"`
	TransitionEasing    *EasingType      `json:"transitionEasing,omitempty"`
	Opacity             *float64         `json:"opacity,omitempty"`
	AbsoluteBoundingBox Rect             `json:"absoluteBoundingBox"`
	Size                *Vector2         `json:"size,omitempty"`
	RelativeTransform   *Transform       `json:"relativeTransform,omitempty"`
	Effects             []Effect         `json:"effects"`
	IsMask              *bool            `json:"isMask,omitempty"`
	Fills               []Paint          `json:"fills,omitempty"`
	FillGeometry        []Path           `json:"fillGeometry,omitempty"`
	Strokes             []Paint          `json:"strokes,omitempty"`
	StrokeWeight        float64          `json:"strokeWeight"`
	StrokeGeometry      []Path           `json:"strokeGeometry,omitempty"`
	StrokeAlign         string           `json:"strokeAlign"` // "INSIDE" | "OUTSIDE" | "CENTER"
	Styles              *StylesObject    `json:"styles,omitempty"`
}

// Vector represents a vector network, consisting of vertices and edges.
type Vector struct {
	VectorBase
	Type NodeType `json:"type"`
}

// BooleanGroup represents a group with a boolean operation applied.
type BooleanGroup struct {
	VectorBase
	Type             NodeType `json:"type"`
	BooleanOperation string   `json:"booleanOperation"` // "UNION" | "INTERSECT" | "SUBTRACT" | "EXCLUDE"
	Children         []Node   `json:"children"`
}

// Star represents a regular star shape.
type Star struct {
	VectorBase
	Type NodeType `json:"type"`
}

// Line represents a straight line.
type Line struct {
	VectorBase
	Type NodeType `json:"type"`
}

// Ellipse represents an ellipse.
type Ellipse struct {
	VectorBase
	Type NodeType `json:"type"`
}

// RegularPolygon represents a regular n-sided polygon.
type RegularPolygon struct {
	VectorBase
	Type NodeType `json:"type"`
}

// Rectangle represents a rectangle.
type Rectangle struct {
	VectorBase
	Type                 NodeType    `json:"type"`
	CornerRadius         *float64    `json:"cornerRadius,omitempty"`
	RectangleCornerRadii *[4]float64 `json:"rectangleCornerRadii,omitempty"`
}

// Text represents a text box.
type Text struct {
	VectorBase
	Type                    NodeType          `json:"type"`
	Characters              string            `json:"characters"`
	Style                   TypeStyle         `json:"style"`
	CharacterStyleOverrides []int             `json:"characterStyleOverrides"`
	StyleOverrideTable      map[int]TypeStyle `json:"styleOverrideTable"`
}

// Slice represents a rectangular region of the canvas that can be exported.
type Slice struct {
	Global
	Type                NodeType        `json:"type"`
	ExportSettings      []ExportSetting `json:"exportSettings"`
	AbsoluteBoundingBox Rect            `json:"absoluteBoundingBox"`
	Size                *Vector2        `json:"size,omitempty"`
	RelativeTransform   *Transform      `json:"relativeTransform,omitempty"`
}

// Component represents a node that can have instances created of it.
type Component struct {
	FrameBase
	Type NodeType `json:"type"`
}

// Instance represents an instance of a component, changes to the component affect the instance.
type Instance struct {
	FrameBase
	Type        NodeType `json:"type"`
	ComponentID string   `json:"componentId"`
}

// Color represents an RGBA color.
type Color struct {
	R float64 `json:"r"`
	G float64 `json:"g"`
	B float64 `json:"b"`
	A float64 `json:"a"`
}

// ExportSetting represents the format and size to export an asset.
type ExportSetting struct {
	Suffix     string     `json:"suffix"`
	Format     string     `json:"format"` // "JPG" | "PNG" | "SVG" | "PDF"
	Constraint Constraint `json:"constraint"`
}

// Constraint represents sizing constraints for exports.
type Constraint struct {
	Type  string  `json:"type"` // "SCALE" | "WIDTH" | "HEIGHT"
	Value float64 `json:"value"`
}

// Rect represents a rectangle that expresses a bounding box in absolute coordinates.
type Rect struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

// LayoutConstraint represents a layout constraint relative to the containing frame.
type LayoutConstraint struct {
	Vertical   string `json:"vertical"`   // "TOP" | "BOTTOM" | "CENTER" | "TOP_BOTTOM" | "SCALE"
	Horizontal string `json:"horizontal"` // "LEFT" | "RIGHT" | "CENTER" | "LEFT_RIGHT" | "SCALE"
}

// LayoutGrid represents guides to align and place objects within a frame.
type LayoutGrid struct {
	Pattern     string  `json:"pattern"` // "COLUMNS" | "ROWS" | "GRID"
	SectionSize float64 `json:"sectionSize"`
	Visible     bool    `json:"visible"`
	Color       Color   `json:"color"`
	Alignment   string  `json:"alignment"` // "MIN" | "MAX" | "CENTER"
	GutterSize  float64 `json:"gutterSize"`
	Offset      float64 `json:"offset"`
	Count       int     `json:"count"`
}

// Effect represents a visual effect such as a shadow or blur.
type Effect struct {
	Type      string     `json:"type"` // "INNER_SHADOW" | "DROP_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR"
	Visible   bool       `json:"visible"`
	Radius    float64    `json:"radius"`
	Color     *Color     `json:"color,omitempty"`
	BlendMode *BlendMode `json:"blendMode,omitempty"`
	Offset    *Vector2   `json:"offset,omitempty"`
}

// Paint represents a solid color, gradient, or image texture.
type Paint struct {
	Type                    PaintType   `json:"type"`
	Visible                 *bool       `json:"visible,omitempty"`
	Opacity                 *float64    `json:"opacity,omitempty"`
	Color                   *Color      `json:"color,omitempty"`
	BlendMode               BlendMode   `json:"blendMode"`
	GradientHandlePositions []Vector2   `json:"gradientHandlePositions,omitempty"`
	GradientStops           []ColorStop `json:"gradientStops,omitempty"`
	ScaleMode               *ScaleMode  `json:"scaleMode,omitempty"`
	ImageTransform          *Transform  `json:"imageTransform,omitempty"`
	ScalingFactor           *float64    `json:"scalingFactor,omitempty"`
	ImageRef                *string     `json:"imageRef,omitempty"`
	GifRef                  *string     `json:"gifRef,omitempty"`
}

// Path represents a sequence of path commands in SVG notation.
type Path struct {
	Path        string `json:"path"`
	WindingRule string `json:"windingRule"` // "EVENODD" | "NONZERO"
}

// Transform represents a 2D transform matrix.
type Transform [2][3]float64

// Vector2 represents a 2D vector.
type Vector2 struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// ColorStop represents a position and color pair for a gradient.
type ColorStop struct {
	Position float64 `json:"position"`
	Color    Color   `json:"color"`
}

// TypeStyle represents metadata for character formatting.
type TypeStyle struct {
	FontFamily                string   `json:"fontFamily"`
	FontPostScriptName        string   `json:"fontPostScriptName"`
	ParagraphSpacing          *float64 `json:"paragraphSpacing,omitempty"`
	ParagraphIndent           *float64 `json:"paragraphIndent,omitempty"`
	Italic                    *bool    `json:"italic,omitempty"`
	FontWeight                int      `json:"fontWeight"` // 100 to 900
	FontSize                  float64  `json:"fontSize"`
	TextAlignHorizontal       string   `json:"textAlignHorizontal"` // "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED"
	TextAlignVertical         string   `json:"textAlignVertical"`   // "TOP" | "CENTER" | "BOTTOM"
	LetterSpacing             float64  `json:"letterSpacing"`
	Fills                     []Paint  `json:"fills,omitempty"`
	LineHeightPx              float64  `json:"lineHeightPx"`
	LineHeightPercent         float64  `json:"lineHeightPercent"`
	LineHeightUnit            string   `json:"lineHeightUnit"`           // "PIXELS" | "FONT_SIZE_%" | "INTRINSIC_%"
	TextCase                  *string  `json:"textCase,omitempty"`       // "UPPER" | "LOWER" | "TITLE"
	TextDecoration            *string  `json:"textDecoration,omitempty"` // "STRIKETHROUGH" | "UNDERLINE"
	LineHeightPercentFontSize *float64 `json:"lineHeightPercentFontSize,omitempty"`
}

// ComponentMetadata represents metadata for a master component.
type ComponentMetadata struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// FrameInfo provides details about the frame.
type FrameInfo struct {
	NodeID          string `json:"node_id"`
	Name            string `json:"name"`
	BackgroundColor string `json:"background_color"`
	PageID          string `json:"page_id"`
	PageName        string `json:"page_name"`
}

// SharedElement contains common metadata for shared elements.
type SharedElement struct {
	ComponentMetadata
	FileKey      string `json:"file_key"`
	NodeID       string `json:"node_id"`
	ThumbnailURL string `json:"thumbnail_urlString"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
	User         User   `json:"user"`
}

// FullComponentMetadata includes additional data for components in a file.
type FullComponentMetadata struct {
	SharedElement
	ContainingFrame *FrameInfo `json:"containing_frame,omitempty"`
	ContainingPage  *any       `json:"containing_page,omitempty"` // broken in the doc
}

// FullStyleMetadata includes additional data for styles in a file.
type FullStyleMetadata struct {
	SharedElement
	StyleType    StyleType `json:"style_type"`
	SortPosition string    `json:"sort_position"`
}

// Style describes styles used in a file.
type Style struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Key         string    `json:"key"`
	StyleType   StyleType `json:"styleType"`
}

// Comment represents a comment or reply left by a user.
type Comment struct {
	ID         string      `json:"id"`
	FileKey    string      `json:"file_key"`
	ParentID   *string     `json:"parent_id,omitempty"`
	User       User        `json:"user"`
	CreatedAt  string      `json:"created_at"`
	ResolvedAt *string     `json:"resolved_at,omitempty"`
	Message    string      `json:"message"`
	ClientMeta interface{} `json:"client_meta"` // Vector2 or FrameOffset
	OrderID    int         `json:"order_id"`
}

// User represents a Figma user.
type User struct {
	ID     string `json:"id"`
	Handle string `json:"handle"`
	ImgURL string `json:"img_url"`
}

// FrameOffset represents a relative offset within a frame.
type FrameOffset struct {
	NodeID     string  `json:"node_id"`
	NodeOffset Vector2 `json:"node_offset"`
}

// ProjectSummary summarizes a project.
type ProjectSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// FileResponse represents the response for a file.
type FileResponse struct {
	Components    map[string]ComponentMetadata `json:"components"`
	Styles        map[string]Style             `json:"styles"`
	Document      Document                     `json:"document"`
	LastModified  string                       `json:"lastModified"`
	Name          string                       `json:"name"`
	Role          RoleType                     `json:"role"`
	SchemaVersion int                          `json:"schemaVersion"`
	ThumbnailUrl  string                       `json:"thumbnailUrl"`
	Version       string                       `json:"version"`
}

// FileNodesResponse represents the response for file nodes.
type FileNodesResponse struct {
	Nodes        map[string]*FileNode `json:"nodes"`
	LastModified string               `json:"lastModified"`
	Name         string               `json:"name"`
	Role         RoleType             `json:"role"`
	ThumbnailUrl string               `json:"thumbnailUrl"`
	Version      string               `json:"version"`
}

// FileNode represents a node in a file.
type FileNode struct {
	Document      Node                         `json:"document"`
	Components    map[string]ComponentMetadata `json:"components"`
	Styles        map[string]Style             `json:"styles"`
	SchemaVersion int                          `json:"schemaVersion"`
}

// VersionMetadata represents metadata for a file version.
type VersionMetadata struct {
	ID          string `json:"id"`
	CreatedAt   string `json:"created_at"`
	Label       string `json:"label"`
	Description string `json:"description"`
	User        User   `json:"user"`
}

// FileVersionsResponse represents the response for file versions.
type FileVersionsResponse struct {
	Versions []VersionMetadata `json:"versions"`
}

// FileImageResponse represents the response for file images.
type FileImageResponse struct {
	Error  *string           `json:"err,omitempty"`
	Images map[string]string `json:"images"`
}

// FileImageFillsResponse represents the response for file image fills.
type FileImageFillsResponse struct {
	Error  bool `json:"error"`
	Status int  `json:"status"`
	Meta   struct {
		Images map[string]string `json:"images"`
	} `json:"meta"`
}

// CommentsResponse represents the response for comments.
type CommentsResponse struct {
	Comments []Comment `json:"comments"`
}

// ComponentResponse represents the response for components.
type ComponentResponse struct {
	Error  *string                          `json:"err,omitempty"`
	Status int                              `json:"status"`
	Meta   map[string]FullComponentMetadata `json:"meta"`
}

// StyleResponse represents the response for styles.
type StyleResponse struct {
	Error *string                      `json:"err,omitempty"`
	Meta  map[string]FullStyleMetadata `json:"meta"`
}

// FileSummary represents the summary of a file.
type FileSummary struct {
	Key          string `json:"key"`
	Name         string `json:"name"`
	ThumbnailURL string `json:"thumbnail_url"`
	LastModified string `json:"last_modified"`
}

// TeamProjectsResponse represents the response for team projects.
type TeamProjectsResponse struct {
	Name     string           `json:"name"`
	Projects []ProjectSummary `json:"projects"`
}

// ProjectFilesResponse represents the response for project files.
type ProjectFilesResponse struct {
	Name  string        `json:"name"`
	Files []FileSummary `json:"files"`
}

// PaginationResponse represents a pagination response.
type PaginationResponse struct {
	Cursor struct {
		Before int `json:"before"`
		After  int `json:"after"`
	} `json:"cursor"`
}

// TeamComponentsResponse represents the response for team components.
type TeamComponentsResponse struct {
	PaginationResponse
	Components []FullComponentMetadata `json:"components"`
}

// FileComponentsResponse represents the response for file components.
type FileComponentsResponse struct {
	PaginationResponse
	Components []FullComponentMetadata `json:"components"`
}

// TeamStylesResponse represents the response for team styles.
type TeamStylesResponse struct {
	PaginationResponse
	Styles []FullStyleMetadata `json:"styles"`
}

// FileStylesResponse represents the response for file styles.
type FileStylesResponse struct {
	PaginationResponse
	Styles []FullStyleMetadata `json:"styles"`
}

// Frame represents a node of fixed size containing other nodes.
type Frame struct {
	FrameBase
	Type NodeType `json:"type"`
}

// Group represents a logical grouping of nodes.
type Group struct {
	FrameBase
	Type NodeType `json:"type"`
}

func FetchFigmaFile(c config.AppConfig, fileID string) (*FigmaDocument, error) {
	req, err := http.NewRequest("GET", figmaAPIURL+fileID, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("X-Figma-Token", c.Figma)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch Figma file: %s", resp.Status)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var doc FigmaDocument
	err = json.Unmarshal(body, &doc)
	if err != nil {
		return nil, err
	}

	return &doc, nil
}

func PrintFigmaNodes(node FigmaNode, indent string) {
	fmt.Printf("%s- %s (%s)\n", indent, node.Name, node.Type)
	for _, child := range node.Children {
		PrintFigmaNodes(child, indent+"  ")
	}
}
