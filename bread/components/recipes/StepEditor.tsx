import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Thermometer, 
  Video, 
  ChefHat, 
  X,
  Play,
  Pause
} from 'lucide-react';
import { BreadStep, BreadIngredient, formatVideoTime, parseVideoTime, validateVideoTimeRange } from '../BreadTypes';

interface StepEditorProps {
  step: BreadStep;
  stepIndex: number;
  ingredients: BreadIngredient[];
  hasVideo?: boolean;
  videoDuration?: number;
  onStepChange: (updatedStep: BreadStep) => void;
  onDeleteStep: () => void;
  onPreviewVideoTime?: (startTime: number, endTime?: number) => void;
}

export function StepEditor({ 
  step, 
  stepIndex, 
  ingredients, 
  hasVideo, 
  videoDuration,
  onStepChange, 
  onDeleteStep,
  onPreviewVideoTime 
}: StepEditorProps) {
  const [localStep, setLocalStep] = useState<BreadStep>(step);
  const [videoStartInput, setVideoStartInput] = useState('');
  const [videoEndInput, setVideoEndInput] = useState('');
  const [videoTimeError, setVideoTimeError] = useState('');

  // Update local state when step prop changes
  useEffect(() => {
    setLocalStep(step);
    setVideoStartInput(step.videoStartTime ? formatVideoTime(step.videoStartTime) : '');
    setVideoEndInput(step.videoEndTime ? formatVideoTime(step.videoEndTime) : '');
  }, [step]);

  // Propagate changes to parent
  useEffect(() => {
    onStepChange(localStep);
  }, [localStep, onStepChange]);

  const updateStep = (updates: Partial<BreadStep>) => {
    setLocalStep(prev => ({ ...prev, ...updates }));
  };

  const addTip = () => {
    const tips = localStep.tips || [];
    updateStep({ tips: [...tips, ''] });
  };

  const updateTip = (index: number, value: string) => {
    const tips = [...(localStep.tips || [])];
    tips[index] = value;
    updateStep({ tips });
  };

  const removeTip = (index: number) => {
    const tips = [...(localStep.tips || [])];
    tips.splice(index, 1);
    updateStep({ tips });
  };

  const toggleIngredient = (ingredientId: string) => {
    const currentIngredients = localStep.ingredients || [];
    const isSelected = currentIngredients.includes(ingredientId);
    
    if (isSelected) {
      updateStep({ 
        ingredients: currentIngredients.filter(id => id !== ingredientId) 
      });
    } else {
      updateStep({ 
        ingredients: [...currentIngredients, ingredientId] 
      });
    }
  };

  const handleVideoTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setVideoStartInput(value);
    } else {
      setVideoEndInput(value);
    }

    // Parse and validate the time
    const startSeconds = type === 'start' ? parseVideoTime(value) : (localStep.videoStartTime || 0);
    const endSeconds = type === 'end' ? parseVideoTime(value) : (localStep.videoEndTime || 0);

    const validation = validateVideoTimeRange(
      value && type === 'start' ? startSeconds : localStep.videoStartTime,
      value && type === 'end' ? endSeconds : localStep.videoEndTime
    );

    if (!validation.isValid) {
      setVideoTimeError(validation.error || '');
      return;
    }

    setVideoTimeError('');

    // Update the step with new video times
    updateStep({
      videoStartTime: type === 'start' && value ? startSeconds : localStep.videoStartTime,
      videoEndTime: type === 'end' && value ? endSeconds : localStep.videoEndTime
    });
  };

  const previewVideoSegment = () => {
    if (onPreviewVideoTime && localStep.videoStartTime !== undefined) {
      onPreviewVideoTime(localStep.videoStartTime, localStep.videoEndTime);
    }
  };

  const getSelectedIngredients = () => {
    return (localStep.ingredients || [])
      .map(id => ingredients.find(ing => ing.id === id))
      .filter(Boolean) as BreadIngredient[];
  };

  return (
    <Card className="border-soft-brown/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-deep-olive flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Step {stepIndex + 1}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteStep}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Step Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`step-${stepIndex}-title`}>Step Title</Label>
            <Input
              id={`step-${stepIndex}-title`}
              value={localStep.title}
              onChange={(e) => updateStep({ title: e.target.value })}
              placeholder="e.g., Mix dry ingredients"
              className="input-cozy"
            />
          </div>

          <div>
            <Label htmlFor={`step-${stepIndex}-duration`}>Duration (minutes)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-soft-brown" />
              <Input
                id={`step-${stepIndex}-duration`}
                type="number"
                value={localStep.duration}
                onChange={(e) => updateStep({ duration: parseInt(e.target.value) || 0 })}
                className="input-cozy pl-10"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor={`step-${stepIndex}-description`}>Instructions</Label>
          <Textarea
            id={`step-${stepIndex}-description`}
            value={localStep.description}
            onChange={(e) => updateStep({ description: e.target.value })}
            placeholder="Detailed instructions for this step..."
            className="input-cozy min-h-[100px]"
          />
        </div>

        {/* Temperature and Optional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`step-${stepIndex}-temperature`}>Temperature (°C) - Optional</Label>
            <div className="relative">
              <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-soft-brown" />
              <Input
                id={`step-${stepIndex}-temperature`}
                type="number"
                value={localStep.temperature || ''}
                onChange={(e) => updateStep({ temperature: e.target.value ? parseInt(e.target.value) : undefined })}
                className="input-cozy pl-10"
                placeholder="e.g., 180"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-7">
            <Checkbox
              id={`step-${stepIndex}-optional`}
              checked={localStep.isOptional || false}
              onCheckedChange={(checked) => updateStep({ isOptional: checked as boolean })}
            />
            <Label htmlFor={`step-${stepIndex}-optional`}>This step is optional</Label>
          </div>
        </div>

        {/* Video Timing - Only show if recipe has video */}
        {hasVideo && (
          <div className="space-y-4 p-4 bg-dusty-rose/10 rounded-lg border border-dusty-rose/30">
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-5 w-5 text-dusty-rose" />
              <h4 className="text-dusty-rose">Video Timing</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`step-${stepIndex}-video-start`}>Start Time (mm:ss)</Label>
                <Input
                  id={`step-${stepIndex}-video-start`}
                  value={videoStartInput}
                  onChange={(e) => handleVideoTimeChange('start', e.target.value)}
                  placeholder="0:00"
                  className="input-cozy"
                />
              </div>

              <div>
                <Label htmlFor={`step-${stepIndex}-video-end`}>End Time (mm:ss)</Label>
                <Input
                  id={`step-${stepIndex}-video-end`}
                  value={videoEndInput}
                  onChange={(e) => handleVideoTimeChange('end', e.target.value)}
                  placeholder="1:30"
                  className="input-cozy"
                />
              </div>
            </div>

            {videoTimeError && (
              <p className="text-red-600 text-sm">{videoTimeError}</p>
            )}

            {videoDuration && (
              <p className="text-secondary text-sm">
                Video duration: {formatVideoTime(videoDuration)}
              </p>
            )}

            {localStep.videoStartTime !== undefined && onPreviewVideoTime && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={previewVideoSegment}
                className="border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-cloud-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Preview Video Segment
              </Button>
            )}
          </div>
        )}

        {/* Ingredients Used in This Step */}
        <div className="space-y-4">
          <h4 className="text-deep-olive flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Ingredients Used in This Step
          </h4>
          
          {ingredients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-soft-brown/20 rounded-lg p-3">
              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`step-${stepIndex}-ingredient-${ingredient.id}`}
                    checked={(localStep.ingredients || []).includes(ingredient.id)}
                    onCheckedChange={() => toggleIngredient(ingredient.id)}
                  />
                  <Label 
                    htmlFor={`step-${stepIndex}-ingredient-${ingredient.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary text-sm italic">
              Add ingredients to the recipe first to select them for this step.
            </p>
          )}

          {/* Display selected ingredients */}
          {getSelectedIngredients().length > 0 && (
            <div className="flex flex-wrap gap-2">
              {getSelectedIngredients().map((ingredient) => (
                <Badge
                  key={ingredient.id}
                  variant="secondary"
                  className="bg-deep-olive/10 text-deep-olive border-deep-olive/20"
                >
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => toggleIngredient(ingredient.id)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-deep-olive">Tips & Notes</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTip}
              className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Tip
            </Button>
          </div>

          {(localStep.tips || []).map((tip, tipIndex) => (
            <div key={tipIndex} className="flex gap-2">
              <Input
                value={tip}
                onChange={(e) => updateTip(tipIndex, e.target.value)}
                placeholder="Enter a helpful tip..."
                className="input-cozy"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeTip(tipIndex)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {(!localStep.tips || localStep.tips.length === 0) && (
            <p className="text-secondary text-sm italic">
              No tips added yet. Tips help other bakers succeed with this step.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}