
import { useState, useEffect } from "react";
import { BreadStep, getTotalTime } from "./bread-recipe";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  FastForward,
  CalendarIcon,
  ListIcon 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  format, 
  addDays, 
  isSameDay, 
  differenceInDays, 
  isAfter, 
  isBefore,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isToday
} from "date-fns";
import mobilePlannerImage from 'figma:asset/5e7c3488d9e8dc81f0f6d97042e493cd37f893a5.png';

interface TimelinePlannerProps {
  steps: BreadStep[];
  onSchedule: (startTimes: Map<string, Date>) => void;
}

interface StepTimeBlock {
  stepId: string;
  step: BreadStep;
  startTime: Date;
  endTime: Date;
  durationInHours: number;
}

export function TimelinePlanner({ steps, onSchedule }: TimelinePlannerProps) {
  const totalDuration = getTotalTime(steps);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayedDates, setDisplayedDates] = useState<Date[]>([new Date()]);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const now = new Date();
    // Round to the nearest hour
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
  });
  const [planMode, setPlanMode] = useState<"backward" | "forward">("backward");
  const [previewStartTimes, setPreviewStartTimes] = useState<Map<string, Date>>(new Map());
  const [previewEndTimes, setPreviewEndTimes] = useState<Map<string, Date>>(new Map());
  const [stepTimeBlocks, setStepTimeBlocks] = useState<StepTimeBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  // For mobile view
  const [activeTab, setActiveTab] = useState<"timeline" | "calendar">("timeline");
  const [isMobile, setIsMobile] = useState(false);

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

  // Calculate preview start times when selectedDate or selectedTime changes
  useEffect(() => {
    const targetDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes()
    );
    
    const startTimes = new Map<string, Date>();
    const endTimes = new Map<string, Date>();
    let currentTime = new Date(targetDateTime);

    // Work backward or forward from the target time
    if (planMode === "backward") {
      // For end time planning, we need to work backward
      for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        // Set the end time for this step
        endTimes.set(step.id, new Date(currentTime));
        // Subtract the duration from the current time to get the start time
        currentTime = new Date(currentTime.getTime() - step.duration * 60 * 1000);
        startTimes.set(step.id, new Date(currentTime));
      }
    } else {
      // For start time planning, we work forward
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        startTimes.set(step.id, new Date(currentTime));
        // Add the duration to the current time to get the end time
        currentTime = new Date(currentTime.getTime() + step.duration * 60 * 1000);
        endTimes.set(step.id, new Date(currentTime));
      }
    }

    setPreviewStartTimes(startTimes);
    setPreviewEndTimes(endTimes);
    
    // Build step time blocks for display
    const blocks: StepTimeBlock[] = steps.map(step => {
      const startTime = startTimes.get(step.id)!;
      const endTime = endTimes.get(step.id)!;
      const durationInHours = step.duration / 60;
      
      return {
        stepId: step.id,
        step,
        startTime,
        endTime,
        durationInHours
      };
    });
    
    setStepTimeBlocks(blocks);
    setShowPreview(true);
    
    // Calculate which days we need to display
    if (blocks.length > 0) {
      const firstStep = blocks[0];
      const lastStep = blocks[blocks.length - 1];
      
      // Find all unique days between first step start and last step end
      const uniqueDays: Date[] = [];
      let currentDay = startOfDay(firstStep.startTime);
      const finalDay = startOfDay(lastStep.endTime);
      
      // Make sure to include all days between start and end
      while (currentDay <= finalDay) {
        uniqueDays.push(new Date(currentDay));
        currentDay = addDays(currentDay, 1);
      }
      
      setDisplayedDates(uniqueDays);
    }
  }, [selectedDate, selectedTime, steps, planMode]);

  const handleSchedule = () => {
    onSchedule(previewStartTimes);
  };

  const handleTimeClick = (hour: number) => {
    const newTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      0,
      0
    );
    setSelectedTime(newTime);
  };

  const navigateDate = (days: number) => {
    setSelectedDate(prev => {
      const newDate = addDays(prev, days);
      return newDate;
    });
  };

  // Get all steps that start/end on or span across a specific date
  const getStepsForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    return stepTimeBlocks.filter(block => {
      // Step starts on this day
      const startsOnDay = isSameDay(block.startTime, date);
      
      // Step ends on this day
      const endsOnDay = isSameDay(block.endTime, date);
      
      // Step spans across this day (starts before, ends after)
      const spansAcrossDay = isBefore(block.startTime, dayStart) && isAfter(block.endTime, dayStart);
      
      return startsOnDay || endsOnDay || spansAcrossDay;
    });
  };

  // Format time period for display
  const formatTimePeriod = (startTime: Date, endTime: Date) => {
    return `${format(startTime, 'h:mm a')} — ${format(endTime, 'h:mm a')}`;
  };

  // Format time for display
  const formatSingleTime = (time: Date) => {
    return format(time, 'h:mm a');
  };

  // Format date for header display
  const formatDateHeader = (date: Date) => {
    const today = isToday(date);
    return {
      dayName: format(date, 'EEEE'),
      dayDate: format(date, 'MMMM d'),
      isToday: today
    };
  };

  // Mobile-specific time selector component
  const MobileTimeSelector = () => (
    <div className="mt-4 px-4">
      <h4 className="mb-2 font-serif italic text-amber-800 text-center">
        Selected Time
      </h4>
      <div className="grid grid-cols-4 gap-2">
        {[6, 9, 12, 15, 18, 21, 0, 3].map(hour => (
          <Button
            key={hour}
            variant={selectedTime.getHours() === hour ? "default" : "outline"}
            size="sm"
            className={`py-2 rounded-full ${
              selectedTime.getHours() === hour 
                ? "bg-amber-800 hover:bg-amber-900" 
                : "border-amber-200 text-amber-800 hover:bg-amber-100"
            }`}
            onClick={() => handleTimeClick(hour)}
          >
            {format(new Date().setHours(hour, 0), 'h a')}
          </Button>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground mt-2">
        {planMode === "backward" ? "End" : "Start"} time selected: {format(selectedTime, 'h:mm a')}
      </div>
    </div>
  );

  // Render desktop view (original design)
  const DesktopView = () => (
    <div className="flex">
      {/* Timeline View */}
      <div className="flex-1 overflow-y-auto h-[40rem]">
        <div className="p-4 space-y-1">
          {displayedDates.map((date, dateIndex) => {
            const dateHeader = formatDateHeader(date);
            const stepsOnDay = getStepsForDay(date);
            
            // Skip days with no steps
            if (stepsOnDay.length === 0) return null;
            
            return (
              <div key={dateIndex} className="mb-6">
                {/* Day header */}
                <div className="sticky top-0 z-10 mb-2 py-2 px-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center">
                    <h3 className="text-sm font-serif italic">
                      {`${dateHeader.dayName}, ${dateHeader.dayDate}`}
                    </h3>
                    {dateHeader.isToday && (
                      <span className="ml-2 text-xs bg-amber-800 text-white px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Steps for this day */}
                <div className="space-y-2">
                  {stepsOnDay.map((block, blockIndex) => {
                    const isActive = block.step.isActiveTime;
                    const isSameStartDay = isSameDay(block.startTime, date);
                    
                    // For active steps, only show on the day they start
                    if (isActive && !isSameStartDay) return null;
                    
                    // For passive steps that span multiple days, only show on the start day
                    if (!isActive && !isSameStartDay) return null;
                    
                    const timeLabel = isSameStartDay ? formatSingleTime(block.startTime) : '';
                    const timePeriod = !isActive 
                      ? formatTimePeriod(block.startTime, block.endTime) 
                      : timeLabel;
                    
                    return (
                      <div key={blockIndex} className="flex">
                        {/* Time marker */}
                        <div className="w-16 text-xs text-amber-800/60 pt-3 pl-2 font-serif">
                          {isSameStartDay ? format(block.startTime, 'h a') : ''}
                        </div>
                        
                        {/* Step content */}
                        <div className="flex-1">
                          {isActive ? (
                            // Active step
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-amber-800 font-medium">
                                    {block.step.title}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {block.step.description}
                                  </div>
                                </div>
                                <div className="text-sm text-amber-800/60 font-serif">
                                  {timeLabel}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Passive waiting step
                            <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div className="text-blue-500">
                                    <FastForward className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="text-blue-700 font-medium">
                                      Wait {Math.round(block.durationInHours)} hours
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {block.step.title}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground font-serif">
                                  {timePeriod}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Show an indicator if this is the last day of baking */}
                {dateIndex === displayedDates.length - 1 && (
                  <div className="mt-6 text-center text-muted-foreground text-sm">
                    <span className="inline-block px-3 py-1 bg-green-50 border border-green-100 rounded-full">
                      Baking complete
                    </span>
                  </div>
                )}
                
                {/* Condensed view indicator */}
                {stepsOnDay.some(block => !block.step.isActiveTime) && (
                  <div className="mt-2 flex items-center justify-center text-xs text-muted-foreground py-2 font-serif italic">
                    <FastForward className="h-3 w-3 mr-1" />
                    <span>Passive waiting periods are condensed to save space</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Calendar Sidebar */}
      <div className="w-64 border-l border-amber-200">
        <div className="p-4">
          <div className="text-center mb-2">
            <h3 className="font-serif italic">{format(selectedDate, 'MMMM yyyy')}</h3>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="w-full"
          />
          
          <div className="mt-4">
            <h4 className="mb-2 flex items-center font-serif italic text-amber-800">
              <Clock className="h-4 w-4 mr-1" />
              Selected Time
            </h4>
            <div className="grid grid-cols-4 gap-1">
              {[6, 9, 12, 15, 18, 21, 0, 3].map(hour => (
                <Button
                  key={hour}
                  variant={selectedTime.getHours() === hour ? "default" : "outline"}
                  size="sm"
                  className={`text-xs py-1 h-auto ${
                    selectedTime.getHours() === hour 
                      ? "bg-amber-800 hover:bg-amber-900" 
                      : "border-amber-200 text-amber-800 hover:bg-amber-100"
                  }`}
                  onClick={() => handleTimeClick(hour)}
                >
                  {format(new Date().setHours(hour, 0), 'h a')}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-amber-800">Total baking time:</span>
              <span className="font-medium text-amber-900">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
            </div>
            
            <div className="flex justify-between text-xs mb-2">
              <span className="text-amber-800">Spans:</span>
              <span className="font-medium text-amber-900">
                {displayedDates.length} {displayedDates.length === 1 ? 'day' : 'days'}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 text-xs mb-1">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
                <span className="text-amber-800">Active Time</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span className="text-amber-800">Passive Time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render mobile timeline view inspired by the reference image
  const MobileTimelineView = () => (
    <div className="p-2">
      {displayedDates.map((date, dateIndex) => {
        const dateHeader = formatDateHeader(date);
        const stepsOnDay = getStepsForDay(date);
        
        // Skip days with no steps
        if (stepsOnDay.length === 0) return null;
        
        return (
          <div key={dateIndex} className="mb-6">
            {/* Day header - simpler for mobile */}
            <div className="sticky top-0 z-10 mb-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <h3 className="font-serif italic">
                {`${dateHeader.dayName}, ${dateHeader.dayDate}`}
              </h3>
            </div>
            
            {/* Steps for this day - mobile optimized layout */}
            <div className="space-y-3">
              {stepsOnDay.map((block, blockIndex) => {
                const isActive = block.step.isActiveTime;
                const isSameStartDay = isSameDay(block.startTime, date);
                
                // For active steps, only show on the day they start
                if (isActive && !isSameStartDay) return null;
                
                // For passive steps that span multiple days, only show on the start day
                if (!isActive && !isSameStartDay) return null;
                
                const timeFormat = format(block.startTime, 'h:mm a');
                
                return (
                  <div key={blockIndex} className={`rounded-xl overflow-hidden border ${
                    isActive ? 'border-amber-200' : 'border-blue-100'
                  }`}>
                    {/* Time marker - moved to left */}
                    <div className={`text-center p-2 ${
                      isActive ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'
                    }`}>
                      <span className="font-serif">{format(block.startTime, 'h:mm a')}</span>
                    </div>
                    
                    {/* Step content - full width for mobile */}
                    <div className={`p-3 ${
                      isActive ? 'bg-white' : 'bg-white'
                    }`}>
                      {isActive ? (
                        // Active step
                        <div>
                          <div className="text-amber-800 font-medium mb-1">
                            {block.step.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {block.step.description}
                          </div>
                        </div>
                      ) : (
                        // Passive waiting step
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FastForward className="h-4 w-4 text-blue-500" />
                            <div className="text-blue-700 font-medium">
                              Wait {Math.round(block.durationInHours)} hours
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {block.step.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-serif">
                            {formatTimePeriod(block.startTime, block.endTime)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Completion indicator for last day */}
            {dateIndex === displayedDates.length - 1 && (
              <div className="mt-4 text-center">
                <span className="inline-block px-4 py-2 bg-green-50 border border-green-100 rounded-full text-green-800">
                  Baking complete
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const MobileCalendarView = () => (
    <div className="p-4">
      <div className="text-center mb-4">
        <h3 className="font-serif italic text-xl">{format(selectedDate, 'MMMM yyyy')}</h3>
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        className="mx-auto"
      />
      
      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-amber-800">Total baking time:</span>
          <span className="font-medium text-amber-900">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-amber-800">Days required:</span>
          <span className="font-medium text-amber-900">
            {displayedDates.length} {displayedDates.length === 1 ? 'day' : 'days'}
          </span>
        </div>
        
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
            <span className="text-amber-800">Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-amber-800">Passive</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border rounded-lg overflow-hidden mb-6 bg-white shadow-sm border-amber-200">
      {/* Header */}
      <div className="p-4 border-b border-amber-200 bg-amber-50/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="mb-1 font-serif italic">Plan Your Bake</h2>
            <p className="text-muted-foreground">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>
          
          {/* Plan mode toggle for both desktop and mobile */}
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="border-amber-200 text-amber-800 hover:bg-amber-100"
            onClick={() => setPlanMode(mode => mode === "backward" ? "forward" : "backward")}
          >
            {planMode === "backward" ? "End Time" : "Start Time"}
          </Button>
        </div>
        
        {/* Date navigation */}
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDate(-1)}
            className="border-amber-200 text-amber-800 hover:bg-amber-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              const today = new Date();
              setSelectedDate(today);
              setSelectedTime(new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), 0));
            }}
            className="border-amber-200 text-amber-800 hover:bg-amber-100"
          >
            Today
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigateDate(1)}
            className="border-amber-200 text-amber-800 hover:bg-amber-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Schedule action button */}
        <Button
          onClick={handleSchedule}
          className="w-full bg-amber-800 text-white hover:bg-amber-900"
        >
          Schedule Bake
        </Button>
      </div>
      
      {/* Responsive Layout - Desktop vs Mobile */}
      {isMobile ? (
        // Mobile Layout
        <div>
          <Tabs defaultValue="timeline" className="w-full" onValueChange={(value) => setActiveTab(value as "timeline" | "calendar")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline" className="flex items-center gap-1">
                <ListIcon className="h-4 w-4" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="border-none p-0">
              <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                <MobileTimelineView />
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="border-none p-0">
              <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                <MobileCalendarView />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Fixed bottom time selector for mobile */}
          <div className="border-t border-amber-200 pt-2 pb-4 bg-cream-50">
            <MobileTimeSelector />
          </div>
        </div>
      ) : (
        // Desktop Layout
        <DesktopView />
      )}
    </div>
  );
}
