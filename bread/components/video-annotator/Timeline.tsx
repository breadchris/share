import { useState, useEffect, useRef } from "react";
import { formatTime } from "../utils/time";
import { TimestampAnnotation, VideoSection } from "./VerticalTimeline";
import { Repeat } from "lucide-react";

interface TimelineProps {
  currentTime: number;
  duration: number;
  annotations: TimestampAnnotation[];
  sections: VideoSection[];
  onSeek: (time: number) => void;
  isLooping?: boolean;
  loopRange?: { start: number; end: number } | null;
}

export function Timeline({ 
  currentTime, 
  duration, 
  annotations, 
  sections,
  onSeek,
  isLooping = false,
  loopRange = null
}: TimelineProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Update progress bar position
  useEffect(() => {
    if (progressRef.current && duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      progressRef.current.style.width = `${progressPercent}%`;
    }
  }, [currentTime, duration]);

  // Handle timeline hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;
    
    setHoverTime(time);
    setIsHovering(true);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;
    
    onSeek(time);
  };

  return (
    <div className="mt-4 py-2">
      <div
        ref={timelineRef}
        className="relative h-12 bg-gray-200 rounded-lg cursor-pointer overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gray-200" />
        
        {/* Loop range indicator */}
        {isLooping && loopRange && (
          <div 
            className="absolute h-full bg-green-100 flex items-center justify-end"
            style={{ 
              left: `${(loopRange.start / duration) * 100}%`,
              width: `${((loopRange.end - loopRange.start) / duration) * 100}%`
            }}
          >
            <div className="mr-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center shadow-sm">
              <Repeat className="w-3 h-3 mr-0.5" /> Loop
            </div>
          </div>
        )}
        
        {/* Section indicators */}
        {sections.map(section => (
          <div
            key={section.id}
            className="absolute h-full bg-gray-300 bg-opacity-50 border-l border-r border-gray-400"
            style={{
              left: `${(section.startTime / duration) * 100}%`,
              width: `${((section.endTime - section.startTime) / duration) * 100}%`
            }}
          >
            <div className="absolute bottom-0 left-0 right-0 text-center text-xs py-1 truncate">
              {section.title}
            </div>
          </div>
        ))}
        
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="absolute h-full bg-blue-500 bg-opacity-30"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Hover indicator */}
        {isHovering && (
          <div
            className="absolute h-full w-0.5 bg-white"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-black text-white text-xs px-1 py-0.5 rounded">
              {formatTime(hoverTime)}
            </div>
          </div>
        )}
        
        {/* Current time marker */}
        <div
          className="absolute h-full w-0.5 bg-blue-600"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute -top-6 -translate-x-1/2 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
            {formatTime(currentTime)}
          </div>
        </div>
        
        {/* Timestamp markers */}
        {annotations.map(annotation => (
          <div
            key={annotation.id}
            className="absolute bottom-0 w-1 h-4 bg-red-500 -translate-x-1/2 hover:h-8 transition-all duration-200"
            style={{ left: `${(annotation.timestamp / duration) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(annotation.timestamp);
            }}
            title={formatTime(annotation.timestamp)}
          />
        ))}
      </div>
    </div>
  );
}