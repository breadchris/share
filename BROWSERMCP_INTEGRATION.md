# BrowserMCP Keyboard Shortcut Integration

This document explains how to use the new keyboard shortcut feature that connects the current browser tab to the BrowserMCP server.

## What was implemented

1. **Keyboard Shortcut**: Added `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac) to connect the current tab to BrowserMCP
2. **WebSocket Communication**: Enhanced the browser extension to communicate with the BrowserMCP server via WebSocket
3. **Tab Management**: Track connected tabs and handle disconnections automatically
4. **Notifications**: Visual feedback when tabs are connected or when errors occur

## How to use

### Prerequisites
1. Start the BrowserMCP server:
   ```bash
   cd browsermcp
   npm run build
   node dist/index.js
   ```
   
2. Load the browser extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `/extension` directory

### Using the keyboard shortcut

1. Navigate to any webpage you want to connect to BrowserMCP
2. Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
3. You should see a notification confirming the connection
4. The tab is now connected to BrowserMCP and can be automated via MCP tools

### Configuration

The extension uses port 8765 by default to connect to BrowserMCP. You can change this by:

1. Opening the extension options page
2. Setting a different port number
3. Reloading the extension

## Technical details

### Communication Flow

1. **Extension → MCP Server**: When keyboard shortcut is pressed:
   ```json
   {
     "type": "tab_connected",
     "tabId": 123,
     "url": "https://example.com",
     "title": "Example Page",
     "timestamp": 1639123456789
   }
   ```

2. **MCP Server → Extension**: Commands to execute in tabs:
   ```json
   {
     "type": "execute_script",
     "tabId": 123,
     "script": "document.querySelector('button').click();"
   }
   ```

3. **Extension → MCP Server**: Page content responses:
   ```json
   {
     "type": "page_content_response",
     "tabId": 123,
     "content": {
       "url": "https://example.com",
       "title": "Example Page",
       "html": "<!DOCTYPE html>...",
       "text": "Page text content"
     }
   }
   ```

### Files Modified

1. **`extension/manifest.json`**: Added keyboard shortcut command and notifications permission
2. **`extension/background.js`**: Added BrowserMCP connection logic and keyboard shortcut handler
3. **`browsermcp/src/server.ts`**: Enhanced WebSocket message handling for extension communication
4. **`browsermcp/src/context.ts`**: Added connected tab tracking

### Features

- **Auto-reconnection**: Extension attempts to reconnect if connection is lost
- **Tab cleanup**: Automatically removes disconnected tabs from tracking
- **Error handling**: Shows notifications for connection failures
- **Multi-tab support**: Can connect multiple tabs (though MCP server handles one at a time)

## Troubleshooting

### Connection fails
- Ensure BrowserMCP server is running on the configured port (default: 8765)
- Check browser console for WebSocket connection errors
- Verify firewall isn't blocking the connection

### Keyboard shortcut doesn't work
- Check if another extension or application is using the same shortcut
- Go to `chrome://extensions/shortcuts` to verify the shortcut is registered
- Try reloading the extension

### No notifications
- Ensure notifications permission is granted for the extension
- Check if browser notifications are enabled

## Future enhancements

- Visual indicator showing which tabs are connected
- Options page to configure WebSocket port
- Support for multiple MCP servers
- Enhanced error recovery and reconnection logic