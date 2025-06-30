import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';

// YouTube iframe API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// YouTube iframe API utility functions
const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
      window.onYouTubeIframeAPIReady = () => resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => resolve();

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  });
};

// Extract YouTube video ID from URL or return the ID if already clean
const extractYouTubeVideoId = (input: string): string | null => {
  if (!input) return null;
  
  // If it's already a clean video ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }
  
  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Custom hook for YouTube player management
const useYouTubePlayer = ({
  videoId,
  width,
  height,
  autoPlay,
  onReady,
  onPlay,
  onPause,
  onError,
  onProgress,
  onDuration,
}: {
  videoId: string;
  width: string | number;
  height: string | number;
  autoPlay: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
}) => {
  const playerRef = useRef<any>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const [isAPIReady, setIsAPIReady] = useState(false);

  // Load YouTube API
  useEffect(() => {
    loadYouTubeAPI().then(() => {
      setIsAPIReady(true);
    });
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !elementRef.current || !videoId) return;

    // Extract clean video ID from the input
    const cleanVideoId = extractYouTubeVideoId(videoId);
    if (!cleanVideoId) {
      console.error('Invalid YouTube video ID or URL:', videoId);
      onError?.('Invalid video ID');
      return;
    }

    const player = new window.YT.Player(elementRef.current, {
      width,
      height,
      videoId: cleanVideoId,
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: (event: any) => {
          playerRef.current = event.target;
          onReady?.();
          if (onDuration) {
            const duration = event.target.getDuration();
            onDuration(duration);
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            onPlay?.();
            startProgressTracking();
          } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
            onPause?.();
            stopProgressTracking();
          }
        },
        onError: (event: any) => {
          onError?.(event.data);
        },
      },
    });

    return () => {
      stopProgressTracking();
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [isAPIReady, videoId, width, height, autoPlay]);

  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && onProgress) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            onProgress({
              played: currentTime / duration,
              playedSeconds: currentTime,
            });
          }
        } catch (error) {
          console.warn('Error getting player progress:', error);
        }
      }
    }, 250);
  }, [onProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  return {
    elementRef,
    playerRef,
    isAPIReady,
  };
};

export interface VideoPlayerProps {
  videoId: string;
  url: string;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  controls?: boolean; // Use custom controls vs native
  className?: string;
  isFullscreen?: boolean; // For theming
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayer: () => any;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  videoId,
  url,
  width = '100%',
  height = '400px',
  autoPlay = false,
  controls = true,
  className = '',
  isFullscreen = false,
  onReady,
  onPlay,
  onPause,
  onError,
  onProgress,
  onDuration,
  onFullscreenChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSeekingAuto, setIsSeekingAuto] = useState(false);

  // Event handlers for YouTube player
  const handleReady = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onReady?.();
  }, [onReady]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
    setShowControls(true);
  }, [onPause]);

  const handleProgress = useCallback((progress: { played: number; playedSeconds: number }) => {
    if (!isSeekingAuto) {
      setCurrentTime(progress.playedSeconds);
    }
    onProgress?.(progress);
  }, [isSeekingAuto, onProgress]);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
    onDuration?.(dur);
  }, [onDuration]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  // Determine the actual video ID to use (prefer videoId prop, fallback to extracting from URL)
  const actualVideoId = React.useMemo(() => {
    // Try the videoId prop first
    if (videoId) {
      const cleanId = extractYouTubeVideoId(videoId);
      if (cleanId) return cleanId;
    }
    
    // Fallback to extracting from URL
    if (url) {
      const cleanId = extractYouTubeVideoId(url);
      if (cleanId) return cleanId;
    }
    
    return null;
  }, [videoId, url]);

  // YouTube player hook
  const { elementRef, playerRef, isAPIReady } = useYouTubePlayer({
    videoId: actualVideoId || '',
    width,
    height,
    autoPlay,
    onReady: handleReady,
    onPlay: handlePlay,
    onPause: handlePause,
    onError: handleError,
    onProgress: handleProgress,
    onDuration: handleDuration,
  });

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    play: () => {
      setIsPlaying(true);
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      setIsPlaying(false);
      if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    },
    seekTo: (seconds: number) => {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    },
    setVolume: (vol: number) => {
      setVolume(vol);
      if (playerRef.current?.setVolume) {
        playerRef.current.setVolume(vol * 100);
      }
    },
    getCurrentTime: () => {
      return playerRef.current?.getCurrentTime?.() || currentTime;
    },
    getDuration: () => {
      return playerRef.current?.getDuration?.() || duration;
    },
    getPlayer: () => playerRef.current,
  }), [currentTime, duration, playerRef]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    
    if (isPlaying && !isSeekingAuto) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isSeekingAuto]);

  // Handle mouse movement for control visibility
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (playerRef.current) {
      if (newPlayingState) {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    }
  }, [isPlaying, playerRef]);

  const handleSeek = useCallback((seekTime: number) => {
    setIsSeekingAuto(true);
    setCurrentTime(seekTime);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seekTime, true);
    }
    setTimeout(() => setIsSeekingAuto(false), 100);
  }, [playerRef]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackRate(speed);
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  }, [playerRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if our video player is focused or active
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(Math.max(0, currentTime - 10), true);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(Math.min(duration, currentTime + 10), true);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'KeyF':
          e.preventDefault();
          onFullscreenChange?.(!isFullscreen);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, volume, isMuted, isFullscreen, onFullscreenChange, handlePlayPause, playerRef]);


  // Sync volume changes with YouTube player
  useEffect(() => {
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted, playerRef]);

  // Sync playback rate changes with YouTube player
  useEffect(() => {
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate, playerRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Theme classes
  const themeClasses = isFullscreen
    ? 'text-white'
    : 'text-gray-900';

  const controlBgClasses = isFullscreen
    ? 'bg-black bg-opacity-50'
    : 'bg-white bg-opacity-90';

  const buttonClasses = isFullscreen
    ? 'text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-20'
    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100';

  // Show error if no valid video ID could be extracted
  if (!actualVideoId) {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className={`text-center p-6 ${themeClasses}`}>
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Invalid Video</h3>
          <p className="text-sm mb-4">Unable to extract YouTube video ID from URL</p>
          <p className="text-xs text-gray-500 mb-4">
            URL: {url || videoId || 'No URL provided'}
          </p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Open Original Link
            </a>
          )}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className={`text-center p-6 ${themeClasses}`}>
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Video Unavailable</h3>
          <p className="text-sm mb-4">Unable to load the video player</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group ${className} max-w-full`}
      style={{ 
        width, 
        height,
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* YouTube iframe Player */}
      <div
        ref={elementRef}
        style={{ 
          width: '100%', 
          height: '100%',
          maxWidth: width,
          maxHeight: height
        }}
        className="youtube-player-container"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Click to play/pause overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handlePlayPause}
      >
        {/* Large play/pause button when paused or on hover */}
        {(!isPlaying || showControls) && (
          <div className={`p-4 rounded-full ${controlBgClasses} transition-opacity duration-200 ${!isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={themeClasses}>
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={themeClasses}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Custom Controls */}
      {controls && (
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} ${controlBgClasses}`}>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-1 bg-gray-300 rounded-full cursor-pointer group"
                 onClick={(e) => {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const percent = (e.clientX - rect.left) / rect.width;
                   handleSeek(percent * duration);
                 }}>
              <div
                className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="absolute top-1/2 w-3 h-3 bg-red-600 rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-6px' }}
              />
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className={`p-2 rounded transition-colors ${buttonClasses}`}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMuteToggle}
                  className={`p-1 rounded transition-colors ${buttonClasses}`}
                >
                  {isMuted || volume === 0 ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Time */}
              <div className={`text-sm ${themeClasses}`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Speed */}
              <select
                value={playbackRate}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className={`text-sm bg-transparent border border-gray-300 rounded px-2 py-1 ${themeClasses}`}
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* YouTube Link */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded transition-colors ${buttonClasses}`}
                title="Watch on YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Fullscreen */}
              {onFullscreenChange && (
                <button
                  onClick={() => onFullscreenChange(!isFullscreen)}
                  className={`p-2 rounded transition-colors ${buttonClasses}`}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;