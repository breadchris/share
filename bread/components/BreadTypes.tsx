// Bread recipe type definitions for the application

export interface BreadIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
  notes?: string;
}

export interface BreadStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  isActiveTime: boolean; // whether this step requires active attention
  temperature?: number; // in celsius
  isOptional?: boolean;
  tips?: string[];
  ingredients?: string[]; // ingredient IDs used in this step
  videoStartTime?: number; // start time in seconds for video annotation
  videoEndTime?: number; // end time in seconds for video annotation
}

export interface BreadRecipe {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prepTime: number; // in minutes
  totalTime: number; // in minutes
  servings: number;
  imageUrl: string;
  ingredients: BreadIngredient[];
  steps: BreadStep[];
  tags: string[];
  createdBy?: string; // user ID who created this recipe
  createdAt?: Date;
  updatedAt?: Date;
  isUserCreated?: boolean; // true if this is a user-created recipe
  videoUrl?: string; // YouTube or other video URL associated with this recipe
  videoTitle?: string; // Title of the associated video
  videoDuration?: number; // Duration of the video in seconds
}

// Difficulty level colors for UI consistency
export const difficultyColors = {
  'Beginner': 'bg-green-100 text-green-800',
  'Intermediate': 'bg-yellow-100 text-yellow-800', 
  'Advanced': 'bg-red-100 text-red-800'
} as const;

// Common bread tags for recipe categorization
export const commonBreadTags = [
  'sourdough',
  'quick-bread',
  'artisan',
  'whole-grain',
  'gluten-free',
  'vegan',
  'sweet',
  'savory',
  'no-knead',
  'overnight',
  'beginner-friendly',
  'traditional',
  'international'
] as const;

// Helper function to format recipe difficulty
export const formatDifficulty = (difficulty: BreadRecipe['difficulty']): string => {
  return difficulty;
};

// Helper function to format prep time
export const formatPrepTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

// Helper function to format video time (seconds to mm:ss)
export const formatVideoTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to parse video time (mm:ss to seconds)
export const parseVideoTime = (timeString: string): number => {
  const parts = timeString.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return 0;
};

// Helper function to get difficulty color class
export const getDifficultyColorClass = (difficulty: BreadRecipe['difficulty']): string => {
  return difficultyColors[difficulty];
};

// Helper function to validate video time range
export const validateVideoTimeRange = (startTime?: number, endTime?: number): { isValid: boolean; error?: string } => {
  if (startTime === undefined && endTime === undefined) {
    return { isValid: true }; // Both undefined is valid (no video timing)
  }
  
  if (startTime !== undefined && endTime !== undefined) {
    if (startTime >= endTime) {
      return { isValid: false, error: 'Start time must be before end time' };
    }
    if (startTime < 0 || endTime < 0) {
      return { isValid: false, error: 'Times must be positive' };
    }
    return { isValid: true };
  }
  
  if (startTime !== undefined && endTime === undefined) {
    return { isValid: false, error: 'End time is required when start time is specified' };
  }
  
  if (startTime === undefined && endTime !== undefined) {
    return { isValid: false, error: 'Start time is required when end time is specified' };
  }
  
  return { isValid: true };
};