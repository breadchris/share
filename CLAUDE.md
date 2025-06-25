# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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