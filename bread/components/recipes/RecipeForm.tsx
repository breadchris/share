import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, Clock, Users, ChefHat, Check, Video } from 'lucide-react';
import { BreadRecipe, BreadStep, BreadIngredient } from '../BreadTypes';
import { StepEditor } from './StepEditor';
import { useUser } from '../../contexts/UserContext';
import { saveRecipe } from '../../lib/supabase';
import { toast } from 'sonner';

interface RecipeFormProps {
  onComplete?: (recipe: BreadRecipe) => void;
  isLoading?: boolean;
  initialRecipe?: BreadRecipe;
  isEditing?: boolean;
}

export function RecipeForm({ 
  onComplete,
  isLoading = false,
  initialRecipe,
  isEditing = false
}: RecipeFormProps) {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxSteps = 4;

  // Basic Information (Step 1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    prepTime: 30,
    totalTime: 180,
    servings: 8,
    imageUrl: '',
    tags: [] as string[],
    videoUrl: '',
    videoTitle: '',
    videoDuration: 0
  });

  // Ingredients (Step 2)
  const [ingredients, setIngredients] = useState<BreadIngredient[]>([
    { id: 'ingredient-1', name: '', amount: 0, unit: 'cups', optional: false }
  ]);

  // Steps (Step 3)
  const [steps, setSteps] = useState<BreadStep[]>([
    {
      id: 'step-1',
      title: '',
      description: '',
      duration: 15,
      temperature: undefined,
      isOptional: false,
      tips: [],
      ingredients: [],
      videoStartTime: undefined,
      videoEndTime: undefined
    }
  ]);

  // UI state
  const [tagInput, setTagInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load initial data if editing
  useEffect(() => {
    if (initialRecipe) {
      console.log('🔄 Loading recipe data for editing:', initialRecipe.name);
      
      setFormData({
        name: initialRecipe.name || '',
        description: initialRecipe.description || '',
        difficulty: initialRecipe.difficulty || 'Beginner',
        prepTime: initialRecipe.prepTime || 30,
        totalTime: initialRecipe.totalTime || 180,
        servings: initialRecipe.servings || 8,
        imageUrl: initialRecipe.imageUrl || '',
        tags: initialRecipe.tags || [],
        videoUrl: initialRecipe.videoUrl || '',
        videoTitle: initialRecipe.videoTitle || '',
        videoDuration: initialRecipe.videoDuration || 0
      });

      if (initialRecipe.ingredients && initialRecipe.ingredients.length > 0) {
        setIngredients(initialRecipe.ingredients);
      }

      if (initialRecipe.steps && initialRecipe.steps.length > 0) {
        setSteps(initialRecipe.steps);
      }
    }
  }, [initialRecipe]);

  const validateCurrentStep = (): string[] => {
    const errors: string[] = [];

    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.name.trim()) {
          errors.push('Recipe name is required');
        }
        if (!formData.description.trim()) {
          errors.push('Recipe description is required');
        }
        break;

      case 2: // Ingredients
        const validIngredients = ingredients.filter(ing => ing.name && ing.name.trim());
        if (validIngredients.length === 0) {
          errors.push('At least one ingredient is required');
        }
        break;

      case 3: // Instructions
        const validSteps = steps.filter(step => step.title && step.title.trim() && step.description && step.description.trim());
        if (validSteps.length === 0) {
          errors.push('At least one complete step is required');
        }
        break;
    }

    return errors;
  };

  const handleNext = () => {
    console.log('🔄 Handling next button click');
    const errors = validateCurrentStep();
    setValidationErrors(errors);

    if (errors.length === 0) {
      if (currentStep < maxSteps) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      console.log('❌ Validation errors:', errors);
      toast.error('Please fix the validation errors before continuing');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('💾 Handling recipe submission');
    
    if (!user) {
      toast.error('You must be signed in to save recipes');
      return;
    }

    // Final validation
    const errors = validateCurrentStep();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build recipe object
      const validIngredients = ingredients.filter(ing => ing.name && ing.name.trim());
      const validSteps = steps.filter(step => step.title && step.title.trim() && step.description && step.description.trim());

      const recipeData: BreadRecipe = {
        id: initialRecipe?.id || `recipe-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        difficulty: formData.difficulty,
        prepTime: formData.prepTime,
        totalTime: formData.totalTime,
        servings: formData.servings,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop',
        ingredients: validIngredients,
        steps: validSteps,
        tags: formData.tags,
        createdBy: user.id,
        createdAt: initialRecipe?.createdAt || new Date(),
        updatedAt: new Date(),
        isUserCreated: true,
        videoUrl: formData.videoUrl || undefined,
        videoTitle: formData.videoTitle || undefined,
        videoDuration: formData.videoDuration || undefined
      };

      console.log('📝 Recipe data prepared:', recipeData.name);

      if (onComplete) {
        await onComplete(recipeData);
      } else {
        // Direct save to database
        const result = await saveRecipe(recipeData);
        if (result.success) {
          toast.success(isEditing ? 'Recipe updated successfully!' : 'Recipe created successfully!');
        } else {
          toast.error('Failed to save recipe', {
            description: result.error || 'Please try again'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error saving recipe:', error);
      toast.error(isEditing ? 'Failed to update recipe' : 'Failed to create recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ingredient handlers
  const addIngredient = () => {
    const newId = `ingredient-${ingredients.length + 1}`;
    setIngredients([...ingredients, { 
      id: newId, 
      name: '', 
      amount: 0, 
      unit: 'cups', 
      optional: false 
    }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
      
      // Remove this ingredient from all steps
      setSteps(prevSteps => 
        prevSteps.map(step => ({
          ...step,
          ingredients: step.ingredients?.filter(ingId => ingId !== ingredients[index].id) || []
        }))
      );
    }
  };

  const updateIngredient = (index: number, field: keyof BreadIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  // Step handlers
  const addStep = () => {
    const newStep: BreadStep = {
      id: `step-${steps.length + 1}`,
      title: '',
      description: '',
      duration: 15,
      temperature: undefined,
      isOptional: false,
      tips: [],
      ingredients: [],
      videoStartTime: undefined,
      videoEndTime: undefined
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, updatedStep: BreadStep) => {
    const updated = [...steps];
    updated[index] = updatedStep;
    setSteps(updated);
  };

  // Tag handlers
  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tag.trim()] });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  // Video preview handler for steps
  const handlePreviewVideoTime = (startTime: number, endTime?: number) => {
    if (formData.videoUrl) {
      // Extract video ID from YouTube URL
      const videoIdMatch = formData.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        let url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startTime)}s`;
        if (endTime) {
          // YouTube doesn't support end time in URL, but we can note it
          console.log(`Playing from ${startTime}s to ${endTime}s`);
        }
        window.open(url, '_blank');
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm mb-2">Recipe Name *</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter recipe name..."
                  className="input-cozy"
                />
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm mb-2">Difficulty Level</label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="input-cozy w-full"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm mb-2">Description *</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your recipe..."
                className="input-cozy min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="prepTime" className="block text-sm mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Prep Time (minutes)
                </label>
                <Input
                  id="prepTime"
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
                  className="input-cozy"
                />
              </div>

              <div>
                <label htmlFor="totalTime" className="block text-sm mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Total Time (minutes)
                </label>
                <Input
                  id="totalTime"
                  type="number"
                  value={formData.totalTime}
                  onChange={(e) => setFormData({ ...formData, totalTime: parseInt(e.target.value) || 0 })}
                  className="input-cozy"
                />
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Servings
                </label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                  className="input-cozy"
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm mb-2">Image URL (optional)</label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/recipe-image.jpg"
                className="input-cozy"
              />
            </div>

            {/* Video Information */}
            <div className="space-y-4 p-4 bg-muted-blue/10 rounded-lg border border-muted-blue/30">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-muted-blue" />
                <h4 className="text-muted-blue">Video Information (Optional)</h4>
              </div>
              
              <div>
                <label htmlFor="videoUrl" className="block text-sm mb-2">YouTube Video URL</label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input-cozy"
                />
              </div>

              {formData.videoUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="videoTitle" className="block text-sm mb-2">Video Title</label>
                    <Input
                      id="videoTitle"
                      value={formData.videoTitle}
                      onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                      placeholder="Video title..."
                      className="input-cozy"
                    />
                  </div>

                  <div>
                    <label htmlFor="videoDuration" className="block text-sm mb-2">Video Duration (seconds)</label>
                    <Input
                      id="videoDuration"
                      type="number"
                      value={formData.videoDuration}
                      onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) || 0 })}
                      className="input-cozy"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm mb-2">Tags</label>
              <div className="space-y-3">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  placeholder="Add tags (press Enter to add)..."
                  className="input-cozy"
                />
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-dusty-rose/20 border-dusty-rose">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-xs hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-deep-olive">Recipe Ingredients</h3>
                <p className="text-secondary text-sm">Add all ingredients needed for your bread recipe</p>
              </div>
              <Button onClick={addIngredient} variant="outline" size="sm" className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-4 bg-warm-beige/30 p-4 rounded-lg">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex gap-3 items-start">
                  <Input
                    type="number"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="input-cozy w-24"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="input-cozy w-32"
                  >
                    <option value="cups">cups</option>
                    <option value="grams">grams</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="liters">liters</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="pieces">pieces</option>
                    <option value="slices">slices</option>
                    <option value="pinch">pinch</option>
                  </select>
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder="Ingredient name"
                    className="input-cozy flex-1"
                  />
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={ingredient.optional || false}
                      onChange={(e) => updateIngredient(index, 'optional', e.target.checked)}
                    />
                    Optional
                  </label>
                  <Button
                    onClick={() => removeIngredient(index)}
                    variant="ghost"
                    size="sm"
                    disabled={ingredients.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-deep-olive">Step-by-Step Instructions</h3>
                <p className="text-secondary text-sm">Break down your recipe into clear, actionable steps</p>
              </div>
              <Button onClick={addStep} variant="outline" size="sm" className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  stepIndex={index}
                  ingredients={ingredients}
                  hasVideo={!!formData.videoUrl}
                  videoDuration={formData.videoDuration}
                  onStepChange={(updatedStep) => updateStep(index, updatedStep)}
                  onDeleteStep={() => removeStep(index)}
                  onPreviewVideoTime={handlePreviewVideoTime}
                />
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-deep-olive mb-2">Review Your Recipe</h3>
              <p className="text-secondary text-sm">
                Please review all details before {isEditing ? 'updating' : 'creating'} your recipe
              </p>
            </div>

            {/* Recipe Summary */}
            <Card className="border-soft-brown/30">
              <CardHeader>
                <CardTitle className="text-deep-olive">{formData.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-secondary">{formData.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    {formData.difficulty}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formData.totalTime} minutes
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {formData.servings} servings
                  </div>
                  {formData.videoUrl && (
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      Video included
                    </div>
                  )}
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-dusty-rose/20 border-dusty-rose">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="text-deep-olive mb-2">Ingredients ({ingredients.filter(ing => ing.name && ing.name.trim()).length})</h4>
                    <ul className="text-sm space-y-1">
                      {ingredients.filter(ing => ing.name && ing.name.trim()).slice(0, 5).map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.amount} {ingredient.unit} {ingredient.name}
                          {ingredient.optional && <span className="text-secondary"> (optional)</span>}
                        </li>
                      ))}
                      {ingredients.filter(ing => ing.name && ing.name.trim()).length > 5 && (
                        <li className="text-secondary">
                          ...and {ingredients.filter(ing => ing.name && ing.name.trim()).length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-deep-olive mb-2">Steps ({steps.filter(step => step.title && step.title.trim()).length})</h4>
                    <ul className="text-sm space-y-1">
                      {steps.filter(step => step.title && step.title.trim()).slice(0, 5).map((step, index) => (
                        <li key={index}>
                          {index + 1}. {step.title}
                          {step.videoStartTime !== undefined && (
                            <span className="text-muted-blue text-xs ml-2">(video timing)</span>
                          )}
                        </li>
                      ))}
                      {steps.filter(step => step.title && step.title.trim()).length > 5 && (
                        <li className="text-secondary">
                          ...and {steps.filter(step => step.title && step.title.trim()).length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step <= currentStep 
                  ? 'bg-deep-olive text-cloud-white' 
                  : 'bg-soft-brown/20 text-secondary'
              }`}>
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-deep-olive' : 'bg-soft-brown/20'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-secondary">
          Step {currentStep} of {maxSteps}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <h4 className="text-red-800 mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-soft-brown/20">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="border-soft-brown text-soft-brown hover:bg-soft-brown hover:text-cloud-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === maxSteps ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
          >
            {isSubmitting || isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cloud-white mr-2" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Recipe' : 'Create Recipe'}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}