import { useState } from "react";
import { BreadStep } from "./bread-recipe";
import { Card, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { EnhancedStepCard } from "./EnhancedStepCard";
import { ArrowRight, ArrowLeft, Play } from "lucide-react";

interface StepByStepViewProps {
  steps: BreadStep[];
  currentStepIndex: number;
  completedSteps: string[];
  onStart?: (stepId: string, stepIndex: number) => void;
  onComplete: (stepId: string, stepIndex: number) => void;
  onStepChange: (newIndex: number) => void;
  ingredients: Array<{
    name: string;
    amount: string;
    unit?: string;
    stepId: string;
  }>;
}

export function StepByStepView({
  steps,
  currentStepIndex,
  completedSteps,
  onStart,
  onComplete,
  onStepChange,
  ingredients
}: StepByStepViewProps) {
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isCompleted = currentStep ? completedSteps.includes(currentStep.id) : false;
  const [stepStarted, setStepStarted] = useState(false);
  
  // Safety check if current step index is out of bounds
  if (!currentStep) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">No step found</h3>
        <p className="text-muted-foreground">The selected step does not exist.</p>
        <Button 
          className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => onStepChange(0)}
        >
          Go to first step
        </Button>
      </div>
    );
  }
  
  // Filter ingredients for the current step
  const stepIngredients = ingredients.filter(ing => ing.stepId === currentStep.id);
  
  // Calculate progress percentage
  const progressPercentage = Math.round(((currentStepIndex + (isCompleted ? 1 : 0)) / steps.length) * 100);

  const handleStartStep = () => {
    setStepStarted(true);
    onStart?.(currentStep.id, currentStepIndex);
  };

  const handleCompleteStep = () => {
    onComplete(currentStep.id, currentStepIndex);
  };

  return (
    <div className="space-y-6">
      {/* Progress bar and step counter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-amber-100" />
      </div>
      
      {/* Main step card using EnhancedStepCard */}
      <Card className="border-amber-200 shadow-md overflow-hidden">
        <EnhancedStepCard 
          step={currentStep}
          stepNumber={currentStepIndex + 1}
          isActive={true}
          isCompleted={isCompleted}
          isUpcoming={false}
          ingredients={stepIngredients}
          alwaysExpanded={true}
          hideCollapseTrigger={true}
        />
        
        <CardFooter className="p-4 border-t border-amber-100 flex justify-between">
          <Button
            variant="outline"
            onClick={() => onStepChange(currentStepIndex - 1)}
            disabled={isFirstStep}
            className="border-amber-300 text-amber-900 hover:bg-amber-100/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Step
          </Button>
          
          <div className="flex gap-3">
            {/* Show Start button if step hasn't been started yet and isn't completed */}
            {!stepStarted && !isCompleted && (
              <Button
                variant="outline"
                onClick={handleStartStep}
                className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Step
              </Button>
            )}
            
            {isCompleted ? (
              <Button
                variant="outline"
                onClick={() => onStepChange(currentStepIndex + 1)}
                disabled={isLastStep}
                className="bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={handleCompleteStep}
                disabled={!stepStarted}
                className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
              >
                Complete & Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}