import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, BookOpen, Brain, PlusCircle, Sparkles, Wand2, Video } from 'lucide-react';
import { BreadRecipe } from '../BreadTypes';
import { RecipeForm } from './RecipeForm';
import { AIRecipeCreator } from './AIRecipeCreator';
import { useUser } from '../../contexts/UserContext';
import { saveRecipe } from '../../lib/supabase';
import { toast } from 'sonner';

type CreationMode = 'select' | 'manual' | 'ai' | 'video';

interface CreateRecipePageProps {
  onBack: () => void;
  onRecipeCreated: (recipe: BreadRecipe) => void;
  onNavigateToVideo: () => void;
  editingRecipe?: BreadRecipe;
  isEditing?: boolean;
}

export function CreateRecipePage({ 
  onBack, 
  onRecipeCreated, 
  onNavigateToVideo,
  editingRecipe,
  isEditing = false
}: CreateRecipePageProps) {
  const [mode, setMode] = useState<CreationMode>(isEditing ? 'manual' : 'select');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const handleManualCreate = () => {
    setMode('manual');
  };

  const handleAICreate = () => {
    setMode('ai');
  };

  const handleVideoCreate = () => {
    onNavigateToVideo();
  };

  const handleRecipeComplete = async (recipe: BreadRecipe) => {
    if (!user) {
      toast.error('You must be signed in to save recipes');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure the recipe has the user's ID
      const recipeToSave = {
        ...recipe,
        createdBy: user.id,
        isUserCreated: true
      };

      const result = await saveRecipe(recipeToSave);
      
      if (result.success) {
        onRecipeCreated(recipeToSave);
      } else {
        toast.error('Failed to save recipe', {
          description: result.error || 'Please try again'
        });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (mode === 'manual') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => isEditing ? onBack() : setMode('select')}
              className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isEditing ? 'Back to recipes' : 'Back to options'}
            </Button>
            <div>
              <h1>{isEditing ? 'Edit Recipe' : 'Manual Recipe Creation'}</h1>
              <p className="text-secondary">
                {isEditing ? 'Update your recipe details' : 'Build your recipe step by step with full control'}
              </p>
            </div>
          </div>

          <RecipeForm 
            onComplete={handleRecipeComplete}
            isLoading={isLoading}
            initialRecipe={editingRecipe}
            isEditing={isEditing}
          />
        </div>
      );
    }

    if (mode === 'ai') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setMode('select')}
              className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to options
            </Button>
            <div>
              <h1 className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-dusty-rose" />
                AI Recipe Creation
              </h1>
              <p className="text-secondary">
                Generate unique recipes using AI assistance
              </p>
            </div>
          </div>

          <AIRecipeCreator 
            onRecipeCreated={handleRecipeComplete}
            onBack={() => setMode('select')}
          />
        </div>
      );
    }

    // Selection mode
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1>Create New Recipe</h1>
          <p className="text-secondary max-w-2xl mx-auto">
            Choose how you'd like to create your bread recipe. You can build it manually step-by-step, 
            let AI analyze your bread photos, or import from YouTube videos with precise timing.
          </p>
        </div>

        {/* Creation Options */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Manual Creation */}
          <Card className="border-soft-brown/30 hover:shadow-warm transition-shadow cursor-pointer group" onClick={handleManualCreate}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-warm-beige rounded-full w-fit group-hover:bg-dusty-rose/20 transition-colors">
                <BookOpen className="h-8 w-8 text-deep-olive" />
              </div>
              <CardTitle className="text-deep-olive">Manual Creation</CardTitle>
              <CardDescription>
                Build your recipe from scratch with complete control over every detail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-deep-olive rounded-full"></div>
                  <span>Add ingredients with precise measurements</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-deep-olive rounded-full"></div>
                  <span>Write detailed step-by-step instructions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-deep-olive rounded-full"></div>
                  <span>Assign ingredients to specific steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-deep-olive rounded-full"></div>
                  <span>Add video timing for each step</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-deep-olive rounded-full"></div>
                  <span>Perfect for experienced bakers</span>
                </div>
              </div>
              
              <Button className="w-full btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90" onClick={handleManualCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Start Manual Creation
              </Button>
            </CardContent>
          </Card>

          {/* AI Creation */}
          <Card className="border-dusty-rose/30 hover:shadow-warm transition-shadow cursor-pointer group bg-gradient-to-br from-dusty-rose/10 to-warm-beige/20" onClick={handleAICreate}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-gradient-to-br from-dusty-rose/20 to-warm-beige/30 rounded-full w-fit group-hover:from-dusty-rose/30 group-hover:to-warm-beige/40 transition-colors">
                <Brain className="h-8 w-8 text-dusty-rose" />
              </div>
              <CardTitle className="text-dusty-rose flex items-center justify-center gap-2">
                AI-Powered Creation
                <Sparkles className="h-4 w-4 text-dusty-rose" />
              </CardTitle>
              <CardDescription>
                Upload photos of your bread and let AI generate a complete recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dusty-rose rounded-full"></div>
                  <span>Upload photos of ingredients &amp; process</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dusty-rose rounded-full"></div>
                  <span>AI analyzes and generates full recipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dusty-rose rounded-full"></div>
                  <span>Edit and refine before saving</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dusty-rose rounded-full"></div>
                  <span>Perfect for documenting existing recipes</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-dusty-rose to-warm-beige hover:from-dusty-rose/90 hover:to-warm-beige/90 text-deep-olive" onClick={handleAICreate}>
                <Wand2 className="mr-2 h-4 w-4" />
                Try AI Generation
              </Button>
            </CardContent>
          </Card>

          {/* Video Creation */}
          <Card className="border-muted-blue/30 hover:shadow-warm transition-shadow cursor-pointer group bg-gradient-to-br from-muted-blue/10 to-cloud-white/50" onClick={handleVideoCreate}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-gradient-to-br from-muted-blue/20 to-cloud-white/30 rounded-full w-fit group-hover:from-muted-blue/30 group-hover:to-cloud-white/40 transition-colors">
                <Video className="h-8 w-8 text-muted-blue" />
              </div>
              <CardTitle className="text-muted-blue flex items-center justify-center gap-2">
                Video Import
                <Video className="h-4 w-4 text-muted-blue" />
              </CardTitle>
              <CardDescription>
                Import bread recipes from YouTube videos with time-based annotations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-blue rounded-full"></div>
                  <span>Import any YouTube baking video</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-blue rounded-full"></div>
                  <span>Annotate steps with precise timing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-blue rounded-full"></div>
                  <span>Auto-assign ingredients to steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-blue rounded-full"></div>
                  <span>Perfect for learning from video tutorials</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-muted-blue to-cloud-white hover:from-muted-blue/90 hover:to-cloud-white/90 text-deep-olive" onClick={handleVideoCreate}>
                <Video className="mr-2 h-4 w-4" />
                Import from Video
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-soft-brown/30">
            <CardHeader>
              <CardTitle className="text-deep-olive text-center">Not sure which to choose?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="text-deep-olive mb-2">Choose Manual Creation if:</h4>
                  <ul className="space-y-1 text-secondary">
                    <li>• You have a recipe in mind to transcribe</li>
                    <li>• You want complete control over details</li>
                    <li>• You're creating a new recipe from scratch</li>
                    <li>• You want to organize ingredients by step</li>
                    <li>• You have a video and want to add timing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-dusty-rose mb-2">Choose AI Creation if:</h4>
                  <ul className="space-y-1 text-secondary">
                    <li>• You have photos of bread you've made</li>
                    <li>• You want to document an existing recipe</li>
                    <li>• You'd like AI to suggest ingredients/steps</li>
                    <li>• You want to experiment with AI assistance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-muted-blue mb-2">Choose Video Import if:</h4>
                  <ul className="space-y-1 text-secondary">
                    <li>• You found a great YouTube baking tutorial</li>
                    <li>• You want precise timing from video</li>
                    <li>• You prefer learning from visual guides</li>
                    <li>• You want to save video recipes for later</li>
                    <li>• You want automatic ingredient-to-step mapping</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="container-cozy section-cozy">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to my recipes
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}