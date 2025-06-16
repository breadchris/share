import { addDays, addHours, subDays, subHours, formatDistanceToNow, isPast, parseISO } from 'date-fns';

// Current date and time for reference
const now = new Date();

// Interface for CommunityBaker
export interface CommunityBaker {
  id: string;
  user_id: string;
  bread_id: string;
  breadName: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  startTime: string;
  expectedFinishTime: string;
  username: string;
  avatar: string;
  location?: string;
}

// Mock data for user's in-progress breads
export const mockUserProgress = [
  {
    id: '1',
    user_id: 'mock-user-id',
    bread_id: 'artisan-sourdough',
    bread_name: 'Artisan Sourdough with Stretch and Fold',
    current_step: 4,
    completed_steps: ['as1', 'as2', 'as3', 'as4'],
    start_time: subDays(now, 1).toISOString(),
    expected_finish_time: addHours(now, 3).toISOString(),
    last_updated: subHours(now, 2).toISOString(),
    is_completed: false
  }
];

// Mock community bakers data
export const mockCommunityBakers = [
  {
    user_id: 'user1',
    bread_id: 'artisan-sourdough',
    bread_name: 'Artisan Sourdough with Stretch and Fold',
    current_step: 3,
    completed_steps: ['as1', 'as2', 'as3'],
    start_time: subDays(now, 1).toISOString(),
    expected_finish_time: addHours(now, 5).toISOString(),
    user_profiles: {
      username: 'ArdenBaker',
      avatar_url: 'https://randomuser.me/api/portraits/men/41.jpg'
    },
    location: 'Verona, Italy'
  },
  {
    user_id: 'user2',
    bread_id: 'artisan-sourdough',
    bread_name: 'Artisan Sourdough with Stretch and Fold',
    current_step: 5,
    completed_steps: ['as1', 'as2', 'as3', 'as4', 'as5'],
    start_time: subDays(now, 2).toISOString(),
    expected_finish_time: addHours(now, 2).toISOString(),
    user_profiles: {
      username: 'RosalindFlour',
      avatar_url: 'https://randomuser.me/api/portraits/women/22.jpg'
    },
    location: 'Stratford-upon-Avon, UK'
  },
  {
    user_id: 'user3',
    bread_id: 'artisan-sourdough',
    bread_name: 'Artisan Sourdough with Stretch and Fold',
    current_step: 2,
    completed_steps: ['as1', 'as2'],
    start_time: subHours(now, 12).toISOString(),
    expected_finish_time: addHours(now, 8).toISOString(),
    user_profiles: {
      username: 'ProsperoKneads',
      avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    location: 'Milan, Italy'
  },
  {
    user_id: 'user4',
    bread_id: 'artisan-sourdough',
    bread_name: 'Artisan Sourdough with Stretch and Fold',
    current_step: 7,
    completed_steps: ['as1', 'as2', 'as3', 'as4', 'as5', 'as6', 'as7'],
    start_time: subDays(now, 3).toISOString(),
    expected_finish_time: addHours(now, 1).toISOString(),
    user_profiles: {
      username: 'PuckBakes',
      avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    location: 'Athens, Greece'
  },
  {
    user_id: 'user5',
    bread_id: 'artisan-sourdough',
    bread_name: 'Artisan Sourdough with Stretch and Fold',
    current_step: 4,
    completed_steps: ['as1', 'as2', 'as3', 'as4'],
    start_time: subDays(now, 1).toISOString(),
    expected_finish_time: addDays(now, 1).toISOString(),
    user_profiles: {
      username: 'HamletRye',
      avatar_url: 'https://randomuser.me/api/portraits/men/62.jpg'
    },
    location: 'Copenhagen, Denmark'
  }
];

// Mock bread recipes data
export const mockBreadRecipes = [
  {
    id: 'artisan-sourdough',
    name: 'Artisan Sourdough with Stretch and Fold',
    description: 'A naturally leavened bread with exceptional flavor and open crumb, using the gentle stretch and fold technique.',
    difficulty: 'Intermediate',
    total_time: 1680, // minutes (28 hours)
    steps: [
      {
        id: 'as1',
        title: 'Prepare Your Starter',
        description: 'Feed your sourdough starter with equal parts flour and water (1:1:1 ratio). Let it ripen at room temperature (70-75°F/21-24°C) for 8-12 hours until doubled and bubbly.',
        duration: 720,
        is_active_time: false,
        tips: ['Your starter should be visibly active with a pleasant, tangy aroma', 'A mature starter will roughly double in size when ready'],
        step_order: 1
      },
      {
        id: 'as2',
        title: 'Mix the Dough',
        description: 'In a large bowl, combine water and active starter. Mix until the starter is dissolved. Add both flours and mix by hand until no dry flour remains.',
        duration: 40,
        is_active_time: true,
        tips: ['The autolyse helps develop gluten and improves dough extensibility', 'Use your hands rather than a utensil for better incorporation'],
        step_order: 2
      }
      // More steps would be included here
    ],
    ingredients: [
      { id: 'ing1', name: 'Bread flour', amount: 400, unit: 'g' },
      { id: 'ing2', name: 'Whole wheat flour', amount: 100, unit: 'g' },
      { id: 'ing3', name: 'Water (room temperature)', amount: 375, unit: 'ml' },
      { id: 'ing4', name: 'Active sourdough starter', amount: 100, unit: 'g' },
      { id: 'ing5', name: 'Salt', amount: 10, unit: 'g' },
      { id: 'ing6', name: 'Additional water', amount: 1, unit: 'tbsp' }
    ]
  }
];

// Function to get a bread recipe by ID
export function getBreadRecipeById(id: string) {
  return mockBreadRecipes.find(recipe => recipe.id === id) || null;
}

// Function to get relative time string
export function getRelativeTimeString(dateTimeString: string): string {
  try {
    const dateTime = typeof dateTimeString === 'string' ? parseISO(dateTimeString) : dateTimeString;
    
    if (isPast(dateTime)) {
      return `${formatDistanceToNow(dateTime)} ago`;
    } else {
      return formatDistanceToNow(dateTime, { addSuffix: true });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'unknown time';
  }
}

// Function to get community bakers
export function getCommunityBakers(limit: number = 10): CommunityBaker[] {
  // Transform mockCommunityBakers into the format expected by the CommunityBakerCard component
  return mockCommunityBakers.slice(0, limit).map(baker => ({
    id: baker.user_id,
    user_id: baker.user_id,
    bread_id: baker.bread_id,
    breadName: baker.bread_name,
    currentStep: baker.current_step,
    totalSteps: baker.completed_steps.length + 3, // Assuming there are more steps to complete
    completedSteps: baker.completed_steps,
    startTime: baker.start_time,
    expectedFinishTime: baker.expected_finish_time,
    username: baker.user_profiles.username,
    avatar: baker.user_profiles.avatar_url,
    location: baker.location
  }));
}