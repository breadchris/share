import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Video, 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Clock,
  ChefHat,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Repeat,
  StopCircle,
  PlayCircle
} from 'lucide-react';
import { VideoPlayer } from '../video-annotator/VideoPlayer';
import { VideoUrlInput } from '../video-annotator/VideoUrlInput';
import { VideoAnnotation } from '../video-annotator/AnnotationManager';
import { BreadRecipe, BreadStep, Ingredient } from '../BreadTypes';
import { formatTime } from '../../utils/time';

export interface YouTubeRecipeImporterProps {
  onRecipeCreated?: (recipe: BreadRecipe) => void;
  onBack?: () => void;
  onComplete?: (recipe: Partial<BreadRecipe>) => void;
  onCancel?: () => void;
}

interface RecipeAnnotation extends VideoAnnotation {
  stepIngredients?: string[];
  stepNotes?: string;
}

export function YouTubeRecipeImporter({ onRecipeCreated, onBack, onComplete, onCancel }: YouTubeRecipeImporterProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [annotations, setAnnotations] = useState<RecipeAnnotation[]>([]);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'video' | 'annotate' | 'review'>('video');
  
  // Video controls - removed unused snap/loop controls
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  
  // Annotation creation state
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [pendingStartTime, setPendingStartTime] = useState<number | null>(null);
  
  // Simplified step looping state
  const [loopingStepId, setLoopingStepId] = useState<string | null>(null);
  const [loopingAnnotation, setLoopingAnnotation] = useState<RecipeAnnotation | null>(null);
  const [lastLoopTime, setLastLoopTime] = useState<number>(-1); // Track video time when we last looped
  
  // Recipe metadata
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<string>('');

  const timelineRef = useRef<HTMLDivElement>(null);

  const handleVideoLoad = useCallback((url: string) => {
    setVideoUrl(url);
    setCurrentStep('annotate');
    
    // Try to extract recipe name from YouTube title (simplified)
    const urlMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (urlMatch) {
      setRecipeName('Recipe from YouTube Video');
    }
  }, []);

  // Simplified and more reliable loop logic
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Handle looping logic - simplified for reliability
    if (loopingAnnotation && loopingStepId && isPlaying) {
      const endTime = loopingAnnotation.endTime || loopingAnnotation.startTime;
      const startTime = loopingAnnotation.startTime;
      
      // Check if we need to loop back
      // Use a small buffer to prevent edge cases and ensure we don't loop repeatedly on the same time
      if (time >= endTime && time !== lastLoopTime) {
        console.log(`🔄 Loop triggered: time=${time.toFixed(2)}, end=${endTime.toFixed(2)}, start=${startTime.toFixed(2)}`);
        setSeekToTime(startTime);
        setLastLoopTime(time); // Remember this time to prevent repeated loops
        return;
      }
      
      // Reset loop tracking if we're before the end time (allows for new loops)
      if (time < endTime - 1) {
        setLastLoopTime(-1);
      }
    }
    
    // Clear seekTo after time update, but be more permissive for looping
    if (seekToTime !== null && Math.abs(time - seekToTime) < 0.5) {
      setSeekToTime(null);
    }
  }, [seekToTime, loopingStepId, loopingAnnotation, lastLoopTime, isPlaying]);

  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
    // Set initial buffered to duration for mock purposes
    setBuffered(dur * 0.8); // Simulate 80% buffered
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleSeekTo = useCallback((time: number) => {
    console.log(`🎯 Manual seek to: ${time.toFixed(2)}`);
    setSeekToTime(time);
    setCurrentTime(time);
    // Reset loop tracking when manually seeking
    setLastLoopTime(-1);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Timeline interaction handlers
  const getTimeFromPosition = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  // NEW: Get time from position within an annotation range
  const getTimeFromPositionInAnnotation = useCallback((clientX: number, annotation: RecipeAnnotation): number => {
    if (!timelineRef.current) return annotation.startTime;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const timelineWidth = rect.width;
    
    // Calculate the start and end positions of the annotation in pixels
    const startPosition = ((annotation.startTime || 0) / duration) * timelineWidth;
    const endPosition = ((annotation.endTime || annotation.startTime || 0) / duration) * timelineWidth;
    
    // Calculate the relative position within the annotation
    const relativeX = Math.max(0, Math.min(endPosition - startPosition, x - startPosition));
    const relativePercentage = (endPosition - startPosition) > 0 ? relativeX / (endPosition - startPosition) : 0;
    
    // Calculate the exact time within the annotation range
    const annotationDuration = (annotation.endTime || annotation.startTime) - annotation.startTime;
    const targetTime = annotation.startTime + (relativePercentage * annotationDuration);
    
    return Math.max(annotation.startTime, Math.min(annotation.endTime || annotation.startTime, targetTime));
  }, [duration]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const clickTime = getTimeFromPosition(e.clientX);
    handleSeekTo(clickTime);
  }, [getTimeFromPosition, handleSeekTo]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      const time = getTimeFromPosition(e.clientX);
      setHoverTime(time);
    }
  }, [getTimeFromPosition, isDragging]);

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Add new annotation - start with creating a new step
  const handleAddAnnotation = useCallback(() => {
    const newAnnotation: RecipeAnnotation = {
      id: crypto.randomUUID(),
      title: `Step ${annotations.length + 1}`,
      description: 'Add description...',
      startTime: currentTime,
      endTime: currentTime + 30, // Default 30 second duration
      type: 'range'
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setEditingAnnotation(newAnnotation.id);
  }, [annotations.length, currentTime]);

  // Set start time for annotation
  const handleSetStartTime = useCallback((id: string) => {
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === id 
        ? { ...annotation, startTime: currentTime }
        : annotation
    ));
    setPendingStartTime(currentTime);
    
    // Update looping annotation if this is the one being looped
    if (loopingStepId === id) {
      setLoopingAnnotation(prev => prev ? { ...prev, startTime: currentTime } : null);
    }
  }, [currentTime, loopingStepId]);

  // Set end time for annotation
  const handleSetEndTime = useCallback((id: string) => {
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === id 
        ? { ...annotation, endTime: currentTime }
        : annotation
    ));
    setPendingStartTime(null);
    
    // Update looping annotation if this is the one being looped
    if (loopingStepId === id) {
      setLoopingAnnotation(prev => prev ? { ...prev, endTime: currentTime } : null);
    }
  }, [currentTime, loopingStepId]);

  // Simplified loop step functionality
  const handleLoopStep = useCallback((annotation: RecipeAnnotation) => {
    if (loopingStepId === annotation.id) {
      // Stop looping
      console.log('⏹️ Stopping loop');
      setLoopingStepId(null);
      setLoopingAnnotation(null);
      setLastLoopTime(-1);
      return;
    }

    // Start looping this step
    console.log(`▶️ Starting loop for: ${annotation.title} (${formatTime(annotation.startTime)} - ${formatTime(annotation.endTime || annotation.startTime)})`);
    setLoopingStepId(annotation.id);
    setLoopingAnnotation(annotation);
    setLastLoopTime(-1); // Reset loop tracking
    
    // Seek to start of the step
    handleSeekTo(annotation.startTime);
  }, [loopingStepId, handleSeekTo]);

  // Clean up looping when component unmounts
  useEffect(() => {
    return () => {
      setLoopingStepId(null);
      setLoopingAnnotation(null);
      setLastLoopTime(-1);
    };
  }, []);

  // Update annotation
  const handleUpdateAnnotation = useCallback((id: string, updates: Partial<RecipeAnnotation>) => {
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === id ? { ...annotation, ...updates } : annotation
    ));
    
    // Update looping annotation if this is the one being looped
    if (loopingStepId === id) {
      setLoopingAnnotation(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [loopingStepId]);

  // Delete annotation
  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
    if (editingAnnotation === id) {
      setEditingAnnotation(null);
    }
    // Stop looping if this step was being looped
    if (loopingStepId === id) {
      setLoopingStepId(null);
      setLoopingAnnotation(null);
      setLastLoopTime(-1);
    }
  }, [editingAnnotation, loopingStepId]);

  // Calculate positions
  const currentPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPosition = duration > 0 ? (buffered / duration) * 100 : 0;

  const createRecipeFromAnnotations = useCallback(() => {
    // Sort annotations by time
    const sortedAnnotations = [...annotations].sort((a, b) => a.startTime - b.startTime);
    
    // Convert annotations to recipe steps
    const steps: BreadStep[] = sortedAnnotations.map((annotation, index) => {
      const duration = annotation.endTime 
        ? Math.round((annotation.endTime - annotation.startTime) / 60) // Convert to minutes
        : 5; // Default 5 minutes if no end time
      
      return {
        id: `step-${index + 1}`,
        title: annotation.title || `Step ${index + 1}`,
        instruction: annotation.description || 'Follow along with the video.',
        duration: Math.max(1, duration), // At least 1 minute
        temperature: undefined,
        equipment: []
      };
    });

    // Parse ingredients from the ingredients text area
    const ingredients: Ingredient[] = recipeIngredients
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => {
        // Try to parse "amount unit ingredient" format
        const match = line.trim().match(/^(\d+(?:\.\d+)?)\s*(\w+)\s+(.+)$/);
        if (match) {
          return {
            id: `ingredient-${index + 1}`,
            item: match[3].trim(),
            amount: match[1],
            unit: match[2]
          };
        } else {
          // If parsing fails, just use the whole line as ingredient name
          return {
            id: `ingredient-${index + 1}`,
            item: line.trim(),
            amount: '',
            unit: ''
          };
        }
      });

    // Calculate total time (sum of all step durations)
    const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);

    const recipe: Partial<BreadRecipe> = {
      name: recipeName || 'Imported Recipe',
      description: recipeDescription || 'Recipe imported from YouTube video',
      difficulty: 'Intermediate', // Default difficulty
      prepTime: 30, // Default prep time
      totalTime,
      servings: 1,
      ingredients,
      steps,
      tags: ['imported', 'video-recipe'],
      imageUrl: '', // Will be filled in the form
      // Store video URL for reference
      sourceVideoUrl: videoUrl
    };

    return recipe;
  }, [annotations, recipeName, recipeDescription, recipeIngredients, videoUrl]);

  const handleCompleteImport = () => {
    const recipe = createRecipeFromAnnotations();
    
    if (onRecipeCreated) {
      // Convert to full BreadRecipe type with required fields
      const fullRecipe: BreadRecipe = {
        id: crypto.randomUUID(),
        name: recipe.name || 'Imported Recipe',
        description: recipe.description || 'Recipe imported from YouTube video',
        difficulty: recipe.difficulty || 'Intermediate',
        prepTime: recipe.prepTime || 30,
        totalTime: recipe.totalTime || 60,
        servings: recipe.servings || 1,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tags: recipe.tags || ['imported', 'video-recipe'],
        imageUrl: recipe.imageUrl || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop',
        createdAt: new Date(),
        updatedAt: new Date(),
        isUserCreated: true,
        sourceVideoUrl: recipe.sourceVideoUrl
      };
      onRecipeCreated(fullRecipe);
    } else if (onComplete) {
      onComplete(recipe);
    }
  };

  const handleProceedToReview = () => {
    if (annotations.length === 0) {
      return; // Need at least one annotation
    }
    setCurrentStep('review');
  };

  const handleBackToAnnotate = () => {
    setCurrentStep('annotate');
  };

  if (currentStep === 'video') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Instructions */}
        <Card className="card-cozy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-dusty-rose" />
              Import from YouTube
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-secondary">
                Paste a YouTube URL of a baking video below. We'll load the video and help you 
                create a structured recipe by annotating the important steps and timing.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-warm-beige/50 rounded-lg">
                  <div className="w-8 h-8 bg-deep-olive rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-cloud-white text-sm font-bold">1</span>
                  </div>
                  <h4 className="mb-2">Load Video</h4>
                  <p className="text-xs text-secondary">Enter YouTube URL and load the video</p>
                </div>
                
                <div className="p-4 bg-warm-beige/50 rounded-lg">
                  <div className="w-8 h-8 bg-deep-olive rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-cloud-white text-sm font-bold">2</span>
                  </div>
                  <h4 className="mb-2">Mark Time Ranges</h4>
                  <p className="text-xs text-secondary">Set start and end times for each recipe step</p>
                </div>
                
                <div className="p-4 bg-warm-beige/50 rounded-lg">
                  <div className="w-8 h-8 bg-deep-olive rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-cloud-white text-sm font-bold">3</span>
                  </div>
                  <h4 className="mb-2">Generate Recipe</h4>
                  <p className="text-xs text-secondary">Review and complete your recipe</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video URL Input */}
        <VideoUrlInput onSubmit={handleVideoLoad} />

        {/* Cancel Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onBack || onCancel}>
            Cancel Import
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'annotate') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="card-cozy">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2">Mark Recipe Steps</h3>
                <p className="text-secondary text-sm">
                  Watch the video and create time ranges for each recipe step.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-dusty-rose/20 text-dusty-rose">
                  {annotations.length} steps
                </Badge>
                
                <Button
                  onClick={handleProceedToReview}
                  disabled={annotations.length === 0}
                  className="btn-primary"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Review Recipe
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Player - Single Column Layout */}
        {videoUrl && (
          <div className="space-y-4">
            {/* Video Player */}
            <VideoPlayer
              videoUrl={videoUrl}
              annotations={annotations}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onPlayStateChange={handlePlayStateChange}
              seekTo={seekToTime}
              showTimeline={false}
            />

            {/* Video Controls and Timeline */}
            <Card className="card-cozy">
              <CardContent className="p-4">
                {/* Simplified Controls Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Add Step Button */}
                    <Button
                      onClick={handleAddAnnotation}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Step
                      <span className="text-xs bg-black/20 px-2 py-1 rounded">
                        ({formatTime(currentTime)})
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {loopingStepId && loopingAnnotation && (
                      <Badge variant="outline" className="bg-yellow-400/20 text-yellow-700 border-yellow-400">
                        <Repeat className="h-3 w-3 mr-1" />
                        Looping: {formatTime(loopingAnnotation.startTime)} - {formatTime(loopingAnnotation.endTime || loopingAnnotation.startTime)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Timeline - Large and Prominent */}
                <div className="space-y-2">
                  {/* Time Display */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  {/* Main Timeline */}
                  <div className="relative">
                    <div
                      ref={timelineRef}
                      className="w-full h-12 bg-border rounded-lg cursor-pointer relative overflow-hidden"
                      onClick={handleTimelineClick}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Buffered Bar */}
                      <div
                        className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded-lg transition-all"
                        style={{ width: `${bufferedPosition}%` }}
                      />

                      {/* Progress Bar */}
                      <div
                        className="absolute top-0 left-0 h-full bg-deep-olive rounded-lg transition-all"
                        style={{ width: `${currentPosition}%` }}
                      />

                      {/* Current Time Indicator */}
                      <div
                        className="absolute top-1/2 w-4 h-4 bg-deep-olive border-2 border-cloud-white rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-sm z-20"
                        style={{ left: `${currentPosition}%` }}
                      />

                      {/* Annotation Time Ranges */}
                      {annotations.map((annotation, index) => {
                        const startPosition = duration > 0 ? ((annotation.startTime || 0) / duration) * 100 : 0;
                        const endPosition = duration > 0 ? ((annotation.endTime || annotation.startTime || 0) / duration) * 100 : 0;
                        const width = Math.max(endPosition - startPosition, 1); // Minimum 1% width
                        const isLooping = loopingStepId === annotation.id;
                        
                        return (
                          <div
                            key={annotation.id || index}
                            className={`absolute top-1 bottom-1 transition-colors cursor-pointer z-10 rounded-sm border ${
                              isLooping 
                                ? 'bg-yellow-400/80 border-yellow-500 animate-pulse' 
                                : 'bg-dusty-rose/60 hover:bg-dusty-rose/80 border-dusty-rose'
                            }`}
                            style={{ 
                              left: `${startPosition}%`,
                              width: `${width}%`
                            }}
                            title={`${annotation.title || `Step ${index + 1}`}: ${formatTime(annotation.startTime)} - ${formatTime(annotation.endTime || annotation.startTime)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // FIXED: Calculate exact time based on click position within the annotation
                              const exactTime = getTimeFromPositionInAnnotation(e.clientX, annotation);
                              handleSeekTo(exactTime);
                              setEditingAnnotation(annotation.id);
                            }}
                          />
                        );
                      })}

                      {/* Hover indicator */}
                      {hoverTime !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 pointer-events-none z-15"
                          style={{ left: `${(hoverTime / duration) * 100}%` }}
                        />
                      )}
                    </div>

                    {/* Timeline Labels */}
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>00:00</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Annotations List */}
            <Card className="card-cozy">
              <CardHeader>
                <CardTitle>Recipe Steps ({annotations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {annotations.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No steps added yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Click "Add Step" to create your first recipe step.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {annotations
                      .sort((a, b) => a.startTime - b.startTime)
                      .map((annotation, index) => {
                        const isLooping = loopingStepId === annotation.id;
                        const hasValidTimeRange = annotation.endTime && annotation.endTime > annotation.startTime;
                        
                        return (
                          <div key={annotation.id} className={`p-4 rounded-lg border transition-all duration-200 ${
                            isLooping ? 'bg-yellow-50 border-yellow-300 shadow-md' : 'bg-warm-beige/30 border-warm-beige'
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                  isLooping ? 'bg-yellow-500 animate-pulse' : 'bg-deep-olive'
                                }`}>
                                  <span className="text-cloud-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleSeekTo(annotation.startTime)}
                                      className="text-sm font-medium text-deep-olive underline underline-offset-4 hover:no-underline"
                                    >
                                      {formatTime(annotation.startTime)}
                                    </button>
                                    <span className="text-xs text-muted-foreground">to</span>
                                    <button
                                      onClick={() => handleSeekTo(annotation.endTime || annotation.startTime)}
                                      className="text-sm font-medium text-deep-olive underline underline-offset-4 hover:no-underline"
                                    >
                                      {formatTime(annotation.endTime || annotation.startTime)}
                                    </button>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    Duration: {Math.round(((annotation.endTime || annotation.startTime) - annotation.startTime) / 60)} min
                                  </span>
                                  {isLooping && (
                                    <span className="text-xs text-yellow-600 font-medium">
                                      🔄 Currently looping
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {/* Loop Step Button */}
                                {hasValidTimeRange && (
                                  <Button
                                    onClick={() => handleLoopStep(annotation)}
                                    variant={isLooping ? "default" : "outline"}
                                    size="sm"
                                    className={`text-xs transition-all duration-200 ${
                                      isLooping 
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500' 
                                        : 'hover:bg-yellow-50 hover:border-yellow-300'
                                    }`}
                                  >
                                    <Repeat className="h-3 w-3 mr-1" />
                                    {isLooping ? 'Stop Loop' : 'Loop Step'}
                                  </Button>
                                )}
                                
                                <Button
                                  onClick={() => setEditingAnnotation(editingAnnotation === annotation.id ? null : annotation.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-deep-olive hover:text-deep-olive"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteAnnotation(annotation.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Editable Content */}
                            {editingAnnotation === annotation.id ? (
                              <div className="space-y-3 mt-3 pt-3 border-t border-border">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">Step Title</label>
                                  <Input
                                    value={annotation.title || ''}
                                    onChange={(e) => handleUpdateAnnotation(annotation.id, { title: e.target.value })}
                                    placeholder="Enter step title..."
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">Step Description</label>
                                  <Textarea
                                    value={annotation.description || ''}
                                    onChange={(e) => handleUpdateAnnotation(annotation.id, { description: e.target.value })}
                                    placeholder="Describe what happens in this step..."
                                    className="text-sm min-h-[80px]"
                                  />
                                </div>
                                
                                {/* Time Controls */}
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => handleSetStartTime(annotation.id)}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      Set Start ({formatTime(currentTime)})
                                    </Button>
                                    <Button
                                      onClick={() => handleSetEndTime(annotation.id)}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      Set End ({formatTime(currentTime)})
                                    </Button>
                                  </div>
                                  
                                  <Button
                                    onClick={() => setEditingAnnotation(null)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                  >
                                    Done
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium text-deep-olive mb-1">
                                  {annotation.title || `Step ${index + 1}`}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {annotation.description || 'Click edit to add description...'}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel Import
          </Button>
          
          <Button 
            onClick={handleProceedToReview}
            disabled={annotations.length === 0}
            className="btn-primary"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Review Recipe ({annotations.length} steps)
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'review') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="card-cozy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-dusty-rose" />
              Review Your Recipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary">
              Review the recipe details before adding it to your collection. You can still edit these details later.
            </p>
          </CardContent>
        </Card>

        {/* Recipe Details Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipe Metadata */}
          <Card className="card-cozy">
            <CardHeader>
              <CardTitle>Recipe Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Recipe Name</label>
                <Input
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Enter recipe name..."
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                <Textarea
                  value={recipeDescription}
                  onChange={(e) => setRecipeDescription(e.target.value)}
                  placeholder="Describe your recipe..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Ingredients (one per line, format: "amount unit ingredient")
                </label>
                <Textarea
                  value={recipeIngredients}
                  onChange={(e) => setRecipeIngredients(e.target.value)}
                  placeholder={`500 g bread flour\n325 ml warm water\n10 g salt\n7 g active dry yeast`}
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recipe Steps Preview */}
          <Card className="card-cozy">
            <CardHeader>
              <CardTitle>Recipe Steps ({annotations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {annotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No steps created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {annotations
                    .sort((a, b) => a.startTime - b.startTime)
                    .map((annotation, index) => {
                      const duration = annotation.endTime 
                        ? Math.round((annotation.endTime - annotation.startTime) / 60)
                        : 5;
                      
                      return (
                        <div key={annotation.id} className="p-3 bg-warm-beige/30 rounded-lg border border-warm-beige">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-deep-olive rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-cloud-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-deep-olive mb-1">
                                {annotation.title || `Step ${index + 1}`}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {annotation.description || 'No description provided'}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  🕐 {formatTime(annotation.startTime)} - {formatTime(annotation.endTime || annotation.startTime)}
                                </span>
                                <span>
                                  ⏱️ ~{duration} min
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBackToAnnotate}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Annotate
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel Import
            </Button>
            <Button 
              onClick={handleCompleteImport}
              className="btn-primary"
              disabled={!recipeName.trim() || annotations.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Create Recipe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}