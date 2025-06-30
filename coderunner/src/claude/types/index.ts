export interface ClaudeMessage {
  type: string;
  subtype?: string;
  message?: any;
  session_id?: string;
  parent_tool_use_id?: string;
  result?: string;
  is_error?: boolean;
  timestamp?: string;
}

export interface ClaudeAssistantMessage {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    output_tokens: number;
    service_tier: string;
  };
}

export interface ClaudeSession {
  id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ClaudeMessage[];
  user_id: number;
  metadata?: Record<string, any>;
}

export interface WSMessage {
  type: string;
  payload: any;
}

export interface ClaudeWebSocketMessage {
  type: 'start' | 'resume' | 'prompt' | 'stop' | 'message' | 'error';
  payload: any;
}

export interface ClaudeConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: Date;
}

export interface ClaudeSessionState {
  currentSessionId: string | null;
  messages: ClaudeMessage[];
  loading: boolean;
  streaming: boolean;
}

export interface ClaudeWebInterfaceProps {
  darkMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  apiBaseUrl?: string;
  autoConnect?: boolean;
  showSessionBrowser?: boolean;
  maxMessages?: number;
  enableExport?: boolean;
  enableKeyboardShortcuts?: boolean;
  onSessionChange?: (sessionId: string | null) => void;
  onMessageReceived?: (message: ClaudeMessage) => void;
  onConnectionStatusChange?: (status: ClaudeConnectionStatus) => void;
}

export interface MessageDisplayProps {
  message: ClaudeMessage;
  index: number;
  darkMode: boolean;
  onCopy?: (text: string) => void;
}

export interface SessionBrowserProps {
  sessions: ClaudeSession[];
  currentSessionId: string | null;
  loading: boolean;
  darkMode: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onExportSession?: (sessionId: string) => void;
}

export interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  loading: boolean;
  darkMode: boolean;
  placeholder?: string;
  multiline?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface StatusIndicatorProps {
  status: ClaudeConnectionStatus;
  currentSessionId: string | null;
  darkMode: boolean;
  compact?: boolean;
}

export interface ClaudeError {
  type: 'connection' | 'authentication' | 'session' | 'message' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ClaudeHookOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  messageHistoryLimit?: number;
  apiBaseUrl?: string;
}

export interface UseClaudeWebSocketReturn {
  connectionStatus: ClaudeConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: ClaudeWebSocketMessage) => void;
  lastMessage: ClaudeMessage | null;
  messageHistory: ClaudeMessage[];
  clearHistory: () => void;
}

export interface UseClaudeSessionReturn {
  sessions: ClaudeSession[];
  currentSession: ClaudeSession | null;
  currentSessionId: string | null;
  loading: boolean;
  error: ClaudeError | null;
  createSession: () => Promise<string>;
  resumeSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  exportSession: (sessionId: string) => Promise<string>;
  refreshSessions: () => Promise<void>;
}

export interface UseClaudeMessagesReturn {
  messages: ClaudeMessage[];
  addMessage: (message: ClaudeMessage) => void;
  clearMessages: () => void;
  getMessagesByType: (type: string) => ClaudeMessage[];
  getLastAssistantMessage: () => ClaudeMessage | null;
  exportMessages: (format: 'json' | 'text' | 'markdown') => string;
}

export type MessageType = 'system' | 'assistant' | 'result' | 'error' | 'user';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type SessionAction = 'create' | 'resume' | 'delete' | 'export' | 'update';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ExportFormat = 'json' | 'text' | 'markdown' | 'html';