import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Calendar as CalendarIcon, Check, Download, Loader2 } from "lucide-react";
import { BreadStep } from "./bread-recipe";
import { generateICalendarFile, downloadCalendarFile } from "../utils/calendar";
import { format } from "date-fns";

interface CalendarExportProps {
  breadName: string;
  steps: BreadStep[];
  startTimes: Map<string, Date>;
}

export function CalendarExport({ breadName, steps, startTimes = new Map() }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExportCalendar = () => {
    setIsExporting(true);
    
    try {
      // Generate the iCalendar data
      const calendarData = generateICalendarFile(breadName, steps, startTimes);
      
      // Download the file
      if (calendarData) {
        downloadCalendarFile(breadName, calendarData);
        setIsSuccess(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error generating calendar file:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get start and end dates from the schedule
  const getScheduleTimeframe = () => {
    if (!startTimes || steps.length === 0 || startTimes.size === 0) return null;
    
    const times = Array.from(startTimes.values());
    const firstTime = new Date(Math.min(...times.map(t => t.getTime())));
    
    // Get the last step and its duration
    const lastStep = steps[steps.length - 1];
    const lastStepStart = startTimes.get(lastStep.id);
    
    if (!lastStepStart) return null;
    
    // Calculate end time by adding duration to last step's start time
    const lastTime = new Date(lastStepStart.getTime() + lastStep.duration * 60 * 1000);
    
    return {
      start: format(firstTime, 'MMM d, yyyy h:mm a'),
      end: format(lastTime, 'MMM d, yyyy h:mm a')
    };
  };

  const timeframe = getScheduleTimeframe();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-amber-300 text-amber-900 hover:bg-amber-100"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Baking Schedule to Calendar</DialogTitle>
          <DialogDescription>
            Export your {breadName} baking schedule to add to your personal calendar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-200">
            <h4 className="font-medium mb-2">Schedule Details</h4>
            
            {timeframe ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Start:</div>
                  <div>{timeframe.start}</div>
                  
                  <div className="text-muted-foreground">End:</div>
                  <div>{timeframe.end}</div>
                  
                  <div className="text-muted-foreground">Steps:</div>
                  <div>{steps.length} baking steps</div>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground">
                  All steps will be added as separate calendar events.
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Please schedule your bread recipe first.
              </div>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-serif italic">
              "Be not afraid of greatness. Some are born great, some achieve greatness, and others have greatness thrust upon them through perfect scheduling."
            </p>
            <p className="text-right text-xs text-muted-foreground">— Almost Shakespeare</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleExportCalendar}
            disabled={isExporting || steps.length === 0 || !startTimes || startTimes.size === 0}
            className="bg-amber-800 hover:bg-amber-900 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : isSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Exported!
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download .ics File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}