import { ClaudeMessage, ClaudeAssistantMessage } from '../types';

export const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
};

export const formatRelativeTime = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch {
    return timestamp;
  }
};

export const extractTextFromAssistantMessage = (message: any): string => {
  try {
    if (typeof message === 'string') {
      const parsed = JSON.parse(message);
      return parsed.content?.[0]?.text || 'No content';
    }
    
    if (message?.content?.[0]?.text) {
      return message.content[0].text;
    }
    
    return JSON.stringify(message, null, 2);
  } catch {
    return typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  }
};

export const getMessageDisplayText = (message: ClaudeMessage): string => {
  switch (message.type) {
    case 'assistant':
      return extractTextFromAssistantMessage(message.message);
      
    case 'system':
      if (message.subtype === 'init') {
        return `Session initialized: ${message.session_id}`;
      }
      return `System: ${message.subtype || 'Unknown'}`;
      
    case 'result':
      return message.result || 'No result';
      
    default:
      if (message.result) return message.result;
      if (message.message) return JSON.stringify(message.message, null, 2);
      return JSON.stringify(message, null, 2);
  }
};

export const getMessageType = (message: ClaudeMessage): 'user' | 'assistant' | 'system' | 'error' | 'result' => {
  if (message.is_error) return 'error';
  if (message.type === 'result') return 'result';
  if (message.type === 'system') return 'system';
  if (message.type === 'assistant') return 'assistant';
  return 'system'; // fallback
};

export const shouldShowTimestamp = (
  currentMessage: ClaudeMessage,
  previousMessage?: ClaudeMessage,
  threshold: number = 5 * 60 * 1000 // 5 minutes
): boolean => {
  if (!previousMessage || !currentMessage.timestamp || !previousMessage.timestamp) {
    return true;
  }
  
  try {
    const currentTime = new Date(currentMessage.timestamp).getTime();
    const previousTime = new Date(previousMessage.timestamp).getTime();
    
    return (currentTime - previousTime) > threshold;
  } catch {
    return true;
  }
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const highlightCodeBlocks = (text: string): string => {
  // Simple code block detection and highlighting
  // This is a basic implementation - for production, consider using a proper markdown parser
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      return `<pre class="code-block" data-language="${language || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
};

export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch {
    return false;
  }
};

export const downloadAsFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const generateSessionTitle = (messages: ClaudeMessage[]): string => {
  // Find the first user message or assistant response to generate a title
  const firstAssistantMessage = messages.find(m => m.type === 'assistant');
  
  if (firstAssistantMessage) {
    const text = extractTextFromAssistantMessage(firstAssistantMessage.message);
    const firstLine = text.split('\n')[0];
    return truncateText(firstLine, 50) || 'Claude Conversation';
  }
  
  const firstResult = messages.find(m => m.type === 'result' && !m.is_error);
  if (firstResult?.result) {
    return truncateText(firstResult.result, 50);
  }
  
  return `Session ${new Date().toLocaleDateString()}`;
};

export const formatUsageStats = (usage?: any): string => {
  if (!usage) return '';
  
  const parts = [];
  if (usage.input_tokens) parts.push(`${usage.input_tokens} in`);
  if (usage.output_tokens) parts.push(`${usage.output_tokens} out`);
  if (usage.cache_read_input_tokens) parts.push(`${usage.cache_read_input_tokens} cached`);
  
  return parts.length > 0 ? `(${parts.join(', ')} tokens)` : '';
};

export const isStreamingMessage = (message: ClaudeMessage): boolean => {
  return message.type === 'assistant' && !message.result;
};

export const isErrorMessage = (message: ClaudeMessage): boolean => {
  return message.is_error === true || message.type === 'error';
};

export const isSystemMessage = (message: ClaudeMessage): boolean => {
  return message.type === 'system';
};

export const isResultMessage = (message: ClaudeMessage): boolean => {
  return message.type === 'result';
};