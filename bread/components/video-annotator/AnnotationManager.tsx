import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Clock,
  MapPin,
  MoreHorizontal
} from 'lucide-react';

export interface VideoAnnotation {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  type: 'marker' | 'range';
}

export interface AnnotationManagerProps {
  annotations: VideoAnnotation[];
  currentTime: number;
  videoDuration: number;
  onAnnotationsChange: (annotations: VideoAnnotation[]) => void;
  onSeekTo: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

// Helper to format time in MM:SS or HH:MM:SS format
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function AnnotationManager({
  annotations = [], // Default to empty array
  currentTime,
  videoDuration,
  onAnnotationsChange,
  onSeekTo,
  isPlaying,
  onPlayPause
}: AnnotationManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleAddMarker = () => {
    const newAnnotation: VideoAnnotation = {
      id: crypto.randomUUID(),
      title: `Step ${annotations.length + 1}`,
      description: 'Add description...',
      startTime: currentTime,
      endTime: currentTime,
      type: 'marker'
    };

    onAnnotationsChange([...annotations, newAnnotation]);
  };

  const handleAddRange = () => {
    const endTime = Math.min(currentTime + 30, videoDuration); // 30 seconds or end of video
    const newAnnotation: VideoAnnotation = {
      id: crypto.randomUUID(),
      title: `Step ${annotations.length + 1}`,
      description: 'Add description...',
      startTime: currentTime,
      endTime: endTime,
      type: 'range'
    };

    onAnnotationsChange([...annotations, newAnnotation]);
  };

  const handleStartEdit = (annotation: VideoAnnotation) => {
    setEditingId(annotation.id);
    setEditTitle(annotation.title);
    setEditDescription(annotation.description);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedAnnotations = annotations.map(annotation =>
      annotation.id === editingId
        ? { ...annotation, title: editTitle, description: editDescription }
        : annotation
    );

    onAnnotationsChange(updatedAnnotations);
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleDelete = (id: string) => {
    const updatedAnnotations = annotations.filter(annotation => annotation.id !== id);
    onAnnotationsChange(updatedAnnotations);
  };

  const handleSeekToAnnotation = (time: number) => {
    onSeekTo(time);
  };

  // Sort annotations by start time
  const sortedAnnotations = [...annotations].sort((a, b) => a.startTime - b.startTime);

  return (
    <Card className="card-cozy h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recipe Steps</span>
          <Badge variant="outline" className="bg-dusty-rose/20 text-dusty-rose">
            {annotations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Annotation Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Current: {formatTime(currentTime)}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={handleAddMarker} 
              variant="outline"
              className="btn-secondary text-sm"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Add Step Marker
            </Button>
            
            <Button 
              onClick={handleAddRange} 
              variant="outline"
              className="border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-cloud-white text-sm"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Add Time Range
            </Button>
          </div>
        </div>

        <Separator />

        {/* Annotations List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedAnnotations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">
                No recipe steps added yet.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Click "Add Step Marker" to mark important moments in the video.
              </p>
            </div>
          ) : (
            sortedAnnotations.map((annotation, index) => (
              <Card key={annotation.id} className="p-3 bg-warm-beige/30">
                {editingId === annotation.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Step title..."
                      className="input-cozy text-sm"
                    />
                    
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Step description..."
                      className="input-cozy text-sm min-h-[60px]"
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveEdit}
                        size="sm"
                        className="btn-primary text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-deep-olive rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-cloud-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{annotation.title}</h4>
                          <button
                            onClick={() => handleSeekToAnnotation(annotation.startTime)}
                            className="text-xs text-deep-olive hover:underline"
                          >
                            {formatTime(annotation.startTime)}
                            {annotation.type === 'range' && ` - ${formatTime(annotation.endTime)}`}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleStartEdit(annotation)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          onClick={() => handleDelete(annotation.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-secondary">{annotation.description}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          annotation.type === 'marker' 
                            ? 'bg-deep-olive/20 text-deep-olive' 
                            : 'bg-dusty-rose/20 text-dusty-rose'
                        }`}
                      >
                        {annotation.type === 'marker' ? 'Marker' : 'Range'}
                      </Badge>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
        
        {/* Video Controls */}
        {annotations.length > 0 && (
          <>
            <Separator />
            
            <div className="flex items-center justify-between">
              <Button
                onClick={onPlayPause}
                variant="outline"
                size="sm"
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
              
              <div className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}