import React from "react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle,
  Coffee,
  Timer
} from "lucide-react";
import { format, addMinutes } from "date-fns";
import { cn } from "./ui/utils";

interface BreadStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  isActiveTime: boolean;
}

interface TimelineViewProps {
  steps: BreadStep[];
  breadName: string;
  stepStartTimes: Map<string, Date>;
  onProceedToBaking: () => void;
  onBackToScheduling: () => void;
}

interface CalendarEvent {
  stepId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

export function TimelineView({ 
  steps, 
  breadName, 
  stepStartTimes, 
  onProceedToBaking, 
  onBackToScheduling 
}: TimelineViewProps) {
  const [addedToCalendar, setAddedToCalendar] = useState<Set<string>>(new Set());
  
  // Create calendar events from steps and start times
  const calendarEvents: CalendarEvent[] = steps.map(step => {
    const startTime = stepStartTimes.get(step.id) || new Date();
    const endTime = addMinutes(startTime, step.duration);
    
    return {
      stepId: step.id,
      title: step.title,
      startTime,
      endTime,
      isActive: step.isActiveTime
    };
  }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  const handleAddToCalendar = async (event: CalendarEvent) => {
    // Create calendar event data
    const eventData = {
      title: `${breadName}: ${event.title}`,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      description: `Baking step for ${breadName}${event.isActive ? ' (requires attention)' : ' (passive step)'}`
    };
    
    // Create downloadable .ics file
    downloadICSFile(eventData, event.stepId);
  };
  
  const downloadICSFile = (eventData: any, stepId: string) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Just Bread//Baking Schedule//EN
BEGIN:VEVENT
UID:${Date.now()}@justbread.app
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${eventData.start.replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${eventData.end.replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description}
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${breadName.toLowerCase().replace(/\s+/g, '-')}-${stepId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setAddedToCalendar(prev => new Set([...prev, stepId]));
  };
  
  const handleAddAllToCalendar = async () => {
    for (const event of calendarEvents) {
      if (!addedToCalendar.has(event.stepId)) {
        await handleAddToCalendar(event);
        // Small delay between events to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };
  
  const getTotalActiveTime = (): number => {
    return calendarEvents
      .filter(event => event.isActive)
      .reduce((total, event) => {
        const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
        return total + duration;
      }, 0);
  };
  
  const getTotalTime = (): number => {
    if (calendarEvents.length === 0) return 0;
    const firstEvent = calendarEvents[0];
    const lastEvent = calendarEvents[calendarEvents.length - 1];
    return (lastEvent.endTime.getTime() - firstEvent.startTime.getTime()) / (1000 * 60);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl mb-3 text-soft-brown">
          {breadName} Baking Schedule
        </h1>
        <p className="text-secondary text-base max-w-2xl mx-auto">
          Review your personalized baking timeline. Add events to your calendar to stay on track, 
          then proceed to the step-by-step directions.
        </p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-soft-brown/30">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-deep-olive mx-auto mb-2" />
            <div className="font-medium text-deep-olive">{formatDuration(getTotalTime())}</div>
            <div className="text-xs text-secondary">Total Time</div>
          </CardContent>
        </Card>
        
        <Card className="border-soft-brown/30">
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 text-dusty-rose mx-auto mb-2" />
            <div className="font-medium text-deep-olive">{formatDuration(getTotalActiveTime())}</div>
            <div className="text-xs text-secondary">Active Time</div>
          </CardContent>
        </Card>
        
        <Card className="border-soft-brown/30">
          <CardContent className="p-4 text-center">
            <Coffee className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <div className="font-medium text-deep-olive">{calendarEvents.length}</div>
            <div className="text-xs text-secondary">Total Steps</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Calendar Integration Section */}
      <Card className="border-dusty-rose/30 bg-dusty-rose/5 mb-8">
        <CardHeader>
          <CardTitle className="text-deep-olive flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Add to Your Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary mb-4">
            Never miss a step! Add these baking events to your calendar and get notifications 
            when it's time for each step.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAddAllToCalendar}
              className="bg-dusty-rose hover:bg-dusty-rose/90 text-cloud-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add All Events to Calendar
            </Button>
            
            <div className="text-xs text-secondary self-center">
              {addedToCalendar.size > 0 && (
                <span className="text-green-600">
                  ✓ {addedToCalendar.size} of {calendarEvents.length} events added
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Timeline */}
      <Card className="border-soft-brown/30 mb-8">
        <CardHeader>
          <CardTitle className="text-deep-olive">Baking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calendarEvents.map((event, index) => (
              <div key={event.stepId} className="flex items-start gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2",
                    event.isActive 
                      ? "bg-dusty-rose border-dusty-rose" 
                      : "bg-deep-olive border-deep-olive"
                  )} />
                  {index < calendarEvents.length - 1 && (
                    <div className="w-0.5 h-16 bg-soft-brown/30 mt-2" />
                  )}
                </div>
                
                {/* Event card */}
                <div className="flex-1 pb-4">
                  <Card className={cn(
                    "border transition-all hover:shadow-md",
                    event.isActive 
                      ? "border-dusty-rose/30 bg-dusty-rose/5" 
                      : "border-deep-olive/30 bg-deep-olive/5"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-deep-olive mb-1">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-secondary">
                            <span>{format(event.startTime, 'h:mm a')}</span>
                            <span>•</span>
                            <span>{formatDuration((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60))}</span>
                            {event.isActive && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-dusty-rose">
                                  <AlertCircle className="h-3 w-3" />
                                  Active
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCalendar(event)}
                          disabled={addedToCalendar.has(event.stepId)}
                          className={cn(
                            "ml-4",
                            addedToCalendar.has(event.stepId) 
                              ? "text-green-600 border-green-600" 
                              : "border-deep-olive text-deep-olive hover:bg-deep-olive hover:text-cloud-white"
                          )}
                        >
                          {addedToCalendar.has(event.stepId) ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button 
          variant="outline" 
          onClick={onBackToScheduling}
          className="border-soft-brown text-soft-brown hover:bg-soft-brown hover:text-cloud-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scheduling
        </Button>
        
        <Button
          onClick={onProceedToBaking}
          className="bg-deep-olive hover:bg-deep-olive/90 text-cloud-white px-8"
        >
          Start Baking
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
