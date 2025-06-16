
/**
 * Utility functions for generating iCalendar (.ics) files
 */

import { BreadStep } from "../components/bread-recipe";

// Format date to iCalendar format (yyyyMMddTHHmmssZ)
export function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Generate a unique identifier for a calendar event
export function generateUID(): string {
  return `bread-${Date.now()}-${Math.floor(Math.random() * 100000)}@breadbaking-app`;
}

// Create an iCalendar event string
function createCalendarEvent(
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  uid: string,
  isActive: boolean
): string {
  const now = new Date();
  const status = isActive ? "CONFIRMED" : "TENTATIVE";
  const categories = isActive ? "BAKING,ACTIVE" : "BAKING,PASSIVE";
  
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDateForCalendar(now)}`,
    `DTSTART:${formatDateForCalendar(startTime)}`,
    `DTEND:${formatDateForCalendar(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `STATUS:${status}`,
    `CATEGORIES:${categories}`,
    "END:VEVENT"
  ].join("\r\n");
}

// Generate complete iCalendar file for a bread recipe
export function generateICalendarFile(
  breadName: string,
  steps: BreadStep[],
  startTimes: Map<string, Date>
): string {
  // Skip if no steps or no start times
  if (steps.length === 0 || startTimes.size === 0) {
    return "";
  }

  const calendarEvents: string[] = [];
  
  // Create calendar events for each step
  steps.forEach(step => {
    const startTime = startTimes.get(step.id);
    if (!startTime) return;
    
    // Calculate end time based on duration
    const endTime = new Date(startTime.getTime() + step.duration * 60 * 1000);
    
    // Generate event summary
    const summary = `${step.isActiveTime ? '[Active] ' : '[Passive] '}${breadName}: ${step.title}`;
    
    // Add tips to description if available
    let description = step.description;
    if (step.tips && step.tips.length > 0) {
      description += "\n\nTips:\n" + step.tips.map(tip => `- ${tip}`).join("\n");
    }
    
    // Create event and add to array
    const uid = generateUID();
    const event = createCalendarEvent(
      summary,
      description,
      startTime,
      endTime,
      uid,
      step.isActiveTime
    );
    
    calendarEvents.push(event);
  });
  
  // Generate full calendar file
  const calendarFile = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BreadBaking App//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Bread Baking Schedule",
    "X-WR-TIMEZONE:UTC",
    ...calendarEvents,
    "END:VCALENDAR"
  ].join("\r\n");
  
  return calendarFile;
}

// Helper function to download the calendar file
export function downloadCalendarFile(breadName: string, calendarData: string): void {
  // Create safe filename
  const fileName = `${breadName.toLowerCase().replace(/\s+/g, '-')}-baking-schedule.ics`;
  
  // Create a Blob with the calendar data
  const blob = new Blob([calendarData], { type: 'text/calendar;charset=utf-8' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
