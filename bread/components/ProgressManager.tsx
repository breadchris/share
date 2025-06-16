import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "../contexts/UserContext";
import { saveProgress, getBreadProgress } from "../lib/supabase";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface ProgressManagerProps {
  breadId: string;
  breadName: string;
  currentStep: number;
  completedSteps: string[];
  startTime: Date;
  expectedFinishTime: Date;
  steps: any[];
  onLoadProgress: (progress: any) => void;
}

export function ProgressManager({
  breadId,
  breadName,
  currentStep,
  completedSteps = [], // Default to empty array to prevent undefined
  startTime,
  expectedFinishTime,
  steps = [], // Default to empty array to prevent undefined
  onLoadProgress
}: ProgressManagerProps) {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);

  // Check if user has existing progress when component mounts
  useEffect(() => {
    if (user && breadId) {
      checkForExistingProgress();
    }
  }, [user, breadId]);

  // Auto-save progress when steps change
  useEffect(() => {
    if (user && completedSteps && completedSteps.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveProgress();
      }, 5000); // Auto-save 5 seconds after changes

      return () => clearTimeout(autoSaveTimer);
    }
  }, [completedSteps, currentStep]);

  const checkForExistingProgress = async () => {
    if (!user) return;
    
    setIsLoadingProgress(true);
    
    try {
      // getBreadProgress only takes userId, not breadId
      const progressList = await getBreadProgress(user.id);
      
      // Find progress for this specific bread
      const progress = progressList?.find(p => p.bread_id === breadId && !p.is_completed);
      
      if (progress) {
        setHasProgress(true);
        
        // If we're just starting (no completed steps), offer to load previous progress
        if (!completedSteps || completedSteps.length === 0) {
          // Convert the dates from strings to Date objects
          progress.start_time = new Date(progress.start_time);
          progress.expected_finish_time = new Date(progress.expected_finish_time);
          
          // Auto-load if no steps completed in current session
          onLoadProgress(progress);
          toast.success("Loaded your previous progress");
        }
      }
    } catch (error) {
      console.error("Error checking for existing progress:", error);
      
      // Only show an error toast if this is a real error, not just no progress found
      if (error instanceof Error && !error.message.includes("not found")) {
        if (error.message.includes("fetch")) {
          toast.error("Could not connect to the server to check for existing progress.");
        } else {
          toast.error("Failed to check for existing progress.");
        }
      }
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!user) {
      toast.info("Sign in to save your progress");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const saved = await saveProgress(
        user.id,
        breadId,
        breadName,
        currentStep,
        completedSteps || [], // Ensure we always pass an array
        startTime,
        expectedFinishTime
      );
      
      if (saved) {
        setLastSaved(new Date());
        setHasProgress(true);
        toast.success("Progress saved");
      } else {
        throw new Error("Failed to save progress");
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          toast.error("Could not connect to the server to save your progress. Please try again when your connection is restored.");
        } else {
          toast.error(error.message || "Failed to save progress. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred while saving progress.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // If we're still loading or there's no user, don't show anything
  if (isLoadingProgress || !user) {
    return null;
  }

  // Safely check completedSteps length with null/undefined protection
  const hasCompletedSteps = completedSteps && Array.isArray(completedSteps) && completedSteps.length > 0;

  return (
    <div className="mb-6 flex justify-end">
      <Button
        variant="outline"
        onClick={handleSaveProgress}
        disabled={isSaving || !hasCompletedSteps}
        className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save Progress"}
      </Button>
      
      {lastSaved && (
        <div className="ml-2 text-xs text-muted-foreground flex items-center">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}