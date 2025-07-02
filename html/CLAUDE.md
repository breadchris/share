# Go HTML Components Library

This document describes how to create and use Go HTML components with this custom library. The system provides a programmatic, type-safe approach to generating HTML without traditional templating.

## Overview

The HTML component library uses a **Node-based architecture** where every HTML element is represented as a `Node` struct. Components are built by composing functions that return `*Node` instances, providing compile-time safety and excellent composability.

### Core Architecture

```go
type Node struct {
    Name         string
    Attrs        map[string]string
    DynamicAttrs map[string]func(ctx context.Context) string
    Children     []*Node
    transform    func(p *Node)
    text         string
    raw          string
    locator      string
    baseURL      string
}
```

## Getting Started

### Import Pattern

Use dot import for clean syntax:

```go
import . "github.com/breadchris/share/html"
```

### Basic HTML Elements

Every HTML element has a corresponding function:

```go
// Basic elements
Div()                    // <div></div>
P()                      // <p></p>
H1()                     // <h1></h1>
Button()                 // <button></button>
Form()                   // <form></form>

// With content
H1(T("Hello World"))     // <h1>Hello World</h1>
P(T("Some text"))        // <p>Some text</p>
```

### Adding Attributes

Attributes are added using transform functions:

```go
// Single attribute
Div(Class("container"))

// Multiple attributes
Button(
    Class("btn btn-primary"),
    Type("submit"),
    Id("submit-btn"),
)

// Custom attributes
Div(Attr("data-id", "123"))

// Multiple attributes at once
Div(Attrs(map[string]string{
    "class": "container",
    "id":    "main",
}))
```

## Component Composition

### Nested Elements

```go
Div(Class("card"),
    H2(Class("card-title"), T("Recipe")),
    P(Class("card-content"), T("Instructions here")),
    Button(Class("btn"), T("Save Recipe")),
)
```

### Collections with Ch()

Use `Ch()` (children) for slices of nodes:

```go
func buildList(items []string) *Node {
    var listItems []*Node
    for _, item := range items {
        listItems = append(listItems, Li(T(item)))
    }
    
    return Ul(Ch(listItems))
}
```

## Advanced Features

### Dynamic Attributes

Attributes can be generated dynamically based on context:

```go
// URLs are automatically prefixed with baseURL from context
A(Href("/recipes"), T("View Recipes"))

// Custom dynamic attributes
func ConditionalClass(condition bool, class string) *Node {
    return &Node{
        transform: func(p *Node) {
            if condition {
                p.Attrs["class"] = class
            }
        },
    }
}
```

### Forms from Go Structs

Automatically generate forms from Go structs:

```go
type Recipe struct {
    Name        string `json:"name"`
    Description string `json:"description"`
    PrepTime    int    `json:"prep_time"`
}

func recipeForm() *Node {
    recipe := Recipe{}
    return Form(
        BuildForm("recipe", recipe),
        Button(Type("submit"), T("Save Recipe")),
    )
}
```

### HTMX Integration

Built-in support for HTMX attributes:

```go
Button(
    Class("btn btn-primary"),
    HxPost("/api/recipes"),
    HxTarget("#recipe-list"),
    HxSwap("innerHTML"),
    T("Add Recipe"),
)

// Other HTMX attributes
Div(
    HxGet("/api/recipes"),
    HxTrigger("load"),
    HxTarget("this"),
)
```

## Layout Components

### Creating Reusable Layouts

```go
func DefaultLayout(title string, content ...*Node) *Node {
    return Html(
        Head(
            Meta(Charset("UTF-8")),
            Meta(Attrs(map[string]string{
                "name":    "viewport", 
                "content": "width=device-width, initial-scale=1.0",
            })),
            Title(T(title)),
            TailwindCSS,
            HTMX,
        ),
        Body(
            buildNavigation(),
            Main(Class("container mx-auto p-4"), Ch(content)),
            buildFooter(),
        ),
    )
}

func buildNavigation() *Node {
    return Nav(Class("bg-blue-500 p-4"),
        Ul(Class("flex justify-center space-x-4"),
            Li(A(Href("/"), Class("text-white"), T("Home"))),
            Li(A(Href("/recipes"), Class("text-white"), T("Recipes"))),
        ),
    )
}
```

### Pre-configured Components

Common external libraries are available as components:

```go
var (
    DaisyUI = Link(
        Href("https://cdn.jsdelivr.net/npm/daisyui@5"),
        Attr("rel", "stylesheet"),
        Attr("type", "text/css"),
    )
    TailwindCSS = Script(Src("https://cdn.tailwindcss.com"))
    HTMX = Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js"))
)
```

## HTTP Integration

### Serving Components

```go
func homePage(w http.ResponseWriter, r *http.Request) {
    page := DefaultLayout("Home",
        H1(T("Welcome to Recipe Manager")),
        P(T("Manage your favorite recipes")),
        A(Href("/recipes"), Class("btn btn-primary"), T("View Recipes")),
    )
    
    page.RenderPage(w, r)
}

// Alternative approaches
func apiHandler(w http.ResponseWriter, r *http.Request) {
    // Direct rendering
    component := Div(T("API Response"))
    w.Header().Set("Content-Type", "text/html")
    w.Write([]byte(component.Render()))
    
    // Or with context
    ctx := context.WithValue(r.Context(), "baseURL", "https://myapp.com")
    w.Write([]byte(component.RenderCtx(ctx)))
}
```

### HTTP Handler Functions

Create reusable handler functions:

```go
func ServeComponent(component *Node) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        component.RenderPage(w, r)
    }
}

// Usage
http.HandleFunc("/about", ServeComponent(aboutPage()))
```

## Component Patterns

### Conditional Rendering

```go
func userProfile(user *User, isLoggedIn bool) *Node {
    if !isLoggedIn {
        return Div(
            P(T("Please log in to view profile")),
            A(Href("/login"), T("Login")),
        )
    }
    
    return Div(
        H1(T("Welcome, " + user.Name)),
        P(T("Email: " + user.Email)),
        Button(HxPost("/logout"), T("Logout")),
    )
}
```

### Data-Driven Components

```go
func recipeCard(recipe Recipe) *Node {
    return Div(Class("card bg-base-100 shadow-xl"),
        Div(Class("card-body"),
            H2(Class("card-title"), T(recipe.Name)),
            P(T(recipe.Description)),
            Div(Class("card-actions justify-end"),
                Button(
                    Class("btn btn-primary"),
                    HxGet(fmt.Sprintf("/recipes/%d", recipe.ID)),
                    T("View Recipe"),
                ),
            ),
        ),
    )
}

func recipeGrid(recipes []Recipe) *Node {
    var cards []*Node
    for _, recipe := range recipes {
        cards = append(cards, recipeCard(recipe))
    }
    
    return Div(Class("grid grid-cols-1 md:grid-cols-3 gap-4"), Ch(cards))
}
```

### Component Factories

```go
func Alert(alertType, message string) *Node {
    classMap := map[string]string{
        "success": "alert alert-success",
        "error":   "alert alert-error",
        "warning": "alert alert-warning",
        "info":    "alert alert-info",
    }
    
    return Div(
        Class(classMap[alertType]),
        T(message),
    )
}

// Usage
Alert("success", "Recipe saved successfully!")
Alert("error", "Failed to save recipe")
```

## Context and Base URLs

### Using Context for Dynamic Values

```go
func apiLink(endpoint string) *Node {
    return A(
        Href(endpoint), // Automatically prefixed with baseURL from context
        Class("api-link"),
        T("API Endpoint"),
    )
}

// Set base URL in context
ctx := context.WithValue(context.Background(), "baseURL", "https://api.myapp.com")
component.RenderCtx(ctx)
```

## Best Practices

### 1. Component Organization

```go
// Keep components in separate functions
func navigationComponent() *Node { /* ... */ }
func footerComponent() *Node { /* ... */ }
func headerComponent(title string) *Node { /* ... */ }

// Group related components
func recipeComponents() {
    func recipeCard(recipe Recipe) *Node { /* ... */ }
    func recipeForm() *Node { /* ... */ }
    func recipeList(recipes []Recipe) *Node { /* ... */ }
}
```

### 2. Styling Conventions

```go
// Use consistent class naming
Div(Class("card"))                    // Component classes
Button(Class("btn btn-primary"))      // Utility classes
Div(Class("grid grid-cols-3 gap-4"))  // Layout classes
```

### 3. Form Handling

```go
// Combine with HTMX for dynamic forms
Form(
    HxPost("/api/recipes"),
    HxTarget("#result"),
    HxSwap("innerHTML"),
    
    BuildForm("recipe", Recipe{}),
    
    Button(
        Type("submit"),
        Class("btn btn-primary"),
        T("Save Recipe"),
    ),
)
```

### 4. Error Handling

```go
func safeRender(component *Node, w http.ResponseWriter) {
    defer func() {
        if r := recover(); r != nil {
            http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        }
    }()
    
    component.RenderPage(w, nil)
}
```

## Common HTML Elements Reference

### Text Elements
- `T(string)` - Text content
- `H1()`, `H2()`, `H3()`, `H4()`, `H5()`, `H6()` - Headings
- `P()` - Paragraph
- `Span()` - Inline text
- `Strong()`, `Em()` - Bold and italic

### Layout Elements
- `Div()` - Generic container
- `Section()`, `Article()`, `Aside()` - Semantic containers
- `Header()`, `Footer()`, `Main()`, `Nav()` - Page structure

### Form Elements
- `Form()` - Form container
- `Input()` - Input field
- `Button()` - Button
- `Select()`, `Option()` - Dropdown
- `Textarea()` - Multi-line input
- `Label()` - Form labels

### List Elements
- `Ul()`, `Ol()` - Unordered and ordered lists
- `Li()` - List items
- `Dl()`, `Dt()`, `Dd()` - Definition lists

### Common Attributes
- `Class()` - CSS classes
- `Id()` - Element ID
- `Href()` - Links
- `Src()` - Source URLs
- `Type()` - Input/button types
- `Attr()` - Custom attributes
- `Attrs()` - Multiple attributes

This component system provides a powerful, type-safe way to build HTML interfaces in Go while maintaining the flexibility and composability needed for modern web applications.