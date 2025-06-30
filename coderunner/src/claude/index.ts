// Main component export
export { default as ClaudeWebInterface } from './ClaudeWebInterface';
export { ClaudeWebInterface as ClaudeInterface } from './ClaudeWebInterface';

// Component exports
export { MessageList } from './components/MessageList';
export { SessionBrowser } from './components/SessionBrowser';
export { InputArea } from './components/InputArea';
export { StatusIndicator } from './components/StatusIndicator';

// Hook exports
export { useClaudeWebSocket } from './hooks/useClaudeWebSocket';
export { useClaudeSession } from './hooks/useClaudeSession';
export { useClaudeMessages } from './hooks/useClaudeMessages';

// Type exports
export type {
  ClaudeMessage,
  ClaudeSession,
  ClaudeWebInterfaceProps,
  ClaudeConnectionStatus,
  ClaudeWebSocketMessage,
  MessageDisplayProps,
  SessionBrowserProps,
  InputAreaProps,
  StatusIndicatorProps,
  ClaudeError,
  UseClaudeWebSocketReturn,
  UseClaudeSessionReturn,
  UseClaudeMessagesReturn,
  MessageType,
  ConnectionState,
  ThemeMode,
  ExportFormat,
} from './types';

// Utility exports
export {
  formatTimestamp,
  formatRelativeTime,
  extractTextFromAssistantMessage,
  getMessageDisplayText,
  getMessageType,
  shouldShowTimestamp,
  truncateText,
  highlightCodeBlocks,
  copyToClipboard,
  downloadAsFile,
  generateSessionTitle,
  formatUsageStats,
  isStreamingMessage,
  isErrorMessage,
  isSystemMessage,
  isResultMessage,
} from './utils/messageFormatting';