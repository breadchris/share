import React, { useRef, useEffect, useCallback } from 'react';
import { InputAreaProps, ImageAttachment } from '../types';

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
  isMobile = false,
  isTouchDevice = false,
  images = [],
  onImagesChange,
  maxImages = 5,
  maxImageSize = 10 * 1024 * 1024, // 10MB
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((value.trim() || images.length > 0) && !disabled && !loading) {
      onSubmit();
    }
  };

  // Image handling functions
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !onImagesChange) return;

    const fileArray = Array.from(files);
    const availableSlots = maxImages - images.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    filesToProcess.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not a valid image file.`);
        return;
      }

      // Validate file size
      if (file.size > maxImageSize) {
        alert(`"${file.name}" is too large. Maximum size is ${Math.round(maxImageSize / 1024 / 1024)}MB.`);
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newImage: ImageAttachment = {
          data: dataUrl,
          mimeType: file.type,
          filename: file.name,
          size: file.size
        };

        onImagesChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Clear the file input
    event.target.value = '';
  }, [images, maxImages, maxImageSize, onImagesChange]);

  const handleRemoveImage = useCallback((index: number) => {
    if (!onImagesChange) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    if (!onImagesChange) return;

    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        
        if (images.length >= maxImages) {
          alert(`Maximum of ${maxImages} images allowed.`);
          return;
        }

        const file = item.getAsFile();
        if (file) {
          if (file.size > maxImageSize) {
            alert(`Image is too large. Maximum size is ${Math.round(maxImageSize / 1024 / 1024)}MB.`);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const newImage: ImageAttachment = {
              data: dataUrl,
              mimeType: file.type,
              filename: `pasted-image-${Date.now()}.${file.type.split('/')[1]}`,
              size: file.size
            };

            onImagesChange([...images, newImage]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  }, [images, maxImages, maxImageSize, onImagesChange]);

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
    w-full rounded-lg border transition-colors resize-none
    ${isMobile ? 'px-3 py-3 text-base' : 'px-4 py-3'}
    ${darkMode 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'}
  `;

  const canSubmit = (value.trim() || images.length > 0) && !disabled && !loading;

  const buttonStyles = `
    rounded-lg font-medium transition-all touch-manipulation
    ${isMobile 
      ? 'px-4 py-3 text-sm min-h-[44px] min-w-[44px]' 
      : 'px-6 py-3'
    }
    ${!canSubmit
      ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
      : isTouchDevice 
        ? 'bg-blue-500 text-white active:bg-blue-700 active:scale-95'
        : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95'
    }
    ${loading ? 'animate-pulse' : ''}
  `;

  const imageButtonStyles = `
    rounded-lg font-medium transition-all touch-manipulation
    ${isMobile 
      ? 'px-3 py-3 text-sm min-h-[44px] min-w-[44px]' 
      : 'px-4 py-3'
    }
    ${disabled
      ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
      : isTouchDevice 
        ? `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} active:scale-95`
        : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} hover:scale-105 active:scale-95`
    }
  `;

  return (
    <div className={`border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}
      ${isMobile ? 'p-3 min-w-0 overflow-hidden' : 'p-4'}
    `}>
      {/* Image previews */}
      {images.length > 0 && (
        <div className={`mb-3 space-y-2`}>
          <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Images ({images.length}/{maxImages})
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                className={`relative group rounded-lg overflow-hidden border-2 ${
                  darkMode ? 'border-gray-600' : 'border-gray-300'
                }`}
                style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px' }}
              >
                <img
                  src={image.data}
                  alt={image.filename || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className={`absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-opacity
                    ${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}
                    opacity-0 group-hover:opacity-100
                  `}
                  style={{ transform: 'translate(50%, -50%)' }}
                  title="Remove image"
                >
                  ×
                </button>
                {image.filename && (
                  <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate
                    opacity-0 group-hover:opacity-100 transition-opacity
                  `}>
                    {image.filename}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        {...(isMobile && { capture: "environment" })}
      />

      <div className={`flex items-end ${isMobile ? 'gap-2' : 'gap-3'}`}>
        {/* Input field */}
        <div className="flex-1 relative">
          {multiline ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={disabled ? 'Connect to start chatting...' : placeholder}
              disabled={disabled}
              className={baseInputStyles}
              rows={1}
              style={{ 
                minHeight: isMobile ? '44px' : '48px', 
                maxHeight: isMobile ? '100px' : '120px' 
              }}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
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

        {/* Image upload button */}
        {onImagesChange && (
          <button
            onClick={handleImageUpload}
            disabled={disabled || images.length >= maxImages}
            className={imageButtonStyles}
            title={`Add images (${images.length}/${maxImages})`}
          >
            {isMobile ? (
              <span className="text-lg">📷</span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-lg">📷</span>
                {!isMobile && <span className="text-sm">Image</span>}
              </div>
            )}
          </button>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={buttonStyles}
          title={multiline ? 'Send message (Shift+Enter)' : 'Send message (Enter)'}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              {!isMobile && <span>Sending...</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {isMobile ? (
                <span className="text-lg">➤</span>
              ) : (
                <>
                  <span>Send</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Keyboard shortcuts hint - hidden on mobile */}
      {!isMobile && (
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
          {onImagesChange && (
            <span className="ml-4">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+V</kbd> to paste images
            </span>
          )}
        </div>
      )}
    </div>
  );
};