import { useState, useCallback } from 'react';
import {
  ClaudeMessage,
  UseClaudeMessagesReturn,
  ExportFormat,
} from '../types';

export const useClaudeMessages = (): UseClaudeMessagesReturn => {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);

  const addMessage = useCallback((message: ClaudeMessage) => {
    setMessages(prev => [...prev, { ...message, timestamp: message.timestamp || new Date().toISOString() }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getMessagesByType = useCallback((type: string) => {
    return messages.filter(message => message.type === type);
  }, [messages]);

  const getLastAssistantMessage = useCallback(() => {
    const assistantMessages = messages.filter(message => message.type === 'assistant');
    return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
  }, [messages]);

  const exportMessages = useCallback((format: ExportFormat) => {
    switch (format) {
      case 'json':
        return JSON.stringify(messages, null, 2);
        
      case 'text':
        return messages.map(message => {
          const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
          let content = '';
          
          if (message.type === 'assistant' && message.message) {
            try {
              const parsed = typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
              content = parsed.content?.[0]?.text || 'No content';
            } catch {
              content = JSON.stringify(message.message);
            }
          } else if (message.result) {
            content = message.result;
          } else {
            content = JSON.stringify(message);
          }
          
          return `[${timestamp}] ${message.type.toUpperCase()}: ${content}`;
        }).join('\n\n');
        
      case 'markdown':
        return messages.map(message => {
          const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
          let content = '';
          let header = '';
          
          if (message.type === 'assistant' && message.message) {
            try {
              const parsed = typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
              content = parsed.content?.[0]?.text || 'No content';
              header = '## Claude Response';
            } catch {
              content = '```json\n' + JSON.stringify(message.message, null, 2) + '\n```';
              header = '## Claude Response (Raw)';
            }
          } else if (message.type === 'system') {
            content = `**${message.subtype || 'System'}**: ${message.session_id || 'No session'}`;
            header = '## System Message';
          } else if (message.result) {
            content = message.is_error ? `❌ ${message.result}` : `✅ ${message.result}`;
            header = '## Result';
          } else {
            content = '```json\n' + JSON.stringify(message, null, 2) + '\n```';
            header = `## ${message.type.charAt(0).toUpperCase() + message.type.slice(1)} Message`;
          }
          
          return `${header}\n\n*${timestamp}*\n\n${content}`;
        }).join('\n\n---\n\n');
        
      case 'html':
        const htmlMessages = messages.map(message => {
          const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
          let content = '';
          let className = '';
          
          if (message.type === 'assistant' && message.message) {
            try {
              const parsed = typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
              content = parsed.content?.[0]?.text || 'No content';
              className = 'assistant-message';
            } catch {
              content = `<pre><code>${JSON.stringify(message.message, null, 2)}</code></pre>`;
              className = 'assistant-message raw';
            }
          } else if (message.type === 'system') {
            content = `<strong>${message.subtype || 'System'}</strong>: ${message.session_id || 'No session'}`;
            className = 'system-message';
          } else if (message.result) {
            content = message.is_error ? `❌ ${message.result}` : `✅ ${message.result}`;
            className = message.is_error ? 'error-message' : 'success-message';
          } else {
            content = `<pre><code>${JSON.stringify(message, null, 2)}</code></pre>`;
            className = 'raw-message';
          }
          
          return `
            <div class="message ${className}">
              <div class="message-header">
                <span class="message-type">${message.type.toUpperCase()}</span>
                <span class="message-timestamp">${timestamp}</span>
              </div>
              <div class="message-content">${content}</div>
            </div>
          `;
        }).join('\n');
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Conversation Export</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
        }
        .message { 
            margin-bottom: 20px; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #ccc;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 0.9em;
            color: #666;
        }
        .message-type { font-weight: bold; }
        .message-content { white-space: pre-wrap; }
        .assistant-message { 
            background-color: #f8f9fa; 
            border-left-color: #007bff; 
        }
        .system-message { 
            background-color: #e9ecef; 
            border-left-color: #6c757d; 
        }
        .error-message { 
            background-color: #f8d7da; 
            border-left-color: #dc3545; 
        }
        .success-message { 
            background-color: #d4edda; 
            border-left-color: #28a745; 
        }
        .raw-message { 
            background-color: #f1f3f4; 
            border-left-color: #6c757d; 
        }
        pre { 
            background-color: #f8f9fa; 
            padding: 10px; 
            border-radius: 4px; 
            overflow-x: auto; 
        }
        code { font-family: 'SF Mono', Monaco, monospace; }
    </style>
</head>
<body>
    <h1>Claude Conversation Export</h1>
    <p>Exported on ${new Date().toLocaleString()}</p>
    <div class="messages">
        ${htmlMessages}
    </div>
</body>
</html>
        `;
        
      default:
        return JSON.stringify(messages, null, 2);
    }
  }, [messages]);

  return {
    messages,
    addMessage,
    clearMessages,
    getMessagesByType,
    getLastAssistantMessage,
    exportMessages,
  };
};