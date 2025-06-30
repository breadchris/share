import React, { useEffect, useRef, useState } from 'react';
import { ClaudeMessage, MessageDisplayProps } from '../types';
import {
  getMessageDisplayText,
  getMessageType,
  formatTimestamp,
  formatRelativeTime,
  shouldShowTimestamp,
  highlightCodeBlocks,
  copyToClipboard,
  formatUsageStats,
} from '../utils/messageFormatting';

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, index, darkMode, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const messageType = getMessageType(message);
  const displayText = getMessageDisplayText(message);

  const handleCopy = async () => {
    const success = await copyToClipboard(displayText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(displayText);
    }
  };

  const getMessageStyles = () => {
    const baseStyles = `p-4 rounded-lg border-l-4 relative group`;
    const darkBg = darkMode ? 'bg-gray-800' : 'bg-gray-50';
    const lightBg = darkMode ? 'bg-gray-700' : 'bg-white';
    const textColor = darkMode ? 'text-white' : 'text-gray-900';

    switch (messageType) {
      case 'assistant':
        return `${baseStyles} ${lightBg} ${textColor} border-l-blue-500`;
      case 'system':
        return `${baseStyles} ${darkBg} ${textColor} border-l-gray-500`;
      case 'error':
        return `${baseStyles} bg-red-50 ${darkMode ? 'bg-red-900' : ''} ${textColor} border-l-red-500`;
      case 'result':
        return `${baseStyles} bg-green-50 ${darkMode ? 'bg-green-900' : ''} ${textColor} border-l-green-500`;
      default:
        return `${baseStyles} ${darkBg} ${textColor} border-l-gray-400`;
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'error':
        return '❌';
      case 'result':
        return '✅';
      default:
        return '💬';
    }
  };

  const getMessageLabel = () => {
    switch (messageType) {
      case 'assistant':
        return 'Claude';
      case 'system':
        return message.subtype === 'init' ? 'Session Started' : 'System';
      case 'error':
        return 'Error';
      case 'result':
        return 'Result';
      default:
        return message.type.charAt(0).toUpperCase() + message.type.slice(1);
    }
  };

  const renderContent = () => {
    if (messageType === 'assistant') {
      // Enhanced rendering for assistant messages
      const htmlContent = highlightCodeBlocks(displayText);
      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    // For other message types, render as plain text with basic formatting
    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {displayText}
      </div>
    );
  };

  const renderUsageInfo = () => {
    if (message.type === 'assistant' && message.message) {
      try {
        const parsed = typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
        const usage = parsed.usage;
        const usageText = formatUsageStats(usage);
        
        if (usageText) {
          return (
            <div className={`text-xs mt-2 opacity-60 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {usageText}
            </div>
          );
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return null;
  };

  return (
    <div className={getMessageStyles()}>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
          px-2 py-1 rounded text-xs font-medium
          ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
        `}
        title="Copy message"
      >
        {copied ? '✓ Copied' : '📋'}
      </button>

      {/* Message header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getMessageIcon()}</span>
        <span className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {getMessageLabel()}
        </span>
        {message.timestamp && (
          <span className={`text-xs ml-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatRelativeTime(message.timestamp)}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="message-content">
        {renderContent()}
      </div>

      {/* Usage info for assistant messages */}
      {renderUsageInfo()}

      {/* Session ID for system messages */}
      {message.type === 'system' && message.session_id && (
        <div className={`text-xs mt-2 opacity-60 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Session: {message.session_id.slice(0, 8)}...
        </div>
      )}
    </div>
  );
};

interface MessageListProps {
  messages: ClaudeMessage[];
  loading?: boolean;
  darkMode?: boolean;
  autoScroll?: boolean;
  maxHeight?: string;
  onCopyMessage?: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  darkMode = false,
  autoScroll = true,
  maxHeight = 'calc(100vh - 200px)',
  onCopyMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const scrollToBottom = () => {
    if (autoScroll && !userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setUserScrolled(!isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderEmptyState = () => (
    <div className={`flex flex-col items-center justify-center h-full text-center p-8
      ${darkMode ? 'text-gray-400' : 'text-gray-500'}
    `}>
      <div className="text-6xl mb-4">🤖</div>
      <h3 className="text-lg font-semibold mb-2">Ready to chat with Claude</h3>
      <p className="text-sm">
        Start a conversation by typing a message below, or resume a previous session.
      </p>
    </div>
  );

  const renderLoadingIndicator = () => (
    <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 border-l-blue-500
      ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}
    `}>
      <div className="flex space-x-1">
        <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
        <div className={`w-2 h-2 rounded-full animate-bounce delay-75 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
        <div className={`w-2 h-2 rounded-full animate-bounce delay-150 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
      </div>
      <span className="text-sm font-medium">Claude is thinking...</span>
    </div>
  );

  const groupedMessages = messages.reduce((groups, message, index) => {
    const previousMessage = index > 0 ? messages[index - 1] : undefined;
    const showTimestamp = shouldShowTimestamp(message, previousMessage);
    
    if (showTimestamp && message.timestamp) {
      groups.push({
        type: 'timestamp',
        timestamp: message.timestamp,
        message: null,
        index,
      });
    }
    
    groups.push({
      type: 'message',
      message,
      index,
      timestamp: null,
    });
    
    return groups;
  }, [] as Array<{ type: 'message' | 'timestamp'; message: ClaudeMessage | null; timestamp: string | null; index: number }>);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      {messages.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <>
          {groupedMessages.map((item, index) => {
            if (item.type === 'timestamp') {
              return (
                <div key={`timestamp-${index}`} className="flex justify-center">
                  <div className={`px-3 py-1 rounded-full text-xs
                    ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
              );
            }
            
            return item.message ? (
              <MessageDisplay
                key={`message-${item.index}`}
                message={item.message}
                index={item.index}
                darkMode={darkMode}
                onCopy={onCopyMessage}
              />
            ) : null;
          })}
          
          {loading && renderLoadingIndicator()}
          
          <div ref={messagesEndRef} />
        </>
      )}

      {/* Scroll to bottom button */}
      {userScrolled && messages.length > 0 && (
        <button
          onClick={() => {
            setUserScrolled(false);
            scrollToBottom();
          }}
          className={`fixed bottom-20 right-6 p-3 rounded-full shadow-lg transition-all hover:scale-110
            ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}
          `}
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}
    </div>
  );
};