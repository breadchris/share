# Flow - Worklet Prototype Platform

Flow is a comprehensive platform for creating and managing worklet prototypes with integrated data persistence capabilities, Slack bot integration, and AI-powered development assistance.

## Features

- **Worklet Management**: Create, deploy, and manage containerized prototypes from Git repositories
- **Supabase Integration**: Built-in key-value store for prototype data persistence
- **TypeScript Support**: Full type safety with auto-generated database types
- **Real-time Claude Integration**: Stream Claude responses directly to Slack threads
- **Session Management**: Maintain conversation context within Slack threads and worklets
- **Thread Support**: Reply to threads to continue conversations with Claude
- **Automatic Cleanup**: Sessions timeout after inactivity to manage resources

## Prerequisites

1. **Node.js 18+** and npm
2. **Go 1.21+**: Required for building the application
3. **Docker**: For worklet containerization
4. **Supabase account**: For data persistence
5. **Slack App**: Create a Slack app with Socket Mode enabled (optional)
6. **Claude CLI**: Install the Claude command-line tool

## Quick Start

### Installation

1. Clone the repository and navigate to the flow directory:
   ```bash
   cd flow
   npm install
   ```

2. Generate TypeScript types from Supabase:
   ```bash
   npm run generate:types
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Supabase Integration

### Database Type Generation

The project uses Supabase for data persistence. TypeScript types are automatically generated from the database schema using the Supabase CLI.

#### Generating Types

To update TypeScript types after database schema changes:

```bash
# Using npm script (recommended)
npm run generate:types

# Or directly with npx
npx supabase gen types typescript --project-id "rugmmokyormjafybapbl" --schema public > database.types.ts
```

#### Configuration

The Supabase configuration is located in `/data/supabase-config.ts` and includes:

- **Project URL**: `https://rugmmokyormjafybapbl.supabase.co`
- **Anonymous Key**: For client-side operations
- **Environment Override**: Runtime configuration via environment variables

#### Environment Variables

You can override the default configuration using environment variables:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Key-Value Store

The platform provides a comprehensive key-value store for prototype data persistence:

#### Features

- **Worklet Isolation**: Each prototype can only access its own data
- **Namespace Support**: Organize data logically within worklets
- **Type Safety**: Full TypeScript support with IntelliSense
- **Batch Operations**: Efficient bulk data operations
- **Collision Prevention**: Entropy-rich keys prevent data conflicts

#### Usage

```typescript
import { createWorkletKVStore } from './data/supabase-kv';

// Initialize the KV store
const kvStore = createWorkletKVStore(workletId);

// Basic operations
await kvStore.set('user_prefs', 'theme', 'dark');
const theme = await kvStore.get<string>('user_prefs', 'theme');

// Batch operations
await kvStore.mset('app_state', {
  current_page: 'dashboard',
  sidebar_open: true
});
```

See `CLAUDE.md` for comprehensive usage examples and patterns.

## Setup

### 1. Slack App Configuration (Optional)

1. Create a new Slack App at https://api.slack.com/apps
2. Enable Socket Mode in "Socket Mode" settings
3. Add slash command `/flow` pointing to your app
4. Configure OAuth scopes:
   - `app_mentions:read`
   - `channels:read`
   - `chat:write`
   - `commands`
   - `im:read`
   - `users:read`
5. Install app to your workspace

### 2. Environment Variables

```bash
export SLACK_APP_TOKEN=xapp-1-...     # Socket Mode token
export SLACK_BOT_TOKEN=xoxb-...       # Bot User OAuth token
export SLACK_BOT_ENABLED=true         # Enable the bot
export SLACK_BOT_DEBUG=true           # Optional: Enable debug logging
```

### 3. Configuration File

Create `data/config.json`:

```json
{
  "slack_bot_enabled": true,
  "slack_app_token": "xapp-1-...",
  "slack_bot_token": "xoxb-...",
  "session_timeout": "30m",
  "max_sessions": 10,
  "dsn": "sqlite://data/db.sqlite",
  "share_dir": "data"
}
```

### 4. Install Dependencies

```bash
go mod tidy
```

### 5. Build and Run

```bash
go build -o flow
./flow
```

## Usage

### Starting a Claude Session

In any Slack channel where the bot is present:

```
/flow Help me refactor this Go code to be more modular
```

This creates a new thread where Claude will:
1. Acknowledge the request
2. Stream the response in real-time
3. Update the message as new content arrives
4. Show tool usage (file reads, code analysis, etc.)

### Continuing the Conversation

Simply reply to the thread to send additional messages to Claude:

```
Actually, can you also add error handling?
```

### Session Management

- Sessions automatically timeout after 30 minutes of inactivity
- Each thread maintains its own Claude session and context
- Sessions are cleaned up when threads become inactive

## Database Schema

### Migration Files

Database migrations are located in `/migrations/` and include:

- `001_worklet_kv_store.sql`: Creates the key-value store table with proper indexing and RLS policies

### Key Tables

#### worklet_kv_store

Stores key-value data for worklet prototypes:

```sql
CREATE TABLE worklet_kv_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklet_id UUID NOT NULL,
    namespace TEXT NOT NULL DEFAULT 'default',
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_worklet_namespace_key UNIQUE (worklet_id, namespace, key)
);
```

#### Security

- **Row Level Security (RLS)**: Enabled for data isolation
- **User-based Access**: Users can only access data for worklets they own
- **Automatic Cleanup**: Functions for efficient data management

## Architecture

### Core Components

- **Worklet Management**: Create, deploy, and manage containerized prototypes
- **Supabase Integration**: Key-value store for prototype data persistence
- **SlackBot**: Main bot service managing Slack connections and Claude sessions
- **Session Management**: Bridges Slack threads with Claude sessions and worklets
- **Message Streaming**: Real-time updates to Slack messages as Claude responds
- **Event Handling**: Processes slash commands and thread replies

### Dependencies

- **Claude Service**: Manages Claude CLI processes and WebSocket communication
- **Database**: Stores session information, conversation history, and worklet data
- **Configuration**: Manages bot settings and credentials
- **Supabase**: Remote database for key-value store operations

## Development

### Scripts

- `npm run generate`: Generate protobuf types
- `npm run generate:types`: Generate Supabase TypeScript types
- `npm run build`: Compile TypeScript
- `npm run dev`: Development mode with watch

### File Structure

```
flow/
├── data/                    # TypeScript modules and data files
│   ├── supabase-config.ts   # Supabase configuration
│   └── supabase-kv.ts       # Key-value store client
├── migrations/              # Database migration files
│   └── 001_worklet_kv_store.sql
├── models/                  # Go models and types
│   └── models.go
├── worklet/                 # Worklet management
├── slackbot/               # Core slack bot implementation
├── code/                   # Code rendering and compilation
├── deps/                   # Dependency injection
├── config/                 # Configuration management
├── db/                     # Database utilities
├── session/                # Session management
├── database.types.ts       # Generated Supabase types
├── package.json
├── main.go                 # Application entry point
└── README.md
```

### Running Tests

```bash
go test ./...
```

### Debug Mode

Enable debug logging:

```bash
export SLACK_BOT_DEBUG=true
```

This provides detailed logs of:
- Slack event processing
- Claude session management
- Message update operations
- Error conditions and retries

## API Reference

### WorkletKVStore Class

The main interface for data persistence operations:

```typescript
class WorkletKVStore {
  // Basic CRUD operations
  set(namespace: string, key: string, value: any): Promise<void>
  get<T>(namespace: string, key: string): Promise<T | null>
  has(namespace: string, key: string): Promise<boolean>
  delete(namespace: string, key: string): Promise<boolean>
  
  // Batch operations
  mset(namespace: string, entries: Record<string, any>): Promise<void>
  mget(namespace: string, keys: string[]): Promise<Record<string, any>>
  
  // List operations
  list(options?: KVListOptions): Promise<string[]>
  listNamespaces(): Promise<string[]>
  clear(namespace?: string): Promise<number>
  
  // Advanced operations
  increment(namespace: string, key: string, delta?: number): Promise<number>
  append(namespace: string, key: string, value: string): Promise<void>
  
  // Utility
  getStats(): Promise<KVStats>
  exportData(): Promise<Record<string, Record<string, any>>>
  importData(data: Record<string, Record<string, any>>): Promise<void>
}
```

### Error Types

```typescript
class KVError extends Error                    // Base KV error
class KVConnectionError extends KVError        // Connection failures
class KVValidationError extends KVError        // Input validation errors
```

## Best Practices

### Data Organization

1. **Use Meaningful Namespaces**: Organize data logically (e.g., `user_prefs`, `app_state`, `cache`)
2. **Validate Input**: Always validate data before storing
3. **Handle Errors**: Implement proper error handling with try-catch blocks
4. **Batch Operations**: Use `mset`/`mget` for multiple operations
5. **Size Limits**: Keep values under 1MB for optimal performance

### Security

1. **Data Isolation**: Each worklet can only access its own data
2. **Input Validation**: All keys and values are validated before storage
3. **Error Handling**: Sensitive information is not exposed in error messages

### Performance

1. **Indexing**: Efficient querying with proper database indexes
2. **Batch Operations**: Reduce round trips with bulk operations
3. **Connection Pooling**: Automatic connection management
4. **Caching**: Built-in query optimization

## Troubleshooting

### Bot not responding to commands

- Check token configuration in environment variables or config file
- Verify Socket Mode is enabled in Slack app settings
- Ensure slash command `/flow` is properly configured

### Claude sessions not working

- Verify Claude CLI is installed and available in PATH
- Check Claude configuration and API keys
- Review application logs for WebSocket connection errors

### Message updates not appearing

- Check Slack API rate limits
- Verify bot has `chat:write` permissions
- Review error logs for API failures

## Contributing

1. Make database schema changes in new migration files
2. Run `npm run generate:types` after schema changes
3. Update documentation and examples
4. Test with both local and production Supabase instances

## License

MIT License - see LICENSE file for details.
