
import { BreadStep } from "../components/bread-recipe";
import { addMinutes } from "date-fns";

/**
 * Adjusts the timing of future steps based on the current time
 * @param steps The list of steps in the recipe
 * @param currentStepIndex The index of the current step
 * @param startTimes The map of step IDs to start times
 * @returns A new map of step IDs to adjusted start times
 */
export function adjustFutureStepTiming(
  steps: BreadStep[],
  currentStepIndex: number,
  startTimes: Map<string, Date>
): Map<string, Date> {
  const now = new Date();
  const newStartTimes = new Map(startTimes);
  
  // Start with the next step
  let nextStepIndex = currentStepIndex + 1;
  let previousEndTime = now;
  
  // Adjust all future steps
  for (let i = nextStepIndex; i < steps.length; i++) {
    const step = steps[i];
    
    // Set the new start time for this step
    newStartTimes.set(step.id, new Date(previousEndTime));
    
    // Calculate when this step ends for the next iteration
    previousEndTime = addMinutes(previousEndTime, step.duration);
  }
  
  return newStartTimes;
}
