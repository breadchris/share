
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { BreadStep } from "./bread-recipe";
import { Check, Clock, Info, Calendar, ArrowRight } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { format, differenceInHours, isSameDay, addMinutes, differenceInMinutes } from "date-fns";

interface StepCardProps {
  step: BreadStep;
  isActive: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  startTime?: Date;
  nextStepTime?: Date | null;
}

export function StepCard({ 
  step, 
  isActive, 
  isCompleted, 
  onComplete,
  startTime,
  nextStepTime
}: StepCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(step.duration * 60); // in seconds
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if viewing on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      setTimerActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timerActive, timeRemaining]);

  useEffect(() => {
    if (startTime && isActive && !timerActive) {
      const now = new Date();
      // Only start the timer if we're after the start time
      if (now > startTime) {
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const remainingSeconds = Math.max(0, step.duration * 60 - elapsedSeconds);
        setTimeRemaining(remainingSeconds);
        setTimerActive(elapsedSeconds < step.duration * 60);
      }
    }
  }, [isActive, startTime, step.duration, timerActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  const getCompletionTime = () => {
    if (!startTime) return '';
    
    const endTime = new Date(startTime.getTime() + step.duration * 60 * 1000);
    const isMultiDayStep = !isSameDay(startTime, endTime);
    
    if (isMultiDayStep) {
      return `${format(endTime, 'MMM d')} at ${format(endTime, 'h:mm a')}`;
    }
    
    return format(endTime, 'h:mm a');
  };

  const getStepDuration = () => {
    const hours = Math.floor(step.duration / 60);
    const minutes = step.duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  const calculateProgress = () => {
    if (!timerActive) return 0;
    const totalSeconds = step.duration * 60;
    const progress = ((totalSeconds - timeRemaining) / totalSeconds) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getStepTimingIndicator = () => {
    if (!startTime) return null;
    
    const endTime = addMinutes(startTime, step.duration);
    const isMultiDayStep = !isSameDay(startTime, endTime);
    const durationHours = step.duration / 60;
    
    if (isMultiDayStep || durationHours >= 8) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Calendar className="h-3 w-3" />
          <span>
            {isMultiDayStep 
              ? `From ${format(startTime, 'MMM d')} to ${format(endTime, 'MMM d')}` 
              : `${durationHours.toFixed(1)} hour process`
            }
          </span>
        </div>
      );
    }
    
    return null;
  };
  
  const getNextStepIndicator = () => {
    if (!isActive || !nextStepTime) return null;
    
    const now = new Date();
    const minutesUntilNext = differenceInMinutes(nextStepTime, now);
    
    if (minutesUntilNext <= 0) {
      return (
        <div className={`mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-md ${isMobile ? 'flex flex-col gap-2' : 'flex items-center justify-between'}`}>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Next step is ready to start!</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className={isMobile ? 'self-end' : ''}
            onClick={onComplete}
          >
            Move to Next
          </Button>
        </div>
      );
    }
    
    if (minutesUntilNext < 60) {
      return (
        <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
          <Clock className="h-4 w-4 text-yellow-600 mr-2" />
          <span className="text-sm text-yellow-700">
            Next step in {minutesUntilNext} minute{minutesUntilNext !== 1 ? 's' : ''} at {format(nextStepTime, 'h:mm a')}
          </span>
        </div>
      );
    }
    
    return (
      <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md flex items-center">
        <Clock className="h-4 w-4 text-blue-500 mr-2" />
        <span className="text-sm text-blue-700">
          Next step at {format(nextStepTime, 'h:mm a')}
          {!isSameDay(nextStepTime, now) && ` on ${format(nextStepTime, 'MMM d')}`}
        </span>
      </div>
    );
  };

  return (
    <Card className={`p-4 sm:p-5 mb-4 transition-all duration-300 ${
      isActive ? 'border-primary shadow-md' : 
      isCompleted ? 'border-green-500 bg-green-50/50' : 
      'opacity-70'
    }`}>
      <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex justify-between items-start'} mb-2`}>
        <h3 className="flex items-center gap-2">
          {isCompleted && <Check className="text-green-500" />}
          {step.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            step.isActiveTime ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {step.isActiveTime ? 'Active' : 'Passive'}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground">
                  <Info size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <ul className="list-disc pl-4 space-y-1">
                  {step.tips?.map((tip, index) => (
                    <li key={index} className="text-xs">{tip}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Step timing indicator for long or multi-day steps */}
      {getStepTimingIndicator()}
      
      <p className="mb-3 text-sm sm:text-base">{step.description}</p>
      
      {isActive && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm">
              {timerActive ? (
                <>Timer: {formatTime(timeRemaining)}</>
              ) : (
                <>Duration: {getStepDuration()}</>
              )}
            </span>
          </div>
          
          {startTime && (
            <div className="text-sm text-muted-foreground">
              Estimated completion: {getCompletionTime()}
            </div>
          )}
          
          {timerActive && (
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-1000"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          )}
          
          {/* Next step indicator */}
          {getNextStepIndicator()}
        </div>
      )}
      
      {isActive && !isCompleted && !getNextStepIndicator() && (
        <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex justify-between items-center'} mt-4`}>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={() => setTimerActive(!timerActive)}
            disabled={timeRemaining === 0}
            className={isMobile ? 'w-full' : ''}
          >
            {timerActive ? 'Pause Timer' : timeRemaining === step.duration * 60 ? 'Start Timer' : 'Resume Timer'}
          </Button>
          <Button 
            onClick={onComplete}
            size={isMobile ? "sm" : "default"}
            className={isMobile ? 'w-full' : ''}
          >
            Mark as Complete
          </Button>
        </div>
      )}
    </Card>
  );
}
