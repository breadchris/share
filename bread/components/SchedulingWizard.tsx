import React from "react";
import { useState, useEffect } from "react";
import { BreadStep, getActiveTime, getTotalTime } from "./bread-recipe";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { 
  CalendarIcon, 
  Clock, 
  ArrowRight, 
  Bed, 
  Sun, 
  Sunset,
  Moon,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  format, 
  addDays,
  setHours,
  setMinutes,
  addMinutes
} from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";

interface SchedulingWizardProps {
  steps: BreadStep[];
  onSchedule: (startTimes: Map<string, Date>) => void;
  breadName: string;
}

type TimeOfDay = "morning" | "afternoon" | "evening";

export function SchedulingWizard({ steps, onSchedule, breadName }: SchedulingWizardProps) {
  const [targetDate, setTargetDate] = useState<Date>(addDays(new Date(), 1));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("evening");
  const [optimizeForSleep, setOptimizeForSleep] = useState<boolean>(true);
  
  // Calculate timing information
  const activeTimeInMinutes = getActiveTime(steps);
  const activeTimeHours = Math.floor(activeTimeInMinutes / 60);
  const activeTimeMinutes = activeTimeInMinutes % 60;
  
  const totalTimeInMinutes = getTotalTime(steps);
  const totalTimeHours = Math.floor(totalTimeInMinutes / 60);
  const totalTimeMinutes = totalTimeInMinutes % 60;

  // Get target completion time based on time of day selection
  const getTargetDateTime = () => {
    const date = new Date(targetDate);
    
    switch (timeOfDay) {
      case "morning":
        return setHours(setMinutes(date, 0), 8); // 8:00 AM
      case "afternoon":
        return setHours(setMinutes(date, 0), 13); // 1:00 PM
      case "evening":
        return setHours(setMinutes(date, 0), 18); // 6:00 PM
      default:
        return setHours(setMinutes(date, 0), 18);
    }
  };

  // Calculate schedule and handle optimization
  const calculateSchedule = () => {
    const goalTime = getTargetDateTime();
    const totalDuration = getTotalTime(steps);
    
    // Calculate start time by working backward from goal time
    let startTime = new Date(goalTime.getTime() - (totalDuration * 60 * 1000));
    
    // Create schedule map
    const scheduledSteps = new Map<string, Date>();
    let currentTime = new Date(startTime);
    
    steps.forEach((step) => {
      scheduledSteps.set(step.id, new Date(currentTime));
      currentTime = addMinutes(currentTime, step.duration);
    });
    
    // If optimizing for sleep, adjust for inconvenient times
    if (optimizeForSleep) {
      // Check for active steps during sleep hours (11 PM - 7 AM)
      const hasNightSteps = steps.some((step) => {
        if (!step.isActiveTime) return false;
        
        const stepStart = scheduledSteps.get(step.id);
        if (!stepStart) return false;
        
        const stepHour = stepStart.getHours();
        return stepHour >= 23 || stepHour < 7;
      });
      
      // If there are night steps, try to shift the schedule earlier
      if (hasNightSteps) {
        // Shift 8 hours earlier to avoid night work
        startTime = new Date(startTime.getTime() - (8 * 60 * 60 * 1000));
        
        // Recalculate with new start time
        currentTime = new Date(startTime);
        steps.forEach((step) => {
          scheduledSteps.set(step.id, new Date(currentTime));
          currentTime = addMinutes(currentTime, step.duration);
        });
      }
    }
    
    return scheduledSteps;
  };

  // Handle view schedule button click
  const handleViewSchedule = () => {
    const scheduledSteps = calculateSchedule();
    onSchedule(scheduledSteps);
  };

  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl mb-3 text-soft-brown">
          When Would You Like Your {breadName} to be Ready?
        </h2>
        <p className="text-secondary text-base">
          We'll work backward from your desired completion time to create the perfect baking schedule.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Target Date Column */}
        <Card className="border-soft-brown/30">
          <CardHeader>
            <CardTitle className="text-deep-olive flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Target Date
            </CardTitle>
            <CardDescription>
              Select the day you want your bread to be ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calendar */}
            <Calendar
              mode="single"
              selected={targetDate}
              onSelect={(date) => date && setTargetDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              disabled={(date) => date < new Date()}
              className="w-full"
              classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-base font-medium text-soft-brown",
                nav_button: cn(
                  "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border border-amber-200 text-amber-800 hover:bg-amber-100"
                ),
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-center text-xs text-secondary font-normal flex-1 p-2 min-w-0",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm flex-1 min-w-0",
                day: cn(
                  "h-10 w-10 mx-auto p-0 font-normal rounded-md hover:bg-dusty-rose/20 text-deep-olive",
                  "aria-selected:opacity-100 focus:bg-dusty-rose/20 focus:text-dusty-rose"
                ),
                day_selected: "bg-deep-olive text-cloud-white hover:bg-deep-olive hover:text-cloud-white focus:bg-deep-olive focus:text-cloud-white",
                day_today: "bg-dusty-rose/20 text-dusty-rose font-medium border border-dusty-rose",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />

            {/* Selected Date Display */}
            {targetDate && (
              <div className="mt-4 p-3 bg-deep-olive/10 rounded-lg">
                <p className="text-center text-deep-olive font-medium">
                  {format(targetDate, 'EEEE, MMMM d')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time of Day Column */}
        <Card className="border-soft-brown/30">
          <CardHeader>
            <CardTitle className="text-deep-olive flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time of Day
            </CardTitle>
            <CardDescription>
              When do you want your bread to be finished?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Options */}
            <div className="grid grid-cols-3 gap-3">
              {/* Morning */}
              <button
                onClick={() => setTimeOfDay("morning")}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-center hover:border-dusty-rose/50",
                  timeOfDay === "morning" 
                    ? "border-deep-olive bg-deep-olive text-cloud-white" 
                    : "border-soft-brown/30 bg-cloud-white text-soft-brown hover:bg-dusty-rose/5"
                )}
              >
                <Sun className="h-5 w-5 mx-auto mb-2" />
                <div className="font-medium text-sm">Morning</div>
                <div className="text-xs opacity-75">8:00 AM</div>
              </button>

              {/* Afternoon */}
              <button
                onClick={() => setTimeOfDay("afternoon")}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-center hover:border-dusty-rose/50",
                  timeOfDay === "afternoon" 
                    ? "border-deep-olive bg-deep-olive text-cloud-white" 
                    : "border-soft-brown/30 bg-cloud-white text-soft-brown hover:bg-dusty-rose/5"
                )}
              >
                <Sunset className="h-5 w-5 mx-auto mb-2" />
                <div className="font-medium text-sm">Afternoon</div>
                <div className="text-xs opacity-75">1:00 PM</div>
              </button>

              {/* Evening */}
              <button
                onClick={() => setTimeOfDay("evening")}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-center hover:border-dusty-rose/50",
                  timeOfDay === "evening" 
                    ? "border-deep-olive bg-deep-olive text-cloud-white" 
                    : "border-soft-brown/30 bg-cloud-white text-soft-brown hover:bg-dusty-rose/5"
                )}
              >
                <Moon className="h-5 w-5 mx-auto mb-2" />
                <div className="font-medium text-sm">Evening</div>
                <div className="text-xs opacity-75">6:00 PM</div>
              </button>
            </div>

            {/* Optimize for Sleep Section */}
            <Card className="border-dusty-rose/30 bg-dusty-rose/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bed className="h-5 w-5 text-dusty-rose mt-0.5 flex-shrink-0" />
                  <div className="flex-grow">
                    <h4 className="font-medium text-soft-brown mb-1">Optimize for Sleep</h4>
                    <p className="text-xs text-secondary mb-3">
                      Adjust schedule to avoid active steps during sleeping hours (11 PM - 7 AM)
                    </p>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="sleep-optimization"
                        checked={optimizeForSleep}
                        onCheckedChange={setOptimizeForSleep}
                      />
                      <Label htmlFor="sleep-optimization" className="text-sm">
                        {optimizeForSleep ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Summary Card */}
      <Card className="border-soft-brown/30 bg-warm-beige/30 mb-8">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-deep-olive flex-shrink-0" />
              <div>
                <h4 className="font-medium text-deep-olive">{breadName}</h4>
                <p className="text-sm text-secondary">
                  {steps.length} steps
                </p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-medium text-deep-olive">
                  {activeTimeHours}h {activeTimeMinutes}m
                </div>
                <div className="text-xs text-secondary">Active time</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-deep-olive">
                  {totalTimeHours}h {totalTimeMinutes}m
                </div>
                <div className="text-xs text-secondary">Total time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Schedule Button */}
      <div className="text-center">
        <Button
          onClick={handleViewSchedule}
          className="bg-deep-olive hover:bg-deep-olive/90 text-cloud-white px-8 py-3 text-base"
        >
          View Schedule
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}