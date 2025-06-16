
import { BreadStep } from "./bread-recipe";
import { format, isToday, isTomorrow, isYesterday, addDays, isSameDay } from "date-fns";

interface ProgressTrackerProps {
  steps: BreadStep[];
  currentStepIndex: number;
  completedSteps: string[];
  startTimes?: Map<string, Date>;
}

export function ProgressTracker({ 
  steps, 
  currentStepIndex, 
  completedSteps,
  startTimes
}: ProgressTrackerProps) {
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;
  
  // Group steps by day for more meaningful progress tracking
  const getDaysWithSteps = () => {
    if (!startTimes || startTimes.size === 0) return [];
    
    const dayMap = new Map<string, {
      date: Date,
      steps: {id: string, index: number}[]
    }>();
    
    steps.forEach((step, index) => {
      const startTime = startTimes.get(step.id);
      if (!startTime) return;
      
      const dateKey = format(startTime, 'yyyy-MM-dd');
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: new Date(startTime),
          steps: []
        });
      }
      
      dayMap.get(dateKey)!.steps.push({
        id: step.id,
        index
      });
    });
    
    return Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  
  // Format the date for display
  const formatDateLabel = (date?: Date) => {
    if (!date) return "";
    
    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };
  
  const getStepProgressLabel = (stepId: string) => {
    const startTime = startTimes?.get(stepId);
    if (!startTime) return null;
    
    return format(startTime, 'h:mm a');
  };
  
  const daysWithSteps = getDaysWithSteps();
  const currentStep = steps[currentStepIndex];
  const currentStepStartTime = startTimes?.get(currentStep?.id);
  const currentStepDay = currentStepStartTime ? format(currentStepStartTime, 'yyyy-MM-dd') : null;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <h3>Baking Progress</h3>
        <span>{completedCount} of {totalSteps} steps completed</span>
      </div>
      
      {/* Main progress bar */}
      <div className="w-full h-3 bg-secondary rounded-full mb-4">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Multi-day progress view */}
      {daysWithSteps.length > 0 && (
        <div className="space-y-4">
          {daysWithSteps.map((day, dayIndex) => {
            const isCurrentDay = currentStepDay === format(day.date, 'yyyy-MM-dd');
            const dayLabel = formatDateLabel(day.date);
            const stepsOnThisDay = day.steps;
            
            return (
              <div key={dayIndex} className={`border rounded-lg p-3 ${isCurrentDay ? 'border-primary bg-blue-50' : ''}`}>
                <div className="flex items-center mb-2">
                  <h4 className={`text-sm ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dayLabel}
                  </h4>
                  {isCurrentDay && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Current Day
                    </span>
                  )}
                </div>
                
                {/* Mobile optimized view hides steps with just progress markers */}
                <div className="md:hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      {stepsOnThisDay.length} steps
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stepsOnThisDay.filter(s => completedSteps.includes(s.id)).length} completed
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(stepsOnThisDay.filter(s => completedSteps.includes(s.id)).length / stepsOnThisDay.length) * 100}%` }}
                    />
                  </div>
                  {/* Current step indicator for mobile */}
                  {stepsOnThisDay.some(s => s.index === currentStepIndex) && (
                    <div className="mt-2 px-2 py-1 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800">
                      Current: {steps[currentStepIndex].title}
                    </div>
                  )}
                </div>
                
                {/* Steps for this day - desktop view */}
                <div className="hidden md:flex justify-between items-center">
                  {stepsOnThisDay.map((stepInfo, stepIdx) => {
                    const step = steps[stepInfo.index];
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = stepInfo.index === currentStepIndex;
                    const stepStartTime = startTimes?.get(step.id);
                    const timeLabel = stepStartTime ? format(stepStartTime, 'h:mm a') : '';
                    
                    return (
                      <div 
                        key={stepInfo.id} 
                        className={`flex flex-col items-center ${stepIdx < stepsOnThisDay.length - 1 ? 'flex-1' : ''}`}
                      >
                        <div className="flex items-center flex-1 w-full">
                          {/* Progress line between steps */}
                          {stepIdx > 0 && (
                            <div className={`h-0.5 flex-1 -ml-2 ${
                              isCompleted || completedSteps.includes(stepsOnThisDay[stepIdx - 1].id) 
                                ? 'bg-primary' 
                                : 'bg-muted'
                            }`} />
                          )}
                          
                          {/* Step indicator dot */}
                          <div 
                            className={`rounded-full border-2 w-5 h-5 flex items-center justify-center ${
                              isCompleted ? 'bg-primary border-primary' : 
                              isCurrent ? 'bg-white border-primary' : 
                              'bg-white border-muted'
                            }`}
                          >
                            {isCompleted && (
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 text-white" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          
                          {/* Line after the last step */}
                          {stepIdx < stepsOnThisDay.length - 1 && (
                            <div className={`h-0.5 flex-1 -mr-2 ${
                              isCompleted ? 'bg-primary' : 'bg-muted'
                            }`} />
                          )}
                        </div>
                        
                        {/* Step name and time */}
                        <div className={`text-xs mt-1 max-w-24 truncate text-center ${
                          isCurrent ? 'text-primary font-medium' : 
                          isCompleted ? 'text-muted-foreground' : 
                          'text-muted-foreground'
                        }`}>
                          {step.title.split('/')[0]}
                        </div>
                        
                        {/* Time indicator */}
                        <div className="text-xs text-muted-foreground">
                          {timeLabel}
                        </div>
                        
                        {/* Current step indicator */}
                        {isCurrent && (
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary mt-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
