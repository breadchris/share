import { BreadStep } from "./bread-recipe";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface EnhancedProgressTrackerProps {
  steps: BreadStep[];
  activeStep: number;
  completedSteps: string[];
  startTimes?: Map<string, Date>;
  breadName?: string;
}

export function EnhancedProgressTracker({ 
  steps, 
  activeStep,
  completedSteps,
  startTimes,
  breadName = "bread"
}: EnhancedProgressTrackerProps) {
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;
  
  // Calculate total active and passive time 
  const activeSteps = steps.filter(step => step.isActiveTime);
  const passiveSteps = steps.filter(step => !step.isActiveTime);
  
  const totalActiveTime = activeSteps.reduce((total, step) => total + step.duration, 0);
  const totalPassiveTime = passiveSteps.reduce((total, step) => total + step.duration, 0);
  
  const activeTimeHours = Math.floor(totalActiveTime / 60);
  const activeTimeMinutes = totalActiveTime % 60;
  
  const passiveTimeHours = Math.floor(totalPassiveTime / 60);
  const passiveTimeMinutes = totalPassiveTime % 60;
  
  // Group steps by day for more meaningful progress tracking
  const getDaysWithSteps = () => {
    if (!startTimes || startTimes.size === 0) return [];
    
    const dayMap = new Map<string, {
      date: Date,
      steps: {id: string, index: number, isActive: boolean}[]
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
        index,
        isActive: step.isActiveTime
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
      return format(date, "EEE, MMM d");
    }
  };
  
  const getStepProgressLabel = (stepId: string) => {
    const startTime = startTimes?.get(stepId);
    if (!startTime) return null;
    
    return format(startTime, 'h:mm a');
  };
  
  const daysWithSteps = getDaysWithSteps();
  const currentStep = steps[activeStep];
  const currentStepStartTime = startTimes?.get(currentStep?.id);
  const currentStepDay = currentStepStartTime ? format(currentStepStartTime, 'yyyy-MM-dd') : null;

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <div>
          <h3 className="font-serif italic text-lg">Your Baking Journey</h3>
          <p className="text-sm text-muted-foreground">
            Track your progress through the {breadName.toLowerCase()} baking process
          </p>
        </div>
        
        <Card className="flex flex-col sm:flex-row sm:justify-between items-center p-3 bg-amber-50/50 border-amber-200 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium">{completedCount} of {totalSteps} steps</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-800" />
              <div className="text-sm">
                <span className="font-medium">{activeTimeHours}h {activeTimeMinutes}m</span>
                <span className="text-xs text-muted-foreground ml-1">active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <span className="font-medium">{daysWithSteps.length}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {daysWithSteps.length === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>
        </Card>
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
            const completedOnThisDay = stepsOnThisDay.filter(s => completedSteps.includes(s.id)).length;
            const allCompletedOnThisDay = completedOnThisDay === stepsOnThisDay.length;
            const dayProgress = (completedOnThisDay / stepsOnThisDay.length) * 100;
            
            return (
              <Card key={dayIndex} className={`border p-3 ${
                isCurrentDay 
                  ? 'bg-amber-50 border-amber-300' 
                  : allCompletedOnThisDay 
                    ? 'bg-green-50 border-green-200'
                    : ''
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-medium ${isCurrentDay ? 'text-amber-900' : ''}`}>
                      {dayLabel}
                    </h4>
                    {isCurrentDay && (
                      <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-300">
                        Current Day
                      </Badge>
                    )}
                    {allCompletedOnThisDay && !isCurrentDay && (
                      <Badge className="bg-green-200 text-green-800 hover:bg-green-300">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {completedOnThisDay} of {stepsOnThisDay.length} steps complete
                  </div>
                </div>
                
                {/* Progress bar for this day */}
                <div className="w-full h-2 bg-secondary rounded-full mb-3">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      allCompletedOnThisDay ? 'bg-green-500' : 'bg-amber-600'
                    }`}
                    style={{ width: `${dayProgress}%` }}
                  />
                </div>
                
                {/* Steps for this day - compact view */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {stepsOnThisDay.map((stepInfo) => {
                    const step = steps[stepInfo.index];
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = stepInfo.index === activeStep;
                    const startTime = startTimes?.get(step.id);
                    
                    return (
                      <Badge
                        key={stepInfo.id}
                        variant={isCompleted ? "outline" : isCurrent ? "default" : "outline"}
                        className={`
                          ${stepInfo.isActive 
                            ? isCompleted 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : isCurrent 
                                ? 'bg-amber-200 text-amber-900 border-amber-300' 
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            : isCompleted 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : isCurrent 
                                ? 'bg-blue-200 text-blue-900 border-blue-300' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                          }
                          ${isCurrent ? 'ring-1 ring-offset-1 ring-amber-300' : ''}
                        `}
                      >
                        {stepInfo.isActive ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <Calendar className="h-3 w-3 mr-1" />
                        )}
                        <span className="truncate max-w-40">{step.title.split('/')[0]}</span>
                        {startTime && (
                          <span className="ml-1 text-xs opacity-80">
                            {format(startTime, 'h:mm')}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
                
                {/* Current step indicator for mobile */}
                {stepsOnThisDay.some(s => s.index === activeStep) && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800">
                    <strong>Current:</strong> {steps[activeStep].title}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}