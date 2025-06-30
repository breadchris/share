import React, { useState, useRef } from 'react';

// Import VideoPlayer from coderunner module
const VideoPlayer = React.lazy(() => import('http://localhost:8080/coderunner/module/@breadchris/VideoPlayer.tsx'));

export interface YouTubePlayerProps {
  videoId: string;
  url: string;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
  playing?: boolean;
  muted?: boolean;
  className?: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  url,
  width = '100%',
  height = '315px',
  controls = true,
  playing = false,
  muted = false,
  className = '',
  onReady,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const playerRef = useRef<any>(null);

  const handleReady = () => {
    setIsLoading(false);
    onReady?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
    console.error('YouTube player error:', error);
  };

  // Fallback component for when ReactPlayer fails to load
  const FallbackPlayer = () => (
    <div 
      className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center space-y-3">
        <div className="text-4xl">📺</div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">YouTube Video</h3>
          <p className="text-sm text-gray-600 mb-3">Unable to load video player</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );

  // Loading component
  const LoadingPlayer = () => (
    <div 
      className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full mx-auto"></div>
        <p className="text-sm text-gray-600">Loading video...</p>
      </div>
    </div>
  );

  if (hasError) {
    return <FallbackPlayer />;
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && <LoadingPlayer />}
      
      <React.Suspense fallback={<LoadingPlayer />}>
        <VideoPlayer
          ref={playerRef}
          url={url}
          width={width}
          height={height}
          controls={controls}
          playing={playing}
          muted={muted}
          onReady={handleReady}
          onError={handleError}
          config={{
            youtube: {
              playerVars: {
                showinfo: 0,
                rel: 0,
                modestbranding: 1,
              },
            },
          }}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      </React.Suspense>
    </div>
  );
};

// Simplified YouTube preview component for timeline
export interface YouTubePreviewProps {
  videoId: string;
  url: string;
  title?: string;
  className?: string;
  onClick?: () => void;
}

export const YouTubePreview: React.FC<YouTubePreviewProps> = ({
  videoId,
  url,
  title,
  className = '',
  onClick,
}) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <img
        src={thumbnailUrl}
        alt={title || 'YouTube Video'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-red-600 rounded-full p-3 group-hover:bg-red-700 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all"></div>
      
      {/* Duration/YouTube logo could be added here */}
      <div className="absolute bottom-2 right-2">
        <svg width="20" height="14" viewBox="0 0 24 24" fill="white" className="opacity-80">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
    </div>
  );
};