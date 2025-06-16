import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { formatTime } from "../utils/time";
import { 
  ChevronDown, 
  ChevronUp, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  PlayCircle, 
  MousePointer, 
  Edit2, 
  Move, 
  Repeat, 
  Save, 
  X, 
  Pencil,
  GripHorizontal,
  MoveVertical
} from "lucide-react";
import { Slider } from "./ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export interface TimestampAnnotation {
  id: string;
  timestamp: number;
  comment: string;
  transcriptBefore: string;
  transcriptAfter: string;
}

export interface VideoSection {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  timestampIds: string[];
}

interface VerticalTimelineProps {
  currentTime: number;
  duration: number;
  annotations: TimestampAnnotation[];
  sections: VideoSection[];
  onAddAnnotation: (timestamp: number) => void;
  onUpdateAnnotation: (id: string, comment: string) => void;
  onCreateSection: (startTime: number, endTime: number, timestampIds: string[]) => void;
  onDeleteAnnotation: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onJumpToTimestamp: (timestamp: number) => void;
  onUpdateSectionBoundary: (id: string, startTime: number, endTime: number) => void;
  onMoveTimestamp: (id: string, newTimestamp: number) => void;
  onSetLoopSelection?: (startTime: number, endTime: number) => void;
  isLooping?: boolean;
  toggleLooping?: () => void;
  onUpdateSectionTitle?: (id: string, title: string) => void;
}

export function VerticalTimeline({
  currentTime,
  duration,
  annotations,
  sections,
  onAddAnnotation,
  onUpdateAnnotation,
  onCreateSection,
  onDeleteAnnotation,
  onDeleteSection,
  onJumpToTimestamp,
  onUpdateSectionBoundary,
  onMoveTimestamp,
  onSetLoopSelection,
  isLooping = false,
  toggleLooping,
  onUpdateSectionTitle
}: VerticalTimelineProps) {
  // Constants for padding and snapping
  const TIMELINE_PADDING_TOP = 60; // Pixels of padding at the top
  const TIMELINE_PADDING_BOTTOM = 60; // Pixels of padding at the bottom
  const SNAP_THRESHOLD = 3; // Time in seconds to snap to a timestamp
  
  // Timeline state
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeBoundaryDrag, setActiveBoundaryDrag] = useState<{
    sectionId: string;
    boundary: 'start' | 'end';
    initialTime: number;
  } | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const [newAnnotationId, setNewAnnotationId] = useState<string | null>(null);
  const [isCreatingSectionFromSelection, setIsCreatingSectionFromSelection] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showHoverIndicator, setShowHoverIndicator] = useState(false);
  const [snappedToTimestamp, setSnappedToTimestamp] = useState<string | null>(null);
  const [snapIndicator, setSnapIndicator] = useState<{timestamp: number, position: 'start' | 'end'} | null>(null);
  
  // Section title editing state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitleDraft, setSectionTitleDraft] = useState<string>("");
  
  // Timestamp dragging state
  const [draggedTimestamp, setDraggedTimestamp] = useState<string | null>(null);
  const [draggedTimestampInitialPos, setDraggedTimestampInitialPos] = useState<number | null>(null);
  const [isDraggingTimestamp, setIsDraggingTimestamp] = useState(false);
  
  // Selection and section resizing state
  const [isResizingSelection, setIsResizingSelection] = useState(false);
  const [isResizingSection, setIsResizingSection] = useState(false);
  const [resizingBoundary, setResizingBoundary] = useState<'start' | 'end' | null>(null);
  const [resizingSectionId, setResizingSectionId] = useState<string | null>(null);
  
  // Zoom and scroll state
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal, >1 = zoomed in
  const [visibleStartTime, setVisibleStartTime] = useState(0);
  const [visibleDuration, setVisibleDuration] = useState(duration);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const sectionTitleInputRef = useRef<HTMLInputElement>(null);

  // Sort annotations by timestamp (ascending)
  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  // Track latest annotation for animation
  useEffect(() => {
    if (annotations.length > 0) {
      const latestAnnotation = annotations[annotations.length - 1];
      setNewAnnotationId(latestAnnotation.id);
      
      // Clear the ID after animation completes
      const timer = setTimeout(() => {
        setNewAnnotationId(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [annotations.length]);

  // Update visible duration when zoom level changes
  useEffect(() => {
    setVisibleDuration(duration / zoomLevel);
    
    // Ensure current time is visible when zooming
    if (currentTime < visibleStartTime || currentTime > visibleStartTime + visibleDuration) {
      const newStart = Math.max(0, currentTime - (visibleDuration / 2));
      setVisibleStartTime(Math.min(newStart, duration - visibleDuration));
    }
  }, [zoomLevel, duration, currentTime]);

  // Update visible range when duration changes
  useEffect(() => {
    setVisibleDuration(duration / zoomLevel);
    
    // If visible range exceeds new duration, adjust it
    if (visibleStartTime + visibleDuration > duration) {
      setVisibleStartTime(Math.max(0, duration - visibleDuration));
    }
  }, [duration]);

  // Auto-scroll to keep current time in view
  useEffect(() => {
    // Only auto-scroll if current time is outside visible range
    const buffer = visibleDuration * 0.1; // 10% buffer
    
    if (currentTime < visibleStartTime + buffer) {
      // Current time is before visible range
      setVisibleStartTime(Math.max(0, currentTime - buffer));
    } else if (currentTime > visibleStartTime + visibleDuration - buffer) {
      // Current time is after visible range
      setVisibleStartTime(Math.min(
        duration - visibleDuration, 
        currentTime - visibleDuration + buffer
      ));
    }
  }, [currentTime, visibleStartTime, visibleDuration, duration]);

  // Update loop selection when selection changes
  useEffect(() => {
    if (selectionStart !== null && selectionEnd !== null && onSetLoopSelection && isLooping) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      
      // Only update if there's a valid selection
      if (end - start >= 1) {
        onSetLoopSelection(start, end);
      }
    }
  }, [selectionStart, selectionEnd, onSetLoopSelection, isLooping]);

  // Focus on section title input when editing
  useEffect(() => {
    if (editingSectionId && sectionTitleInputRef.current) {
      sectionTitleInputRef.current.focus();
    }
  }, [editingSectionId]);

  // Function to find the nearest timestamp to a given time
  const findNearestTimestamp = (time: number): { id: string, timestamp: number } | null => {
    if (annotations.length === 0) return null;
    
    // Find timestamp closest to the given time within threshold
    let closestTimestamp = null;
    let minDistance = SNAP_THRESHOLD;
    
    for (const annotation of annotations) {
      const distance = Math.abs(annotation.timestamp - time);
      if (distance < minDistance) {
        minDistance = distance;
        closestTimestamp = annotation;
      }
    }
    
    if (closestTimestamp) {
      return {
        id: closestTimestamp.id,
        timestamp: closestTimestamp.timestamp
      };
    }
    
    return null;
  };

  // Function to snap time to nearest timestamp if within threshold
  const snapToNearestTimestamp = (time: number): number => {
    const nearest = findNearestTimestamp(time);
    if (nearest) {
      setSnappedToTimestamp(nearest.id);
      return nearest.timestamp;
    }
    
    setSnappedToTimestamp(null);
    return time;
  };

  // Function to check if a timestamp is within a section
  const isTimestampInSection = (timestamp: number) => {
    return sections.some(section => 
      timestamp >= section.startTime && timestamp <= section.endTime
    );
  };

  // Function to get section that contains a timestamp
  const getSectionForTimestamp = (timestamp: number) => {
    return sections.find(section => 
      timestamp >= section.startTime && timestamp <= section.endTime
    );
  };

  // Function to check if a section is expanded
  const isSectionExpanded = (sectionId: string) => {
    return expandedSections.has(sectionId);
  };

  // Function to get the section a timestamp belongs to
  const getTimestampSection = (timestampId: string) => {
    return sections.find(section => section.timestampIds.includes(timestampId));
  };

  // Function to check if a timestamp belongs to the active section
  const isTimestampInActiveSection = (timestampId: string) => {
    if (!activeSection) return false;
    const section = sections.find(s => s.id === activeSection);
    return section ? section.timestampIds.includes(timestampId) : false;
  };

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: string) => {
    const newExpandedSections = new Set(expandedSections);
    if (newExpandedSections.has(sectionId)) {
      newExpandedSections.delete(sectionId);
    } else {
      newExpandedSections.add(sectionId);
    }
    setExpandedSections(newExpandedSections);
  };

  // Convert Y position to time based on visible range
  const getTimeFromYPosition = (y: number, rect: DOMRect) => {
    // Adjust for padding
    if (y < TIMELINE_PADDING_TOP) {
      return 0; // Start of video if clicking in top padding
    } else if (y > rect.height - TIMELINE_PADDING_BOTTOM) {
      return duration; // End of video if clicking in bottom padding
    }
    
    // Calculate time within the visible range
    const timePercent = (y - TIMELINE_PADDING_TOP) / (rect.height - TIMELINE_PADDING_TOP - TIMELINE_PADDING_BOTTOM);
    return visibleStartTime + (timePercent * visibleDuration);
  };

  // Handle timeline hover to show time indicator
  const handleTimelineHover = (e: React.MouseEvent) => {
    if (!timelineContentRef.current) return;
    
    const rect = timelineContentRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Skip hover if in the padding areas
    if (y < TIMELINE_PADDING_TOP || y > rect.height - TIMELINE_PADDING_BOTTOM) {
      setShowHoverIndicator(false);
      return;
    }
    
    // Convert y position to time
    const hoverTimeValue = getTimeFromYPosition(y, rect);
    
    // Check if we should snap this hover indicator
    const nearest = findNearestTimestamp(hoverTimeValue);
    if (nearest && !isDragging && !isDraggingTimestamp && !isResizingSelection && !isResizingSection) {
      setHoverTime(nearest.timestamp);
      setSnappedToTimestamp(nearest.id);
    } else {
      setHoverTime(hoverTimeValue);
      setSnappedToTimestamp(null);
    }
    
    setShowHoverIndicator(true);
  };

  // Clear hover indicator when mouse leaves
  const handleTimelineLeave = () => {
    setShowHoverIndicator(false);
    setSnappedToTimestamp(null);
  };

  // Handle direct timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    // If we're in selection mode or resizing, don't seek on click
    if (isSelectionMode || isResizingSelection || isResizingSection) return;
    
    // Skip if we're interacting with a section or annotation
    if ((e.target as HTMLElement).closest('.section-header, .annotation-card, .zoom-controls, .timestamp-marker, .section-indicator, .selection-handle, .section-resize-handle')) {
      return;
    }
    
    if (!timelineContentRef.current) return;
    
    const rect = timelineContentRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Get time from y position
    let clickTime = getTimeFromYPosition(y, rect);
    
    // Snap to nearest timestamp if close enough
    const snappedTime = snapToNearestTimestamp(clickTime);
    if (snappedTime !== clickTime) {
      clickTime = snappedTime;
    }
    
    // Seek to this position
    onJumpToTimestamp(clickTime);
    
    // Add a visual feedback for the click
    setHoverTime(clickTime);
    setShowHoverIndicator(true);
    setTimeout(() => {
      setShowHoverIndicator(false);
      setSnappedToTimestamp(null);
    }, 800);
  };

  // Handle mouse down to start selection (only in selection mode)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if in selection mode or shift key is pressed
    if (!isSelectionMode && !e.shiftKey) return;
    
    // Skip if we're interacting with a section or annotation
    if ((e.target as HTMLElement).closest('.section-header, .annotation-card, .zoom-controls, .timeline-drag-handle, .timestamp-marker, .section-indicator, .timeline-padding, .selection-handle, .section-resize-handle')) {
      return;
    }
    
    if (!timelineContentRef.current) return;
    
    const rect = timelineContentRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Ignore clicks in the padding areas
    if (y < TIMELINE_PADDING_TOP || y > rect.height - TIMELINE_PADDING_BOTTOM) {
      return;
    }
    
    // Convert y position to time based on visible range
    let time = getTimeFromYPosition(y, rect);
    
    // Snap to nearest timestamp if close enough
    const snappedTime = snapToNearestTimestamp(time);
    if (snappedTime !== time) {
      time = snappedTime;
      setSnapIndicator({ timestamp: time, position: 'start' });
    } else {
      setSnapIndicator(null);
    }
    
    setSelectionStart(time);
    setSelectionEnd(time);
    setIsDragging(true);
    
    // Prevent default behavior
    e.preventDefault();
  };

  // Handle mouse move to update selection or resize
  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle hover time indicator if not dragging/resizing
    if (!isDraggingTimestamp && !isResizingSelection && !isResizingSection) {
      handleTimelineHover(e);
    }
    
    // Update selection if we're dragging a selection
    if (isDragging && !isResizingSelection && !isResizingSection && timelineContentRef.current) {
      const rect = timelineContentRef.current.getBoundingClientRect();
      const y = Math.max(TIMELINE_PADDING_TOP, Math.min(e.clientY - rect.top, rect.height - TIMELINE_PADDING_BOTTOM));
      
      // Convert y position to time based on visible range
      let time = getTimeFromYPosition(y, rect);
      
      // Snap to nearest timestamp if close enough
      const snappedTime = snapToNearestTimestamp(time);
      if (snappedTime !== time) {
        time = snappedTime;
        setSnapIndicator({ timestamp: time, position: 'end' });
      } else {
        setSnapIndicator(null);
      }
      
      setSelectionEnd(time);
    }
    
    // Handle selection resizing
    if (isResizingSelection && resizingBoundary && timelineContentRef.current) {
      const rect = timelineContentRef.current.getBoundingClientRect();
      const y = Math.max(TIMELINE_PADDING_TOP, Math.min(e.clientY - rect.top, rect.height - TIMELINE_PADDING_BOTTOM));
      
      // Convert y position to time based on visible range
      let time = getTimeFromYPosition(y, rect);
      
      // Snap to nearest timestamp if close enough
      const snappedTime = snapToNearestTimestamp(time);
      if (snappedTime !== time) {
        time = snappedTime;
        setSnapIndicator({ timestamp: time, position: resizingBoundary });
      } else {
        setSnapIndicator(null);
      }
      
      // Update the appropriate boundary
      if (resizingBoundary === 'start') {
        setSelectionStart(time);
      } else {
        setSelectionEnd(time);
      }
      
      // If looping is active, update the loop range in real-time
      if (isLooping && onSetLoopSelection && selectionStart !== null && selectionEnd !== null) {
        const start = resizingBoundary === 'start' ? time : selectionStart;
        const end = resizingBoundary === 'end' ? time : selectionEnd;
        onSetLoopSelection(Math.min(start, end), Math.max(start, end));
      }
    }
    
    // Handle section resizing
    if (isResizingSection && resizingBoundary && resizingSectionId && timelineContentRef.current) {
      const rect = timelineContentRef.current.getBoundingClientRect();
      const y = Math.max(TIMELINE_PADDING_TOP, Math.min(e.clientY - rect.top, rect.height - TIMELINE_PADDING_BOTTOM));
      
      // Convert y position to time based on visible range
      let time = getTimeFromYPosition(y, rect);
      
      // Snap to nearest timestamp if close enough
      const snappedTime = snapToNearestTimestamp(time);
      if (snappedTime !== time) {
        time = snappedTime;
        setSnapIndicator({ timestamp: time, position: resizingBoundary });
      } else {
        setSnapIndicator(null);
      }
      
      // Get the current section
      const section = sections.find(s => s.id === resizingSectionId);
      if (!section) return;
      
      // Update section boundary in real-time
      if (resizingBoundary === 'start') {
        // Ensure start time doesn't go past end time - 1 second
        const newStartTime = Math.min(time, section.endTime - 1);
        onUpdateSectionBoundary(section.id, newStartTime, section.endTime);
        
        // Update loop range if this section is being looped
        if (isLooping && onSetLoopSelection) {
          onSetLoopSelection(newStartTime, section.endTime);
        }
      } else {
        // Ensure end time doesn't go before start time + 1 second
        const newEndTime = Math.max(time, section.startTime + 1);
        onUpdateSectionBoundary(section.id, section.startTime, newEndTime);
        
        // Update loop range if this section is being looped
        if (isLooping && onSetLoopSelection) {
          onSetLoopSelection(section.startTime, newEndTime);
        }
      }
    }
  };

  // Handle mouse up to finish selection or resizing
  const handleMouseUp = () => {
    // Handle finishing selection creation
    if (isDragging && selectionStart !== null && selectionEnd !== null) {
      // Ensure start is before end
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      
      // Only create a selection if it's at least 1 second
      if (end - start >= 1) {
        // Find all timestamps within the selection
        const selectedTimestampIds = annotations
          .filter(a => a.timestamp >= start && a.timestamp <= end)
          .map(a => a.id);
        
        if (selectedTimestampIds.length > 0) {
          setSelectionStart(start);
          setSelectionEnd(end);
        } else {
          // If no timestamps in selection, clear it
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else {
        // Too small selection, clear it
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    }
    
    // Reset dragging and resizing states
    setIsDragging(false);
    setIsResizingSelection(false);
    setIsResizingSection(false);
    setResizingSectionId(null);
    setResizingBoundary(null);
    setSnapIndicator(null);
  };

  // Handle selection boundary resize start
  const handleSelectionResizeStart = (e: React.MouseEvent, boundary: 'start' | 'end') => {
    e.stopPropagation(); // Prevent timeline click
    
    if (selectionStart === null || selectionEnd === null) return;
    
    setIsResizingSelection(true);
    setResizingBoundary(boundary);
    setIsSelectionMode(true); // Switch to selection mode
    
    // Prevent default to avoid any text selection
    e.preventDefault();
  };

  // Handle section resize start
  const handleSectionResizeStart = (e: React.MouseEvent, sectionId: string, boundary: 'start' | 'end') => {
    e.stopPropagation(); // Prevent timeline click
    
    setIsResizingSection(true);
    setResizingSectionId(sectionId);
    setResizingBoundary(boundary);
    
    // Prevent default to avoid any text selection
    e.preventDefault();
  };

  // Handle boundary drag start
  const handleBoundaryDragStart = (sectionId: string, boundary: 'start' | 'end', time: number) => {
    setActiveBoundaryDrag({
      sectionId,
      boundary,
      initialTime: time
    });
  };

  // Handle boundary drag move
  const handleBoundaryDragMove = (e: React.MouseEvent) => {
    if (!activeBoundaryDrag || !timelineContentRef.current) return;
    
    const rect = timelineContentRef.current.getBoundingClientRect();
    const y = Math.max(TIMELINE_PADDING_TOP, Math.min(e.clientY - rect.top, rect.height - TIMELINE_PADDING_BOTTOM));
    
    // Convert y position to time based on visible range
    let time = getTimeFromYPosition(y, rect);
    
    // Snap to nearest timestamp if close enough
    const snappedTime = snapToNearestTimestamp(time);
    if (snappedTime !== time) {
      time = snappedTime;
    }
    
    const section = sections.find(s => s.id === activeBoundaryDrag.sectionId);
    if (!section) return;
    
    if (activeBoundaryDrag.boundary === 'start') {
      // Ensure start time doesn't go past end time
      const newStartTime = Math.min(time, section.endTime - 1);
      onUpdateSectionBoundary(section.id, newStartTime, section.endTime);
    } else {
      // Ensure end time doesn't go before start time
      const newEndTime = Math.max(time, section.startTime + 1);
      onUpdateSectionBoundary(section.id, section.startTime, newEndTime);
    }
  };

  // Handle boundary drag end
  const handleBoundaryDragEnd = () => {
    setActiveBoundaryDrag(null);
    setSnappedToTimestamp(null);
  };

  // Handle timeline drag start (for scrolling)
  const handleTimelineDragStart = (e: React.MouseEvent) => {
    // Skip if we're interacting with a section or annotation
    if ((e.target as HTMLElement).closest('.section-header, .annotation-card, .section-boundary, .zoom-controls, .timestamp-marker, .section-indicator, .timeline-padding, .selection-handle, .section-resize-handle')) {
      return;
    }
    
    // Only initiate dragging if the middle mouse button is pressed or Alt key is held
    if (e.button !== 1 && !e.altKey) return;
    
    setIsDraggingTimeline(true);
    setDragStartY(e.clientY);
    setDragStartTime(visibleStartTime);
    
    // Prevent default behavior
    e.preventDefault();
  };

  // Handle timeline drag move
  const handleTimelineDragMove = (e: React.MouseEvent) => {
    if (!isDraggingTimeline || !timelineRef.current) return;
    
    const deltaY = dragStartY - e.clientY;
    const timelineHeight = timelineRef.current.getBoundingClientRect().height - TIMELINE_PADDING_TOP - TIMELINE_PADDING_BOTTOM;
    const timeDelta = (deltaY / timelineHeight) * visibleDuration;
    
    // Calculate new start time ensuring it stays within bounds
    const newStartTime = Math.max(
      0,
      Math.min(
        duration - visibleDuration,
        dragStartTime + timeDelta
      )
    );
    
    setVisibleStartTime(newStartTime);
  };

  // Handle timeline drag end
  const handleTimelineDragEnd = () => {
    setIsDraggingTimeline(false);
  };

  // Handle timestamp drag start
  const handleTimestampDragStart = (e: React.MouseEvent, id: string, timestamp: number) => {
    e.stopPropagation(); // Prevent timeline click or selection
    
    // Prevent dragging if we're in selection mode
    if (isSelectionMode) return;
    
    setDraggedTimestamp(id);
    setDraggedTimestampInitialPos(timestamp);
    setIsDraggingTimestamp(true);
    
    // Change cursor style globally to indicate dragging
    document.body.style.cursor = 'grabbing';
    
    // Prevent default to avoid any text selection
    e.preventDefault();
  };

  // Handle timestamp drag move
  const handleTimestampDragMove = (e: React.MouseEvent) => {
    if (!isDraggingTimestamp || !draggedTimestamp || !timelineContentRef.current) return;
    
    const rect = timelineContentRef.current.getBoundingClientRect();
    const y = Math.max(TIMELINE_PADDING_TOP, Math.min(e.clientY - rect.top, rect.height - TIMELINE_PADDING_BOTTOM));
    
    // Convert y position to time based on visible range
    let newTime = getTimeFromYPosition(y, rect);
    
    // Snap to nearest timestamp if close enough (except self)
    const nearestTimestamps = annotations
      .filter(a => a.id !== draggedTimestamp) // Exclude the timestamp being dragged
      .map(a => ({ id: a.id, timestamp: a.timestamp, distance: Math.abs(a.timestamp - newTime) }))
      .filter(a => a.distance <= SNAP_THRESHOLD)
      .sort((a, b) => a.distance - b.distance);
    
    if (nearestTimestamps.length > 0) {
      newTime = nearestTimestamps[0].timestamp;
      setSnappedToTimestamp(nearestTimestamps[0].id);
    } else {
      setSnappedToTimestamp(null);
    }
    
    // Update hover indicator to show where timestamp will be placed
    setHoverTime(newTime);
    setShowHoverIndicator(true);
    
    // Stop propagation to prevent other handlers
    e.stopPropagation();
  };

  // Handle timestamp drag end
  const handleTimestampDragEnd = (e: React.MouseEvent) => {
    if (!isDraggingTimestamp || !draggedTimestamp || !timelineContentRef.current) return;
    
    const rect = timelineContentRef.current.getBoundingClientRect();
    const y = Math.max(TIMELINE_PADDING_TOP, Math.min(e.clientY - rect.top, rect.height - TIMELINE_PADDING_BOTTOM));
    
    // Convert y position to time based on visible range
    let newTime = getTimeFromYPosition(y, rect);
    
    // Snap to nearest timestamp if close enough (except self)
    const nearestTimestamps = annotations
      .filter(a => a.id !== draggedTimestamp) // Exclude the timestamp being dragged
      .map(a => ({ id: a.id, timestamp: a.timestamp, distance: Math.abs(a.timestamp - newTime) }))
      .filter(a => a.distance <= SNAP_THRESHOLD)
      .sort((a, b) => a.distance - b.distance);
    
    if (nearestTimestamps.length > 0) {
      newTime = nearestTimestamps[0].timestamp;
    }
    
    // Update the timestamp position
    onMoveTimestamp(draggedTimestamp, newTime);
    
    // Reset dragging state
    setDraggedTimestamp(null);
    setDraggedTimestampInitialPos(null);
    setIsDraggingTimestamp(false);
    setShowHoverIndicator(false);
    setSnappedToTimestamp(null);
    
    // Reset cursor
    document.body.style.cursor = '';
    
    // Stop propagation to prevent other handlers
    e.stopPropagation();
  };

  // Handle zoom in/out
  const handleZoomChange = (newZoom: number) => {
    // Ensure zoom level is between 1 and 10
    const clampedZoom = Math.max(1, Math.min(10, newZoom));
    
    // If we're zooming in, center on current time
    if (clampedZoom > zoomLevel) {
      const centerTime = currentTime;
      const newVisibleDuration = duration / clampedZoom;
      const newStartTime = Math.max(
        0,
        Math.min(
          duration - newVisibleDuration,
          centerTime - (newVisibleDuration / 2)
        )
      );
      
      setVisibleStartTime(newStartTime);
    }
    
    setZoomLevel(clampedZoom);
  };

  // Handle mouse wheel for zooming and scrolling
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default to avoid page scrolling
    e.preventDefault();
    
    // Zoom if Ctrl key is pressed, otherwise scroll
    if (e.ctrlKey || e.metaKey) {
      // Zoom: delta < 0 means zoom in, delta > 0 means zoom out
      const zoomDelta = e.deltaY < 0 ? 0.5 : -0.5;
      handleZoomChange(zoomLevel + zoomDelta);
    } else {
      // Scroll: move visible range up or down
      const scrollDelta = (e.deltaY / (timelineRef.current!.clientHeight - TIMELINE_PADDING_TOP - TIMELINE_PADDING_BOTTOM)) * visibleDuration;
      const newStartTime = Math.max(
        0,
        Math.min(
          duration - visibleDuration,
          visibleStartTime + scrollDelta
        )
      );
      
      setVisibleStartTime(newStartTime);
    }
  };

  // Handle comment change
  const handleCommentChange = (id: string, comment: string) => {
    setCommentDraft(prev => ({ ...prev, [id]: comment }));
  };

  // Handle comment save
  const handleCommentSave = (id: string) => {
    if (id in commentDraft) {
      onUpdateAnnotation(id, commentDraft[id]);
      // Remove from draft state after saving
      setCommentDraft(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Create section from current selection
  const handleCreateSection = () => {
    if (selectionStart === null || selectionEnd === null) {
      console.error("Cannot create section: No selection");
      return;
    }
    
    // To track that we're in the process of creating a section
    setIsCreatingSectionFromSelection(true);
    
    // Ensure start is before end
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    
    // Find all timestamps within the selection
    const selectedTimestampIds = annotations
      .filter(a => a.timestamp >= start && a.timestamp <= end)
      .map(a => a.id);
    
    console.log(`Creating section from ${formatTime(start)} to ${formatTime(end)}, with ${selectedTimestampIds.length} timestamps`);
    
    // Only proceed if we have at least one timestamp
    if (selectedTimestampIds.length > 0) {
      // Call the parent function to actually create the section
      onCreateSection(start, end, selectedTimestampIds);
      
      // Clear selection
      setSelectionStart(null);
      setSelectionEnd(null);
    } else {
      // If no timestamps in selection, show an error message
      alert("Please add at least one timestamp in the selected range to create a section");
      console.error("Cannot create section: No timestamps in selection");
    }
    
    // Reset the flag
    setIsCreatingSectionFromSelection(false);
    
    // Exit selection mode after creating a section
    setIsSelectionMode(false);
  };

  // Clear current selection
  const handleClearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Set active section and jump to its start time
  const handleSectionClick = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Jump to section start time
    onJumpToTimestamp(section.startTime);
    
    // If we're clicking on the already active section, unselect it and disable looping
    if (sectionId === activeSection) {
      setActiveSection(null);
      // Disable looping when unselecting a section
      if (isLooping && toggleLooping) {
        toggleLooping();
      }
    } else {
      // Set active section and clear selected timestamp
      setActiveSection(sectionId);
      setSelectedTimestamp(null);
    }
  };

  // Handle loop selection directly from the current selection
  const handleLoopSelection = () => {
    if (selectionStart === null || selectionEnd === null || !onSetLoopSelection) return;
    
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    
    // Only proceed if we have a valid selection
    if (end - start >= 1) {
      onSetLoopSelection(start, end);
      
      // Enable looping if it's not already enabled
      if (toggleLooping && !isLooping) {
        toggleLooping();
      }
    }
  };

  // Function to map timestamp to Y position in the timeline
  const getTimePosition = (time: number) => {
    // If time is outside visible range, return -9999 to hide it
    if (time < visibleStartTime || time > visibleStartTime + visibleDuration) {
      return "-9999px";
    }
    
    // Calculate position as percentage of visible range, accounting for padding
    const timePercent = (time - visibleStartTime) / visibleDuration;
    const contentHeight = timelineContentRef.current?.clientHeight || 0;
    const availableHeight = contentHeight - TIMELINE_PADDING_TOP - TIMELINE_PADDING_BOTTOM;
    
    return `${TIMELINE_PADDING_TOP + (timePercent * availableHeight)}px`;
  };

  // Check if a time is visible in the current view
  const isTimeVisible = (time: number) => {
    return time >= visibleStartTime && time <= visibleStartTime + visibleDuration;
  };

  // Function to get annotations that should be visible on the timeline
  const getVisibleAnnotations = () => {
    // If we have an active section, we want to show all timestamps from that section
    if (activeSection) {
      const activeSectionObj = sections.find(s => s.id === activeSection);
      if (activeSectionObj) {
        // Get IDs of timestamps in this section
        const sectionTimestampIds = new Set(activeSectionObj.timestampIds);
        
        // Get all timestamps that are not in any section OR are in the active section
        return sortedAnnotations.filter(a => 
          isTimeVisible(a.timestamp) && 
          (!sections.some(section => 
            section.id !== activeSectionObj.id && section.timestampIds.includes(a.id)
          ) || sectionTimestampIds.has(a.id))
        );
      }
    }
    
    // Default behavior - show annotations that aren't in any section
    return sortedAnnotations.filter(a => 
      isTimeVisible(a.timestamp) && 
      !sections.some(section => 
        section.timestampIds.includes(a.id)
      )
    );
  };

  // Function to get visible sections
  const getVisibleSections = () => {
    return sections.filter(section => 
      isTimeVisible(section.startTime) || 
      isTimeVisible(section.endTime) ||
      (section.startTime < visibleStartTime && section.endTime > visibleStartTime + visibleDuration)
    );
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    // Clear any existing selection when toggling mode off
    if (isSelectionMode) {
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  // Start editing a section title
  const handleStartEditingTitle = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    setEditingSectionId(sectionId);
    setSectionTitleDraft(section.title);
  };

  // Save edited section title
  const handleSaveSectionTitle = () => {
    if (!editingSectionId || !onUpdateSectionTitle) return;
    
    // Trim the title and ensure it's not empty
    const trimmedTitle = sectionTitleDraft.trim();
    if (trimmedTitle.length === 0) {
      // If empty, use default title
      onUpdateSectionTitle(editingSectionId, `Section ${sections.findIndex(s => s.id === editingSectionId) + 1}`);
    } else {
      onUpdateSectionTitle(editingSectionId, trimmedTitle);
    }
    
    // Exit editing mode
    setEditingSectionId(null);
    setSectionTitleDraft("");
  };

  // Cancel editing section title
  const handleCancelEditingTitle = () => {
    setEditingSectionId(null);
    setSectionTitleDraft("");
  };

  // Handle key press in section title input
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveSectionTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditingTitle();
    }
  };

  // Clean up any ongoing drag operations when the component unmounts
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  // Calculate min/max selection times
  const minSelectionTime = selectionStart !== null && selectionEnd !== null 
    ? Math.min(selectionStart, selectionEnd) 
    : null;
  
  const maxSelectionTime = selectionStart !== null && selectionEnd !== null 
    ? Math.max(selectionStart, selectionEnd) 
    : null;

  return (
    <div className="w-full h-[600px] relative bg-white rounded-xl overflow-hidden" ref={containerRef}>
      {/* Add Timestamp Button */}
      <div className="p-4 bg-white border-b">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Button 
            onClick={() => onAddAnnotation(currentTime)} 
            className="w-full py-5 rounded-xl bg-[#0B0C13] hover:bg-[#0B0C13]/90 transition-all"
          >
            <span className="flex flex-col items-center">
              <span className="text-lg">Add Timestamp</span>
              <span className="text-sm opacity-80">{formatTime(currentTime)}</span>
            </span>
          </Button>
        </motion.div>
      </div>

      {/* Selection Controls */}
      <div className="absolute top-16 left-0 right-0 z-50 flex justify-center gap-2 p-2 bg-white/90 shadow-sm rounded-lg mx-auto max-w-fit">
        {/* Selection Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleSelectionMode}
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              className={isSelectionMode ? "bg-primary" : ""}
            >
              {isSelectionMode ? (
                <><MousePointer className="w-4 h-4 mr-1" /> Exit Selection Mode</>
              ) : (
                <><Edit2 className="w-4 h-4 mr-1" /> Select Range</>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSelectionMode ? "Exit Selection Mode" : "Enter Selection Mode"}
          </TooltipContent>
        </Tooltip>
        
        {/* Create Section Button - only show when there's a selection */}
        {selectionStart !== null && selectionEnd !== null && (
          <div className="flex gap-2">
            <Button
              onClick={handleCreateSection}
              variant="outline"
              className="bg-background/80 hover:bg-background border-primary"
              disabled={isCreatingSectionFromSelection}
            >
              {isCreatingSectionFromSelection ? "Creating Section..." : "Create Section from Selection"}
            </Button>
            
            <Button
              onClick={handleClearSelection}
              variant="ghost"
              size="sm"
              className="text-gray-500"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Loop Controls - Always visible */}
      <div className="absolute top-16 right-4 z-40 flex items-center bg-white/90 shadow-sm rounded-lg px-3 py-1.5">
        {selectionStart !== null && selectionEnd !== null && (
          <div className="mr-2 text-xs font-medium text-gray-700">
            {formatTime(minSelectionTime!)} - {formatTime(maxSelectionTime!)}
          </div>
        )}
        
        <div className="flex items-center gap-1.5">
          <Switch
            id="loop-mode"
            checked={isLooping}
            onCheckedChange={toggleLooping}
            disabled={selectionStart === null && selectionEnd === null && !activeSection}
          />
          <Label 
            htmlFor="loop-mode" 
            className={`text-xs flex items-center ${isLooping ? 'text-green-700 font-medium' : 'text-gray-600'} ${(selectionStart === null && selectionEnd === null && !activeSection) ? 'opacity-50' : ''}`}
          >
            <Repeat className={`w-3 h-3 mr-1 ${isLooping ? 'text-green-600' : ''}`} /> 
            {isLooping ? "Looping" : "Loop Selection"}
          </Label>
        </div>
        
        {!isLooping && ((selectionStart !== null && selectionEnd !== null) || activeSection) && (
          <Button
            onClick={() => {
              if (activeSection) {
                const section = sections.find(s => s.id === activeSection);
                if (section && onSetLoopSelection) {
                  onSetLoopSelection(section.startTime, section.endTime, section.id);
                  if (toggleLooping) toggleLooping();
                }
              } else if (selectionStart !== null && selectionEnd !== null) {
                handleLoopSelection();
              }
            }}
            size="sm"
            variant="ghost"
            className="ml-1 h-7 px-2 text-xs"
          >
            <PlayCircle className="w-3 h-3 mr-1" /> Start Loop
          </Button>
        )}
      </div>

      {/* Section Display Indicator */}
      {activeSection && (
        <div className="absolute top-28 left-0 right-0 z-40 flex justify-center">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
            <span>
              Showing timestamps for section: {sections.find(s => s.id === activeSection)?.title || "Section"}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 ml-2 text-xs" 
              onClick={() => {
                setActiveSection(null);
                // Disable looping when clearing active section
                if (isLooping && toggleLooping) {
                  toggleLooping();
                }
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(600px-80px)] flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Time range and Zoom Controls - Now in a fixed left sidebar */}
          <div className="w-[80px] h-full bg-white border-r flex flex-col justify-between p-2 relative z-50">
            {/* Time range indicator */}
            <div className="bg-white p-2 rounded-lg text-xs font-medium">
              {formatTime(visibleStartTime)}
              <div className="mt-1">-</div>
              {formatTime(Math.min(visibleStartTime + visibleDuration, duration))}
            </div>
            
            {/* Interaction Instructions */}
            <div className="text-xs text-muted-foreground px-1 text-center">
              {isSelectionMode ? (
                <div className="space-y-1">
                  <p>Click & drag to select</p>
                  <p>Selections snap to timestamps</p>
                  <p>Drag handles to resize selection</p>
                  <p>Hold Alt + drag to scroll</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p>Click to seek</p>
                  <p>Hold Shift to select</p>
                  <p>Hold Alt to scroll</p>
                  <p className="font-medium mt-2">Drag timestamps to move</p>
                  <p className="text-xs">Resize sections when selected</p>
                </div>
              )}
            </div>
            
            {/* Zoom Controls */}
            <div className="zoom-controls flex flex-col items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => handleZoomChange(zoomLevel + 0.5)}
                disabled={zoomLevel >= 10}
                className="w-8 h-8"
              >
                <ZoomIn size={16} />
              </Button>
              
              <div className="h-24 px-2">
                <Slider
                  value={[zoomLevel]}
                  min={1}
                  max={10}
                  step={0.5}
                  orientation="vertical"
                  onValueChange={(values) => handleZoomChange(values[0])}
                />
              </div>
              
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => handleZoomChange(zoomLevel - 0.5)}
                disabled={zoomLevel <= 1}
                className="w-8 h-8"
              >
                <ZoomOut size={16} />
              </Button>
              
              <div className="text-center text-xs font-medium mt-1">
                {zoomLevel.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Timeline Container */}
          <div 
            ref={timelineRef}
            className={`flex-1 h-full relative overflow-y-auto border-r
              ${isSelectionMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
            onClick={handleTimelineClick}
            onMouseDown={(e) => {
              handleMouseDown(e);
              handleTimelineDragStart(e);
            }}
            onMouseMove={(e) => {
              handleMouseMove(e);
              handleTimelineDragMove(e);
              if (isDraggingTimestamp) {
                handleTimestampDragMove(e);
              }
            }}
            onMouseUp={(e) => {
              handleMouseUp();
              handleTimelineDragEnd();
              if (isDraggingTimestamp) {
                handleTimestampDragEnd(e);
              }
            }}
            onMouseLeave={(e) => {
              handleTimelineLeave();
              if (isDraggingTimestamp) {
                handleTimestampDragEnd(e);
              }
            }}
            onWheel={handleWheel}
          >
            {/* Timeline Content with Padding */}
            <div 
              ref={timelineContentRef}
              className="relative h-full w-full"
            >
              {/* Top Padding Area with Start Time Label */}
              <div className="timeline-padding absolute left-0 top-0 w-full h-[60px] bg-gradient-to-b from-white to-transparent z-5 flex items-center justify-center">
                <div className="absolute left-1/2 -translate-x-1/2 top-2 bg-white/90 px-3 py-1 rounded-full shadow-sm border text-xs font-medium">
                  Start: {formatTime(0)}
                </div>
              </div>

              {/* Bottom Padding Area with End Time Label */}
              <div className="timeline-padding absolute left-0 bottom-0 w-full h-[60px] bg-gradient-to-t from-white to-transparent z-5 flex items-center justify-center">
                <div className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white/90 px-3 py-1 rounded-full shadow-sm border text-xs font-medium">
                  End: {formatTime(duration)}
                </div>
              </div>

              {/* Hover Time Indicator */}
              {showHoverIndicator && hoverTime !== null && (
                <div className="absolute left-0 right-0 h-0.5 bg-secondary/50 z-20 pointer-events-none"
                     style={{ top: getTimePosition(hoverTime) }}>
                  <div className="absolute -left-14 top-0 -translate-y-1/2 px-2 py-1 bg-white/90 border shadow-sm rounded text-xs">
                    {formatTime(hoverTime)}
                  </div>
                  
                  {/* Snap indicator */}
                  {snappedToTimestamp && (
                    <div className="absolute right-0 top-0 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 shadow-sm rounded-full text-xs">
                      Snapped
                    </div>
                  )}
                </div>
              )}

              {/* Snap indicator for selection */}
              {snapIndicator && (
                <div className="absolute left-0 right-0 h-0.5 bg-blue-500/70 z-25 pointer-events-none"
                     style={{ top: getTimePosition(snapIndicator.timestamp) }}>
                  <div className="absolute -right-1 top-0 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 shadow-sm rounded-full text-xs flex items-center">
                    {snapIndicator.position === 'start' ? 'Start' : 'End'} Snap
                  </div>
                </div>
              )}

              {/* Current Time Indicator */}
              {isTimeVisible(currentTime) && (
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-primary z-30 pointer-events-none"
                  style={{ top: getTimePosition(currentTime) }}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3 rounded-full bg-black w-6 h-6 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Selection Area */}
              {selectionStart !== null && selectionEnd !== null && (
                <>
                  <div 
                    className={`absolute left-4 right-4 border-y ${isLooping ? 'bg-green-200/30 border-green-400' : 'bg-primary/20 border-primary'}`}
                    style={{ 
                      top: getTimePosition(minSelectionTime!), 
                      height: `${Math.abs(
                        parseInt(getTimePosition(maxSelectionTime!)) - 
                        parseInt(getTimePosition(minSelectionTime!))
                      )}px` 
                    }}
                  >
                    {isLooping && (
                      <div className="absolute right-2 top-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center shadow-sm">
                        <Repeat className="w-3 h-3 mr-1" /> Loop Active
                      </div>
                    )}
                  </div>
                  
                  {/* Selection Resize Handles */}
                  <div 
                    className="absolute left-2 right-2 h-6 -mt-3 bg-transparent cursor-ns-resize z-40 selection-handle"
                    style={{ top: getTimePosition(minSelectionTime!) }}
                    onMouseDown={(e) => handleSelectionResizeStart(e, 'start')}
                    title="Drag to adjust selection start"
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto w-6 h-6 rounded-full bg-primary/90 border-2 border-white flex items-center justify-center">
                      <MoveVertical className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div 
                    className="absolute left-2 right-2 h-6 -mt-3 bg-transparent cursor-ns-resize z-40 selection-handle"
                    style={{ top: getTimePosition(maxSelectionTime!) }}
                    onMouseDown={(e) => handleSelectionResizeStart(e, 'end')}
                    title="Drag to adjust selection end"
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto w-6 h-6 rounded-full bg-primary/90 border-2 border-white flex items-center justify-center">
                      <MoveVertical className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </>
              )}

              {/* Timeline Line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[60px] bottom-[60px] w-0.5 bg-gray-300" />

              {/* Time Markers (every minute or based on zoom) */}
              {Array.from({ length: Math.ceil(visibleDuration / 60) + 1 }).map((_, i) => {
                const markerTime = Math.floor(visibleStartTime / 60) * 60 + (i * 60);
                if (markerTime <= duration && isTimeVisible(markerTime)) {
                  return (
                    <div 
                      key={`marker-${markerTime}`}
                      className="absolute left-0 right-0 h-px bg-gray-200 pointer-events-none flex items-center"
                      style={{ top: getTimePosition(markerTime) }}
                    >
                      <span className="ml-12 text-xs text-gray-500">
                        {formatTime(markerTime)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}

              {/* Section Indicators */}
              {getVisibleSections().map(section => {
                // Calculate section position and height
                const sectionTopTime = Math.max(section.startTime, visibleStartTime);
                const sectionBottomTime = Math.min(section.endTime, visibleStartTime + visibleDuration);
                
                const sectionTop = getTimePosition(sectionTopTime);
                const sectionBottom = getTimePosition(sectionBottomTime);
                const sectionHeight = Math.max(0, parseInt(sectionBottom) - parseInt(sectionTop));

                if (sectionHeight <= 0) return null;

                const isActive = section.id === activeSection;

                return (
                  <div key={`section-container-${section.id}`}>
                    <div 
                      key={`indicator-${section.id}`}
                      className={`absolute left-1/2 -translate-x-1/2 ml-10 w-8 bg-secondary hover:bg-secondary-foreground transition-colors cursor-pointer section-indicator z-20 rounded-sm
                        ${isActive ? 'bg-primary' : 'opacity-70'}`}
                      style={{ 
                        top: getTimePosition(section.startTime), 
                        height: `${Math.abs(
                          parseInt(getTimePosition(section.endTime)) - 
                          parseInt(getTimePosition(section.startTime))
                        )}px`,
                        borderWidth: '2px',
                        borderColor: isActive ? 'var(--primary)' : 'transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent timeline click
                        handleSectionClick(section.id);
                      }}
                      title={`${section.title} (${formatTime(section.startTime)} - ${formatTime(section.endTime)}) - Click to view timestamps`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-full bg-white/20"></div>
                      </div>
                    </div>
                    
                    {/* Section Resize Handles - Only show when section is active */}
                    {isActive && isTimeVisible(section.startTime) && (
                      <div 
                        className="absolute left-2 right-2 h-6 -mt-3 bg-transparent cursor-ns-resize z-40 section-resize-handle"
                        style={{ top: getTimePosition(section.startTime) }}
                        onMouseDown={(e) => handleSectionResizeStart(e, section.id, 'start')}
                        title="Drag to adjust section start"
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto w-6 h-6 rounded-full bg-primary/90 border-2 border-white flex items-center justify-center animate-pulse">
                          <MoveVertical className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {isActive && isTimeVisible(section.endTime) && (
                      <div 
                        className="absolute left-2 right-2 h-6 -mt-3 bg-transparent cursor-ns-resize z-40 section-resize-handle"
                        style={{ top: getTimePosition(section.endTime) }}
                        onMouseDown={(e) => handleSectionResizeStart(e, section.id, 'end')}
                        title="Drag to adjust section end"
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto w-6 h-6 rounded-full bg-primary/90 border-2 border-white flex items-center justify-center animate-pulse">
                          <MoveVertical className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Annotations (including section annotations when section is active) */}
              {getVisibleAnnotations().map(annotation => {
                const isInSelection = 
                  selectionStart !== null && 
                  selectionEnd !== null && 
                  annotation.timestamp >= Math.min(selectionStart, selectionEnd) && 
                  annotation.timestamp <= Math.max(selectionStart, selectionEnd);
                
                const isNew = newAnnotationId === annotation.id;
                const isDragging = draggedTimestamp === annotation.id;
                const isInActiveSection = isTimestampInActiveSection(annotation.id);
                const isSnapped = snappedToTimestamp === annotation.id;

                // Determine the appearance based on whether this timestamp is part of the active section
                const bgColor = isInActiveSection 
                  ? (isInSelection ? '#3B82F6' : '#10b981') // Green for section timestamps
                  : (isInSelection ? '#3B82F6' : '#EF4444'); // Red for regular timestamps

                return (
                  <div 
                    key={annotation.id}
                    className="absolute w-full"
                    style={{ top: getTimePosition(annotation.timestamp) }}
                  >
                    {/* Timestamp marker on the line */}
                    <motion.div 
                      className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 -translate-y-1/2 rounded-full flex items-center justify-center z-20 timestamp-marker group
                        ${selectedTimestamp === annotation.id ? 'ring-2 ring-primary' : ''}
                        ${isDragging ? 'cursor-grabbing scale-110 ring-2 ring-primary' : 'cursor-grab hover:scale-105'}
                        ${isInActiveSection ? 'ml-8' : ''}
                        ${isSnapped ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white' : ''}`}
                      style={{ 
                        backgroundColor: bgColor,
                        border: '2px solid white'
                      }}
                      onMouseDown={(e) => {
                        if (!isSelectionMode) {
                          // Only handle left clicks for dragging
                          if (e.button === 0) {
                            handleTimestampDragStart(e, annotation.id, annotation.timestamp);
                          }
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent timeline click
                        if (!isDraggingTimestamp) {
                          setSelectedTimestamp(prev => prev === annotation.id ? null : annotation.id);
                          onJumpToTimestamp(annotation.timestamp);
                          // Don't clear active section when selecting a timestamp that belongs to it
                          if (!isInActiveSection) {
                            setActiveSection(null);
                            // Disable looping when clearing active section
                            if (isLooping && toggleLooping) {
                              toggleLooping();
                            }
                          }
                        }
                      }}
                      title={`${formatTime(annotation.timestamp)} - ${isInActiveSection ? 'Section timestamp' : 'Timestamp'} - Click to select, drag to move`}
                      initial={isNew ? { scale: 0, opacity: 0 } : false}
                      animate={isNew ? { scale: 1.2, opacity: 1 } : false}
                      transition={isNew ? { 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 15 
                      } : undefined}
                      whileHover={{ scale: isDragging ? 1.1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {!isSelectionMode && (
                        <Move 
                          className={`w-3 h-3 text-white ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}
                        />
                      )}
                    </motion.div>

                    {/* Connecting line to section (only for section timestamps) */}
                    {isInActiveSection && (
                      <div 
                        className="absolute left-1/2 right-0 h-0.5 bg-emerald-500/30 z-15 pointer-events-none"
                        style={{ width: '24px' }}
                      />
                    )}

                    {/* Ripple effect for new annotations */}
                    {isNew && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 pointer-events-none"
                        initial={{ width: '6px', height: '6px', opacity: 0.7 }}
                        animate={{ width: '50px', height: '50px', opacity: 0 }}
                        transition={{ duration: 0.8 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Panel - Shows Section or Timestamp Details */}
        {(activeSection || selectedTimestamp) && (
          <div className="border-t bg-white p-4 h-1/3 overflow-y-auto">
            {/* Section Detail Panel */}
            {activeSection && sections.map(section => {
              if (section.id !== activeSection) return null;
              
              const sectionAnnotations = annotations
                .filter(a => section.timestampIds.includes(a.id))
                .sort((a, b) => a.timestamp - b.timestamp);
              
              return (
                <div key={`section-detail-${section.id}`} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center">
                      <div className="w-3 h-3 bg-primary rounded-sm mr-2"></div>
                      
                      {/* Editable Section Title */}
                      {editingSectionId === section.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={sectionTitleInputRef}
                            value={sectionTitleDraft}
                            onChange={(e) => setSectionTitleDraft(e.target.value)}
                            onKeyDown={handleTitleKeyPress}
                            className="h-8 py-1 font-medium min-w-[200px]"
                            placeholder="Enter section title..."
                            autoFocus
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7" 
                            onClick={handleSaveSectionTitle}
                          >
                            <Save className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7" 
                            onClick={handleCancelEditingTitle}
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{section.title}</span>
                          {onUpdateSectionTitle && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6" 
                              onClick={() => handleStartEditingTitle(section.id)}
                            >
                              <Pencil className="w-3 h-3 text-gray-500" />
                            </Button>
                          )}
                          <span className="text-sm text-gray-500 ml-1">
                            ({formatTime(section.startTime)} - {formatTime(section.endTime)})
                          </span>
                        </div>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      {toggleLooping && (
                        <Button
                          onClick={() => {
                            if (onSetLoopSelection) onSetLoopSelection(section.startTime, section.endTime, section.id);
                            if (!isLooping && toggleLooping) toggleLooping();
                          }}
                          variant={isLooping ? "default" : "outline"}
                          size="sm"
                          className={`flex items-center gap-1 ${isLooping ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          <Repeat className="w-4 h-4" />
                          {isLooping ? "Looping" : "Loop Section"}
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          onDeleteSection(section.id);
                          setActiveSection(null);
                          // Disable looping when deleting a section
                          if (isLooping && toggleLooping) {
                            toggleLooping();
                          }
                        }}
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        size="sm"
                      >
                        Delete Section
                      </Button>
                    </div>
                  </div>
                  
                  {/* Section resizing instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-700 flex items-center">
                    <MoveVertical className="w-4 h-4 mr-1 text-blue-500" />
                    <span>
                      You can resize this section by dragging the handles that appear at the start and end points on the timeline.
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionAnnotations.map(annotation => (
                      <div 
                        key={`section-annotation-${annotation.id}`}
                        className={`bg-gray-100 rounded-lg overflow-hidden border ${selectedTimestamp === annotation.id ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="bg-gray-200 p-2 flex items-center justify-between">
                          <button
                            onClick={() => onJumpToTimestamp(annotation.timestamp)}
                            className="font-medium text-primary flex items-center"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            {formatTime(annotation.timestamp)}
                          </button>
                          <Button
                            onClick={() => onDeleteAnnotation(annotation.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-gray-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {annotation.transcriptBefore && (
                          <div className="p-3 text-gray-700 text-sm border-b border-gray-200">
                            {annotation.transcriptBefore && (
                              <p>...{annotation.transcriptBefore}</p>
                            )}
                            <p className="font-medium my-1">► TIMESTAMP</p>
                            {annotation.transcriptAfter && (
                              <p>{annotation.transcriptAfter}...</p>
                            )}
                          </div>
                        )}
                        
                        <div className="p-3">
                          {annotation.id in commentDraft || !annotation.comment ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Add a comment..."
                                value={commentDraft[annotation.id] || annotation.comment || ''}
                                onChange={(e) => handleCommentChange(annotation.id, e.target.value)}
                                rows={2}
                                className="bg-white"
                              />
                              <div className="flex justify-end">
                                <Button 
                                  onClick={() => handleCommentSave(annotation.id)}
                                  size="sm"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="p-2 cursor-pointer bg-white rounded" 
                              onClick={() => handleCommentChange(annotation.id, annotation.comment)}
                            >
                              {annotation.comment || (
                                <span className="text-muted-foreground italic">Add a comment...</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Timestamp Detail Panel */}
            {selectedTimestamp && annotations.map(annotation => {
              if (annotation.id !== selectedTimestamp) return null;
              
              // Check if this timestamp belongs to a section
              const section = getTimestampSection(annotation.id);
              
              return (
                <div key={`timestamp-detail-${annotation.id}`} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center">
                      <div className={`w-3 h-3 rounded-sm mr-2 ${section ? 'bg-emerald-500' : 'bg-destructive'}`}></div>
                      Timestamp at {formatTime(annotation.timestamp)}
                      {section && (
                        <span className="ml-2 text-sm bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                          Part of "{section.title}"
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onJumpToTimestamp(annotation.timestamp)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Play
                      </Button>
                      <Button
                        onClick={() => {
                          onDeleteAnnotation(annotation.id);
                          setSelectedTimestamp(null);
                        }}
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        size="sm"
                      >
                        Delete Timestamp
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg overflow-hidden border">
                    {annotation.transcriptBefore && (
                      <div className="bg-gray-200 p-4 text-gray-700 text-sm border-b border-gray-200">
                        <h4 className="font-medium mb-2">Transcript Context</h4>
                        {annotation.transcriptBefore && (
                          <p>...{annotation.transcriptBefore}</p>
                        )}
                        <p className="font-medium my-2 text-primary">► TIMESTAMP</p>
                        {annotation.transcriptAfter && (
                          <p>{annotation.transcriptAfter}...</p>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h4 className="font-medium mb-2">Comments</h4>
                      {annotation.id in commentDraft || !annotation.comment ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add a comment..."
                            value={commentDraft[annotation.id] || annotation.comment || ''}
                            onChange={(e) => handleCommentChange(annotation.id, e.target.value)}
                            rows={3}
                            className="bg-white"
                          />
                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handleCommentSave(annotation.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="p-3 cursor-pointer bg-white rounded border" 
                          onClick={() => handleCommentChange(annotation.id, annotation.comment)}
                        >
                          {annotation.comment || (
                            <span className="text-muted-foreground italic">Add a comment...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}