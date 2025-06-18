import { useState, useEffect } from "react";
import { BreadSelector } from "./components/BreadSelector";
import { BreadScheduler } from "./components/BreadScheduler";
import { BreadRecipe } from "./components/BreadTypes";
import { Button } from "./components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Coffee, Plus, User, Sparkles, Brain, Video } from "lucide-react";
import { UserProvider, useUser } from "./contexts/UserContext";
import { AuthModal } from "./components/auth/AuthModal";
import { UserMenu } from "./components/auth/UserMenu";
import { ProgressManager } from "./components/ProgressManager";
import { Toaster } from 'sonner';
import { SchedulingWizard } from "./components/SchedulingWizard";
import { CommunityBakingProgress } from "./components/CommunityBakingProgress";
import { BreadPhotoUploader } from "./components/BreadPhotoUploader";
import { CompletionCelebration } from "./components/CompletionCelebration";
import { UserInProgressBread } from "./components/UserInProgressBread";
import { ProfilePage } from "./components/profile/ProfilePage";
import { BakingHistory } from "./components/profile/BakingHistory";
import { RecipeCreator } from "./components/recipes/RecipeCreator";
import { CreateRecipePage } from "./components/recipes/CreateRecipePage";
import { AIRecipeCreator } from "./components/recipes/AIRecipeCreator";
import { YouTubeRecipeImporter } from "./components/recipes/YouTubeRecipeImporter";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { toast } from 'sonner';
import { saveProgress, SaveResult, getRecipe } from "./lib/supabase";
import { TimelineView } from "./components/TimelineView";
import React from "react";
import ReactDOM from "react-dom/client";

// Define the application routes
type AppRoute = 
  | "home" 
  | "onboarding"
  | "profile" 
  | "baking-history" 
  | "scheduling" 
  | "baking" 
  | "completed" 
  | "sharing"
  | "my-recipes"
  | "create-recipe"
  | "ai-create-recipe"
  | "youtube-create-recipe"
  | "edit-recipe"
  | "timeline";

function AppContent() {
  const [selectedBread, setSelectedBread] = useState<BreadRecipe | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [expectedFinishTime, setExpectedFinishTime] = useState<Date>(new Date());
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stepStartTimes, setStepStartTimes] = useState<Map<string, Date>>(new Map());
  const [route, setRoute] = useState<AppRoute>("home");
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  
  // Add a key to force RecipeCreator to refresh when a recipe is created
  const [recipeListKey, setRecipeListKey] = useState(0);
  
  // Add state for recipe editing
  const [editingRecipe, setEditingRecipe] = useState<BreadRecipe | null>(null);
  
  // Add state for onboarding flow (now stored in session state only)
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  const { user, isLoading: isUserLoading } = useUser();
  
  // Check if user should see onboarding on first visit (session-based only)
  useEffect(() => {
    // For new users, always show onboarding prompt unless they've already completed it this session
    if (!hasCompletedOnboarding && route === "home" && !isUserLoading && user) {
      setShowOnboardingPrompt(true);
    }
  }, [route, hasCompletedOnboarding, isUserLoading, user]);
  
  // Save progress when steps are completed or current step changes
  useEffect(() => {
    const saveBreadProgress = async () => {
      if (user && selectedBread && (completedSteps.length > 0 || currentStep > 0)) {
        try {
          const result = await saveProgress(
            user.id,
            selectedBread.id,
            selectedBread.name,
            currentStep,
            completedSteps,
            startTime,
            expectedFinishTime
          );
          
          if (result.success) {
            console.log('✅ Progress saved successfully');
            // Only show success toast occasionally for auto-saves to avoid spam
            if (Math.random() < 0.1) { // 10% chance to show toast for auto-saves
              toast.success('Progress saved', {
                description: "Your baking progress is securely stored"
              });
            }
          } else {
            console.log('❌ Failed to save progress');
            toast.error('Failed to save progress', {
              description: result.error || "Database connection failed"
            });
          }
        } catch (error) {
          console.log('❌ Error saving progress:', error);
          toast.error('Failed to save progress', {
            description: "An unexpected error occurred"
          });
        }
      }
    };
    
    saveBreadProgress();
  }, [user, selectedBread, currentStep, completedSteps, startTime, expectedFinishTime]);
  
  // Check if viewing on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Check if all steps are completed
  useEffect(() => {
    if (selectedBread && completedSteps.length > 0) {
      const isAllCompleted = completedSteps.length === selectedBread.steps.length;
      if (isAllCompleted && route === "baking") {
        // All steps completed, show celebration
        setRoute("completed");
      }
    }
  }, [completedSteps, selectedBread, route]);
  
  const handleSelectBread = (recipe: BreadRecipe) => {
    setSelectedBread(recipe);
    setRoute("scheduling");
    // Reset progress when selecting a new bread
    setCurrentStep(0);
    setCompletedSteps([]);
    setUploadedPhotoUrl(null);
    
    // Calculate expected finish time based on total recipe time
    const totalMinutes = recipe.steps.reduce((acc, step) => acc + step.duration, 0);
    const now = new Date();
    setStartTime(now);
    
    const finish = new Date(now);
    finish.setMinutes(finish.getMinutes() + totalMinutes);
    setExpectedFinishTime(finish);
  };
  
  const handleScheduleConfirm = async (startTimes: Map<string, Date>) => {
    setStepStartTimes(startTimes);
    
    // Update start time and finish time based on the scheduled times
    if (selectedBread && startTimes.size > 0) {
      const firstStep = selectedBread.steps[0];
      const firstStepStart = startTimes.get(firstStep.id);
      
      if (firstStepStart) {
        setStartTime(firstStepStart);
        
        // Calculate finish time based on the last step's end time
        const lastStep = selectedBread.steps[selectedBread.steps.length - 1];
        const lastStepStart = startTimes.get(lastStep.id);
        
        if (lastStepStart) {
          const finish = new Date(lastStepStart);
          finish.setMinutes(finish.getMinutes() + lastStep.duration);
          setExpectedFinishTime(finish);
        }
      }
    }
    
    // Navigate to timeline view instead of directly to baking
    setRoute("timeline");
  };
  
  const handleBackToSelection = () => {
    setSelectedBread(null);
    setRoute("home");
  };
  
  const handleBackToScheduling = () => {
    setRoute("scheduling");
  };
  
  const handleProceedToBaking = async () => {
    // Save initial baking progress when user begins baking
    if (user && selectedBread) {
      try {
        console.log('🚀 Beginning baking session - saving initial progress');
        
        const bakingStartTime = stepStartTimes.size > 0 && selectedBread.steps[0] 
          ? stepStartTimes.get(selectedBread.steps[0].id) || new Date()
          : new Date();
        
        const totalMinutes = selectedBread.steps.reduce((acc, step) => acc + step.duration, 0);
        const bakingFinishTime = new Date(bakingStartTime);
        bakingFinishTime.setMinutes(bakingFinishTime.getMinutes() + totalMinutes);
        
        const result = await saveProgress(
          user.id,
          selectedBread.id,
          selectedBread.name,
          0, // Starting at step 0
          [], // No completed steps yet
          bakingStartTime,
          bakingFinishTime
        );
        
        if (result.success) {
          console.log('✅ Initial baking progress saved successfully');
          toast.success(`Started baking ${selectedBread.name}!`, {
            description: "Your progress is being tracked"
          });
        } else {
          console.log('❌ Failed to save initial baking progress');
          toast.error('Failed to save baking progress', {
            description: result.error || "Database connection failed"
          });
        }
      } catch (error) {
        console.error('❌ Error saving initial baking progress:', error);
        toast.error('Failed to save baking progress', {
          description: "An unexpected error occurred"
        });
      }
    } else if (!user) {
      // User not logged in - show info message
      toast.info('Baking session started', {
        description: "Sign in to save your progress"
      });
    }
    
    // Navigate to baking view
    setRoute("baking");
  };
  
  const handleStepStart = async (stepId: string, stepIndex: number) => {
    console.log(`🚀 Step started: ${stepId} (index: ${stepIndex})`);
    
    // Update current step to the started step
    setCurrentStep(stepIndex);
    
    // Save progress immediately when step is started
    if (user && selectedBread) {
      try {
        const result = await saveProgress(
          user.id,
          selectedBread.id,
          selectedBread.name,
          stepIndex,
          completedSteps,
          startTime,
          expectedFinishTime
        );
        
        // Find the step name for the toast
        const step = selectedBread.steps.find(s => s.id === stepId);
        const stepName = step ? step.title : `Step ${stepIndex + 1}`;
        
        if (result.success) {
          console.log('✅ Progress saved on step start');
          toast.success(`Started: ${stepName}`, {
            description: "Progress saved"
          });
        } else {
          console.log('❌ Failed to save progress on step start');
          toast.error(`Started: ${stepName}`, {
            description: result.error || "Progress not saved"
          });
        }
      } catch (error) {
        console.error('❌ Error saving progress on step start:', error);
        toast.error('Failed to save progress', {
          description: "An unexpected error occurred"
        });
      }
    }
  };
  
  const handleStepComplete = (stepId: string, stepIndex: number) => {
    console.log(`✅ Step completed: ${stepId} (index: ${stepIndex})`);
    
    // Mark step as completed
    setCompletedSteps(prev => [...prev, stepId]);
    // Advance to next step
    setCurrentStep(stepIndex + 1);
    
    // Progress will be saved automatically via the useEffect hook
    if (selectedBread) {
      const step = selectedBread.steps.find(s => s.id === stepId);
      const stepName = step ? step.title : `Step ${stepIndex + 1}`;
      
      toast.success(`Completed: ${stepName}`, {
        description: "Great job! Moving to the next step."
      });
    }
  };
  
  const handleLoadProgress = (progress: any) => {
    if (!selectedBread) return;
    
    setCurrentStep(progress.current_step);
    setCompletedSteps(progress.completed_steps);
    setStartTime(new Date(progress.start_time));
    setExpectedFinishTime(new Date(progress.expected_finish_time));
    setRoute("baking");
  };
  
  const handleContinueToSharing = () => {
    setRoute("sharing");
  };
  
  const handlePhotoUploaded = (photoUrl: string) => {
    setUploadedPhotoUrl(photoUrl);
  };
  
  const handleBackToCelebration = () => {
    setRoute("completed");
  };
  
  const getTotalBakingTime = (): number => {
    if (!selectedBread) return 0;
    return selectedBread.steps.reduce((total, step) => total + step.duration, 0);
  };

  const handleContinueBaking = async (breadId: string, breadName: string, progress: any) => {
    try {
      console.log(`🔍 Looking for bread recipe with ID: ${breadId}`);
      
      // Try to fetch the recipe from database (user-created recipes only now)
      console.log(`🔍 Checking database for user-created recipe: ${breadId}`);
      
      try {
        const databaseRecipe = await getRecipe(breadId);
        
        if (databaseRecipe) {
          setSelectedBread(databaseRecipe);
          console.log(`✅ Using database recipe for ${databaseRecipe.name}`);
        } else {
          // If recipe not found, create a minimal recipe object as fallback
          console.log(`⚠️ Recipe ID "${breadId}" not found in database, creating minimal recipe`);
          
          setSelectedBread({
            id: breadId,
            name: breadName,
            description: "Continuing your bread baking journey...",
            difficulty: "Intermediate",
            prepTime: 60,
            totalTime: 240,
            servings: 4,
            ingredients: [],
            imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop",
            steps: [],
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isUserCreated: true
          } as BreadRecipe);
          
          console.log(`📝 Created minimal recipe for ${breadName}`);
        }
      } catch (dbError) {
        console.error(`❌ Error fetching recipe from database:`, dbError);
        
        // Create minimal recipe as fallback
        setSelectedBread({
          id: breadId,
          name: breadName,
          description: "Continuing your bread baking journey...",
          difficulty: "Intermediate",
          prepTime: 60,
          totalTime: 240,
          servings: 4,
          ingredients: [],
          imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop",
          steps: [],
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isUserCreated: true
        } as BreadRecipe);
        
        console.log(`📝 Created minimal recipe fallback for ${breadName}`);
      }
      
      // Load the progress and update current step, completed steps, etc.
      setCurrentStep(progress.current_step);
      setCompletedSteps(progress.completed_steps);
      setStartTime(new Date(progress.start_time));
      setExpectedFinishTime(new Date(progress.expected_finish_time));
      
      // Explicitly change the route to baking view
      setRoute("baking");
      
      toast.success(`Continuing with your ${breadName}`, {
        description: "Your progress has been restored"
      });
    } catch (error) {
      console.error("❌ Error continuing bread baking:", error);
      toast.error("Could not continue baking", {
        description: "Please try selecting the bread again from your recipes"
      });
    }
  };

  const handleProfileClick = () => {
    setRoute("profile");
  };

  const handleHistoryClick = () => {
    setRoute("baking-history");
  };

  const handleMyRecipesClick = () => {
    setRoute("my-recipes");
  };

  const handleCreateRecipeClick = () => {
    setRoute("create-recipe");
    setEditingRecipe(null); // Clear any editing state
  };

  const handleAICreateRecipeClick = () => {
    setRoute("ai-create-recipe");
    setEditingRecipe(null); // Clear any editing state
  };

  const handleYouTubeCreateRecipeClick = () => {
    setRoute("youtube-create-recipe");
    setEditingRecipe(null); // Clear any editing state
  };

  const handleEditRecipeClick = (recipe: BreadRecipe) => {
    setEditingRecipe(recipe);
    setRoute("edit-recipe");
  };

  const handleRecipeCreated = (recipe: BreadRecipe) => {
    console.log('✅ Recipe created successfully:', recipe.name);
    
    // Navigate back to my recipes page
    setRoute("my-recipes");
    
    // Trigger a refresh of the recipe list by updating the key
    setRecipeListKey(prev => prev + 1);
    
    // Show success toast
    toast.success(`Recipe "${recipe.name}" created successfully!`, {
      description: "Your new recipe is now available in your collection"
    });
  };

  const handleRecipeUpdated = (recipe: BreadRecipe) => {
    console.log('✅ Recipe updated successfully:', recipe.name);
    
    // Clear editing state
    setEditingRecipe(null);
    
    // Navigate back to my recipes page
    setRoute("my-recipes");
    
    // Trigger a refresh of the recipe list by updating the key
    setRecipeListKey(prev => prev + 1);
    
    // Show success toast
    toast.success(`Recipe "${recipe.name}" updated successfully!`);
  };

  // Handler specifically for AI-generated recipes
  const handleAIRecipeGenerated = (recipe: BreadRecipe) => {
    console.log('✅ AI Recipe generated successfully:', recipe.name);
    
    // Navigate back to my recipes page
    setRoute("my-recipes");
    
    // Trigger a refresh of the recipe list by updating the key
    setRecipeListKey(prev => prev + 1);
    
    // Show success toast with AI-specific messaging
    toast.success(`AI-generated recipe "${recipe.name}" created!`, {
      description: "Your new AI-powered recipe is ready to bake"
    });
  };

  // Onboarding handlers (session-based only, no localStorage)
  const handleStartOnboarding = () => {
    setShowOnboardingPrompt(false);
    setRoute("onboarding");
  };

  const handleSkipOnboarding = () => {
    setShowOnboardingPrompt(false);
    setHasCompletedOnboarding(true);
  };

  const handleOnboardingComplete = (recommendedRecipe?: BreadRecipe) => {
    setHasCompletedOnboarding(true);
    
    if (recommendedRecipe) {
      // User selected a recommended recipe
      handleSelectBread(recommendedRecipe);
      toast.success(`Great choice! Let's start with ${recommendedRecipe.name}`, {
        description: "We'll guide you through every step of the way"
      });
    } else {
      // User completed onboarding but didn't select a recipe
      setRoute("home");
      toast.success("Welcome to your bread baking journey!", {
        description: "You can now browse all your recipes below"
      });
    }
  };

  const handleRestartOnboarding = () => {
    setHasCompletedOnboarding(false);
    setRoute("onboarding");
  };

  const renderContent = () => {
    if (route === "onboarding") {
      return (
        <OnboardingWizard 
          onComplete={handleOnboardingComplete}
          onBack={handleBackToSelection}
        />
      );
    }

    if (route === "profile") {
      return <ProfilePage onBack={handleBackToSelection} />;
    }

    if (route === "baking-history") {
      return (
        <div className="container-cozy section-cozy">
          <Button 
            variant="ghost" 
            onClick={handleBackToSelection}
            className="mb-6 text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to baking
          </Button>
          
          <h1 className="mb-6">Baking History</h1>
          
          {user && <BakingHistory userId={user.id} />}
        </div>
      );
    }

    if (route === "my-recipes") {
      return (
        <div className="container-cozy section-cozy">
          <Button 
            variant="ghost" 
            onClick={handleBackToSelection}
            className="mb-6 text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to baking
          </Button>
          
          {/* Add key prop to force refresh when recipes are created */}
          <RecipeCreator 
            key={recipeListKey}
            onSelectRecipe={handleSelectBread}
            onEditRecipe={handleEditRecipeClick}
            onCreateNewRecipe={handleCreateRecipeClick}
            onCreateAIRecipe={handleAICreateRecipeClick}
            onCreateYouTubeRecipe={handleYouTubeCreateRecipeClick}
          />
        </div>
      );
    }

    if (route === "create-recipe") {
      return (
        <div className="container-cozy section-cozy">
          <CreateRecipePage
            onBack={() => setRoute("my-recipes")}
            onRecipeCreated={handleRecipeCreated}
            onNavigateToVideo={handleYouTubeCreateRecipeClick}
          />
        </div>
      );
    }

    if (route === "ai-create-recipe") {
      return (
        <div className="container-cozy section-cozy">
          <Button 
            variant="ghost" 
            onClick={() => setRoute("my-recipes")}
            className="mb-6 text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to my recipes
          </Button>
          
          <header className="text-center space-m">
            <h1 className="flex items-center justify-center gap-3">
              <Brain className="h-8 w-8 text-dusty-rose" />
              AI Recipe Creator
            </h1>
            <p className="text-secondary max-w-2xl mx-auto">
              Generate unique bread recipes using AI. Upload photos of bread you'd like to recreate, 
              or describe your perfect loaf and let our AI create a detailed recipe for you.
            </p>
          </header>
          
          <AIRecipeCreator 
            onRecipeCreated={handleAIRecipeGenerated}
            onBack={() => setRoute("my-recipes")}
          />
        </div>
      );
    }

    if (route === "youtube-create-recipe") {
      return (
        <div className="container-cozy section-cozy">
          <Button 
            variant="ghost" 
            onClick={() => setRoute("my-recipes")}
            className="mb-6 text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to my recipes
          </Button>
          
          <header className="text-center space-m">
            <h1 className="flex items-center justify-center gap-3">
              <Video className="h-8 w-8 text-dusty-rose" />
              Create Recipe from YouTube Video
            </h1>
            <p className="text-secondary max-w-2xl mx-auto">
              Import a bread recipe from any YouTube video. Our tool will help you annotate the video 
              and extract the recipe steps, ingredients, and timing information.
            </p>
          </header>
          
          <YouTubeRecipeImporter 
            onRecipeCreated={handleRecipeCreated}
            onBack={() => setRoute("my-recipes")}
          />
        </div>
      );
    }

    if (route === "edit-recipe" && editingRecipe) {
      return (
        <div className="container-cozy section-cozy">
          <CreateRecipePage
            onBack={() => setRoute("my-recipes")}
            onRecipeCreated={handleRecipeUpdated}
            onNavigateToVideo={handleYouTubeCreateRecipeClick}
            editingRecipe={editingRecipe}
            isEditing={true}
          />
        </div>
      );
    }

    if (route === "home") {
      return (
        <>
          {/* Onboarding Prompt for New Users - only show to logged in users */}
          {showOnboardingPrompt && user && (
            <div className="relative overflow-hidden rounded-lg border-2 border-dusty-rose bg-gradient-to-r from-dusty-rose/10 to-warm-beige/20 p-6 mb-8">
              <div className="relative text-center">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-dusty-rose mr-3 animate-pulse" />
                  <h2 className="text-dusty-rose">New to bread baking?</h2>
                </div>
                <p className="text-secondary max-w-2xl mx-auto mb-6">
                  Let us help you create your first bread recipe! Our quick 2-minute guide will help you get started 
                  with creating custom recipes tailored to your skill level and schedule.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleStartOnboarding}
                    className="btn-primary bg-dusty-rose hover:bg-dusty-rose/90 text-cloud-white"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Started Guide
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSkipOnboarding}
                    className="border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-cloud-white"
                  >
                    Start Creating Recipes
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User's in-progress bread */}
          {user && (
            <div className="space-m">
              <UserInProgressBread 
                userId={user.id} 
                onContinueBaking={handleContinueBaking}
              />
            </div>
          )}
          
          {/* My Bread Recipes - Only show if user is logged in */}
          {user && (
            <div className="space-m">
              <div className="flex items-center justify-between">
                <div>
                  <h2>My Bread Recipes</h2>
                  <p className="text-secondary mt-2">
                    Your personal collection of bread recipes.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {/* Show restart onboarding button for users who have completed it */}
                  {hasCompletedOnboarding && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestartOnboarding}
                      className="border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-cloud-white hidden sm:flex"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Recipe Guide
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleCreateRecipeClick}
                    className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Recipe
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {user && (
            <div className="section-cozy">
              <BreadSelector onSelectBread={handleSelectBread} />
            </div>
          )}
          
          {/* Guest Welcome Section - show if user is not logged in */}
          {!user && (
            <div className="section-cozy">
              <div className="text-center max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-6">
                  <Coffee className="h-12 w-12 text-deep-olive mr-4" />
                  <h1>Welcome to Just Bread</h1>
                </div>
                <p className="text-secondary mb-8 text-lg leading-relaxed">
                  Create, share, and track your bread baking journey. From traditional sourdough to innovative recipes, 
                  our platform helps you document every step of your baking process.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-cloud-white/70 backdrop-blur-sm rounded-lg border border-soft-brown/20 p-6">
                    <Brain className="h-8 w-8 text-dusty-rose mx-auto mb-4" />
                    <h3 className="mb-3">AI Recipe Creation</h3>
                    <p className="text-secondary">Generate unique recipes using AI or import from YouTube videos</p>
                  </div>
                  
                  <div className="bg-cloud-white/70 backdrop-blur-sm rounded-lg border border-soft-brown/20 p-6">
                    <BookOpen className="h-8 w-8 text-deep-olive mx-auto mb-4" />
                    <h3 className="mb-3">Personal Collection</h3>
                    <p className="text-secondary">Build your own library of tested and perfected bread recipes</p>
                  </div>
                </div>
                
                <AuthModal />
              </div>
            </div>
          )}
          
          <div className="section-cozy">
            <header className="text-center space-m">
              <h2>Join the Baking Community</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See what fellow bakers are creating around the world. Join them by starting your own bread journey.
              </p>
            </header>
            
            <CommunityBakingProgress />
          </div>
          
          <div className="relative overflow-hidden rounded-lg border border-soft-brown/30 p-l section-cozy" style={{
            background: 'linear-gradient(135deg, rgba(246, 240, 228, 0.9) 0%, rgba(163, 138, 114, 0.1) 50%, rgba(246, 240, 228, 0.9) 100%)'
          }}>
            {/* Subtle pattern overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(163, 138, 114, 0.3) 2px, transparent 2px),
                                 radial-gradient(circle at 80% 50%, rgba(109, 112, 83, 0.3) 1px, transparent 1px)`,
                backgroundSize: '24px 24px, 16px 16px'
              }}
            />
            
            <div className="relative text-center">
              <div className="flex items-center justify-center mb-4">
                <Coffee className="h-6 w-6 text-deep-olive mr-2" />
                <h2>Why Bake with Us?</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Experience the zen of bread making with our mindful approach to baking. Every loaf tells a story.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-m mt-8 text-left">
                <div className="bg-cloud-white/70 backdrop-blur-sm rounded-lg border border-soft-brown/20 p-m hover-warm shadow-cozy">
                  <h3 className="mb-3">Smart Recipe Creation</h3>
                  <p className="text-secondary">Create recipes from scratch, import from videos, or generate with AI to build your perfect collection.</p>
                </div>
                
                <div className="bg-cloud-white/70 backdrop-blur-sm rounded-lg border border-soft-brown/20 p-m hover-warm shadow-cozy">
                  <h3 className="mb-3">Progress Tracking</h3>
                  <p className="text-secondary">Track your baking sessions with detailed timing and step-by-step guidance.</p>
                </div>
                
                <div className="bg-cloud-white/70 backdrop-blur-sm rounded-lg border border-soft-brown/20 p-m hover-warm shadow-cozy">
                  <h3 className="mb-3">Community Connection</h3>
                  <p className="text-secondary">Share your journey with fellow bakers who appreciate the craft and patience of bread making.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (route === "scheduling" && selectedBread) {
      return (
        <>
          <Button 
            variant="ghost" 
            onClick={handleBackToSelection}
            className="mb-6 text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to recipes
          </Button>
          
          <header className="text-center space-m">
            <h1>{selectedBread.name}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {selectedBread.description}
            </p>
          </header>
          
          <SchedulingWizard 
            steps={selectedBread.steps} 
            onSchedule={handleScheduleConfirm} 
            breadName={selectedBread.name} 
          />
        </>
      );
    }

    if (route === "baking" && selectedBread) {
      return (
        <div>
          <div className="flex gap-3 mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToSelection}
              className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to recipes
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleBackToScheduling}
              className="border border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Adjust schedule
            </Button>
          </div>
          
          <header className="text-center space-m">
            <h1>{selectedBread.name}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {selectedBread.description}
            </p>
          </header>
          
          <ProgressManager
            breadId={selectedBread.id}
            breadName={selectedBread.name}
            currentStep={currentStep}
            completedSteps={completedSteps}
            startTime={startTime}
            expectedFinishTime={expectedFinishTime}
            steps={selectedBread.steps}
            onLoadProgress={handleLoadProgress}
          />
          
          <BreadScheduler 
            breadRecipe={selectedBread.steps} 
            breadName={selectedBread.name}
            ingredients={selectedBread.ingredients}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepStart={handleStepStart}
            onStepComplete={handleStepComplete}
          />
        </div>
      );
    }

    if (route === "completed" && selectedBread) {
      return (
        <div>
          <div className="flex gap-3 mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToSelection}
              className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to recipes
            </Button>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <CompletionCelebration 
              breadName={selectedBread.name}
              totalSteps={selectedBread.steps.length}
              totalTime={getTotalBakingTime()}
              onContinue={handleContinueToSharing}
            />
          </div>
        </div>
      );
    }

    if (route === "sharing" && selectedBread) {
      return (
        <div>
          <div className="flex gap-3 mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToSelection}
              className="text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to recipes
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleBackToCelebration}
              className="border border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to celebration
            </Button>
          </div>
          
          <header className="text-center space-m">
            <h1>{selectedBread.name}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Share your beautiful creation with the community!
            </p>
          </header>
          
          <div className="max-w-2xl mx-auto">
            <BreadPhotoUploader 
              userId={user?.id}
              breadId={selectedBread.id}
              breadName={selectedBread.name}
              onPhotoUploaded={handlePhotoUploaded}
            />
            
            {uploadedPhotoUrl && (
              <div className="mt-8 text-center">
                <Button 
                  variant="default" 
                  onClick={handleBackToSelection}
                  className="btn-primary"
                >
                  Start a New Bread
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (route === "timeline") {
      return (
        <>
          <Button 
            variant="ghost" 
            onClick={handleBackToSelection}
            className="mb-6 text-soft-brown hover:text-deep-olive hover:bg-dusty-rose/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to recipes
          </Button>
          
          {selectedBread && (
            <TimelineView
              steps={selectedBread.steps}
              breadName={selectedBread.name}
              stepStartTimes={stepStartTimes}
              onProceedToBaking={handleProceedToBaking}
              onBackToScheduling={handleBackToScheduling}
            />
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background py-6 sm:py-12 px-4 sm:px-6">
      <div className="container-cozy">
        {/* Enhanced Navigation Bar */}
        <nav className="bg-cloud-white/80 backdrop-blur-sm border border-border rounded-lg shadow-cozy p-4 mb-8">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Coffee className="h-6 w-6 text-deep-olive mr-3" />
              <h4 className="text-deep-olive">Just Bread</h4>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Recipe Actions for logged-in users */}
                  <div className="hidden sm:flex items-center gap-2 mr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMyRecipesClick}
                      className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white transition-colors"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Recipes
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={handleCreateRecipeClick}
                      className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Recipe
                    </Button>
                  </div>
                  
                  {/* Mobile: Show condensed recipe actions */}
                  <div className="sm:hidden flex items-center gap-2 mr-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMyRecipesClick}
                      className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white px-3"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={handleCreateRecipeClick}
                      className="btn-primary bg-deep-olive text-cloud-white hover:bg-deep-olive/90 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* User Menu */}
                  <UserMenu 
                    onProfileClick={handleProfileClick}
                    onHistoryClick={handleHistoryClick}
                    onMyRecipesClick={handleMyRecipesClick}
                  />
                </>
              ) : (
                <>
                  {/* Guest Actions */}
                  <div className="hidden sm:block mr-4">
                    <p className="text-xs text-secondary">
                      Sign in to create and manage your recipes
                    </p>
                  </div>
                  
                  {/* Auth Modal */}
                  <AuthModal />
                </>
              )}
            </div>
          </div>
        </nav>
        
        {/* Main content area */}
        {renderContent()}
        
        {/* Footer */}
        <footer className="section-cozy pt-8 border-t border-border">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Crafted with warmth for the mindful baker. Every loaf tells a story.
            </p>
          </div>
        </footer>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

// If not already present, add this at the end:
const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}