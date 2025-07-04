import React, { useState, useEffect, useCallback } from 'react';
import type { ContentViewerProps, Content } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { formatDomainForDisplay } from '../utils/url';
import { getReplies, createReply, getErrorMessage } from '../utils/api';

export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Threading state
  const [replies, setReplies] = useState<Content[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [repliesOffset, setRepliesOffset] = useState(0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

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

  // Load replies for the current content
  const loadReplies = useCallback(async (reset = false) => {
    if (!content.id) return;
    
    setIsLoadingReplies(true);
    setThreadError(null);
    
    const offset = reset ? 0 : repliesOffset;
    
    try {
      const response = await getReplies(content.id, offset);
      setReplies(prev => reset ? response.content : [...prev, ...response.content]);
      setHasMoreReplies(response.has_more);
      setRepliesOffset(response.next_offset);
    } catch (error) {
      setThreadError(getErrorMessage(error));
    } finally {
      setIsLoadingReplies(false);
    }
  }, [content.id, repliesOffset]);

  // Load replies when component mounts (only if content has replies)
  useEffect(() => {
    if (content.reply_count && content.reply_count > 0) {
      loadReplies(true);
    }
  }, [content.id]);

  // Handle reply submission
  const handleReplySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmittingReply) return;
    
    setIsSubmittingReply(true);
    setThreadError(null);
    
    try {
      const newReply = await createReply(content.id, {
        type: 'text',
        data: replyText.trim(),
        group_id: content.group_id,
      });
      
      // Add the new reply to the local state
      setReplies(prev => [...prev, newReply]);
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      setThreadError(getErrorMessage(error));
    } finally {
      setIsSubmittingReply(false);
    }
  }, [content.id, content.group_id, replyText, isSubmittingReply]);

  const renderContentLarge = () => {
    // Debug logging for content type investigation
    console.log('ContentViewer Debug - Full content object:', content);
    console.log('ContentViewer Debug - content.type value:', content.type);
    console.log('ContentViewer Debug - content.type typeof:', typeof content.type);
    console.log('ContentViewer Debug - content.type length:', content.type?.length);
    console.log('ContentViewer Debug - content.type char codes:', content.type?.split('').map(c => c.charCodeAt(0)));
    console.log('ContentViewer Debug - JSON.stringify(content.type):', JSON.stringify(content.type));
    
    // Normalize content type to handle potential whitespace issues
    let normalizedType = typeof content.type === 'string' ? content.type.trim().toLowerCase() : '';
    console.log('ContentViewer Debug - normalizedType:', normalizedType);
    
    // Additional validation for valid content types
    const validTypes = ['text', 'image', 'audio', 'clipboard', 'file', 'url'];
    const isValidType = typeof normalizedType === 'string' && validTypes.includes(normalizedType);
    console.log('ContentViewer Debug - isValidType:', isValidType);
    
    // Fallback logic for invalid or missing content types
    if (!isValidType) {
      console.warn('ContentViewer Debug - Invalid content type detected, attempting fallback detection');
      
      // Try to infer content type from other properties
      if (content.media_url && content.mime_type) {
        if (content.mime_type.startsWith('image/')) {
          normalizedType = 'image';
          console.log('ContentViewer Debug - Inferred type as image from mime_type');
        } else if (content.mime_type.startsWith('audio/')) {
          normalizedType = 'audio';
          console.log('ContentViewer Debug - Inferred type as audio from mime_type');
        } else {
          normalizedType = 'file';
          console.log('ContentViewer Debug - Inferred type as file from mime_type');
        }
      } else if (content.data && typeof content.data === 'string') {
        // Check if data looks like a URL
        try {
          new URL(content.data);
          normalizedType = 'url';
          console.log('ContentViewer Debug - Inferred type as url from data');
        } catch {
          // Assume text if it's just string data
          normalizedType = 'text';
          console.log('ContentViewer Debug - Inferred type as text from data');
        }
      } else {
        // Ultimate fallback
        normalizedType = 'text';
        console.log('ContentViewer Debug - Using ultimate fallback: text');
      }
    }
    
    switch (normalizedType) {
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

      case 'file':
        const fileName = content.metadata?.filename || 'Unknown file';
        const fileSize = content.file_size || content.metadata?.size;
        const mimeType = content.mime_type || content.metadata?.mime_type;
        
        // Get file extension for icon
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const getFileIcon = (extension?: string) => {
          if (!extension) return '📄';
          if (['pdf'].includes(extension)) return '📄';
          if (['doc', 'docx'].includes(extension)) return '📝';
          if (['xls', 'xlsx'].includes(extension)) return '📊';
          if (['ppt', 'pptx'].includes(extension)) return '📊';
          if (['zip', 'rar', '7z'].includes(extension)) return '🗜️';
          if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) return '🎬';
          if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return '🎵';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return '🖼️';
          if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) return '📄';
          if (['js', 'ts', 'html', 'css', 'py', 'java', 'cpp', 'c', 'go', 'php', 'rb'].includes(extension)) return '💻';
          return '📁';
        };

        const formatFileSize = (bytes?: number) => {
          if (!bytes) return 'Unknown size';
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(1024));
          return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
        };

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-8xl mb-4">{getFileIcon(fileExtension)}</div>
              <h3 className={`text-xl font-medium break-words ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                {fileName}
              </h3>
              <div className={`text-sm space-y-1 mt-2 ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                {fileSize && <p>Size: {formatFileSize(fileSize)}</p>}
                {mimeType && <p>Type: {mimeType}</p>}
                <p>Uploaded: {formatTimestamp(content.created_at)}</p>
              </div>
            </div>

            {content.media_url && (
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-3">
                  <a
                    href={content.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isFullscreen 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Download File
                  </a>
                  
                  <button
                    onClick={() => navigator.clipboard?.writeText(content.media_url || '')}
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
            )}

            {/* Additional metadata */}
            {content.metadata && Object.keys(content.metadata).filter(key => !['filename', 'size', 'mime_type'].includes(key)).length > 0 && (
              <div className={`text-sm space-y-1 ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                <h4 className="font-medium">Additional Details:</h4>
                {Object.entries(content.metadata)
                  .filter(([key]) => !['filename', 'size', 'mime_type'].includes(key))
                  .map(([key, value]) => (
                    <p key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </p>
                  ))}
              </div>
            )}
          </div>
        );

      default:
        console.error('ContentViewer Debug - Reached default case!');
        console.error('ContentViewer Debug - Original content.type:', content.type);
        console.error('ContentViewer Debug - Normalized type:', normalizedType);
        console.error('ContentViewer Debug - All valid types:', ['text', 'image', 'audio', 'clipboard', 'file', 'url']);
        return (
          <div className={`text-center ${isFullscreen ? 'text-white' : 'text-gray-500'}`}>
            <div className="text-6xl mb-4">❓</div>
            <p>Unknown content type: "{content.type}" (normalized: "{normalizedType}")</p>
            <div className="mt-4 text-sm opacity-75 font-mono">
              <p>Debug Info:</p>
              <p>Type: {typeof content.type}</p>
              <p>Length: {content.type?.length}</p>
              <p>JSON: {JSON.stringify(content.type)}</p>
            </div>
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
                 content.type === 'file' ? 'File' :
                 content.type === 'url' ? (content.metadata?.isYouTube ? 'YouTube Video' : 'Link') : 'Content'}
              </h2>
              <div className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>{formatTimestamp(content.created_at)}</p>
                {content.user_info && content.user_info.Username && (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {content.user_info.Username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs">by {content.user_info.Username}</span>
                  </div>
                )}
              </div>
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

        {/* Threading Section */}
        {!isFullscreen && (
          <div className="border-t border-gray-200 p-4 space-y-4 max-h-80 overflow-y-auto">
            {/* Reply Count & Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-700">
                  {content.reply_count > 0 ? `${content.reply_count} ${content.reply_count === 1 ? 'Reply' : 'Replies'}` : 'No replies yet'}
                </h4>
                {!content.reply_count && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Be the first to reply
                  </button>
                )}
              </div>
              {(content.reply_count > 0 || showReplyForm) && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Reply
                </button>
              )}
            </div>

            {/* Error Display */}
            {threadError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {threadError}
              </div>
            )}

            {/* Reply Form */}
            {showReplyForm && (
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  disabled={isSubmittingReply}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                    disabled={isSubmittingReply}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            )}

            {/* Replies List */}
            {replies.length > 0 && (
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div key={reply.Content.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {reply.user_info && reply.user_info.Username && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {reply.user_info.Username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {reply.user_info?.Username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(reply.Content.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {reply.Content.data}
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {hasMoreReplies && (
                  <button
                    onClick={() => loadReplies(false)}
                    disabled={isLoadingReplies}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    {isLoadingReplies ? 'Loading...' : 'Load more replies'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

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