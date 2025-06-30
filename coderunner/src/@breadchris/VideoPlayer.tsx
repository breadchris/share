import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';

// Import ReactPlayer from ESM.sh
import ReactPlayer from 'react-player';

// Extended interface that includes all react-player props plus wrapper-specific props
export interface VideoPlayerProps {
  // Core react-player props
  url?: string | string[] | MediaStream;
  playing?: boolean;
  loop?: boolean;
  controls?: boolean;
  light?: boolean | string;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  progressInterval?: number;
  playsinline?: boolean;
  pip?: boolean;
  stopOnUnmount?: boolean;
  fallback?: React.ReactElement;
  wrapper?: any;
  config?: {
    youtube?: any;
    facebook?: any;
    soundcloud?: any;
    vimeo?: any;
    file?: any;
    wistia?: any;
    mixcloud?: any;
    dailymotion?: any;
    twitch?: any;
    [key: string]: any;
  };

  // Event handlers
  onReady?: (player: any) => void;
  onStart?: (player: any) => void;
  onPlay?: (player: any) => void;
  onPause?: (player: any) => void;
  onBuffer?: (player: any) => void;
  onBufferEnd?: (player: any) => void;
  onEnded?: (player: any) => void;
  onError?: (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => void;
  onDuration?: (duration: number) => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onSeek?: (seconds: number) => void;
  onPlaybackRateChange?: (speed: number) => void;
  onPlaybackQualityChange?: (quality: any) => void;
  onEnablePIP?: (player: any) => void;
  onDisablePIP?: (player: any) => void;

  // Wrapper-specific props
  className?: string;
  loadingClassName?: string;
  errorClassName?: string;
  fallbackContent?: React.ReactNode;
  showFallbackLink?: boolean;
  fallbackLinkText?: string;
  onStateChange?: (state: 'loading' | 'ready' | 'error') => void;
}

// Ref interface for imperative API access
export interface VideoPlayerRef {
  getPlayer: () => any;
  getCurrentTime: () => number;
  getSecondsLoaded: () => number;
  getDuration: () => number;
  getInternalPlayer: (key?: string) => any;
  seekTo: (amount: number, type?: 'seconds' | 'fraction') => void;
}

/**
 * Universal VideoPlayer Component
 * 
 * A flexible wrapper around react-player that supports all major video platforms
 * and provides consistent loading states, error handling, and fallback UI.
 * 
 * @example
 * // Basic usage
 * <VideoPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" controls />
 * 
 * // With custom props
 * <VideoPlayer
 *   url="https://vimeo.com/90509568"
 *   playing={true}
 *   volume={0.8}
 *   onReady={() => console.log('Ready!')}
 *   width="100%"
 *   height="400px"
 * />
 * 
 * // With error handling
 * <VideoPlayer
 *   url="invalid-url"
 *   fallbackContent={<div>Custom error message</div>}
 *   onError={(error) => console.error('Player error:', error)}
 * />
 */
export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  // Wrapper-specific props
  className = '',
  loadingClassName = '',
  errorClassName = '',
  fallbackContent,
  showFallbackLink = true,
  fallbackLinkText = 'Open Video',
  onStateChange,
  
  // React-player props with defaults
  url,
  width = '100%',
  height = '360px',
  controls = true,
  playing = false,
  muted = false,
  
  // Event handlers
  onReady,
  onError,
  
  // All other react-player props
  ...reactPlayerProps
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const playerRef = useRef<any>(null);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    getPlayer: () => playerRef.current,
    getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
    getSecondsLoaded: () => playerRef.current?.getSecondsLoaded() || 0,
    getDuration: () => playerRef.current?.getDuration() || 0,
    getInternalPlayer: (key?: string) => playerRef.current?.getInternalPlayer(key),
    seekTo: (amount: number, type: 'seconds' | 'fraction' = 'seconds') => {
      playerRef.current?.seekTo(amount, type);
    }
  }), []);

  const handleReady = (player: any) => {
    setIsLoading(false);
    setHasError(false);
    onStateChange?.('ready');
    onReady?.(player);
  };

  const handleError = (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(error?.message || 'Failed to load video');
    onStateChange?.('error');
    onError?.(error, data, hlsInstance, hlsGlobal);
    console.error('VideoPlayer error:', error, data);
  };

  // Enhanced loading component
  const LoadingPlayer = () => (
    <div 
      className={`bg-gray-100 rounded-lg flex items-center justify-center ${className} ${loadingClassName}`}
      style={{ width, height }}
    >
      <div className="text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
        <p className="text-sm text-gray-600">Loading video...</p>
      </div>
    </div>
  );

  // Enhanced fallback component
  const FallbackPlayer = () => (
    <div 
      className={`bg-gray-100 rounded-lg flex items-center justify-center ${className} ${errorClassName}`}
      style={{ width, height }}
    >
      <div className="text-center space-y-3 p-4">
        {fallbackContent || (
          <>
            <div className="text-4xl">🎥</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Video Unavailable</h3>
              <p className="text-sm text-gray-600 mb-3">
                {errorMessage || 'Unable to load video player'}
              </p>
              {showFallbackLink && url && typeof url === 'string' && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                  </svg>
                  {fallbackLinkText}
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Show error state
  if (hasError) {
    return <FallbackPlayer />;
  }

  // Show loading state
  if (isLoading) {
    onStateChange?.('loading');
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && <LoadingPlayer />}
      
      <React.Suspense fallback={<LoadingPlayer />}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          width={width}
          height={height}
          controls={controls}
          playing={playing}
          muted={muted}
          onReady={handleReady}
          onError={handleError}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
          {...reactPlayerProps}
        />
      </React.Suspense>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

// Convenience components for common use cases
export const AutoPlayVideoPlayer: React.FC<Omit<VideoPlayerProps, 'playing'>> = (props) => (
  <VideoPlayer playing={true} {...props} />
);

export const MutedVideoPlayer: React.FC<Omit<VideoPlayerProps, 'muted'>> = (props) => (
  <VideoPlayer muted={true} {...props} />
);

export const LoopingVideoPlayer: React.FC<Omit<VideoPlayerProps, 'loop'>> = (props) => (
  <VideoPlayer loop={true} {...props} />
);

// Export types for external use
export type { VideoPlayerProps, VideoPlayerRef };

export default VideoPlayer;