import React, { useRef, useEffect } from 'react';
import { InputAreaProps } from '../types';

export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
  loading,
  darkMode,
  placeholder = "Ask Claude anything...",
  multiline = true,
  onKeyDown,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Call custom onKeyDown handler if provided
    onKeyDown?.(event);

    // Handle Enter key submission
    if (event.key === 'Enter') {
      if (multiline) {
        // In multiline mode, Shift+Enter submits, Enter adds new line
        if (event.shiftKey) {
          event.preventDefault();
          handleSubmit();
        }
        // Allow normal Enter behavior (new line)
      } else {
        // In single line mode, Enter submits
        event.preventDefault();
        handleSubmit();
      }
    }

    // Handle Escape key to clear input
    if (event.key === 'Escape') {
      onChange('');
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled && !loading) {
      onSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (multiline && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value, multiline]);

  // Focus management
  useEffect(() => {
    if (!disabled) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [disabled, multiline]);

  const baseInputStyles = `
    w-full px-4 py-3 rounded-lg border transition-colors resize-none
    ${darkMode 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'}
  `;

  const buttonStyles = `
    px-6 py-3 rounded-lg font-medium transition-all transform
    ${disabled || loading || !value.trim()
      ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
      : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95'
    }
    ${loading ? 'animate-pulse' : ''}
  `;

  return (
    <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="flex gap-3 items-end">
        {/* Input field */}
        <div className="flex-1 relative">
          {multiline ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Connect to start chatting...' : placeholder}
              disabled={disabled}
              className={baseInputStyles}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Connect to start chatting...' : placeholder}
              disabled={disabled}
              className={baseInputStyles}
            />
          )}

          {/* Character count for long messages */}
          {value.length > 500 && (
            <div className={`absolute bottom-1 right-2 text-xs ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {value.length}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || loading || !value.trim()}
          className={buttonStyles}
          title={multiline ? 'Send message (Shift+Enter)' : 'Send message (Enter)'}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Send</span>
              <span className="text-lg">→</span>
            </div>
          )}
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {multiline ? (
          <span>Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift+Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> for new line</span>
        ) : (
          <span>Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to send</span>
        )}
        {value.length > 0 && (
          <span className="ml-4">
            Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to clear
          </span>
        )}
      </div>
    </div>
  );
};