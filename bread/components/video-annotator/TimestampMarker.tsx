
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { formatTime } from "../utils/time";

export interface Annotation {
  id: string;
  timestamp: number;
  description: string;
}

interface TimestampMarkerProps {
  currentTime: number;
  annotations: Annotation[];
  onAddAnnotation: (description: string, timestamp: number) => void;
  onJumpToTimestamp: (timestamp: number) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function TimestampMarker({
  currentTime,
  annotations,
  onAddAnnotation,
  onJumpToTimestamp,
  onDeleteAnnotation,
}: TimestampMarkerProps) {
  const [description, setDescription] = useState("");

  const handleAddAnnotation = () => {
    if (description.trim()) {
      onAddAnnotation(description, currentTime);
      setDescription("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add annotation at current timestamp..."
          className="flex-1"
        />
        <Button onClick={handleAddAnnotation} variant="default">
          Add at {formatTime(currentTime)}
        </Button>
      </div>

      <div className="space-y-2">
        <h3>Annotations</h3>
        {annotations.length === 0 ? (
          <p className="text-muted-foreground">No annotations yet</p>
        ) : (
          <ul className="space-y-2">
            {annotations.map((annotation) => (
              <li
                key={annotation.id}
                className="flex items-center justify-between p-2 bg-accent rounded-md"
              >
                <div>
                  <button
                    onClick={() => onJumpToTimestamp(annotation.timestamp)}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {formatTime(annotation.timestamp)}
                  </button>
                  <span className="mx-2">-</span>
                  <span>{annotation.description}</span>
                </div>
                <Button
                  onClick={() => onDeleteAnnotation(annotation.id)}
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
