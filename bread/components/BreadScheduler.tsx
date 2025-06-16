import { useState, useEffect } from "react";
import { BreadStep } from "./bread-recipe";
import { EnhancedStepCard } from "./EnhancedStepCard";
import { EnhancedProgressTracker } from "./EnhancedProgressTracker";
import { TimelinePlanner } from "./TimelinePlanner";
import { CalendarExport } from "./CalendarExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TimeAdjustmentNotification } from "./TimeAdjustmentNotification";
import { Button } from "./ui/button";
import { StepByStepView } from "./StepByStepView";
import { 
  ArrowDownToLine, 
  ClipboardList, 
  ListChecks, 
  BookOpenText
} from "lucide-react";

interface BreadSchedulerProps {
  breadRecipe: BreadStep[];
  breadName: string;
  ingredients: any[];
  currentStep?: number;
  completedSteps?: string[];
  onStepStart?: (stepId: string, stepIndex: number) => void;
  onStepComplete?: (stepId: string, stepIndex: number) => void;
Start?: (stepId: string, stepIndex: number) => void;
  onStepComplete?: (stepId: string, stepIndex: number) => void;
}

export function BreadScheduler({ 
  breadRecipe, 
  breadName, 
  ingredients,
  currentStep = 0,
  completedSteps = [],
  onStepStart,
  onStepComplete
}: BreadSchedulerProps) {
  const [startingTime, setStartingTime] = useState<Date>(new Date());
  const [activeStep, setActiveStep] = useState<number>(currentStep);
  const [timeAdjustment, setTimeAdjustment] = useState<{ message: string; type: "info" | "warning" | "success" } | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(completedSteps);
  const [stepStartTimes, setStepStartTimes] = useState<Map<string, Date>>(new Map());
  const [viewMode, setViewMode] = useState<"all-steps" | "focused-step">("focused-step");

  // Update local state when props change (e.g., when loading saved progress)
  useEffect(() => {
    setActiveStep(currentStep);
    setCompletedStepIds(completedSteps);
  }, [currentStep, completedSteps]);

  // Initialize step start times
  useEffect(() => {
    const times = new Map<string, Date>();
    let currentTime = new Date(startingTime);
    
    breadRecipe.forEach(step => {
      times.set(step.id, new Date(currentTime));
      
      // Add step duration to current time for next step
      currentTime = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + step.duration);
    });
    
    setStepStartTimes(times);
  }, [breadRecipe, startingTime]);

  const handleTimeChange = (newTime: Date) => {
    setStartingTime(newTime);
  };

  const handleStepStart = (stepId: string, stepIndex: number) => {
    // Update local active step state
    setActiveStep(stepIndex);
    
    // Notify parent component
    onStepStart?.(stepId, stepIndex);
    
    // Show info notification
    setTimeAdjustment({
      message: `Started: ${breadRecipe[stepIndex].title}`,
      type: "info"
    });
    
    // Clear notification after a few seconds
    setTimeout(() => {
      setTimeAdjustment(null);
    }, 3000);
  };

  const handleStepComplete = (stepId: string, stepIndex: number) => {
    setCompletedStepIds(prev => [...prev, stepId]);
    setActiveStep(stepIndex + 1);
    
    // Notify parent component
    onStepComplete?.(stepId, stepIndex);
    
    // Show success notification
    setTimeAdjustment({
      message: `Step completed! ${breadRecipe[stepIndex + 1] ? `Moving to ${breadRecipe[stepIndex + 1].title}` : 'All steps complete!'}`,
      type: "success"
    });
    
    // Clear notification after a few seconds
    setTimeout(() => {
      setTimeAdjustment(null);
    }, 3000);
  };

  const handleTimeAdjustment = (message: string, type: "info" | "warning" | "success" = "info") => {
    setTimeAdjustment({ message, type });
    
    // Clear notification after a few seconds
    setTimeout(() => {
      setTimeAdjustment(null);
    }, 3000);
  };

  const handleStepChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < breadRecipe.length) {
      setActiveStep(newIndex);
      
      // If jumping to a new step, trigger the step start handler
      const step = breadRecipe[newIndex];
      if (step && !completedStepIds.includes(step.id)) {
        handleStepStart(step.id, newIndex);
      }
    }
  };

  // Safety check for empty recipe
  if (!breadRecipe || breadRecipe.length === 0) {
    return (
      <div className="p-6 text-center border border-amber-200 rounded-lg bg-amber-50">
        <h3 className="text-lg font-medium mb-2">No recipe steps found</h3>
        <p className="text-muted-foreground">Please select a recipe to begin baking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {timeAdjustment && (
        <TimeAdjustmentNotification 
          message={timeAdjustment.message} 
          type={timeAdjustment.type} 
        />
      )}
      
      <EnhancedProgressTracker 
        steps={breadRecipe} 
        activeStep={activeStep}
        completedSteps={completedStepIds}
        startTimes={stepStartTimes}
        breadName={breadName}
      />
      
      <div className="flex justify-end space-x-2 mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setViewMode(viewMode === "all-steps" ? "focused-step" : "all-steps")}
          className="border-amber-300 text-amber-900 hover:bg-amber-100"
        >
          {viewMode === "all-steps" ? (
            <>
              <BookOpenText className="h-4 w-4 mr-2" />
              Show One Step at a Time
            </>
          ) : (
            <>
              <ListChecks className="h-4 w-4 mr-2" />
              Show All Steps
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps" className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" />
            Step by Step
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center">
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Timeline View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="steps" className="pt-4">
          {viewMode === "focused-step" ? (
            <StepByStepView 
              steps={breadRecipe}
              currentStepIndex={activeStep}
              completedSteps={completedStepIds}
              onStart={handleStepStart}
              onComplete={handleStepComplete}
              onStepChange={handleStepChange}
              ingredients={ingredients}
            />
          ) : (
            <div className="space-y-6">
              {breadRecipe.map((step, index) => (
                <EnhancedStepCard 
                  key={step.id}
                  step={step} 
                  stepNumber={index + 1}
                  isActive={index === activeStep}
                  isCompleted={completedStepIds.includes(step.id)}
                  isUpcoming={index > activeStep}
                  onStart={() => handleStepStart(step.id, index)}
                  onComplete={() => handleStepComplete(step.id, index)}
                  ingredients={ingredients.filter(ing => ing.stepId === step.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="pt-4">
          <TimelinePlanner 
            steps={breadRecipe} 
            startingTime={startingTime}
            onTimeChange={handleTimeChange}
            activeStep={activeStep}
            completedSteps={completedStepIds}
          />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 border-t border-amber-100 pt-6">
        <CalendarExport 
          breadName={breadName} 
          steps={breadRecipe} 
          startTimes={stepStartTimes} 
        />
      </div>
    </div>
  );
}