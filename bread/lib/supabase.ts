import { createClient } from '@supabase/supabase-js';
import { BreadRecipe } from '../components/BreadTypes';
import { projectId, publicAnonKey } from '../components/supabase/info';

// Use centralized Supabase configuration with fallbacks
const SUPABASE_URL = `https://${projectId}.supabase.co`
const SUPABASE_ANON_KEY = publicAnonKey;

// Storage bucket name for bread photos
const STORAGE_BUCKET = 'bread-photos';

// Types for save operation results (simplified)
export type SaveResult = {
  success: boolean;
  error?: string;
};

// Types for file upload results
export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

// Error logging configuration
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// Structured error logging function
const logError = (
  level: LogLevel,
  operation: string,
  message: string,
  context?: Record<string, any>,
  error?: any
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    operation,
    message,
    context: context || {}
  };

  // Add error details if provided
  if (error) {
    logEntry.context.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint
    };
  }

  // Color-coded console output based on level
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[90m'  // Gray
  };
  const resetColor = '\x1b[0m';

  console.log(
    `${colors[level]}[${level}] ${timestamp} - ${operation}:${resetColor}`,
    message,
    context ? '\nContext:' : '',
    context || ''
  );

  return logEntry;
};

// Initialize Supabase client
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Export project info for components that need it
export { projectId, publicAnonKey };

// Type definitions aligned with actual database schema
export type BreadProgress = {
  id: string;
  user_id: string;
  bread_id: string;
  bread_name: string;
  current_step: number;
  completed_steps: string[];
  start_time: string;
  expected_finish_time: string;
  last_updated: string;
  is_completed: boolean;
  ingredient_notes?: string;
  step_start_times?: Record<string, string>;
};

export type BakingHistoryRecord = {
  id: string;
  user_id: string;
  bread_id: string;
  bread_name: string;
  start_time: string;
  finish_time: string;
  total_steps: number;
  completed_steps: string[];
  duration_minutes?: number;
  notes?: string;
  rating?: number;
  photo_ids?: string[];
  created_at: string;
};

export type CommunityBreadPhoto = {
  id: string;
  user_id: string;
  bread_id: string;
  bread_name: string;
  photo_url: string;
  comment?: string;
  rating?: number;
  likes_count?: number;
  created_at: string;
  user_name?: string;
  avatar_url?: string;
};

// User profile type - aligned with profiles table schema
export type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  created_at: string;
  updated_at: string;
};

// Database recipe type (matches Supabase schema)
export type DatabaseRecipe = {
  id?: string;
  name: string;
  description: string;
  difficulty: string;
  prep_time: number;
  total_time: number;
  image_url?: string;
  ingredients: any[];
  steps: any[];
  tags?: string[];
  user_id: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Storage and file upload functions
export const uploadFile = async (
  file: File,
  userId: string,
  breadId: string
): Promise<UploadResult> => {
  const operation = 'uploadFile';
  const context = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    userId,
    breadId
  };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting file upload', context);
  
  try {
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${breadId}/${timestamp}.${fileExt}`;
    
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase Storage upload');
    
    // Try to upload to Supabase Storage
    const resp = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    console.log(resp);
    const {data, error} = resp;
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase Storage upload failed', context, error);
      throw error;
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
    
    if (!urlData.publicUrl) {
      throw new Error('Failed to generate public URL');
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase Storage upload successful', {
      fileName: data.path,
      publicUrl: urlData.publicUrl
    });
    
    return {
      success: true,
      url: urlData.publicUrl
    };
    
  } catch (error) {
    logError(LOG_LEVELS.WARN, operation, 'Storage upload failed, trying fallback methods', context, error);
    
    // Fallback 1: Try to create storage bucket if it doesn't exist
    if (error.message?.includes('Bucket not found') || error.message?.includes('404')) {
      try {
        logError(LOG_LEVELS.INFO, operation, 'Attempting to create storage bucket');
      } catch (createError) {
        logError(LOG_LEVELS.WARN, operation, 'Failed to create storage bucket', context, createError);
      }
    }
    
    // Fallback 3: Use a placeholder image URL
    logError(LOG_LEVELS.WARN, operation, 'Using placeholder image as final fallback');
    
    return {
      success: false,
      error: 'Failed to upload photo. Please try again or use a different image.'
    };
  }
};

// Enhanced upload bread photo function with proper file handling
export const uploadBreadPhoto = async (
  file: File,
  userId: string,
  breadId: string,
  breadName: string,
  comment?: string,
  rating?: number
): Promise<UploadResult> => {
  const operation = 'uploadBreadPhoto';
  const context = { 
    userId, 
    breadId, 
    breadName,
    fileName: file.name,
    fileSize: file.size 
  };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting bread photo upload process', context);
  
  try {
    // Validate that breadId is a valid UUID
    if (!isValidUUID(breadId)) {
      const error = `Invalid breadId format: ${breadId}. Must be a valid UUID referencing user_recipes.id`;
      logError(LOG_LEVELS.ERROR, operation, error, context);
      return {
        success: false,
        error
      };
    }
    
    // Verify the recipe exists and belongs to the user
    const { data: recipe, error: recipeError } = await supabase
      .from('user_recipes')
      .select('id, name')
      .eq('id', breadId)
      .eq('user_id', userId)
      .single();
    
    if (recipeError || !recipe) {
      const error = `Recipe not found or access denied: ${breadId}`;
      logError(LOG_LEVELS.ERROR, operation, error, context, recipeError);
      return {
        success: false,
        error: 'Recipe not found or you do not have permission to upload photos for it'
      };
    }
    
    // First, upload the file
    const uploadResult = await uploadFile(file, userId, breadId);
    
    if (!uploadResult.success || !uploadResult.url) {
      logError(LOG_LEVELS.ERROR, operation, 'File upload failed', context);
      return uploadResult;
    }
    
    // Then, save the photo record to the database - breadId is now UUID foreign key
    const { data, error } = await supabase
      .from('bread_photos')
      .insert([{
        user_id: userId,
        bread_id: breadId, // UUID foreign key to user_recipes.id
        bread_name: breadName,
        photo_url: uploadResult.url,
        comment: comment || null,
        rating: rating || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Failed to save photo record to database', context, error);
      return {
        success: false,
        error: 'Photo uploaded but failed to save to database'
      };
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Bread photo upload completed successfully', {
      photoId: data.id,
      photoUrl: uploadResult.url
    });
    
    return {
      success: true,
      url: uploadResult.url
    };
    
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Bread photo upload failed', context, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

// Delete uploaded file function
export const deleteFile = async (filePath: string): Promise<boolean> => {
  const operation = 'deleteFile';
  const context = { filePath };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting file deletion', context);
  
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'File deletion failed', context, error);
      return false;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'File deleted successfully');
    return true;
    
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'File deletion failed', context, error);
    return false;
  }
};

// Community bread photos function - aligned with bread_photos table
export const getCommunityBreadPhotos = async (): Promise<CommunityBreadPhoto[]> => {
  const operation = 'getCommunityBreadPhotos';
  
  logError(LOG_LEVELS.INFO, operation, 'Getting community bread photos');
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Querying Supabase for community photos');
    
    const { data, error } = await supabase
      .from('bread_photos')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase query failed', {}, error);
      throw error;
    }
    
    const photos: CommunityBreadPhoto[] = (data || []).map(photo => ({
      id: photo.id,
      user_id: photo.user_id,
      bread_id: photo.bread_id,
      bread_name: photo.bread_name,
      photo_url: photo.photo_url,
      comment: photo.comment,
      rating: photo.rating,
      likes_count: photo.likes_count,
      created_at: photo.created_at,
      user_name: photo.profiles?.username,
      avatar_url: photo.profiles?.avatar_url
    }));
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase query successful', {
      photoCount: photos.length
    });
    
    return photos;
  } catch (dbError) {
    logError(LOG_LEVELS.WARN, operation, 'Database unavailable, returning mock data', {}, dbError);
    
    // Return mock data when database is unavailable
    const mockPhotos: CommunityBreadPhoto[] = [
      {
        id: 'photo-1',
        user_id: 'user-alice',
        bread_id: 'artisan-sourdough',
        bread_name: 'Artisan Sourdough',
        photo_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop',
        comment: 'My first successful sourdough! So proud of the crust.',
        rating: 5,
        likes_count: 12,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_name: 'Alice',
        avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg'
      },
      {
        id: 'photo-2',
        user_id: 'user-bob',
        bread_id: 'figma-nyc-offsite',
        bread_name: 'Figma NYC Offsite Bread',
        photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        comment: 'Perfect for our team breakfast!',
        rating: 4,
        likes_count: 8,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_name: 'Bob',
        avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg'
      },
      {
        id: 'photo-3',
        user_id: 'user-carol',
        bread_id: 'artisan-sourdough',
        bread_name: 'Artisan Sourdough',
        photo_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop',
        comment: 'Love the tangy flavor of this recipe!',
        rating: 5,
        likes_count: 15,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        user_name: 'Carol',
        avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg'
      }
    ];
    
    return mockPhotos;
  }
};

// Recipe Management Functions

// Create a new recipe
export const createRecipe = async (recipeData: DatabaseRecipe): Promise<DatabaseRecipe | null> => {
  const operation = 'createRecipe';
  const context = {
    recipeName: recipeData.name,
    userId: recipeData.user_id
  };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting create recipe operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase insert');
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('user_recipes')
      .insert([{
        ...recipeData,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase insert failed', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase create successful', {
      recipeId: data.id
    });
    
    return data;
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to create recipe', context, error);
    return null;
  }
};

// Update an existing recipe
export const updateRecipe = async (recipeId: string, recipeData: DatabaseRecipe): Promise<DatabaseRecipe | null> => {
  const operation = 'updateRecipe';
  const context = {
    recipeId,
    recipeName: recipeData.name,
    userId: recipeData.user_id
  };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting update recipe operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase update');
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('user_recipes')
      .update({
        ...recipeData,
        updated_at: now
      })
      .eq('id', recipeId)
      .eq('user_id', recipeData.user_id) // Ensure user owns the recipe
      .select()
      .single();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase update failed', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase update successful');
    return data;
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to update recipe', context, error);
    return null;
  }
};

// Helper function to check if an ID is a temporary/generated ID (not a real database UUID)
const isTemporaryId = (id: string): boolean => {
  // Check for various temporary ID patterns
  const temporaryPatterns = [
    /^ai-/,           // AI-generated IDs (ai-xxx)
    /^mock-/,         // Mock recipe IDs 
    /^temp-/,         // Temporary IDs
    /^ai-recipe-/,    // Frontend generated AI IDs
    /^mock-recipe-/   // Frontend generated mock IDs
  ];
  
  return temporaryPatterns.some(pattern => pattern.test(id));
};

// Helper function to check if an ID is a valid UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Helper function to generate a new UUID
export const newUUID = (): string => {
  // Use the modern Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Convert BreadRecipe to DatabaseRecipe format
const convertBreadRecipeToDatabase = (recipe: BreadRecipe): DatabaseRecipe => {
  return {
    id: recipe.id && isValidUUID(recipe.id) ? recipe.id : undefined, // Only include valid UUID format, otherwise create new
    name: recipe.name,
    description: recipe.description,
    difficulty: recipe.difficulty,
    prep_time: recipe.prepTime,
    total_time: recipe.totalTime,
    image_url: recipe.imageUrl,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    tags: recipe.tags || [],
    user_id: recipe.createdBy || '',
    is_public: false // Default to private recipes
  };
};

// Main saveRecipe function that handles both create and update
export const saveRecipe = async (recipe: BreadRecipe): Promise<SaveResult> => {
  const operation = 'saveRecipe';
  const context = {
    recipeName: recipe.name,
    recipeId: recipe.id,
    userId: recipe.createdBy,
    hasSteps: recipe.steps.length,
    hasIngredients: recipe.ingredients.length
  };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting save recipe operation', context);
  
  try {
    // Validate required fields
    if (!recipe.createdBy) {
      const error = 'User ID is required to save recipe';
      logError(LOG_LEVELS.ERROR, operation, error, context);
      return {
        success: false,
        error
      };
    }
    
    if (!recipe.name || recipe.name.trim().length === 0) {
      const error = 'Recipe name is required';
      logError(LOG_LEVELS.ERROR, operation, error, context);
      return {
        success: false,
        error
      };
    }
    
    // Convert to database format
    const databaseRecipe = convertBreadRecipeToDatabase(recipe);
    
    let result: DatabaseRecipe | null = null;
    
    // Determine if this is an update or create operation
    if (recipe.id && isValidUUID(recipe.id)) {
      // This is an existing recipe with a valid UUID - update it
      logError(LOG_LEVELS.DEBUG, operation, 'Recipe has valid existing UUID, performing update');
      result = await updateRecipe(recipe.id, databaseRecipe);
    } else {
      // This is a new recipe (invalid UUID or no ID) - create it
      logError(LOG_LEVELS.DEBUG, operation, 'Recipe is new or has invalid UUID, performing create', {
        hasId: !!recipe.id,
        isValidUUID: recipe.id ? isValidUUID(recipe.id) : false
      });
      databaseRecipe.id = newUUID();
      result = await createRecipe(databaseRecipe);
    }
    
    if (result) {
      logError(LOG_LEVELS.INFO, operation, 'Recipe save successful', {
        recipeId: result.id,
        operation: recipe.id && !recipe.id.startsWith('ai-recipe-') ? 'update' : 'create'
      });
      
      return {
        success: true
      };
    } else {
      const error = 'Failed to save recipe to database';
      logError(LOG_LEVELS.ERROR, operation, error, context);
      return {
        success: false,
        error
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while saving recipe';
    logError(LOG_LEVELS.ERROR, operation, 'Save recipe operation failed', context, error);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Get all recipes for a user
export const getUserRecipes = async (userId: string): Promise<BreadRecipe[]> => {
  const operation = 'getUserRecipes';
  const context = { userId };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting get user recipes operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Querying Supabase for user recipes');
    
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase query failed', context, error);
      throw error;
    }
    
    // Convert database format to BreadRecipe format
    const recipes: BreadRecipe[] = (data || []).map(dbRecipe => {
      console.log('🔍 Converting database recipe:', dbRecipe.name);
      console.log('📊 Raw ingredients from DB:', dbRecipe.ingredients);
      
      // Ensure ingredients have the correct structure
      const convertedIngredients = Array.isArray(dbRecipe.ingredients) 
        ? dbRecipe.ingredients.map((ing: any, index: number) => {
            console.log(`🥖 Processing ingredient ${index}:`, ing);
            
            // Handle different possible property names and structures
            const ingredient = {
              id: ing.id || `ingredient-${index}`,
              name: ing.name || ing.item || ing.ingredient || `Ingredient ${index + 1}`,
              amount: ing.amount || ing.quantity || 0,
              unit: ing.unit || ing.measurement || '',
              optional: ing.optional || false,
              notes: ing.notes || ing.note || ''
            };
            
            console.log(`✅ Converted ingredient ${index}:`, ingredient);
            return ingredient;
          })
        : [];
      
      return {
        id: dbRecipe.id,
        name: dbRecipe.name,
        description: dbRecipe.description,
        difficulty: dbRecipe.difficulty,
        prepTime: dbRecipe.prep_time,
        totalTime: dbRecipe.total_time,
        servings: 4, // Default serving size
        imageUrl: dbRecipe.image_url,
        ingredients: convertedIngredients,
        steps: dbRecipe.steps,
        tags: dbRecipe.tags || [],
        createdBy: dbRecipe.user_id,
        createdAt: new Date(dbRecipe.created_at),
        updatedAt: new Date(dbRecipe.updated_at),
        isUserCreated: true
      };
    });
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase query successful', {
      recipeCount: recipes.length
    });
    
    return recipes;
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to get user recipes', context, error);
    return [];
  }
};

// Get a specific recipe by ID
export const getRecipe = async (recipeId: string): Promise<BreadRecipe | null> => {
  const operation = 'getRecipe';
  const context = { recipeId };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting get recipe operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Querying Supabase for recipe');
    
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .eq('id', recipeId)
      .single();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase query failed', context, error);
      throw error;
    }
    
    if (!data) {
      logError(LOG_LEVELS.INFO, operation, 'Recipe not found in Supabase', context);
      return null;
    }
    
    // Convert database format to BreadRecipe format
    const recipe: BreadRecipe = {
      id: data.id,
      name: data.name,
      description: data.description,
      difficulty: data.difficulty,
      prepTime: data.prep_time,
      totalTime: data.total_time,
      servings: 4, // Default serving size
      imageUrl: data.image_url,
      ingredients: Array.isArray(data.ingredients) 
        ? data.ingredients.map((ing: any, index: number) => {
            console.log(`🥖 Converting single recipe ingredient ${index}:`, ing);
            
            // Handle different possible property names and structures
            const ingredient = {
              id: ing.id || `ingredient-${index}`,
              name: ing.name || ing.item || ing.ingredient || `Ingredient ${index + 1}`,
              amount: ing.amount || ing.quantity || 0,
              unit: ing.unit || ing.measurement || '',
              optional: ing.optional || false,
              notes: ing.notes || ing.note || ''
            };
            
            console.log(`✅ Converted single recipe ingredient ${index}:`, ingredient);
            return ingredient;
          })
        : [],
      steps: data.steps,
      tags: data.tags || [],
      createdBy: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isUserCreated: true
    };
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase query successful', {
      recipeName: recipe.name
    });
    
    return recipe;
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to get recipe', context, error);
    return null;
  }
};

// Delete a recipe
export const deleteRecipe = async (recipeId: string, userId: string): Promise<boolean> => {
  const operation = 'deleteRecipe';
  const context = { recipeId, userId };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting delete recipe operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase delete');
    
    const { error } = await supabase
      .from('user_recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase delete failed', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase delete successful');
    return true;
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to delete recipe', context, error);
    return false;
  }
};

// Mock authentication functions (fallback when Supabase is unavailable)
const mockSignIn = async (email: string, password: string) => {
  const operation = 'mockSignIn';
  logError(LOG_LEVELS.INFO, operation, 'Using mock sign in');
  
  // Simple mock validation
  if (email && password) {
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      user_metadata: {
        username: email.split('@')[0]
      }
    };
    
    return {
      data: {
        user: mockUser,
        session: {
          access_token: 'mock-token',
          user: mockUser
        }
      },
      error: null
    };
  }
  
  return {
    data: null,
    error: { message: 'Invalid credentials' }
  };
};

const mockSignUp = async (email: string, password: string, metadata: any = {}) => {
  const operation = 'mockSignUp';
  logError(LOG_LEVELS.INFO, operation, 'Using mock sign up');
  
  // Simple mock validation
  if (email && password) {
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      user_metadata: {
        ...metadata,
        username: metadata.username || email.split('@')[0]
      }
    };
    
    return {
      data: {
        user: mockUser,
        session: {
          access_token: 'mock-token',
          user: mockUser
        }
      },
      error: null
    };
  }
  
  return {
    data: null,
    error: { message: 'Invalid registration data' }
  };
};

// Authentication functions
export const signIn = async (email: string, password: string) => {
  const operation = 'signIn';
  const context = { email };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting sign in process', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase authentication');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase authentication failed', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase authentication successful', {
      userId: data.user?.id
    });
    
    return { data, error: null };
  } catch (error) {
    logError(LOG_LEVELS.WARN, operation, 'Authentication failed, falling back to mock authentication', context, error);
    return mockSignIn(email, password);
  }
};

export const signUp = async (email: string, password: string, metadata: any = {}) => {
  const operation = 'signUp';
  const context = { email, hasMetadata: Object.keys(metadata).length > 0 };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting sign up process', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase registration');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase registration failed', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase registration successful', {
      userId: data.user?.id
    });
    
    return { data, error: null };
  } catch (error) {
    logError(LOG_LEVELS.WARN, operation, 'Registration failed, falling back to mock registration', context, error);
    return mockSignUp(email, password, metadata);
  }
};

// Google OAuth sign in function
export const signInWithGoogle = async () => {
  const operation = 'signInWithGoogle';
  
  logError(LOG_LEVELS.INFO, operation, 'Starting Google OAuth sign in');
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase Google OAuth');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/bread`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Google OAuth sign in failed', {}, error);
      throw error;
    }

    logError(LOG_LEVELS.INFO, operation, 'Google OAuth sign in initiated successfully');
    return { data, error: null };
    
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Google OAuth sign in failed', {}, error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  const operation = 'signOut';
  
  logError(LOG_LEVELS.INFO, operation, 'Starting sign out process');
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase sign out');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase sign out failed', {}, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase sign out successful');
    return { error: null };
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Sign out failed', {}, error);
    return { error };
  }
};

// Progress tracking functions - Updated for UUID foreign key relationship
export const saveProgress = async (
  userId: string,
  breadId: string,
  breadName: string,
  currentStep: number,
  completedSteps: string[],
  startTime: Date,
  expectedFinishTime: Date
): Promise<SaveResult> => {
  const operation = 'saveProgress';
  const context = {
    userId,
    breadId,
    breadName,
    currentStep,
    completedStepCount: completedSteps.length
  };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting save progress operation', context);
  
  try {
    // Validate that breadId is a valid UUID and references a user recipe
    if (!isValidUUID(breadId)) {
      const error = `Invalid breadId format: ${breadId}. Must be a valid UUID referencing user_recipes.id`;
      logError(LOG_LEVELS.ERROR, operation, error, context);
      return {
        success: false,
        error
      };
    }
    
    // Verify the recipe exists and belongs to the user
    const { data: recipe, error: recipeError } = await supabase
      .from('user_recipes')
      .select('id, name')
      .eq('id', breadId)
      .eq('user_id', userId)
      .single();
    
    if (recipeError || !recipe) {
      const error = `Recipe not found or access denied: ${breadId}`;
      logError(LOG_LEVELS.ERROR, operation, error, context, recipeError);
      return {
        success: false,
        error: 'Recipe not found or you do not have permission to access it'
      };
    }
    
    const now = new Date();
    const progressData = {
      user_id: userId,
      bread_id: breadId, // Now a UUID foreign key
      bread_name: breadName,
      current_step: currentStep,
      completed_steps: completedSteps,
      start_time: startTime.toISOString(),
      expected_finish_time: expectedFinishTime.toISOString(),
      last_updated: now.toISOString(),
      is_completed: false
    };
    
    logError(LOG_LEVELS.DEBUG, operation, 'Checking for existing progress record');
    
    // First, try to find an existing progress record for this user/bread combination
    const { data: existingProgress, error: findError } = await supabase
      .from('bread_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('bread_id', breadId)
      .eq('is_completed', false)
      .maybeSingle(); // Use maybeSingle to avoid error if no record found
    
    if (findError) {
      logError(LOG_LEVELS.ERROR, operation, 'Error finding existing progress', context, findError);
      throw findError;
    }
    
    if (existingProgress) {
      // Update existing record using its ID
      logError(LOG_LEVELS.DEBUG, operation, 'Updating existing progress record', {
        existingProgressId: existingProgress.id
      });
      
      const { data, error } = await supabase
        .from('bread_progress')
        .update(progressData)
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      if (error) {
        logError(LOG_LEVELS.ERROR, operation, 'Supabase update failed', context, error);
        throw error;
      }
      
      logError(LOG_LEVELS.INFO, operation, 'Progress updated successfully', {
        progressId: data.id
      });
    } else {
      // Insert new record
      logError(LOG_LEVELS.DEBUG, operation, 'Inserting new progress record');
      
      const { data, error } = await supabase
        .from('bread_progress')
        .insert([progressData])
        .select()
        .single();
      
      if (error) {
        logError(LOG_LEVELS.ERROR, operation, 'Supabase insert failed', context, error);
        throw error;
      }
      
      logError(LOG_LEVELS.INFO, operation, 'Progress inserted successfully', {
        progressId: data.id
      });
    }
    
    return { success: true };
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to save progress', context, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving progress'
    };
  }
};

export const getUserProgress = async (userId: string): Promise<BreadProgress[]> => {
  const operation = 'getUserProgress';
  const context = { userId };
  
  logError(LOG_LEVELS.INFO, operation, 'Getting user progress', context);
  
  try {
    const { data, error } = await supabase
      .from('bread_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('last_updated', { ascending: false });
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Failed to get user progress', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'User progress retrieved successfully', {
      progressCount: data?.length || 0
    });
    
    return data || [];
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to get user progress', context, error);
    return [];
  }
};

export const getAllUserProgress = async (userId: string): Promise<BreadProgress[]> => {
  return getUserProgress(userId);
};

export const markBreadCompleted = async (
  userId: string,
  breadId: string,
  breadName: string,
  completedSteps: string[],
  notes?: string,
  rating?: number
): Promise<SaveResult> => {
  const operation = 'markBreadCompleted';
  const context = { userId, breadId, breadName };
  
  logError(LOG_LEVELS.INFO, operation, 'Marking bread as completed', context);
  
  try {
    // Validate that breadId is a valid UUID
    if (!isValidUUID(breadId)) {
      const error = `Invalid breadId format: ${breadId}. Must be a valid UUID referencing user_recipes.id`;
      logError(LOG_LEVELS.ERROR, operation, error, context);
      return {
        success: false,
        error
      };
    }
    
    // First, get the current progress to get timing information
    const { data: currentProgress, error: getError } = await supabase
      .from('bread_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('bread_id', breadId)
      .eq('is_completed', false)
      .single();
    
    if (getError || !currentProgress) {
      logError(LOG_LEVELS.WARN, operation, 'No progress found to mark as completed', context);
      return {
        success: false,
        error: 'No active baking progress found for this bread'
      };
    }
    
    const finishTime = new Date();
    const startTime = new Date(currentProgress.start_time);
    const durationMinutes = Math.round((finishTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Mark progress as completed using the progress record's ID
    const { error: progressError } = await supabase
      .from('bread_progress')
      .update({
        is_completed: true,
        completed_steps: completedSteps,
        last_updated: finishTime.toISOString()
      })
      .eq('id', currentProgress.id); // Use the record's ID instead of user_id/bread_id
    
    if (progressError) {
      logError(LOG_LEVELS.ERROR, operation, 'Failed to update progress as completed', context, progressError);
      throw progressError;
    }
    
    // Add entry to baking history - breadId is now UUID foreign key
    const historyData = {
      user_id: userId,
      bread_id: breadId, // UUID foreign key to user_recipes.id
      bread_name: breadName,
      start_time: currentProgress.start_time,
      finish_time: finishTime.toISOString(),
      total_steps: completedSteps.length,
      completed_steps: completedSteps,
      duration_minutes: durationMinutes,
      notes: notes || null,
      rating: rating || null,
      created_at: finishTime.toISOString()
    };
    
    const { error: historyError } = await supabase
      .from('user_baking_history')
      .insert([historyData]);
    
    if (historyError) {
      logError(LOG_LEVELS.ERROR, operation, 'Failed to save to baking history', context, historyError);
      // Don't fail the whole operation if history save fails
      logError(LOG_LEVELS.WARN, operation, 'Continuing despite history save failure');
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Bread marked as completed successfully', {
      durationMinutes,
      totalSteps: completedSteps.length
    });
    
    return { success: true };
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to mark bread as completed', context, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error marking bread as completed'
    };
  }
};

export const getBakingHistory = async (userId: string): Promise<BakingHistoryRecord[]> => {
  const operation = 'getBakingHistory';
  const context = { userId };
  
  logError(LOG_LEVELS.INFO, operation, 'Getting baking history', context);
  
  try {
    const { data, error } = await supabase
      .from('user_baking_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Failed to get baking history', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Baking history retrieved successfully', {
      historyCount: data?.length || 0
    });
    
    return data || [];
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to get baking history', context, error);
    return [];
  }
};

// Get user profile information
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const operation = 'getUserProfile';
  const context = { userId };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting get user profile operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Querying Supabase for user profile');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase query failed', context, error);
      throw error;
    }
    
    if (!data) {
      logError(LOG_LEVELS.INFO, operation, 'User profile not found', context);
      return null;
    }
    
    const profile: UserProfile = {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      location: data.location,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase query successful', {
      username: profile.username
    });
    
    return profile;
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to get user profile', context, error);
    return null;
  }
};

// Update user profile information
export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<SaveResult> => {
  const operation = 'updateUserProfile';
  const context = { userId, hasData: Object.keys(profileData).length > 0 };
  
  logError(LOG_LEVELS.INFO, operation, 'Starting update user profile operation', context);
  
  try {
    logError(LOG_LEVELS.DEBUG, operation, 'Attempting Supabase profile update');
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: now
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      logError(LOG_LEVELS.ERROR, operation, 'Supabase update failed', context, error);
      throw error;
    }
    
    logError(LOG_LEVELS.INFO, operation, 'Supabase profile update successful');
    return { success: true };
  } catch (error) {
    logError(LOG_LEVELS.ERROR, operation, 'Failed to update user profile', context, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
};

// Alias functions for backward compatibility
export const getBreadProgress = getUserProgress;