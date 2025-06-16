import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Clock, ArrowRight, History, Calendar, ChevronRight, CheckCircle2, PlusCircle, Check } from 'lucide-react';
import { getAllUserProgress, markBreadCompleted, getRecipe } from '../lib/supabase';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow, isPast, format, parseISO } from 'date-fns';
import { Progress } from './ui/progress';
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
} from './ui/alert-dialog';
import { toast } from 'sonner';

// Type for progress data
type BreadProgress = {
  id: string;
  user_id: string;
  bread_id: string;
  bread_name: string;
  current_step: number;
  completed_steps: string[];
  start_time: string;
  expected_finish_time: string;
  last_updated: string;
  is_completed: boolean;
};

type UserInProgressBreadProps = {
  userId: string;
  onContinueBaking: (breadId: string, breadName: string, progress: BreadProgress) => void;
};

export function UserInProgressBread({ userId, onContinueBaking }: UserInProgressBreadProps) {
  const [progressItems, setProgressItems] = useState<BreadProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for recipe data to avoid repeated database calls
  const [recipeCache, setRecipeCache] = useState<Map<string, any>>(new Map());

  // Fetch user progress data and preload recipe information
  useEffect(() => {
    const fetchProgress = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Fetching progress for user:', userId);
        
        const progress = await getAllUserProgress(userId);
        console.log('📊 Fetched progress data:', progress);
        
        if (progress && progress.length > 0) {
          setProgressItems(progress);
          console.log(`✅ Found ${progress.length} bread(s) in progress`);
          
          // Preload recipe data for each progress item
          console.log('🔄 Preloading recipe data for progress items...');
          for (const progressItem of progress) {
            await getFullRecipe(progressItem.bread_id);
          }
          console.log('✅ Recipe data preloaded');
        } else {
          setProgressItems([]);
          console.log('📝 No breads in progress found');
        }
      } catch (err) {
        console.error('❌ Error fetching progress:', err);
        setError('Failed to load your baking progress');
        toast.error('Failed to load progress', {
          description: 'Could not connect to the database'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  // Handle continuing a bread baking session
  const handleContinue = (progress: BreadProgress) => {
    console.log('🚀 Continuing bread:', progress.bread_name);
    onContinueBaking(progress.bread_id, progress.bread_name, progress);
  };

  // Enhanced recipe lookup that checks database for user-created recipes only
  const getFullRecipe = async (breadId: string) => {
    // Check cache first
    if (recipeCache.has(breadId)) {
      return recipeCache.get(breadId);
    }
    
    // Check database for user-created recipes
    try {
      console.log(`🔍 Checking database for user-created recipe: ${breadId}`);
      const dbRecipe = await getRecipe(breadId);
      
      if (dbRecipe) {
        console.log(`✅ Found database recipe for ${breadId}`);
        setRecipeCache(prev => new Map(prev.set(breadId, dbRecipe)));
        return dbRecipe;
      }
    } catch (error) {
      console.log(`❌ Error fetching recipe from database: ${error}`);
    }
    
    console.log(`⚠️ Recipe not found for ${breadId}`);
    return null;
  };

  // Handle marking bread as completed
  const handleMarkCompleted = async (progress: BreadProgress) => {
    try {
      console.log('✅ Marking bread as completed:', progress.bread_name);
      
      // Get the actual recipe to determine total steps
      const recipe = await getFullRecipe(progress.bread_id);
      const totalSteps = recipe?.steps?.length || Math.max(progress.completed_steps.length, progress.current_step + 1);
      
      console.log(`📊 Recipe found: ${!!recipe}, Total steps: ${totalSteps}`);
      
      const result = await markBreadCompleted(
        progress.user_id,
        progress.bread_id,
        progress.bread_name,
        progress.completed_steps,
        'Marked as completed by user'
      );

      if (result.success) {
        toast.success(`${progress.bread_name} marked as completed!`);
        // Refresh the progress list
        const updatedProgress = await getAllUserProgress(userId);
        setProgressItems(updatedProgress);
      } else {
        toast.error('Failed to mark bread as completed', {
          description: result.error || 'Database connection failed'
        });
      }
    } catch (error) {
      console.error('Error marking bread as completed:', error);
      toast.error('Failed to mark bread as completed', {
        description: 'An unexpected error occurred'
      });
    }
  };

  // Calculate progress percentage - now only uses cached recipes from database
  const calculateProgress = (progress: BreadProgress) => {
    const recipe = recipeCache.get(progress.bread_id);
    if (!recipe || !recipe.steps || recipe.steps.length === 0) {
      // Fallback calculation when recipe not found
      const estimatedTotal = Math.max(progress.completed_steps.length, progress.current_step + 1, 1);
      return Math.round((progress.completed_steps.length / estimatedTotal) * 100);
    }
    
    const totalSteps = recipe.steps.length;
    const completedCount = progress.completed_steps.length;
    return Math.round((completedCount / totalSteps) * 100);
  };

  // Get total steps for display - now only uses cached recipes from database
  const getTotalSteps = (progress: BreadProgress) => {
    const recipe = recipeCache.get(progress.bread_id);
    return recipe?.steps?.length || Math.max(progress.completed_steps.length, progress.current_step + 1, 1);
  };

  // Get bread image URL - now only uses cached recipes from database
  const getBreadImage = (breadId: string) => {
    const recipe = recipeCache.get(breadId);
    return recipe?.imageUrl || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop';
  };

  // Format time displays
  const formatTime = (timeString: string) => {
    try {
      const date = parseISO(timeString);
      return format(date, 'MMM d, h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeStatus = (expectedFinishTime: string) => {
    try {
      const finishTime = parseISO(expectedFinishTime);
      const now = new Date();
      
      if (isPast(finishTime)) {
        return {
          text: `Finished ${formatDistanceToNow(finishTime)} ago`,
          variant: 'overdue' as const
        };
      } else {
        return {
          text: `Finishes in ${formatDistanceToNow(finishTime)}`,
          variant: 'upcoming' as const
        };
      }
    } catch {
      return {
        text: 'Time unknown',
        variant: 'unknown' as const
      };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-soft-brown/30">
        <CardHeader className="bg-gradient-to-r from-warm-beige/70 to-cloud-white/50 border-b border-soft-brown/20">
          <CardTitle>Your Bread Progress</CardTitle>
          <CardDescription>Loading your baking sessions...</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-100/70 to-red-50/50 border-b border-red-100">
          <CardTitle className="text-red-800">Error Loading Progress</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <p className="text-secondary mb-4">
            We couldn't load your baking progress due to a database connection issue.
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
    );
  }

  // No progress state
  if (progressItems.length === 0) {
    return (
      <Card className="border-soft-brown/30">
        <CardHeader className="bg-gradient-to-r from-warm-beige/70 to-cloud-white/50 border-b border-soft-brown/20">
          <CardTitle>Begin Your Bread Journey</CardTitle>
          <CardDescription>Start your first baking adventure</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-dusty-rose/20 flex items-center justify-center mb-4">
              <PlusCircle className="h-10 w-10 text-dusty-rose" />
            </div>
            <h3 className="text-dusty-rose mb-2">No Breads in Progress</h3>
            <p className="text-secondary max-w-md mx-auto">
              "The secret of getting ahead is getting started." Create or select a bread recipe below to begin your baking adventure.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-soft-brown/20">
            <p className="text-xs text-secondary">
              Your active baking sessions will appear here, ready to continue whenever you're ready.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Progress items found - show them
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-dusty-rose">Your Bread Progress</h2>
          <p className="text-secondary">Continue your baking journey</p>
        </div>
        <div className="text-sm text-secondary">
          {progressItems.length} bread{progressItems.length !== 1 ? 's' : ''} in progress
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {progressItems.map((progress) => {
          const progressPercentage = calculateProgress(progress);
          const timeStatus = getTimeStatus(progress.expected_finish_time);
          const totalSteps = getTotalSteps(progress);
          
          return (
            <Card key={progress.id} className="border-soft-brown/30 hover:shadow-warm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-dusty-rose mb-1">
                      {progress.bread_name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Started {formatTime(progress.start_time)}
                    </CardDescription>
                  </div>
                  <div className="ml-2 w-16 h-16 rounded-lg overflow-hidden border-2 border-soft-brown/20">
                    <ImageWithFallback
                      src={getBreadImage(progress.bread_id)}
                      alt={progress.bread_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Progress</span>
                    <span className="text-deep-olive">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex items-center text-xs text-secondary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {progress.completed_steps.length} of {totalSteps} steps completed
                  </div>
                </div>

                {/* Time status */}
                {/* <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-dusty-rose" />
                  <span className={`${
                    timeStatus.variant === 'overdue' ? 'text-red-600' : 
                    timeStatus.variant === 'upcoming' ? 'text-green-600' : 
                    'text-secondary'
                  }`}>
                    {timeStatus.text}
                  </span>
                </div> */}

                {/* Current step info */}
                <div className="text-sm bg-dusty-rose/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-dusty-rose">
                      Step {progress.current_step + 1} of {totalSteps}
                    </span>
                    <span className="text-xs text-dusty-rose/70">
                      Current
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-0">
                <Button
                  onClick={() => handleContinue(progress)}
                  className="flex-1 btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
                  size="sm"
                >
                  Continue Baking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                      <Check className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to mark "{progress.bread_name}" as completed? This will move it to your baking history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleMarkCompleted(progress)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Completed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}