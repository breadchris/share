import { useState, useEffect } from "react";
import { BreadStep } from "./BreadTypes"; // Updated import
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { StepIngredientCard } from "./StepIngredientCard";
import { Clock, ChevronDown, ChevronRight, CheckCircle, ArrowRight, ChefHat, Utensils, Info, Play } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface EnhancedStepCardProps {
  step: BreadStep;
  stepNumber: number;
  isActive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  ingredients?: Array<{
    name: string;
    amount: string;
    unit?: string;
  }>;
  alwaysExpanded?: boolean;
  hideCollapseTrigger?: boolean;
}

export function EnhancedStepCard({ 
  step, 
  stepNumber, 
  isActive, 
  isCompleted, 
  isUpcoming,
  onStart,
  onComplete,
  ingredients = [],
  alwaysExpanded = false,
  hideCollapseTrigger = false
}: EnhancedStepCardProps) {
  const [isOpen, setIsOpen] = useState(isActive || alwaysExpanded);
  const [stepStarted, setStepStarted] = useState(false);

  // Ensure card is always expanded if alwaysExpanded is true
  useEffect(() => {
    if (alwaysExpanded) {
      setIsOpen(true);
    }
  }, [alwaysExpanded]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleStartStep = () => {
    setStepStarted(true);
    onStart?.();
  };

  const handleCompleteStep = () => {
    onComplete?.();
  };

  // Get step description - handle both 'instruction' and 'description' fields for compatibility
  const getStepDescription = () => {
    return step.instruction || (step as any).description || '';
  };

  // Handle tips - can be string or array for backward compatibility
  const getTipsContent = () => {
    if (!step.tips) return null;
    
    if (typeof step.tips === 'string') {
      // If tips is a string, return it as a single paragraph
      return <p className="text-muted-foreground">{step.tips}</p>;
    } else if (Array.isArray(step.tips)) {
      // If tips is an array, render as a list
      return (
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          {step.tips.map((tip, index) => (
            <li key={index} className="pl-2">{tip}</li>
          ))}
        </ul>
      );
    }
    
    return null;
  };

  return (
    <Card 
      className={`
        transition-all duration-300 overflow-hidden
        ${isActive ? 'ring-2 ring-amber-400 shadow-md' : ''}
        ${isCompleted ? 'bg-amber-50/50' : 'bg-card'}
      `}
    >
      <Collapsible open={isOpen} onOpenChange={alwaysExpanded ? undefined : setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 rounded-full items-center justify-center bg-amber-100 text-amber-900 font-serif text-lg">
              {isCompleted ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : stepStarted ? (
                <Play className="h-5 w-5 text-deep-olive" />
              ) : (
                stepNumber
              )}
            </div>
            <CardTitle className="text-lg sm:text-xl">
              {step.title}
            </CardTitle>
            {stepStarted && !isCompleted && (
              <Badge variant="outline" className="bg-deep-olive/10 text-deep-olive border-deep-olive">
                In Progress
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge 
              variant={step.isActiveTime ? "default" : "outline"}
              className={`
                ${step.isActiveTime 
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-200' 
                  : 'bg-transparent text-amber-700 border-amber-200'
                }
                px-3 py-1 text-sm
              `}
            >
              <Clock className="h-4 w-4 mr-2" />
              {formatDuration(step.duration)}
            </Badge>
            
            {!hideCollapseTrigger && (
              <CollapsibleTrigger
                className="text-amber-700 hover:text-amber-900"
              >
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </CollapsibleTrigger>
            )}
          </div>
        </CardHeader>
        
        <CollapsibleContent forceMount={alwaysExpanded}>
          <CardContent className="p-6">
            {/* Ingredients section - Displayed prominently at top */}
            {ingredients.length > 0 && (
              <div className="mb-5 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center mb-3">
                  <ChefHat className="h-5 w-5 text-amber-700 mr-2" />
                  <h4 className="font-medium text-amber-800 text-lg font-serif italic">
                    Ingredients for This Step
                  </h4>
                </div>
                
                <div className="grid gap-3">
                  {ingredients.map((ingredient, index) => (
                    <StepIngredientCard 
                      key={index}
                      name={ingredient.name}
                      amount={ingredient.amount}
                      unit={ingredient.unit}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Optional step image */}
            {(step as any).imageUrl && (
              <div className="mb-5 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={(step as any).imageUrl}
                  alt={step.title}
                  width={800}
                  height={400}
                  className="w-full object-cover"
                />
              </div>
            )}
            
            {/* Instructions section */}
            <div className="prose prose-amber max-w-none mb-6">
              <h4 className="flex items-center text-base font-medium text-amber-900 mb-3">
                <Utensils className="h-4 w-4 mr-2 text-amber-700" />
                Instructions:
              </h4>
              <p className="text-base sm:text-lg">{getStepDescription()}</p>
            </div>
            
            {/* Temperature section - if available */}
            {step.temperature && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Temperature: </span>
                  <span className="text-blue-700 ml-1">{step.temperature}</span>
                </div>
              </div>
            )}
            
            {/* Tips section - handle both string and array formats */}
            {step.tips && (
              <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
                <h4 className="text-base font-medium text-amber-900 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-amber-700" />
                  Tips:
                </h4>
                {getTipsContent()}
              </div>
            )}
          </CardContent>
          
          {/* Action buttons - only show for active steps */}
          {isActive && !alwaysExpanded && (onStart || onComplete) && (
            <CardFooter className="p-4 pt-0 flex justify-end gap-3">
              {/* Show Start button if step hasn't been started yet and isn't completed */}
              {!stepStarted && !isCompleted && onStart && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartStep}
                  className="border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Step
                </Button>
              )}
              
              {/* Show Complete button if step has been started or is already in progress */}
              {(stepStarted || isCompleted) && onComplete && (
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleCompleteStep}
                  disabled={isCompleted}
                >
                  {isCompleted ? 'Completed' : 'Complete & Next Step'}
                  {!isCompleted && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}