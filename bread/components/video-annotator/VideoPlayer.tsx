import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Maximize } from "lucide-react";
import ReactPlayer from 'react-player/youtube';

export interface VideoPlayerProps {
  videoUrl: string;
  annotations?: any[];
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  seekTo?: number;
  showTimeline?: boolean;
}

export function VideoPlayer({
  videoUrl,
  annotations = [],
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  seekTo,
  showTimeline = true
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const playerRef = useRef<ReactPlayer>(null);
  const timeUpdateInterval = useRef<number | null>(null);
  const lastSeekTo = useRef<number | null>(null);

  // Validate YouTube URL
  const isValidYouTubeUrl = ReactPlayer.canPlay(videoUrl);

  // Start time update loop
  const startTimeUpdateLoop = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
    
    timeUpdateInterval.current = window.setInterval(() => {
      if (playerRef.current && isReady) {
        try {
          const current = playerRef.current.getCurrentTime();
          const loaded = playerRef.current.getSecondsLoaded();
          
          setCurrentTime(current);
          setBufferedTime(loaded);
          onTimeUpdate(current);
        } catch (error) {
          // Ignore errors during time updates
          console.warn('Time update error:', error);
        }
      }
    }, 100);
  }, [isReady, onTimeUpdate]);

  const stopTimeUpdateLoop = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
      timeUpdateInterval.current = null;
    }
  }, []);

  // Handle external seek requests
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null && seekTo !== lastSeekTo.current && playerRef.current && isReady) {
      try {
        playerRef.current.seekTo(seekTo, 'seconds');
        lastSeekTo.current = seekTo;
        setCurrentTime(seekTo);
      } catch (error) {
        console.warn('Failed to seek:', error);
      }
    }
  }, [seekTo, isReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTimeUpdateLoop();
    };
  }, [stopTimeUpdateLoop]);

  // Handle player ready
  const handleReady = useCallback(() => {
    console.log('ReactPlayer ready');
    setIsReady(true);
    setIsLoading(false);
    setError(null);
    
    if (playerRef.current) {
      const videoDuration = playerRef.current.getDuration();
      setDuration(videoDuration);
      onDurationChange(videoDuration);
    }
  }, [onDurationChange]);

  // Handle play state changes
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlayStateChange(true);
    startTimeUpdateLoop();
  }, [onPlayStateChange, startTimeUpdateLoop]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange(false);
    stopTimeUpdateLoop();
  }, [onPlayStateChange, stopTimeUpdateLoop]);

  // Handle duration change
  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
    onDurationChange(duration);
  }, [onDurationChange]);

  // Handle player error
  const handleError = useCallback((error: any) => {
    console.error('ReactPlayer error:', error);
    setError('Failed to load video. Please check the YouTube URL.');
    setIsLoading(false);
  }, []);

  // Handle progress updates
  const handleProgress = useCallback((state: { played: number, playedSeconds: number, loaded: number, loadedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
    setBufferedTime(state.loadedSeconds);
    onTimeUpdate(state.playedSeconds);
  }, [onTimeUpdate]);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(0, 'seconds');
        setCurrentTime(0);
        onTimeUpdate(0);
      } catch (error) {
        console.warn('Failed to restart:', error);
      }
    }
  }, [onTimeUpdate]);

  // Handle buffer progress
  const handleBuffer = useCallback(() => {
    console.log('Video buffering...');
  }, []);

  // Handle when buffer ends
  const handleBufferEnd = useCallback(() => {
    console.log('Video buffer ended');
  }, []);

  if (!isValidYouTubeUrl) {
    return (
      <Card className="card-cozy">
        <div className="aspect-video bg-warm-beige/50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">Invalid Video URL</h3>
            <p className="text-secondary text-sm">
              Please enter a valid YouTube URL to continue.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-cozy">
        <div className="aspect-video bg-destructive/10 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <VolumeX className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="mb-2 text-destructive">Video Error</h3>
            <p className="text-secondary text-sm">{error}</p>
            <Button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setIsReady(false);
              }}
              className="mt-4 btn-primary"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-cozy overflow-hidden">
      <div className="relative">
        {/* ReactPlayer Container */}
        <div className="aspect-video bg-black relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-dusty-rose/30 border-t-dusty-rose rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-cloud-white">Loading video...</p>
                <p className="text-cloud-white/70 text-sm mt-2">
                  {videoUrl.length > 50 ? `${videoUrl.substring(0, 50)}...` : videoUrl}
                </p>
              </div>
            </div>
          )}
          
          {/* ReactPlayer */}
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            controls={false} // We'll use custom controls
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onDuration={handleDuration}
            onProgress={handleProgress}
            onError={handleError}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
            config={{
              youtube: {
                playerVars: {
                  showinfo: 0,
                  modestbranding: 1,
                  rel: 0,
                  enablejsapi: 1
                }
              }
            }}
            style={{ 
              display: isLoading ? 'none' : 'block',
              backgroundColor: '#000000'
            }}
          />
        </div>

        {/* Custom Controls Overlay - only show when player is ready */}
        {!isLoading && !error && isReady && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-cloud-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                className="text-cloud-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <div className="flex-1 text-cloud-white text-sm">
                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="text-cloud-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {showTimeline && duration > 0 && (
              <div className="mt-3">
                <div className="w-full bg-white/30 rounded-full h-1 relative">
                  {/* Buffered */}
                  <div
                    className="absolute top-0 left-0 h-full bg-white/50 rounded-full transition-all"
                    style={{ width: `${(bufferedTime / duration) * 100}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-dusty-rose rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  
                  {/* Annotation markers - show as ranges */}
                  {annotations.map((annotation, index) => {
                    const startPos = duration > 0 ? ((annotation.startTime || 0) / duration) * 100 : 0;
                    const endPos = duration > 0 ? ((annotation.endTime || annotation.startTime || 0) / duration) * 100 : 0;
                    const width = Math.max(endPos - startPos, 0.5); // Minimum 0.5% width for visibility
                    
                    return (
                      <div
                        key={annotation.id || index}
                        className="absolute top-0 h-1 bg-yellow-400/80 rounded-full"
                        style={{ 
                          left: `${startPos}%`,
                          width: `${width}%`
                        }}
                        title={`Step ${index + 1}: ${annotation.title || 'Untitled'}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}