import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { VideoSection } from "./VerticalTimeline";
import { formatTime } from "../utils/time";
import { Pencil, Save, X, Repeat, Trash2, PlayCircle, MoveHorizontal } from "lucide-react";
import { Switch } from "./ui/switch";

interface SectionEditorProps {
  activeSection: VideoSection | null;
  isLooping: boolean;
  onUpdateSectionTitle: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onJumpToTimestamp: (timestamp: number) => void;
  onSetLoopSelection: (startTime: number, endTime: number, sectionId?: string) => void;
  toggleLooping: () => void;
  onClose: () => void;
}

export function SectionEditor({
  activeSection,
  isLooping,
  onUpdateSectionTitle,
  onDeleteSection,
  onJumpToTimestamp,
  onSetLoopSelection,
  toggleLooping,
  onClose
}: SectionEditorProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize title when section changes
  useEffect(() => {
    if (activeSection) {
      setTitleDraft(activeSection.title);
    }
  }, [activeSection?.id]);

  // Focus on input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  if (!activeSection) return null;

  const handleStartEditing = () => {
    setEditingTitle(true);
    setTitleDraft(activeSection.title);
  };

  const handleSaveTitle = () => {
    const trimmedTitle = titleDraft.trim();
    if (trimmedTitle.length === 0) {
      // Default title if empty
      const sectionIndex = activeSection.id.slice(-4); // Just use part of the ID as a number
      onUpdateSectionTitle(activeSection.id, `Section ${sectionIndex}`);
    } else {
      onUpdateSectionTitle(activeSection.id, trimmedTitle);
    }
    setEditingTitle(false);
  };

  const handleCancelEditing = () => {
    setEditingTitle(false);
    setTitleDraft(activeSection.title);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  const handleToggleLoop = () => {
    if (isLooping) {
      toggleLooping(); // Turn off looping
    } else {
      // Turn on looping and set the section as the loop range
      onSetLoopSelection(activeSection.startTime, activeSection.endTime, activeSection.id);
      toggleLooping();
    }
  };

  const handleDeleteSection = () => {
    if (window.confirm(`Are you sure you want to delete the section "${activeSection.title}"?`)) {
      onDeleteSection(activeSection.id);
      onClose();
    }
  };

  const handleJumpToStart = () => {
    onJumpToTimestamp(activeSection.startTime);
  };

  return (
    <div className="bg-secondary/20 px-4 py-3 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-9 min-w-[250px] font-medium"
                placeholder="Enter section title..."
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={handleSaveTitle}
                title="Save title"
              >
                <Save className="w-4 h-4 text-green-600" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={handleCancelEditing}
                title="Cancel editing"
              >
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{activeSection.title}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleStartEditing}
                  title="Rename section"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(activeSection.startTime)} - {formatTime(activeSection.endTime)}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleJumpToStart}
            title="Jump to section start"
          >
            <PlayCircle className="w-4 h-4" />
            Play Section
          </Button>
          
          <div className="flex items-center gap-1.5">
            <Switch
              id="section-loop-mode"
              checked={isLooping}
              onCheckedChange={handleToggleLoop}
            />
            <label 
              htmlFor="section-loop-mode" 
              className={`text-sm flex items-center ${isLooping ? 'text-green-700 font-medium' : 'text-gray-600'}`}
            >
              <Repeat className={`w-4 h-4 mr-1 ${isLooping ? 'text-green-600' : ''}`} /> 
              {isLooping ? "Looping" : "Loop Section"}
            </label>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDeleteSection}
            title="Delete this section"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onClose}
            title="Close section editor"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 bg-blue-50 rounded p-1.5 text-xs text-blue-700 flex items-center gap-2">
        <div className="flex items-center">
          <MoveHorizontal className="w-3.5 h-3.5 mr-1 text-blue-500 flex-shrink-0" />
          <span>Resize this section by dragging the handles on the timeline</span>
        </div>
      </div>
    </div>
  );
}