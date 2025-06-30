import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TimelineProps, Content } from '../types';
import { SwipeableContentItem } from './SwipeableContentItem';
import { YouTubePreview } from './YouTubePlayer';
import { formatDomainForDisplay } from '../utils/url';

// Timeline item component
interface TimelineItemProps {
  content: Content;
  onClick: (content: Content) => void;
  onSelect?: (content: Content) => void;
  onDelete?: (content: Content) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ content, onClick, onSelect, onDelete }) => {
  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Unknown time';
    
    // Handle different date formats and ensure valid date parsing
    let date: Date;
    
    // Try parsing as-is first
    date = new Date(dateString);
    
    // If invalid, try parsing various formats
    if (isNaN(date.getTime())) {
      // Try adding timezone if missing (common with Go backend)
      const isoWithZ = dateString.endsWith('Z') ? dateString : dateString + 'Z';
      date = new Date(isoWithZ);
      
      // Try with UTC suffix if still invalid
      if (isNaN(date.getTime()) && !dateString.includes('T')) {
        date = new Date(dateString + 'T00:00:00Z');
      }
      
      // Try parsing as RFC3339 format (Go's default time format)
      if (isNaN(date.getTime())) {
        // Handle Go's RFC3339 format: "2006-01-02T15:04:05Z07:00"
        const rfc3339Regex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?/;
        const match = dateString.match(rfc3339Regex);
        if (match) {
          let isoString = match[1];
          if (match[2]) isoString += match[2]; // Add fractional seconds
          if (match[3]) {
            isoString += match[3];
          } else {
            isoString += 'Z'; // Default to UTC
          }
          date = new Date(isoString);
        }
      }
    }
    
    // If still invalid, try parsing as timestamp (milliseconds or seconds)
    if (isNaN(date.getTime())) {
      const timestamp = parseInt(dateString);
      if (!isNaN(timestamp)) {
        // Try as milliseconds first, then seconds
        date = new Date(timestamp);
        if (date.getFullYear() < 1990) {
          date = new Date(timestamp * 1000);
        }
      }
    }
    
    // Final fallback
    if (isNaN(date.getTime())) {
      console.warn('Unable to parse date:', dateString);
      return 'Unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <div className="text-gray-900">
            <p className="whitespace-pre-wrap break-words">{content.data}</p>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={content.media_url || content.data}
              alt="Shared content"
              className="w-full max-w-sm rounded-lg border border-gray-200"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
              loading="lazy"
            />
            {content.data !== content.media_url && (
              <p className="text-gray-600 text-sm">{content.data}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">🎵</div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Audio Recording</p>
                {content.metadata?.duration && (
                  <p className="text-xs text-gray-500">
                    {Math.floor(content.metadata.duration / 60)}:
                    {(content.metadata.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>
            </div>
            {content.media_url && (
              <audio
                controls
                className="w-full max-w-sm"
                preload="metadata"
              >
                <source src={content.media_url} type={content.mime_type || 'audio/webm'} />
                Your browser does not support audio playback.
              </audio>
            )}
          </div>
        );

      case 'clipboard':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>📋</span>
              <span>Pasted from clipboard</span>
            </div>
            <div className="text-gray-900">
              <p className="whitespace-pre-wrap break-words">{content.data}</p>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {content.metadata?.originalName || 'Uploaded file'}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {content.metadata?.mimeType && (
                    <span className="uppercase">{content.metadata.mimeType.split('/')[1]}</span>
                  )}
                  {content.metadata?.size && (
                    <span>{(content.metadata.size / 1024).toFixed(1)} KB</span>
                  )}
                </div>
              </div>
              <a
                href={content.media_url || content.data}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
            </div>
          </div>
        );

      case 'url':
        const { isYouTube, youtubeVideoId, domain, title, description } = content.metadata || {};
        
        if (isYouTube && youtubeVideoId) {
          return (
            <div className="space-y-2">
              <YouTubePreview
                videoId={youtubeVideoId}
                url={content.data}
                title={title}
                className="aspect-video w-full max-w-sm"
                onClick={() => onClick(content)}
              />
              {title && title !== 'YouTube Video' && (
                <p className="text-sm font-medium text-gray-900">{title}</p>
              )}
            </div>
          );
        } else {
          // Generic URL preview
          return (
            <div className="border border-gray-200 rounded-lg overflow-hidden max-w-sm">
              <div className="p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-sm flex items-center justify-center text-xs">
                    🔗
                  </div>
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    {formatDomainForDisplay(domain || '')}
                  </span>
                </div>
                
                {title && (
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {title}
                  </h3>
                )}
                
                {description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {description}
                  </p>
                )}
                
                <a
                  href={content.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {content.data.length > 40 ? content.data.substring(0, 40) + '...' : content.data}
                </a>
              </div>
            </div>
          );
        }

      default:
        return (
          <div className="text-gray-500 italic">
            Unknown content type: {content.type}
          </div>
        );
    }
  };

  const handleSelect = useCallback((content: Content) => {
    if (onSelect) {
      onSelect(content);
    } else {
      console.log('Selected content:', content.id);
    }
  }, [onSelect]);

  const handleDelete = useCallback((content: Content) => {
    if (onDelete) {
      onDelete(content.id);
    } else {
      console.log('Delete content:', content.id);
    }
  }, [onDelete]);

  const contentElement = (
    <div
      className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(content)}
    >
      {/* Content */}
      <div className="mb-3">
        {renderContent()}
      </div>

      {/* Tags */}
      {content.tag_names && content.tag_names.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {content.tag_names.map((tag, index) => (
            <span
              key={`${content.id}-tag-${index}`}
              className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              title={`Tag: ${tag}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Debug: Show if tags exist but are not displayed */}
      {process.env.NODE_ENV === 'development' && content.tag_names && content.tag_names.length === 0 && (
        <div className="text-xs text-gray-400 italic">No tags</div>
      )}

      {/* User Information and Timestamp */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {content.user_info && content.user_info.username && (
            <>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {content.user_info.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{content.user_info.username}</span>
            </>
          )}
        </div>
        <div className="text-gray-400">
          {formatTimeAgo(content.created_at)}
        </div>
      </div>
    </div>
  );

  return (
    <SwipeableContentItem
      content={content}
      onSelect={handleSelect}
      onDelete={handleDelete}
    >
      {contentElement}
    </SwipeableContentItem>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  content,
  isLoading,
  hasMore,
  onLoadMore,
  onContentClick,
  onContentSelect,
  onContentDelete,
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setIsLoadingMore(true);
          onLoadMore();
        }
      },
      {
        root: timelineRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  // Reset loading state when content changes
  useEffect(() => {
    setIsLoadingMore(false);
  }, [content]);

  // Preserve scroll position when new content is added to the top
  const preserveScrollPosition = useCallback(() => {
    if (timelineRef.current) {
      lastScrollTop.current = timelineRef.current.scrollTop;
    }
  }, []);

  // Handle content click
  const handleContentClick = useCallback((clickedContent: Content) => {
    preserveScrollPosition();
    onContentClick(clickedContent);
  }, [onContentClick, preserveScrollPosition]);

  // Restore scroll position (useful when returning from content view)
  const restoreScrollPosition = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = lastScrollTop.current;
    }
  }, []);

  // Expose restoreScrollPosition for parent components
  useEffect(() => {
    (Timeline as any).restoreScrollPosition = restoreScrollPosition;
  }, [restoreScrollPosition]);

  return (
    <div
      ref={timelineRef}
      className="flex-1 overflow-y-auto overscroll-behavior-contain"
      style={{
        height: 'calc(100vh - 200px)', // Adjust based on header/footer heights
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
    >
      {/* Initial loading state */}
      {isLoading && (!content || content.length === 0) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading timeline...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!content || content.length === 0) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-sm">Start sharing to see your timeline</p>
          </div>
        </div>
      )}

      {/* Content items */}
      {content && content.map((item) => (
        <TimelineItem
          key={item.id}
          content={item}
          onClick={handleContentClick}
          onSelect={onContentSelect}
          onDelete={onContentDelete}
        />
      ))}

      {/* Load more sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
        >
          {isLoadingMore ? (
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading more...</p>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Scroll to load more
            </div>
          )}
        </div>
      )}

      {/* End of timeline indicator */}
      {!hasMore && content && content.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <div className="border-t border-gray-200 w-16 mx-auto mb-4"></div>
          You've reached the beginning
        </div>
      )}
    </div>
  );
};

// Add static method for external access to scroll position restoration
(Timeline as any).restoreScrollPosition = () => {};