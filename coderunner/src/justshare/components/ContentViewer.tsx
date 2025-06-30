import React, { useState, useEffect, useCallback } from 'react';
import type { ContentViewerProps, Content } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { formatDomainForDisplay } from '../utils/url';

export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Track viewport size for responsive video sizing
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive video dimensions
  const getVideoDimensions = useCallback(() => {
    if (isFullscreen) {
      return {
        width: '100%',
        height: '80vh' // Leave space for controls in fullscreen
      };
    }

    const { width: screenWidth, height: screenHeight } = viewportSize;
    
    // Estimate space used by header, padding, metadata footer
    const headerHeight = 80; // Approximate header height
    const footerHeight = 100; // Approximate metadata footer height  
    const modalPadding = 48; // Modal padding
    const availableHeight = screenHeight * 0.9 - headerHeight - footerHeight - modalPadding;
    
    // Responsive breakpoints
    if (screenWidth < 768) {
      // Mobile: Prioritize fitting on screen
      const maxHeight = Math.min(availableHeight * 0.7, screenHeight * 0.35);
      const maxWidth = screenWidth - 48; // Account for modal padding and margins
      const aspectRatio = 16 / 9;
      
      // Calculate dimensions maintaining aspect ratio
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      return {
        width: `${Math.floor(width)}px`,
        height: `${Math.floor(height)}px`
      };
    } else if (screenWidth < 1024) {
      // Tablet: Medium sizing
      const maxHeight = Math.min(availableHeight * 0.7, 400);
      const maxWidth = Math.min(screenWidth * 0.8, 700);
      const aspectRatio = 16 / 9;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      return {
        width: `${Math.floor(width)}px`,
        height: `${Math.floor(height)}px`
      };
    } else {
      // Desktop: Larger sizing but still responsive
      const maxHeight = Math.min(availableHeight * 0.6, 450);
      const maxWidth = 800;
      const aspectRatio = 16 / 9;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      return {
        width: `${Math.floor(width)}px`,
        height: `${Math.floor(height)}px`
      };
    }
  }, [isFullscreen, viewportSize]);

  // Hide actions after inactivity in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;

    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      setShowActions(true);
      timeoutId = setTimeout(() => setShowActions(false), 3000);
    };

    resetTimeout();
    
    const handleActivity = () => resetTimeout();
    
    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [isFullscreen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(!isFullscreen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContentLarge = () => {
    switch (content.type) {
      case 'text':
        return (
          <div className={`prose max-w-none ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
            <p className="whitespace-pre-wrap break-words text-lg leading-relaxed">
              {content.data}
            </p>
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center">
            <img
              src={content.media_url || content.data}
              alt="Shared content"
              className={`max-w-full max-h-full object-contain ${
                isFullscreen ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                maxHeight: isFullscreen ? '90vh' : '70vh',
              }}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-8xl mb-4">🎵</div>
              <h3 className={`text-xl font-medium ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                Audio Recording
              </h3>
              {content.metadata?.duration && (
                <p className={`text-lg ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  Duration: {Math.floor(content.metadata.duration / 60)}:
                  {(content.metadata.duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
            
            {content.media_url && (
              <div className="flex justify-center">
                <audio
                  controls
                  className="w-full max-w-md"
                  autoPlay={false}
                >
                  <source src={content.media_url} type={content.mime_type || 'audio/webm'} />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {content.metadata && (
              <div className={`text-sm space-y-1 ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                {content.metadata.size && (
                  <p>Size: {(content.metadata.size / 1024).toFixed(1)} KB</p>
                )}
                {content.metadata.format && (
                  <p>Format: {content.metadata.format.toUpperCase()}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'clipboard':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📋</span>
              <div>
                <h3 className={`text-lg font-medium ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                  Clipboard Content
                </h3>
                <p className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  Pasted at {formatTimestamp(content.created_at)}
                </p>
              </div>
            </div>
            
            <div className={`prose max-w-none ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
              <p className="whitespace-pre-wrap break-words text-lg leading-relaxed">
                {content.data}
              </p>
            </div>

            {content.metadata?.length && (
              <p className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                {content.metadata.length} characters
              </p>
            )}
          </div>
        );

      case 'url':
        const { isYouTube, youtubeVideoId, domain, title, description } = content.metadata || {};
        
        if (isYouTube && youtubeVideoId) {
          const videoDimensions = getVideoDimensions();
          
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📺</div>
                <h3 className={`text-xl font-medium ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                  {title || 'YouTube Video'}
                </h3>
                <p className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatDomainForDisplay(domain || 'youtube.com')}
                </p>
              </div>
              
              <div className="flex justify-center items-center">
                <div className="w-full max-w-full flex justify-center">
                  <VideoPlayer
                    videoId={youtubeVideoId}
                    url={content.data}
                    width={videoDimensions.width}
                    height={videoDimensions.height}
                    controls={true}
                    autoPlay={false}
                    isFullscreen={isFullscreen}
                    onFullscreenChange={setIsFullscreen}
                    className="rounded-lg overflow-hidden max-w-full"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <a
                  href={content.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isFullscreen 
                      ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch on YouTube
                </a>
              </div>
            </div>
          );
        } else {
          // Generic URL content
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className={`text-xl font-medium ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                  {title || 'Link'}
                </h3>
                <p className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatDomainForDisplay(domain || '')}
                </p>
              </div>
              
              {description && (
                <div className={`text-center max-w-2xl mx-auto ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="text-lg leading-relaxed">{description}</p>
                </div>
              )}
              
              <div className="text-center space-y-4">
                <div className={`inline-block px-4 py-3 rounded-lg ${
                  isFullscreen ? 'bg-white bg-opacity-10' : 'bg-gray-100'
                }`}>
                  <p className={`text-sm font-mono break-all ${
                    isFullscreen ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {content.data}
                  </p>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <a
                    href={content.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isFullscreen 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                    Open Link
                  </a>
                  
                  <button
                    onClick={() => navigator.clipboard?.writeText(content.data)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isFullscreen 
                        ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          );
        }

      default:
        return (
          <div className={`text-center ${isFullscreen ? 'text-white' : 'text-gray-500'}`}>
            <div className="text-6xl mb-4">❓</div>
            <p>Unknown content type: {content.type}</p>
          </div>
        );
    }
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onClose();
      }
    }
  }, [isFullscreen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isFullscreen 
          ? 'bg-black' 
          : 'bg-black bg-opacity-50 backdrop-blur-sm'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Main Content Container */}
      <div
        className={`relative transition-all duration-300 ${
          isFullscreen 
            ? 'w-full h-full' 
            : 'w-full max-w-4xl mx-2 sm:mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col'
        }`}
      >
        {/* Header */}
        {(!isFullscreen || showActions) && (
          <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${
            isFullscreen ? 'absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 text-white border-gray-700' : ''
          }`}>
            <div>
              <h2 className="text-lg font-semibold">
                {content.type === 'text' ? 'Text Note' :
                 content.type === 'image' ? 'Image' :
                 content.type === 'audio' ? 'Audio Recording' :
                 content.type === 'clipboard' ? 'Clipboard' :
                 content.type === 'url' ? (content.metadata?.isYouTube ? 'YouTube Video' : 'Link') : 'Content'}
              </h2>
              <p className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatTimestamp(content.created_at)}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Fullscreen toggle for images */}
              {content.type === 'image' && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`p-2 rounded-lg transition-colors ${
                    isFullscreen 
                      ? 'text-white hover:bg-white hover:bg-opacity-20' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
                >
                  {isFullscreen ? '🗗' : '🗖'}
                </button>
              )}

              {/* Edit button */}
              {onEdit && content.type === 'text' && (
                <button
                  onClick={() => onEdit(content)}
                  className={`p-2 rounded-lg transition-colors ${
                    isFullscreen 
                      ? 'text-white hover:bg-white hover:bg-opacity-20' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Edit content"
                >
                  ✏️
                </button>
              )}

              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={() => onDelete(content.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isFullscreen 
                      ? 'text-red-400 hover:bg-red-500 hover:bg-opacity-20' 
                      : 'text-red-600 hover:bg-red-100'
                  }`}
                  title="Delete content"
                >
                  🗑️
                </button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isFullscreen 
                    ? 'text-white hover:bg-white hover:bg-opacity-20' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`${
          isFullscreen 
            ? 'h-full flex items-center justify-center' 
            : 'flex-1 p-6 overflow-y-auto min-h-0'
        }`}>
          {renderContentLarge()}
        </div>

        {/* Tags and Metadata */}
        {(!isFullscreen || showActions) && (content.tag_names?.length || content.metadata) && (
          <div className={`p-4 border-t border-gray-200 space-y-3 ${
            isFullscreen ? 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white border-gray-700' : ''
          }`}>
            {/* Tags */}
            {content.tag_names && content.tag_names.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium mb-2 ${isFullscreen ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {content.tag_names.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs ${
                        isFullscreen 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {content.metadata && Object.keys(content.metadata).length > 0 && (
              <div>
                <h4 className={`text-sm font-medium mb-2 ${isFullscreen ? 'text-gray-300' : 'text-gray-700'}`}>
                  Details
                </h4>
                <div className={`text-xs space-y-1 ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  {Object.entries(content.metadata).map(([key, value]) => (
                    <p key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        {!isFullscreen && (
          <div className="absolute bottom-4 right-4 text-xs text-gray-400">
            Press Esc to close
            {content.type === 'image' && ' • F for fullscreen'}
          </div>
        )}
      </div>
    </div>
  );
};