import { useState } from "react";
import { Timeline } from "./Timeline";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TimestampAnnotation, VideoSection } from "./VerticalTimeline";

interface ToggleableHorizontalTimelineProps {
  currentTime: number;
  duration: number;
  annotations: TimestampAnnotation[];
  sections: VideoSection[];
  onSeek: (time: number) => void;
  isLooping?: boolean;
  loopRange?: {start: number, end: number} | null;
}

export function ToggleableHorizontalTimeline(props: ToggleableHorizontalTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="w-full border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full py-1 flex justify-center items-center" 
          onClick={() => setIsExpanded(true)}
        >
          <ChevronDown className="w-4 h-4 mr-1" />
          Show Simple Timeline
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full border-t">
      <div className="flex justify-between items-center px-4 py-1 border-b bg-gray-50">
        <h3 className="text-sm font-medium">Simple Timeline</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(false)}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
      
      <Timeline {...props} />
    </div>
  );
}