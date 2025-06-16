
import { Button } from "./ui/button";
import { formatTime } from "../utils/time";

export interface Section {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
}

interface SectionManagerProps {
  currentTime: number;
  sections: Section[];
  onCreateSection: (startTime: number, endTime: number) => void;
  onJumpToSection: (startTime: number) => void;
  onDeleteSection: (id: string) => void;
  onSetStartTime: (time: number) => void;
  onSetEndTime: (time: number) => void;
  startTimeMarker: number | null;
  endTimeMarker: number | null;
}

export function SectionManager({
  currentTime,
  sections,
  onCreateSection,
  onJumpToSection,
  onDeleteSection,
  onSetStartTime,
  onSetEndTime,
  startTimeMarker,
  endTimeMarker,
}: SectionManagerProps) {
  const handleSetStartTime = () => {
    onSetStartTime(currentTime);
  };

  const handleSetEndTime = () => {
    onSetEndTime(currentTime);
  };

  const handleCreateSection = () => {
    if (startTimeMarker !== null && endTimeMarker !== null && startTimeMarker < endTimeMarker) {
      onCreateSection(startTimeMarker, endTimeMarker);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3>Create Section</h3>
        <div className="flex space-x-2">
          <Button onClick={handleSetStartTime} variant="outline">
            Set Start: {startTimeMarker !== null ? formatTime(startTimeMarker) : "Not set"}
          </Button>
          <Button onClick={handleSetEndTime} variant="outline">
            Set End: {endTimeMarker !== null ? formatTime(endTimeMarker) : "Not set"}
          </Button>
          <Button
            onClick={handleCreateSection}
            disabled={startTimeMarker === null || endTimeMarker === null || startTimeMarker >= endTimeMarker}
          >
            Create Section
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3>Sections</h3>
        {sections.length === 0 ? (
          <p className="text-muted-foreground">No sections defined</p>
        ) : (
          <ul className="space-y-2">
            {sections.map((section) => (
              <li
                key={section.id}
                className="flex items-center justify-between p-2 bg-secondary rounded-md"
              >
                <div>
                  <button
                    onClick={() => onJumpToSection(section.startTime)}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                  </button>
                  <span className="mx-2">-</span>
                  <span>{section.title}</span>
                </div>
                <Button
                  onClick={() => onDeleteSection(section.id)}
                  variant="ghost"
                  size="sm"
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
