# Claude Web Interface

A comprehensive React component for interfacing with Claude AI through a web browser. This component provides a full-featured chat interface with session management, real-time streaming, and extensive customization options.

## Features

### Core Functionality
- **Real-time WebSocket communication** with Claude CLI service
- **Session management** - create, resume, save, and organize conversations
- **Streaming responses** with live message updates
- **Message history** with persistent storage
- **Error handling** and connection recovery

### User Interface
- **Modern, responsive design** using Tailwind CSS + DaisyUI
- **Dark/light theme support** with auto-detection
- **Session browser** with search and filtering
- **Message formatting** with syntax highlighting
- **Export capabilities** (JSON, Markdown, HTML, Text)
- **Keyboard shortcuts** for power users

### Advanced Features
- **Auto-reconnection** on WebSocket disconnect
- **Message copy/share** functionality
- **Usage statistics** display
- **Accessibility support** (ARIA labels, keyboard navigation)
- **Mobile-friendly** responsive layout
- **Customizable theming** and configuration

## Installation

```bash
# The component is part of the coderunner package
# Simply import from the claude package
```

## Basic Usage

```tsx
import React from 'react';
import { ClaudeWebInterface } from '../claude';

function App() {
  return (
    <div className="h-screen">
      <ClaudeWebInterface
        darkMode={false}
        autoConnect={true}
        showSessionBrowser={true}
        enableExport={true}
      />
    </div>
  );
}

export default App;
```

## Advanced Usage

```tsx
import React, { useState } from 'react';
import { ClaudeWebInterface, ClaudeMessage, ClaudeConnectionStatus } from '../claude';

function AdvancedApp() {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ClaudeConnectionStatus>();

  const handleMessageReceived = (message: ClaudeMessage) => {
    setMessages(prev => [...prev, message]);
    console.log('New message:', message);
  };

  const handleConnectionChange = (status: ClaudeConnectionStatus) => {
    setConnectionStatus(status);
    console.log('Connection status:', status);
  };

  const handleSessionChange = (sessionId: string | null) => {
    console.log('Current session:', sessionId);
  };

  return (
    <ClaudeWebInterface
      theme="auto" // 'light' | 'dark' | 'auto'
      className="custom-claude-interface"
      apiBaseUrl="https://your-api-server.com"
      autoConnect={true}
      showSessionBrowser={true}
      maxMessages={500}
      enableExport={true}
      enableKeyboardShortcuts={true}
      onMessageReceived={handleMessageReceived}
      onConnectionStatusChange={handleConnectionChange}
      onSessionChange={handleSessionChange}
    />
  );
}

export default AdvancedApp;
```

## Component Props

### ClaudeWebInterfaceProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `darkMode` | `boolean` | `false` | Force dark mode (overrides theme detection) |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode |
| `className` | `string` | `''` | Additional CSS classes |
| `apiBaseUrl` | `string` | `''` | Base URL for API calls |
| `autoConnect` | `boolean` | `true` | Auto-connect on mount |
| `showSessionBrowser` | `boolean` | `true` | Show session management sidebar |
| `maxMessages` | `number` | `1000` | Maximum messages to keep in memory |
| `enableExport` | `boolean` | `true` | Enable export functionality |
| `enableKeyboardShortcuts` | `boolean` | `true` | Enable keyboard shortcuts |
| `onSessionChange` | `(sessionId: string \| null) => void` | - | Session change callback |
| `onMessageReceived` | `(message: ClaudeMessage) => void` | - | New message callback |
| `onConnectionStatusChange` | `(status: ClaudeConnectionStatus) => void` | - | Connection status callback |

## Hooks

### useClaudeWebSocket

Manages WebSocket connection to Claude service.

```tsx
import { useClaudeWebSocket } from '../claude';

const { 
  connectionStatus, 
  connect, 
  disconnect, 
  sendMessage, 
  lastMessage, 
  messageHistory 
} = useClaudeWebSocket({
  autoConnect: true,
  reconnectAttempts: 3,
  reconnectDelay: 2000,
  messageHistoryLimit: 1000,
  apiBaseUrl: 'https://api.example.com'
});
```

### useClaudeSession

Manages Claude session operations.

```tsx
import { useClaudeSession } from '../claude';

const {
  sessions,
  currentSession,
  currentSessionId,
  loading,
  error,
  createSession,
  resumeSession,
  deleteSession,
  updateSessionTitle,
  exportSession,
  refreshSessions
} = useClaudeSession({
  apiBaseUrl: 'https://api.example.com'
});
```

### useClaudeMessages

Manages message state and operations.

```tsx
import { useClaudeMessages } from '../claude';

const {
  messages,
  addMessage,
  clearMessages,
  getMessagesByType,
  getLastAssistantMessage,
  exportMessages
} = useClaudeMessages();
```

## Standalone Components

You can also use individual components separately:

```tsx
import { 
  MessageList, 
  SessionBrowser, 
  InputArea, 
  StatusIndicator 
} from '../claude';

// Use components individually with your own state management
```

## Keyboard Shortcuts

When `enableKeyboardShortcuts` is true:

- `Ctrl/Cmd + Enter` - Send message
- `Ctrl/Cmd + N` - Start new session
- `Ctrl/Cmd + B` - Toggle sidebar
- `Ctrl/Cmd + K` - Focus input
- `Shift + Esc` - Disconnect
- `Esc` - Clear input (when focused)

## Styling

The component uses Tailwind CSS for styling. You can customize the appearance by:

1. **Overriding CSS classes**: Pass custom classes via `className` prop
2. **Custom CSS**: Import the provided `styles.css` or create your own
3. **Tailwind configuration**: Modify your Tailwind config for global changes

```css
/* Custom styling example */
.custom-claude-interface {
  --primary-color: #your-color;
}

.custom-claude-interface .message {
  border-radius: 12px;
}
```

## Theme Support

The component supports multiple theme modes:

- **`light`** - Force light theme
- **`dark`** - Force dark theme  
- **`auto`** - Automatically detect system preference

Themes are implemented using CSS classes and Tailwind's dark mode support.

## Export Formats

When `enableExport` is true, users can export conversations in multiple formats:

- **JSON** - Complete message data with metadata
- **Markdown** - Formatted for documentation
- **HTML** - Self-contained HTML file with styling
- **Text** - Plain text format

## Error Handling

The component includes comprehensive error handling:

- **Connection errors** - Auto-retry with exponential backoff
- **Session errors** - User-friendly error messages
- **Message parsing errors** - Graceful fallbacks
- **API errors** - Detailed error reporting

## Accessibility

The component is built with accessibility in mind:

- **Keyboard navigation** - Full keyboard support
- **Screen reader support** - ARIA labels and descriptions
- **High contrast mode** - Respects user preferences
- **Reduced motion** - Honors prefers-reduced-motion
- **Focus management** - Proper focus indicators

## Browser Support

- **Modern browsers** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebSocket support** - Required for real-time communication
- **ES2020 features** - Optional chaining, nullish coalescing
- **CSS Grid & Flexbox** - For responsive layout

## Performance

The component is optimized for performance:

- **Virtual scrolling** - For large message lists
- **Message chunking** - Configurable message limits
- **Debounced inputs** - Reduces API calls
- **Memoized components** - Prevents unnecessary re-renders
- **Lazy loading** - Components load on demand

## Development

To extend or modify the component:

1. **TypeScript** - Fully typed with comprehensive interfaces
2. **React Hooks** - Modern React patterns throughout
3. **Modular architecture** - Easily extensible components
4. **Test coverage** - Unit tests for all major functionality

## API Integration

The component expects a backend service that implements the Claude CLI interface:

- **WebSocket endpoint**: `/coderunner/claude/ws`
- **Session endpoints**: `/coderunner/claude/sessions`
- **Authentication**: Cookie-based session auth

See the backend implementation in `coderunner/claude/claude.go` for details.

## Troubleshooting

### Common Issues

1. **Connection fails**: Check WebSocket URL and authentication
2. **Messages not appearing**: Verify message format compatibility
3. **Styling issues**: Ensure Tailwind CSS is properly configured
4. **TypeScript errors**: Check type imports and compatibility

### Debug Mode

Enable debug logging:

```tsx
// Add to your component
useEffect(() => {
  window.claudeDebug = true;
}, []);
```

This will log detailed information about WebSocket messages, state changes, and errors to the browser console.