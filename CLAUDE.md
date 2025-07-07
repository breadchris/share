# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## git repos
- ./claudemd
- ./flow
only refer to the code in the git repo directory in isolation, this is a separate git repo and does not share code with the rest of the codebase.

## Proto / GRPC
- Proto files are located in the `proto/` directory
- Use go generate . to generate Go and Typescript from proto files
- Refer to ./buf.gen.yaml for the code generation configuration

## Go
- Debug print statements should be fmt.Printf("Debug: %+v\n", variable)
- Routes are mounted in `main.go` using the `p()` function. Each route handler is wrapped with `interpreted("/path")`
- JustShare is mounted as the root route ("") in both startServer and startXCTF functions
- Utility functions have been moved to `main_todo.go` to keep main.go focused on core server setup
- Never try to run the apps yourself

## React
- React apps are built using TypeScript and React, with components stored in `.tsx` files.
- Components use esmodules are available 

## Persisting State
- Uploading files will use the "/upload" endpoint to persist files located in main.go as func uploadHandler(w http.ResponseWriter, r *http.Request) {
- Storing models in the database is managed in ./models/models.go, which uses GORM for ORM functionality.
- The database is automatically migrated in the ./db/ package, which handles schema changes and updates.
- The document store is in db/

## Tools
- Use the browsermcp tool for debugging the currently opened web app when there are errors or when the user wants to inspect the current state of the application to make enhancements to rendered UI elements.

## Context
- The api for the coderunner is in ./coderunner/coderunner.go
- ./data/coderunner/src/ is where components are stored
- Components are written in TypeScript/React and compiled with esbuild. They use tailwindcss for styling.

––––––––––––––––––––––––
By following this layered thought-process—starting from purpose and use cases, down through props, state, visuals, and tests—you ensure your component is both well-defined and resilient to future change.










## Developing Components
When I set out to design and implement a UI component (or any isolated unit of functionality), I run through a structured “context enumeration” process to make sure it’s:

Well scoped—so I know exactly what it must do

Loosely coupled—so it can flex and evolve without breaking everything else

Below is the thought-process I follow, step by step:

1. Clarify the Why
   Purpose & goal

What user problem is this component solving?

What higher-level feature or page does it enable?

Stakeholders & users

Who asked for it? Product, UX, accessibility team, etc.

Who will use it? What personas or roles?

Outcome: A one-sentence mission statement (“This component lets an editor add and reorder tags on an article”).

2. Enumerate Use Cases
   Primary flows

The “happy path” interactions that must work flawlessly.

Secondary & edge cases

What if there’s no data? What if the user cancels midway?

Error conditions, loading states, empty states.

Outcome: A concise list of scenarios—e.g.

Create a new tag

Remove an existing tag

Drag-and-drop reorder

While saving, show spinner and disable inputs

3. Capture Requirements
   Functional requirements

What data goes in and what comes out?

What events or callbacks must it fire?

Non-functional constraints

Performance (e.g. must render in <50 ms)

Accessibility (keyboard, screen-reader)

Theming / styling constraints (fits within existing design system)

Outcome: A requirements checklist you can tick off during development.

4. Sketch the API Boundary
   Inputs (props / parameters / config)

Data shapes, required vs optional

Default values or sensible fallbacks

Outputs (events / return values / callbacks)

What will parent code listen for?

Public methods (if any)

Imperative actions the consumer might call

Outcome: A “component signature” draft, e.g.

ts
Copy code
interface TagEditorProps {
tags: string[];
onAdd(tag: string): void;
onRemove(tag: string): void;
onReorder(tags: string[]): void;
disabled?: boolean;
}
5. Define State & Data Flow
   Internal state vs controlled state

What does this component own vs what does the parent own?

Lifecycle & side-effects

Will it fetch data, debounce inputs, animate transitions?

Data normalization

How will you transform or validate incoming data?

Outcome: Clear map of how data moves in, mutates, and is emitted.

6. Outline the Visual & Interaction Blueprint
   Wireframes or low-fi sketches

Layout, spacing, iconography, typography

Interaction design

Hover states, focus rings, press/tap feedback

Responsive & adaptive concerns

How does it behave on mobile vs desktop?

Outcome: A tiny style-guide or sketch that the implementer can refer to.

7. Surface Dependencies & Integration Points
   Other components it composes (buttons, modals, lists)

Data services (REST clients, caches)

Utility libraries (drag-and-drop, date formatting)

Outcome: A dependency list so you know what to import and what to mock in tests.

8. Enumerate Error States & Edge Cases
   Validation errors, API failures, timeouts

Race conditions (e.g. two reorder requests in flight)

Accessibility fallbacks (e.g. no-JS environments)

Outcome: A set of “what if” tests you’ll write before coding.

9. Draft a Test Plan
   Unit tests for pure logic (data transforms, validation)

Component tests (rendering, props, events)

Visual regression (snapshot tests or Percy)

Accessibility audits (aXe, keyboard navigation)

Outcome: A checklist of test cases ensuring full coverage.

10. Write Lightweight Documentation
    Prop tables with descriptions and examples

Usage snippets: minimal and more advanced

Do’s & Don’ts: common pitfalls or misuse

Outcome: A README or Storybook entry so other devs can pick it up.

11. Review & Iterate
    Peer review: grab another set of eyes for ambiguity or missing cases

Prototype & sanity check: a quick POC to validate assumptions

Refinement: slim down props, collapse rarely used options

Outcome: A final spec that’s neither over-engineered nor under-scoped.

Balancing Granularity
Too coarse → you end up coding assumptions into the component; unclear boundaries.

Too fine → you over-specify internal details, hindering flexibility or reuse.

Rule of thumb: stop when you can hand off your spec to a teammate and have them implement it without further questions—but leave room for extension by keeping the API minimal and focused.

## Commands

### Development
- `go run . start` - Start the development server
- `npm run build` - Build WebAssembly components
- `GOOS=js GOARCH=wasm go build -buildvcs=false -ldflags "-s -w" -o editor/web/public/wasm/analyzer@v1.wasm ./editor/wasm/analyzer/webworker.go` - Build WASM analyzer

### Testing
- `go test ./...` - Run all Go tests
- Individual package tests: `go test ./package-name/`

## Architecture

### Backend (Go)
- **Main application**: `main.go` - HTTP server with modular route handlers
- **Database**: GORM with SQLite/PostgreSQL support via `db/db.go`
- **Models**: `models/models.go` - Database models with GORM annotations
- **Auto-migration**: Database schema migrations run automatically in `db/`

### Frontend (TypeScript/React)
- **Components**: Write new frontend components in `.tsx` files
- **Build system**: esbuild for TypeScript compilation and bundling
- **Monaco Editor**: Code editing functionality with WebAssembly support

### Key Modules
- **coderunner/**: Code execution environment with Monaco editor integration
  - `coderunner.go` - Backend API endpoints for file operations
  - `CodeRunner.tsx` - Frontend React component
- **justshare/**: Mobile-first content capture and sharing platform
  - `justshare.go` - Backend API for content, groups, and file management
  - `JustShare.tsx` - Main React application component
  - See `/data/coderunner/src/justshare/CLAUDE.md` for detailed documentation
- **ai/**: AI integration and chat functionality
- **breadchris/**: Blog and content management
- **xctf/**: CTF (Capture The Flag) platform features
- **editor/**: Collaborative editing with leaps and Monaco

### Database Patterns
- Use GORM models in `models/models.go`
- Add new models with proper GORM tags and relationships
- Auto-migration runs in `db/` package
- JSONField generic type for complex data storage

### Component Structure
Follow the coderunner pattern for new features:
1. Backend Go package with HTTP handlers
2. Frontend TSX components with React
3. API endpoints for data operations
4. Database models if persistence needed

### File Organization
- Backend packages: `/package-name/package-name.go`
- Frontend components: `/package-name/ComponentName.tsx`
- Static assets: `/static/`
- Database models: `/models/models.go`
