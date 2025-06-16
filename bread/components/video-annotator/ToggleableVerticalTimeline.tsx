import { useState } from "react";
import { VerticalTimeline, TimestampAnnotation, VideoSection } from "./VerticalTimeline";
import { Button } from "./ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Card } from "./ui/card";

interface ToggleableVerticalTimelineProps {
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

export function ToggleableVerticalTimeline(props: ToggleableVerticalTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30">
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-l-lg rounded-r-none h-32 shadow-lg"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span className="rotate-90">Advanced Timeline</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 z-30 w-[600px] max-w-full shadow-xl bg-white flex flex-col border-l">
      <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
        <h3 className="font-medium">Advanced Timeline</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(false)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <VerticalTimeline {...props} />
      </div>
    </div>
  );
}