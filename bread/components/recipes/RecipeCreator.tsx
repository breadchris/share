import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Clock, Users, ChefHat, Plus, Edit, Trash2, Brain, Sparkles, BookOpen, Wand2, Video } from 'lucide-react';
import { BreadRecipe } from '../BreadTypes';
import { useUser } from '../../contexts/UserContext';
import { getUserRecipes, deleteRecipe } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface RecipeCreatorProps {
  onSelectRecipe: (recipe: BreadRecipe) => void;
  onEditRecipe: (recipe: BreadRecipe) => void;
  onCreateNewRecipe: () => void;
  onCreateAIRecipe: () => void;
  onCreateYouTubeRecipe?: () => void;
}

export function RecipeCreator({ 
  onSelectRecipe, 
  onEditRecipe, 
  onCreateNewRecipe,
  onCreateAIRecipe,
  onCreateYouTubeRecipe 
}: RecipeCreatorProps) {
  const [userRecipes, setUserRecipes] = useState<BreadRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Fetch user recipes
  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('📚 Fetching user recipes');
        
        const recipes = await getUserRecipes(user.id);
        setUserRecipes(recipes);
        
        console.log(`✅ Loaded ${recipes.length} user recipes`);
      } catch (err) {
        console.error('❌ Error fetching user recipes:', err);
        setError('Failed to load your recipes');
        toast.error('Failed to load recipes', {
          description: 'Could not connect to the database'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRecipes();
  }, [user]);

  // Handle recipe deletion
  const handleDeleteRecipe = async (recipe: BreadRecipe) => {
    if (!user || !recipe.id) return;

    try {
      console.log('🗑️ Deleting recipe:', recipe.name);
      
      const success = await deleteRecipe(recipe.id, user.id);
      
      if (success) {
        // Remove from local state
        setUserRecipes(prev => prev.filter(r => r.id !== recipe.id));
        toast.success(`Recipe "${recipe.name}" deleted successfully`);
      } else {
        toast.error('Failed to delete recipe', {
          description: 'Database connection failed'
        });
      }
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      toast.error('Failed to delete recipe', {
        description: 'An unexpected error occurred'
      });
    }
  };

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>My Recipes</h1>
            <p className="text-secondary">Loading your bread recipes...</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-soft-brown/20">
              <CardHeader>
                <div className="w-full h-48 bg-warm-beige/50 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-warm-beige/50 rounded animate-pulse"></div>
                  <div className="h-3 bg-warm-beige/50 rounded animate-pulse w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>My Recipes</h1>
            <p className="text-secondary text-red-600">{error}</p>
          </div>
        </div>
        
        <Card className="border-red-200">
          <CardContent className="pt-6 text-center">
            <p className="text-secondary mb-4">
              We couldn't load your recipes due to a database connection issue.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>My Recipes</h1>
          <p className="text-secondary">
            {userRecipes.length === 0 
              ? "Create your first bread recipe" 
              : `${userRecipes.length} recipe${userRecipes.length !== 1 ? 's' : ''} in your collection`
            }
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onCreateNewRecipe}
            className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Recipe
          </Button>
          
          <Button
            onClick={onCreateAIRecipe}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Brain className="mr-2 h-4 w-4" />
            AI Recipe
          </Button>

          {onCreateYouTubeRecipe && (
            <Button
              onClick={onCreateYouTubeRecipe}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              <Video className="mr-2 h-4 w-4" />
              From Video
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {userRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-dusty-rose/20 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-dusty-rose" />
            </div>
            
            <div className="space-y-2">
              <h3>No recipes yet</h3>
              <p className="text-secondary max-w-md mx-auto">
                Create your first bread recipe to start building your personal collection. 
                You can write it manually or let AI help you generate one from photos.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onCreateNewRecipe}
                className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Manual Recipe
              </Button>
              
              <Button
                onClick={onCreateAIRecipe}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Try AI Recipe Creation
              </Button>

              {onCreateYouTubeRecipe && (
                <Button
                  onClick={onCreateYouTubeRecipe}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                >
                  <Video className="mr-2 h-4 w-4" />
                  From YouTube Video
                </Button>
              )}
            </div>
            
            {/* AI Creation Info */}
            <Card className="max-w-md mx-auto border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-purple-800 mb-1">New: AI Recipe Creation</h4>
                    <p className="text-sm text-purple-700">
                      Upload photos of your bread, ingredients, or baking process and let AI create a complete recipe for you!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recipe Grid */}
      {userRecipes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userRecipes.map((recipe) => (
            <Card 
              key={recipe.id} 
              className="card-cozy hover-warm group cursor-pointer border-soft-brown/20"
              onClick={() => onSelectRecipe(recipe)}
            >
              <CardHeader className="pb-3">
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-soft-brown/20 mb-3">
                  <ImageWithFallback
                    src={recipe.imageUrl || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop'}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-deep-olive mb-1 truncate">
                      {recipe.name}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {recipe.description}
                    </CardDescription>
                  </div>
                  
                  {/* Action buttons with proper event stopping */}
                  <div 
                    className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      // Stop propagation on the container to prevent card click
                      e.stopPropagation();
                    }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-deep-olive/30 text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRecipe(recipe);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRecipe(recipe)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Recipe
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-secondary mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(recipe.totalTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{recipe.servings || 8}</span>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      recipe.difficulty === 'Beginner' ? 'border-green-300 text-green-700' :
                      recipe.difficulty === 'Intermediate' ? 'border-dusty-rose text-dusty-rose' :
                      'border-red-300 text-red-700'
                    }`}
                  >
                    <ChefHat className="h-3 w-3 mr-1" />
                    {recipe.difficulty}
                  </Badge>
                </div>
                
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-warm-beige/80 text-deep-olive">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-warm-beige/80 text-deep-olive">
                        +{recipe.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}