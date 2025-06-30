import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClaudeMessage,
  ClaudeWebSocketMessage,
  ClaudeConnectionStatus,
  UseClaudeWebSocketReturn,
  ClaudeHookOptions,
} from '../types';

export const useClaudeWebSocket = (
  options: ClaudeHookOptions = {}
): UseClaudeWebSocketReturn => {
  const {
    autoConnect = false,
    reconnectAttempts = 3,
    reconnectDelay = 2000,
    messageHistoryLimit = 1000,
    apiBaseUrl = '',
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ClaudeConnectionStatus>({
    connected: false,
    connecting: false,
  });

  const [lastMessage, setLastMessage] = useState<ClaudeMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<ClaudeMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  const getWebSocketUrl = useCallback(() => {
    const baseUrl = apiBaseUrl || window.location.origin;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = apiBaseUrl ? new URL(apiBaseUrl).host : window.location.host;
    return `${protocol}//${host}/coderunner/claude/ws`;
  }, [apiBaseUrl]);

  const addToHistory = useCallback((message: ClaudeMessage) => {
    setMessageHistory(prev => {
      const newHistory = [...prev, { ...message, timestamp: new Date().toISOString() }];
      return newHistory.slice(-messageHistoryLimit);
    });
  }, [messageHistoryLimit]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const wsMessage = JSON.parse(event.data);
      
      switch (wsMessage.type) {
        case 'message':
          const claudeMessage = wsMessage.payload as ClaudeMessage;
          setLastMessage(claudeMessage);
          addToHistory(claudeMessage);
          break;
          
        case 'error':
          console.error('Claude WebSocket error:', wsMessage.payload);
          setConnectionStatus(prev => ({
            ...prev,
            error: wsMessage.payload.error || 'Unknown error occurred',
          }));
          break;
          
        default:
          console.log('Received WebSocket message:', wsMessage);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [addToHistory]);

  const handleOpen = useCallback(() => {
    setConnectionStatus({
      connected: true,
      connecting: false,
      lastConnected: new Date(),
    });
    reconnectCountRef.current = 0;
    console.log('Connected to Claude WebSocket');
  }, []);

  const handleClose = useCallback((event: CloseEvent) => {
    setConnectionStatus(prev => ({
      ...prev,
      connected: false,
      connecting: false,
    }));
    
    console.log('Disconnected from Claude WebSocket', event.code, event.reason);
    
    // Auto-reconnect if not manually disconnected and we have attempts left
    if (!isManualDisconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
      const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current); // Exponential backoff
      
      setConnectionStatus(prev => ({
        ...prev,
        connecting: true,
      }));
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectCountRef.current++;
        connect();
      }, delay);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${reconnectAttempts})`);
    }
  }, [reconnectAttempts, reconnectDelay]);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setConnectionStatus(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: 'Connection error occurred',
    }));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return; // Already connecting
    }

    isManualDisconnectRef.current = false;
    
    setConnectionStatus(prev => ({
      ...prev,
      connecting: true,
      error: undefined,
    }));

    // First, check if we need authentication by making a test request
    const wsUrl = getWebSocketUrl();
    
    // Test authentication before creating WebSocket
    fetch(wsUrl.replace('ws://', 'http://').replace('wss://', 'https://'), {
      method: 'HEAD',
      credentials: 'include'
    }).then(response => {
      if (response.status === 401) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }
      
      // Proceed with WebSocket connection
      try {
        console.log('Connecting to Claude WebSocket:', wsUrl);
        
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.addEventListener('open', handleOpen);
        wsRef.current.addEventListener('message', handleMessage);
        wsRef.current.addEventListener('close', handleClose);
        wsRef.current.addEventListener('error', handleError);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus(prev => ({
          ...prev,
          connecting: false,
          error: 'Failed to create connection',
        }));
      }
    }).catch(error => {
      console.error('Authentication check failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        connecting: false,
        error: 'Authentication check failed',
      }));
    });
  }, [getWebSocketUrl, handleOpen, handleMessage, handleClose, handleError]);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.removeEventListener('open', handleOpen);
      wsRef.current.removeEventListener('message', handleMessage);
      wsRef.current.removeEventListener('close', handleClose);
      wsRef.current.removeEventListener('error', handleError);
      
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Manual disconnect');
      }
      
      wsRef.current = null;
    }

    setConnectionStatus({
      connected: false,
      connecting: false,
    });
  }, [handleOpen, handleMessage, handleClose, handleError]);

  const sendMessage = useCallback((message: ClaudeWebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        setConnectionStatus(prev => ({
          ...prev,
          error: 'Failed to send message',
        }));
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
      setConnectionStatus(prev => ({
        ...prev,
        error: 'Not connected to Claude',
      }));
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessageHistory([]);
    setLastMessage(null);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Only depend on autoConnect for the initial effect

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    messageHistory,
    clearHistory,
  };
};