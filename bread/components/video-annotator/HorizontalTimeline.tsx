import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Play, Pause, Repeat, Square, RotateCcw } from "lucide-react";
import { formatTime } from "../../utils/time";

export interface HorizontalTimelineProps {
  currentTime: number;
  duration: number;
  buffered: number;
  annotations: any[];
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  height?: number;
}

interface TimelineSelection {
  startTime: number;
  endTime: number;
  startAnnotationId?: string;
  endAnnotationId?: string;
}

export function HorizontalTimeline({
  currentTime,
  duration,
  buffered,
  annotations = [],
  onSeek,
  onPlayPause,
  isPlaying,
  height = 120
}: HorizontalTimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<TimelineSelection | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStartTime, setLoopStartTime] = useState<number | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [snappedMarker, setSnappedMarker] = useState<string | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const loopCheckInterval = useRef<number | null>(null);

  // Constants
  const SNAP_THRESHOLD = 2; // seconds
  const MIN_SELECTION_DURATION = 1; // minimum 1 second selection

  // Calculate positions
  const currentPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPosition = duration > 0 ? (buffered / duration) * 100 : 0;

  // Sort annotations by start time
  const sortedAnnotations = [...annotations].sort((a, b) => 
    (a.startTime || 0) - (b.startTime || 0)
  );

  // Find nearest annotation for snapping
  const findNearestAnnotation = useCallback((time: number) => {
    let nearest = null;
    let minDistance = SNAP_THRESHOLD;

    for (const annotation of sortedAnnotations) {
      const annotationTime = annotation.startTime || 0;
      const distance = Math.abs(annotationTime - time);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = annotation;
      }
    }

    return nearest;
  }, [sortedAnnotations]);

  // Convert mouse position to time
  const getTimeFromPosition = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  // Handle timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Don't handle clicks on markers or other interactive elements
    if ((e.target as HTMLElement).closest('.annotation-marker, .selection-handle')) {
      return;
    }

    const clickTime = getTimeFromPosition(e.clientX);
    
    // Snap to nearest annotation if close enough
    const nearestAnnotation = findNearestAnnotation(clickTime);
    const seekTime = nearestAnnotation ? (nearestAnnotation.startTime || 0) : clickTime;
    
    onSeek(seekTime);
  }, [getTimeFromPosition, findNearestAnnotation, onSeek]);

  // Handle marker click
  const handleMarkerClick = useCallback((e: React.MouseEvent, annotation: any) => {
    e.stopPropagation();
    
    const annotationId = annotation.id;
    const annotationTime = annotation.startTime || 0;

    if (e.ctrlKey || e.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedMarkers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(annotationId)) {
          newSet.delete(annotationId);
        } else {
          newSet.add(annotationId);
        }
        return newSet;
      });
    } else if (e.shiftKey && selectedMarkers.size > 0) {
      // Range select with Shift
      const selectedTimes = Array.from(selectedMarkers)
        .map(id => sortedAnnotations.find(a => a.id === id))
        .filter(Boolean)
        .map(a => a.startTime || 0);
      
      const minTime = Math.min(...selectedTimes);
      const maxTime = Math.max(...selectedTimes);
      const currentTime = annotationTime;
      
      // Select all annotations between the range
      const rangeAnnotations = sortedAnnotations.filter(a => {
        const time = a.startTime || 0;
        return time >= Math.min(minTime, currentTime) && time <= Math.max(maxTime, currentTime);
      });
      
      setSelectedMarkers(new Set(rangeAnnotations.map(a => a.id)));
    } else {
      // Single select
      setSelectedMarkers(new Set([annotationId]));
      onSeek(annotationTime);
    }
  }, [selectedMarkers, sortedAnnotations, onSeek]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.annotation-marker')) {
      return; // Don't start drag on markers
    }

    if (e.shiftKey) {
      // Start selection drag
      setIsSelecting(true);
      const startTime = getTimeFromPosition(e.clientX);
      setDragStartTime(startTime);
      setSelection(null);
    } else {
      // Start seek drag
      setIsDragging(true);
      handleTimelineClick(e);
    }
  }, [getTimeFromPosition, handleTimelineClick]);

  // Handle drag move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const currentMouseTime = getTimeFromPosition(e.clientX);
    setHoverTime(currentMouseTime);

    // Check for snapping
    const nearestAnnotation = findNearestAnnotation(currentMouseTime);
    setSnappedMarker(nearestAnnotation?.id || null);

    if (isDragging) {
      // Continuous seeking while dragging
      const seekTime = nearestAnnotation ? (nearestAnnotation.startTime || 0) : currentMouseTime;
      onSeek(seekTime);
    } else if (isSelecting && dragStartTime !== null) {
      // Update selection
      const startTime = Math.min(dragStartTime, currentMouseTime);
      const endTime = Math.max(dragStartTime, currentMouseTime);
      
      if (endTime - startTime >= MIN_SELECTION_DURATION) {
        // Snap selection boundaries to annotations
        const startAnnotation = findNearestAnnotation(startTime);
        const endAnnotation = findNearestAnnotation(endTime);
        
        const snappedStartTime = startAnnotation ? (startAnnotation.startTime || 0) : startTime;
        const snappedEndTime = endAnnotation ? (endAnnotation.startTime || 0) : endTime;
        
        setSelection({
          startTime: Math.min(snappedStartTime, snappedEndTime),
          endTime: Math.max(snappedStartTime, snappedEndTime),
          startAnnotationId: startAnnotation?.id,
          endAnnotationId: endAnnotation?.id
        });
      }
    }
  }, [
    getTimeFromPosition, 
    findNearestAnnotation, 
    isDragging, 
    isSelecting, 
    dragStartTime, 
    onSeek
  ]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (isSelecting && selection) {
      // Select all annotations within the selection
      const selectedInRange = sortedAnnotations.filter(annotation => {
        const time = annotation.startTime || 0;
        return time >= selection.startTime && time <= selection.endTime;
      });
      
      setSelectedMarkers(new Set(selectedInRange.map(a => a.id)));
    }
    
    setIsDragging(false);
    setIsSelecting(false);
    setDragStartTime(null);
  }, [isSelecting, selection, sortedAnnotations]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
    setSnappedMarker(null);
    setIsDragging(false);
    setIsSelecting(false);
    setDragStartTime(null);
  }, []);

  // Loop functionality
  const startLoop = useCallback(() => {
    if (selectedMarkers.size === 0) return;

    const selectedAnnotations = sortedAnnotations.filter(a => selectedMarkers.has(a.id));
    if (selectedAnnotations.length === 0) return;

    const times = selectedAnnotations.map(a => a.startTime || 0).sort((a, b) => a - b);
    const startTime = times[0];
    const endTime = times[times.length - 1];

    setLoopStartTime(startTime);
    setIsLooping(true);
    
    // Start from the beginning of the loop
    onSeek(startTime);
    if (!isPlaying) {
      onPlayPause();
    }
  }, [selectedMarkers, sortedAnnotations, onSeek, isPlaying, onPlayPause]);

  const stopLoop = useCallback(() => {
    setIsLooping(false);
    setLoopStartTime(null);
    if (loopCheckInterval.current) {
      clearInterval(loopCheckInterval.current);
      loopCheckInterval.current = null;
    }
  }, []);

  // Loop checking effect
  useEffect(() => {
    if (isLooping && selectedMarkers.size > 0 && isPlaying) {
      const selectedAnnotations = sortedAnnotations.filter(a => selectedMarkers.has(a.id));
      const times = selectedAnnotations.map(a => a.startTime || 0).sort((a, b) => a - b);
      const endTime = times[times.length - 1];

      if (loopCheckInterval.current) {
        clearInterval(loopCheckInterval.current);
      }

      loopCheckInterval.current = window.setInterval(() => {
        if (currentTime >= endTime + 1) { // 1 second buffer
          onSeek(times[0]);
        }
      }, 100);
    } else {
      if (loopCheckInterval.current) {
        clearInterval(loopCheckInterval.current);
        loopCheckInterval.current = null;
      }
    }

    return () => {
      if (loopCheckInterval.current) {
        clearInterval(loopCheckInterval.current);
        loopCheckInterval.current = null;
      }
    };
  }, [isLooping, selectedMarkers, isPlaying, currentTime, sortedAnnotations, onSeek]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedMarkers(new Set());
    setSelection(null);
    stopLoop();
  }, [stopLoop]);

  return (
    <div 
      className="w-full bg-warm-beige border-t border-border" 
      style={{ height: `${height}px` }}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPlayPause}
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {hoverTime !== null && (
              <div className="text-xs text-muted-foreground bg-card px-2 py-1 rounded">
                {formatTime(hoverTime)}
                {snappedMarker && <span className="ml-1 text-dusty-rose">⬡</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedMarkers.size > 0 && (
              <>
                <Badge variant="outline" className="text-xs bg-dusty-rose/20 text-dusty-rose">
                  {selectedMarkers.size} selected
                </Badge>
                
                {!isLooping ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startLoop}
                    className="text-xs"
                  >
                    <Repeat className="h-3 w-3 mr-1" />
                    Loop
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopLoop}
                    className="text-xs bg-dusty-rose/20 text-dusty-rose"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Stop Loop
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </>
            )}

            <Badge variant="outline" className="text-xs">
              {annotations.length} steps
            </Badge>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground mb-3">
          Click to seek • Shift+drag to select • Ctrl+click markers to multi-select
        </div>

        {/* Timeline */}
        <div className="flex-1 relative">
          <div
            ref={timelineRef}
            className="w-full h-8 bg-border rounded-full cursor-pointer relative overflow-visible"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={handleTimelineClick}
          >
            {/* Buffered Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded-full transition-all"
              style={{ width: `${bufferedPosition}%` }}
            />

            {/* Progress Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-deep-olive rounded-full transition-all"
              style={{ width: `${currentPosition}%` }}
            />

            {/* Selection Area */}
            {selection && (
              <div
                className="absolute top-0 h-full bg-dusty-rose/30 border-l-2 border-r-2 border-dusty-rose"
                style={{
                  left: `${(selection.startTime / duration) * 100}%`,
                  width: `${((selection.endTime - selection.startTime) / duration) * 100}%`
                }}
              />
            )}

            {/* Current Time Indicator */}
            <div
              className="absolute top-1/2 w-4 h-4 bg-deep-olive border-2 border-cloud-white rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-sm z-20"
              style={{ left: `${currentPosition}%` }}
            />

            {/* Annotation Markers */}
            {sortedAnnotations.map((annotation, index) => {
              const position = duration > 0 ? ((annotation.startTime || 0) / duration) * 100 : 0;
              const isSelected = selectedMarkers.has(annotation.id);
              const isSnapped = snappedMarker === annotation.id;
              
              return (
                <div
                  key={annotation.id || index}
                  className={`annotation-marker absolute top-0 bottom-0 w-2 cursor-pointer transition-all z-10 ${
                    isSelected 
                      ? 'bg-dusty-rose opacity-100 scale-125' 
                      : 'bg-dusty-rose/60 hover:bg-dusty-rose hover:opacity-100'
                  } ${
                    isSnapped ? 'scale-110 ring-2 ring-dusty-rose ring-opacity-50' : ''
                  }`}
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  onClick={(e) => handleMarkerClick(e, annotation)}
                  title={`Step ${index + 1}: ${annotation.title || 'Untitled'} (${formatTime(annotation.startTime || 0)})`}
                >
                  <div className="absolute -top-1 -bottom-1 -left-1 -right-1" />
                </div>
              );
            })}

            {/* Hover indicator */}
            {hoverTime !== null && !isDragging && !isSelecting && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/50 pointer-events-none z-15"
                style={{ left: `${(hoverTime / duration) * 100}%` }}
              />
            )}

            {/* Loop indicator */}
            {isLooping && selectedMarkers.size > 0 && (
              <div className="absolute -top-8 left-0 right-0 flex justify-center">
                <div className="bg-dusty-rose text-cloud-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  Looping {selectedMarkers.size} step{selectedMarkers.size !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Labels */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0:00</span>
            {selectedMarkers.size > 1 && (
              <span className="text-dusty-rose">
                {selectedMarkers.size} steps selected
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}