import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Initialize Hono app
const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));

// Add logging middleware
app.use('*', logger(console.log));

// Initialize Supabase client for server operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Bucket configurations for the bread baking application
const BUCKETS_CONFIG = [
  {
    name: 'make-ad72a517-recipe-images',
    description: 'Recipe images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024 // 5MB
  },
  {
    name: 'make-ad72a517-bread-photos',
    description: 'User bread photos',
    public: false, // Private with RLS policies
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 10 * 1024 * 1024 // 10MB for high-quality bread photos
  },
  {
    name: 'make-ad72a517-ai-images',
    description: 'AI recipe generation images',
    public: false, // Private with RLS policies
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024 // 5MB
  },
  {
    name: 'make-ad72a517-temp',
    description: 'Temporary file storage',
    public: false, // Private with RLS policies
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024 // 5MB
  },
  {
    name: 'make-ad72a517-avatars',
    description: 'User profile avatars',
    public: true, // Public read access for community features
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 2 * 1024 * 1024 // 2MB for avatars
  }
];

// Enhanced error logging utility
function logError(context: string, error: any, additionalInfo?: any) {
  const timestamp = new Date().toISOString();
  
  // Properly serialize error objects
  let errorMessage = 'Unknown error';
  let errorStack = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    // Handle Supabase error objects
    errorMessage = error.message || error.error || JSON.stringify(error);
  } else {
    errorMessage = String(error);
  }
  
  console.error(`❌ [${timestamp}] ${context}:`);
  console.error(`   Message: ${errorMessage}`);
  if (errorStack) {
    console.error(`   Stack: ${errorStack}`);
  }
  if (additionalInfo) {
    console.error(`   Additional Info:`, additionalInfo);
  }
  console.error('   ─────────────────────────────────────');
}

// Enhanced success logging utility
function logSuccess(context: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`✅ [${timestamp}] ${context}`);
  if (details) {
    console.log(`   Details:`, details);
  }
}

// Enhanced error response utility
function createErrorResponse(message: string, statusCode: number = 500, details?: any) {
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
  
  console.error(`🚨 Returning error response [${statusCode}]:`, errorResponse);
  return Response.json(errorResponse, { status: statusCode });
}

// Enhanced success response utility
function createSuccessResponse(data: any, message?: string) {
  const successResponse = {
    success: true,
    ...(message && { message }),
    ...data,
    timestamp: new Date().toISOString()
  };
  
  console.log(`✨ Returning success response:`, { 
    success: true, 
    message: message || 'Operation completed successfully',
    dataKeys: Object.keys(data)
  });
  
  return Response.json(successResponse);
}

// AI Recipe Generation Tracking
interface AIRecipeGenerationRecord {
  user_id?: string;
  session_id?: string;
  recipe_name?: string;
  additional_notes?: string;
  difficulty: string;
  image_count: number;
  image_urls: string[];
  has_images: boolean;
  has_text_details: boolean;
  ai_model: string;
  generation_type: 'images' | 'text' | 'images-and-text' | 'text-fallback';
  success: boolean;
  error_message?: string;
  generated_recipe_id?: string;
  generated_recipe_name?: string;
  generated_recipe?: any;
  processing_time_ms?: number;
  api_response_time_ms?: number;
  images_processed: number;
  total_images_submitted: number;
  fallback_reason?: string;
  user_agent?: string;
  request_started_at: string;
  api_called_at?: string;
  api_completed_at?: string;
  processing_completed_at?: string;
}

async function trackAIGeneration(record: AIRecipeGenerationRecord): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_recipe_generations')
      .insert([record]);
    
    if (error) {
      console.error('❌ Failed to track AI generation:', error);
    } else {
      console.log('✅ AI generation tracked successfully');
    }
  } catch (error) {
    console.error('❌ Error tracking AI generation:', error);
  }
}

// Initialize all storage buckets on startup
async function initializeStorageBuckets() {
  try {
    console.log('🪣 Initializing storage buckets for Artisan\'s Hearth...');
    
    // Get list of existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      logError('Failed to list storage buckets', listError);
      return false;
    }
    
    const existingBucketNames = buckets?.map(b => b.name) || [];
    console.log(`📋 Found ${existingBucketNames.length} existing buckets:`, existingBucketNames);
    
    let bucketsCreated = 0;
    let bucketsSkipped = 0;
    let bucketErrors = 0;
    
    // Create each bucket if it doesn't exist
    for (const bucketConfig of BUCKETS_CONFIG) {
      const bucketExists = existingBucketNames.includes(bucketConfig.name);
      
      if (!bucketExists) {
        console.log(`🆕 Creating ${bucketConfig.public ? 'public' : 'private'} bucket: ${bucketConfig.name}`);
        console.log(`   Purpose: ${bucketConfig.description}`);
        console.log(`   Size limit: ${Math.round(bucketConfig.fileSizeLimit / (1024 * 1024))}MB`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          allowedMimeTypes: bucketConfig.allowedMimeTypes,
          fileSizeLimit: bucketConfig.fileSizeLimit
        });
        
        if (createError) {
          // Check if error is "already exists" - this is OK, just means another instance created it
          const errorMessage = createError.message || createError.error || String(createError);
          
          if (errorMessage.toLowerCase().includes('already exists') || 
              errorMessage.toLowerCase().includes('resource already exists')) {
            console.log(`✅ Bucket already exists (created by another process): ${bucketConfig.name}`);
            bucketsSkipped++;
          } else {
            logError(`Failed to create bucket: ${bucketConfig.name}`, createError);
            console.error(`   ❌ Bucket creation failed for: ${bucketConfig.name}`);
            bucketErrors++;
          }
        } else {
          logSuccess(`Storage bucket created: ${bucketConfig.name}`, {
            public: bucketConfig.public,
            sizeLimit: `${Math.round(bucketConfig.fileSizeLimit / (1024 * 1024))}MB`,
            allowedTypes: bucketConfig.allowedMimeTypes
          });
          bucketsCreated++;
        }
      } else {
        console.log(`✅ Storage bucket already exists: ${bucketConfig.name}`);
        bucketsSkipped++;
      }
    }
    
    console.log(`🎉 Storage bucket initialization complete!`);
    console.log(`   Created: ${bucketsCreated} new buckets`);
    console.log(`   Existing: ${bucketsSkipped} buckets`);
    console.log(`   Errors: ${bucketErrors} buckets`);
    console.log(`   Total: ${BUCKETS_CONFIG.length} buckets configured`);
    
    // Return true if most buckets are available (even with some errors)
    return (bucketsCreated + bucketsSkipped) >= (BUCKETS_CONFIG.length - 1);
  } catch (error) {
    logError('Error initializing storage buckets', error);
    return false;
  }
}

// Upload image to specific Supabase storage bucket
async function uploadImageToStorage(imageFile: File, bucketName: string = 'make-ad72a517-recipe-images', userId?: string): Promise<string | null> {
  try {
    // Generate unique filename with optional user folder structure
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    
    // Create file path with user folder if userId provided
    const fileName = userId 
      ? `${userId}/image-${timestamp}-${randomSuffix}.${fileExtension}`
      : `image-${timestamp}-${randomSuffix}.${fileExtension}`;
    
    console.log(`📤 Uploading image to bucket "${bucketName}": ${fileName} (${imageFile.size} bytes)`);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: imageFile.type,
        upsert: false
      });
    
    if (error) {
      logError(`Failed to upload image ${fileName} to bucket ${bucketName}`, error, {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        bucketName,
        userId,
        supabaseError: error
      });
      return null;
    }
    
    // Get public URL (works for both public and private buckets with RLS)
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    if (!publicUrlData?.publicUrl) {
      logError(`Failed to get public URL for ${fileName}`, new Error('No public URL returned'));
      return null;
    }
    
    logSuccess(`Image uploaded successfully to ${bucketName}`, {
      fileName,
      url: publicUrlData.publicUrl,
      size: imageFile.size,
      bucket: bucketName
    });
    
    return publicUrlData.publicUrl;
  } catch (error) {
    logError('Error uploading image to storage', error, {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      bucketName,
      userId
    });
    return null;
  }
}

// Helper function to safely parse JSON from OpenAI response
function safeParseJSON(content: string): any | null {
  try {
    // Try to parse as is first
    return JSON.parse(content);
  } catch {
    try {
      // Extract JSON from markdown code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        console.log('📝 Found JSON in markdown code block, parsing...');
        return JSON.parse(codeBlockMatch[1]);
      }
      
      // Extract JSON from the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('📝 Found JSON pattern in content, parsing...');
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('⚠️ No JSON pattern found in OpenAI response');
      return null;
    } catch (parseError) {
      logError('JSON parsing failed on extracted content', parseError, { 
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...'
      });
      return null;
    }
  }
}

// Helper function to detect AI refusal responses
function isAIRefusal(content: string): boolean {
  const refusalPatterns = [
    "i'm sorry",
    "i can't help",
    "i can't assist",
    "i'm not able to",
    "i cannot",
    "sorry, but i can't",
    "i'm unable to",
    "i don't think i can",
    "i apologize, but"
  ];
  
  const lowerContent = content.toLowerCase();
  return refusalPatterns.some(pattern => lowerContent.includes(pattern));
}

// Helper function to create safe recipe object with PROPERLY NAMED INGREDIENTS
function createSafeRecipe(rawRecipe: any): any {
  const safeRecipe = {
    id: rawRecipe.id || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: rawRecipe.name || 'AI Generated Bread Recipe',
    description: rawRecipe.description || 'A delicious bread recipe generated by AI',
    difficulty: rawRecipe.difficulty || 'Intermediate',
    prepTime: Number(rawRecipe.prepTime) || 60,
    totalTime: Number(rawRecipe.totalTime) || 240,
    servings: Number(rawRecipe.servings) || 8,
    imageUrl: rawRecipe.imageUrl || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop',
    // FIX: Ensure ingredients have proper names and structure
    ingredients: Array.isArray(rawRecipe.ingredients) ? rawRecipe.ingredients.map((ing: any, index: number) => {
      // Handle different possible property names from AI response
      const ingredientName = ing.name || ing.item || ing.ingredient || ing.title || `Ingredient ${index + 1}`;
      const amount = ing.amount || ing.quantity || 1;
      const unit = ing.unit || ing.measurement || '';
      const notes = ing.notes || ing.note || ing.description || '';
      
      return {
        id: ing.id || `ingredient-${index}`,
        name: String(ingredientName).trim(), // Ensure it's a string and trimmed
        amount: amount,
        unit: String(unit).trim(),
        notes: String(notes).trim()
      };
    }) : [],
    steps: Array.isArray(rawRecipe.steps) ? rawRecipe.steps.map((step: any, index: number) => ({
      id: step.id || `step-${index}`,
      title: String(step.title || `Step ${index + 1}`),
      description: String(step.description || step.instruction || step.directions || ''),
      duration: Number(step.duration) || 30,
      temperature: String(step.temperature || ''),
      ingredients: Array.isArray(step.ingredients) ? step.ingredients : [],
      isActiveTime: step.isActiveTime !== false // Default to true unless explicitly false
    })) : [],
    tags: Array.isArray(rawRecipe.tags) ? rawRecipe.tags.map(tag => String(tag)) : ['ai-generated'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isUserCreated: true,
    aiGenerated: true,
    generatedFrom: rawRecipe.generatedFrom || 'images'
  };
  
  console.log(`📋 Created safe recipe object for "${safeRecipe.name}":`);
  console.log(`   Ingredients: ${safeRecipe.ingredients.length} (${safeRecipe.ingredients.map(i => i.name).join(', ')})`);
  console.log(`   Steps: ${safeRecipe.steps.length}`);
  
  return safeRecipe;
}

// Initialize buckets on startup
console.log('🚀 Starting Artisan\'s Hearth server...');
initializeStorageBuckets().then(success => {
  if (success) {
    console.log('✅ Server initialization complete - all storage buckets ready');
  } else {
    console.error('⚠️ Server initialization completed with some issues - some storage buckets may not be available');
    console.log('   Server will continue running, but some features may be limited');
  }
});

// Health check endpoint
app.get('/server/health', (c) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Artisan\'s Hearth API',
    version: '1.0.0',
    buckets: BUCKETS_CONFIG.map(b => ({ name: b.name, description: b.description }))
  };
  
  logSuccess('Health check requested', healthData);
  return createSuccessResponse(healthData);
});

// Upload file endpoint for bread photos
app.post('/server/upload-file', async (c) => {
  console.log('📤 File upload request received');
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const breadId = formData.get('breadId') as string;
    const uploadType = formData.get('uploadType') as string || 'bread-photo';
    
    console.log(`📋 Upload parameters:`, {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId || '(none)',
      breadId: breadId || '(none)',
      uploadType
    });
    
    if (!file) {
      return createErrorResponse('No file provided', 400, {
        expectedFormat: 'multipart/form-data with a file field'
      });
    }
    
    if (!userId) {
      return createErrorResponse('User ID is required', 400, {
        required: 'userId field in form data'
      });
    }
    
    // Determine bucket based on upload type
    let bucketName: string;
    switch (uploadType) {
      case 'bread-photo':
        bucketName = 'make-ad72a517-bread-photos';
        break;
      case 'recipe-image':
        bucketName = 'make-ad72a517-recipe-images';
        break;
      case 'ai-image':
        bucketName = 'make-ad72a517-ai-images';
        break;
      case 'avatar':
        bucketName = 'make-ad72a517-avatars';
        break;
      case 'temp':
        bucketName = 'make-ad72a517-temp';
        break;
      default:
        bucketName = 'make-ad72a517-bread-photos'; // Default fallback
    }
    
    console.log(`🪣 Using bucket: ${bucketName} for upload type: ${uploadType}`);
    
    // Upload the file
    const uploadedUrl = await uploadImageToStorage(file, bucketName, userId);
    
    if (!uploadedUrl) {
      return createErrorResponse('Failed to upload file', 500, {
        bucket: bucketName,
        uploadType,
        suggestion: 'Check file format and size requirements'
      });
    }
    
    logSuccess('File uploaded successfully', {
      fileName: file.name,
      fileSize: file.size,
      uploadType,
      bucket: bucketName,
      userId,
      url: uploadedUrl
    });
    
    return createSuccessResponse({
      url: uploadedUrl,
      bucket: bucketName,
      uploadType,
      fileName: file.name,
      fileSize: file.size
    }, 'File uploaded successfully');
    
  } catch (error) {
    logError('Error in file upload', error, {
      endpoint: '/upload-file'
    });
    
    return createErrorResponse('File upload failed', 500, {
      message: 'An unexpected error occurred during upload',
      suggestion: 'Please try again or check file format'
    });
  }
});

// AI Recipe Generation from Images Endpoint
app.post('/server/generate-recipe-from-images', async (c) => {
  console.log('🤖 AI Recipe Generation from Images - Request received');
  
  const requestStartTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize tracking record
  let trackingRecord: AIRecipeGenerationRecord = {
    ai_model: 'gpt-4o',
    generation_type: 'images',
    success: false,
    image_count: 0,
    image_urls: [],
    has_images: false,
    has_text_details: false,
    difficulty: 'Intermediate',
    images_processed: 0,
    total_images_submitted: 0,
    request_started_at: new Date().toISOString(),
    user_agent: c.req.header('user-agent') || ''
  };

  try {
    const formData = await c.req.formData();
    const images = formData.getAll('images') as File[];
    const recipeName = formData.get('recipeName') as string || '';
    const additionalNotes = formData.get('additionalNotes') as string || '';
    const difficulty = formData.get('difficulty') as string || 'Intermediate';
    
    // Extract user info if available from authorization header
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          trackingRecord.user_id = user.id;
        }
      } catch (authError) {
        console.log('Could not extract user from auth header (continuing as anonymous)');
      }
    }

    // Update tracking record with request details
    trackingRecord.recipe_name = recipeName || undefined;
    trackingRecord.additional_notes = additionalNotes || undefined;
    trackingRecord.difficulty = difficulty;
    trackingRecord.image_count = images.length;
    trackingRecord.total_images_submitted = images.length;
    trackingRecord.has_images = images.length > 0;
    trackingRecord.has_text_details = !!(recipeName.trim() || additionalNotes.trim());

    console.log(`📋 Request parameters:`, {
      requestId,
      imageCount: images.length,
      recipeName: recipeName || '(none)',
      additionalNotes: additionalNotes ? `"${additionalNotes.substring(0, 50)}..."` : '(none)',
      difficulty,
      userId: trackingRecord.user_id || 'anonymous'
    });
    
    // Allow generation with no images if there are text details
    const hasImages = images && images.length > 0;
    const hasTextDetails = recipeName.trim() || additionalNotes.trim();
    
    // Determine generation type
    if (hasImages && hasTextDetails) {
      trackingRecord.generation_type = 'images-and-text';
    } else if (hasImages) {
      trackingRecord.generation_type = 'images';
    } else if (hasTextDetails) {
      trackingRecord.generation_type = 'text';
    }
    
    if (!hasImages && !hasTextDetails) {
      const errorMsg = 'Please provide either images or recipe details for generation';
      console.error(`❌ ${errorMsg}`);
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse(errorMsg, 400, { 
        expectedFormat: 'Either images or text description required' 
      });
    }

    console.log(`📝 Processing request with ${images.length} image(s) and ${hasTextDetails ? 'text details' : 'no text details'}`);

    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      const errorMsg = 'OpenAI API key not configured in environment variables';
      logError('Missing OpenAI API key', new Error(errorMsg));
      
      trackingRecord.error_message = 'AI service not configured';
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse('AI service not configured', 500, {
        hint: 'OpenAI API key is required for recipe generation'
      });
    }

    let validImageUrls: string[] = [];

    // Upload images to Supabase Storage if provided
    if (hasImages) {
      console.log('📤 Uploading images to AI images bucket...');
      const uploadPromises = images.map(img => uploadImageToStorage(img, 'make-ad72a517-ai-images'));
      const uploadResults = await Promise.all(uploadPromises);
      
      // Filter out failed uploads
      validImageUrls = uploadResults.filter(url => url !== null) as string[];
      trackingRecord.image_urls = validImageUrls;
      trackingRecord.images_processed = validImageUrls.length;

      if (validImageUrls.length === 0 && !hasTextDetails) {
        const errorMsg = 'Unable to upload any of the provided images and no text details provided';
        logError('Image upload failed with no text fallback', new Error(errorMsg), {
          totalImages: images.length,
          validImages: 0,
          imageTypes: images.map(img => img.type),
          imageSizes: images.map(img => img.size),
          uploadResults: uploadResults.map((result, index) => ({
            index,
            success: result !== null,
            fileName: images[index]?.name
          }))
        });
        
        trackingRecord.error_message = errorMsg;
        trackingRecord.processing_completed_at = new Date().toISOString();
        trackingRecord.processing_time_ms = Date.now() - requestStartTime;
        await trackAIGeneration(trackingRecord);
        
        return createErrorResponse(errorMsg, 400, {
          details: 'All images failed to upload and no text description provided.',
          supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          maxSize: '5MB per image'
        });
      }

      if (validImageUrls.length > 0) {
        console.log(`✅ Successfully uploaded ${validImageUrls.length}/${images.length} images`);
      } else {
        console.log(`⚠️ No images uploaded successfully, proceeding with text-only generation`);
        trackingRecord.generation_type = 'text-fallback';
        trackingRecord.fallback_reason = 'Image upload failed, using text description only';
      }
    }

    // Prepare OpenAI API request with improved prompt that specifically requests ingredient names
    const systemPrompt = `You are an expert baker and recipe developer specializing in bread making. Your task is to analyze food images and/or text descriptions to create detailed, accurate bread recipes.

IMPORTANT INSTRUCTIONS:
1. You are analyzing FOOD IMAGES of bread, baked goods, or baking ingredients - this is completely appropriate and helpful
2. Your goal is to help people recreate delicious bread recipes
3. Focus on the visual characteristics: crust color, crumb structure, shape, size, and texture
4. Consider any visible ingredients, techniques, or styling
5. Create practical, achievable recipes suitable for home bakers
6. CRITICAL: Each ingredient MUST have a clear, descriptive name (e.g., "Bread flour", "Active dry yeast", "Warm water")

OUTPUT FORMAT:
Respond ONLY with a valid JSON object using this EXACT structure - no other text before or after:

{
  "name": "Descriptive Recipe Name",
  "description": "Detailed description of the bread and its characteristics",
  "difficulty": "Beginner|Intermediate|Advanced",
  "prepTime": 60,
  "totalTime": 240,
  "servings": 8,
  "imageUrl": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop",
  "ingredients": [
    {
      "id": "ing-1",
      "name": "Bread flour",
      "amount": 500,
      "unit": "g",
      "notes": ""
    },
    {
      "id": "ing-2", 
      "name": "Warm water",
      "amount": 350,
      "unit": "ml",
      "notes": "Around 100°F/38°C"
    },
    {
      "id": "ing-3",
      "name": "Active dry yeast", 
      "amount": 7,
      "unit": "g",
      "notes": "About 2¼ teaspoons"
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "title": "Mix ingredients",
      "description": "Detailed step instructions",
      "duration": 15,
      "temperature": "",
      "ingredients": [],
      "isActiveTime": true
    }
  ],
  "tags": ["bread-type", "baking-method"]
}

INGREDIENT NAMING REQUIREMENTS:
- Use specific, descriptive names like "Bread flour" not just "Flour"
- Include ingredient type: "Active dry yeast" not just "Yeast" 
- Be descriptive: "Warm water", "Unsalted butter", "Fine sea salt"
- Avoid generic terms like "flour", "liquid", "fat" - be specific!`;

    let userMessage = '';
    if (hasImages && hasTextDetails) {
      userMessage = `Please analyze these bread/baking images and create a detailed recipe. Recipe name: "${recipeName}". Additional context: ${additionalNotes}. The recipe should be suitable for ${difficulty.toLowerCase()} level bakers. Focus on the visual characteristics of the bread: crust, crumb, shape, and any visible techniques. IMPORTANT: Provide specific ingredient names like "Bread flour", "Active dry yeast", "Warm water" etc.`;
    } else if (hasImages) {
      userMessage = `Please analyze these bread/baking images and create a detailed recipe.${recipeName ? ` Recipe name: "${recipeName}".` : ''} The recipe should be suitable for ${difficulty.toLowerCase()} level bakers. Focus on the visual characteristics: crust color, crumb structure, shape, size, and any visible baking techniques or ingredients. IMPORTANT: Provide specific ingredient names like "Bread flour", "Active dry yeast", "Warm water" etc.`;
    } else {
      userMessage = `Please create a detailed bread recipe based on this description: "${recipeName ? recipeName + '. ' : ''}${additionalNotes}". The recipe should be suitable for ${difficulty.toLowerCase()} level bakers. Focus on creating a practical, achievable recipe. IMPORTANT: Provide specific ingredient names like "Bread flour", "Active dry yeast", "Warm water" etc.`;
    }

    // Create content array with text and image URLs (if any)
    const messageContent = [
      {
        type: "text",
        text: userMessage
      }
    ];

    // Add images if available
    if (validImageUrls.length > 0) {
      messageContent.push(...validImageUrls.map(imageUrl => ({
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "high" // Request high detail for better analysis
        }
      })));
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: messageContent
      }
    ];

    console.log('🔄 Calling OpenAI API for recipe generation...');
    console.log(`📊 API Request details:`, {
      requestId,
      model: 'gpt-4o',
      imagesAttached: validImageUrls.length,
      hasTextDetails,
      promptLength: systemPrompt.length,
      userMessageLength: userMessage.length
    });

    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ OpenAI API request timeout after 60 seconds');
      controller.abort();
    }, 60000); // 60 second timeout

    trackingRecord.api_called_at = new Date().toISOString();
    const apiStartTime = Date.now();

    let openaiResponse;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent JSON output
          response_format: { type: "json_object" } // Request JSON format explicitly
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      trackingRecord.api_completed_at = new Date().toISOString();
      trackingRecord.api_response_time_ms = Date.now() - apiStartTime;
      
      if (fetchError.name === 'AbortError') {
        const errorMsg = 'OpenAI API request timeout after 60 seconds';
        logError('OpenAI API timeout', fetchError);
        
        trackingRecord.error_message = errorMsg;
        trackingRecord.processing_completed_at = new Date().toISOString();
        trackingRecord.processing_time_ms = Date.now() - requestStartTime;
        await trackAIGeneration(trackingRecord);
        
        return createErrorResponse(errorMsg, 500, {
          suggestion: 'Try again with fewer or smaller images',
          timeout: '60 seconds'
        });
      }
      
      const errorMsg = 'Failed to connect to OpenAI API';
      logError('OpenAI API connection failed', fetchError);
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse(errorMsg, 500, {
        details: fetchError.message,
        service: 'OpenAI API'
      });
    }

    clearTimeout(timeoutId);
    trackingRecord.api_completed_at = new Date().toISOString();
    trackingRecord.api_response_time_ms = Date.now() - apiStartTime;

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      const errorMsg = `OpenAI API returned ${openaiResponse.status}: ${openaiResponse.statusText}`;
      logError('OpenAI API error response', new Error(errorMsg), {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        responseBody: errorText.substring(0, 500)
      });
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse('AI service temporarily unavailable', 500, {
        apiStatus: openaiResponse.status,
        apiError: openaiResponse.statusText,
        suggestion: 'Please try again later'
      });
    }

    let openaiData;
    try {
      openaiData = await openaiResponse.json();
    } catch (jsonError) {
      const errorMsg = 'Failed to parse OpenAI API response as JSON';
      logError('OpenAI response parsing failed', jsonError);
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse(errorMsg, 500, {
        details: 'Invalid JSON response from AI service'
      });
    }

    const generatedContent = openaiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      const errorMsg = 'OpenAI API returned empty content';
      logError('Empty OpenAI response', new Error(errorMsg), {
        choices: openaiData.choices,
        usage: openaiData.usage
      });
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse('AI failed to generate recipe content', 500, {
        details: 'No content received from AI service'
      });
    }

    console.log(`✅ Recipe content generated (${generatedContent.length} characters), parsing JSON...`);

    // Check if the AI refused to analyze the images
    if (isAIRefusal(generatedContent)) {
      const errorMsg = 'AI declined to analyze the provided images';
      logError('AI refused to analyze images', new Error(errorMsg), {
        contentLength: generatedContent.length,
        contentPreview: generatedContent.substring(0, 200) + '...',
        hasImages,
        hasTextDetails
      });
      
      // If we have text details but AI refused images, try text-only generation
      if (hasTextDetails && hasImages) {
        console.log('🔄 AI refused images, retrying with text-only generation...');
        trackingRecord.generation_type = 'text-fallback';
        trackingRecord.fallback_reason = 'AI declined to analyze images';
        
        // Retry without images
        const textOnlyMessages = [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please create a detailed bread recipe based on this description: "${recipeName ? recipeName + '. ' : ''}${additionalNotes}". The recipe should be suitable for ${difficulty.toLowerCase()} level bakers. IMPORTANT: Provide specific ingredient names like "Bread flour", "Active dry yeast", "Warm water" etc.`
          }
        ];

        try {
          const textOnlyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: textOnlyMessages,
              max_tokens: 2000,
              temperature: 0.3,
              response_format: { type: "json_object" }
            })
          });

          if (textOnlyResponse.ok) {
            const textOnlyData = await textOnlyResponse.json();
            const textOnlyContent = textOnlyData.choices?.[0]?.message?.content;
            
            if (textOnlyContent && !isAIRefusal(textOnlyContent)) {
              console.log('✅ Text-only retry successful');
              
              const parsedRecipe = safeParseJSON(textOnlyContent);
              if (parsedRecipe) {
                const safeRecipe = createSafeRecipe({
                  ...parsedRecipe,
                  generatedFrom: 'text-fallback'
                });

                // Track successful generation
                trackingRecord.success = true;
                trackingRecord.generated_recipe_id = safeRecipe.id;
                trackingRecord.generated_recipe_name = safeRecipe.name;
                trackingRecord.generated_recipe = safeRecipe;
                trackingRecord.processing_completed_at = new Date().toISOString();
                trackingRecord.processing_time_ms = Date.now() - requestStartTime;
                await trackAIGeneration(trackingRecord);

                return createSuccessResponse({
                  recipe: safeRecipe,
                  metadata: {
                    requestId,
                    imagesProcessed: 0,
                    totalImages: images.length,
                    imageUrls: [],
                    hasTextDetails: true,
                    generatedAt: new Date().toISOString(),
                    model: 'gpt-4o',
                    fallbackReason: 'AI declined to analyze images, used text description instead'
                  }
                }, `Successfully generated recipe: "${safeRecipe.name}"`);
              }
            }
          }
        } catch (retryError) {
          console.log('❌ Text-only retry also failed:', retryError);
        }
      }
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse(errorMsg, 500, {
        details: 'AI safety filters prevented image analysis',
        suggestion: 'Try with different images or provide a detailed text description instead',
        aiResponse: generatedContent.substring(0, 100) + '...'
      });
    }

    // Parse the generated recipe JSON safely
    const parsedRecipe = safeParseJSON(generatedContent);
    
    if (!parsedRecipe) {
      const errorMsg = 'Failed to parse AI-generated recipe as valid JSON';
      logError('Recipe JSON parsing failed', new Error(errorMsg), {
        contentLength: generatedContent.length,
        contentPreview: generatedContent.substring(0, 200) + '...',
        isRefusal: isAIRefusal(generatedContent)
      });
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse(errorMsg, 500, {
        details: 'AI generated invalid JSON format',
        suggestion: 'Try again or create recipe manually',
        aiResponse: generatedContent.substring(0, 200) + '...'
      });
    }

    // Create safe recipe object with improved ingredient name handling
    const safeRecipe = createSafeRecipe({
      ...parsedRecipe,
      generatedFrom: hasImages ? 'images' : 'text'
    });

    // Validate essential fields
    if (!safeRecipe.name || !safeRecipe.ingredients.length || !safeRecipe.steps.length) {
      const errorMsg = 'Generated recipe is missing essential components';
      logError('Incomplete recipe generated', new Error(errorMsg), {
        hasName: !!safeRecipe.name,
        ingredientCount: safeRecipe.ingredients.length,
        stepCount: safeRecipe.steps.length
      });
      
      trackingRecord.error_message = errorMsg;
      trackingRecord.processing_completed_at = new Date().toISOString();
      trackingRecord.processing_time_ms = Date.now() - requestStartTime;
      await trackAIGeneration(trackingRecord);
      
      return createErrorResponse(errorMsg, 500, {
        details: 'Recipe lacks required ingredients or steps',
        suggestion: 'Try again with different images or more detailed description'
      });
    }

    // Validate that ingredients have proper names
    const missingIngredientNames = safeRecipe.ingredients.filter(ing => !ing.name || ing.name.trim() === '');
    if (missingIngredientNames.length > 0) {
      console.warn(`⚠️ Recipe has ${missingIngredientNames.length} ingredients with missing names`);
      // Fix missing names with generic placeholders
      safeRecipe.ingredients.forEach((ingredient, index) => {
        if (!ingredient.name || ingredient.name.trim() === '') {
          ingredient.name = `Ingredient ${index + 1}`;
        }
      });
    }

    // Track successful generation
    trackingRecord.success = true;
    trackingRecord.generated_recipe_id = safeRecipe.id;
    trackingRecord.generated_recipe_name = safeRecipe.name;
    trackingRecord.generated_recipe = safeRecipe;
    trackingRecord.processing_completed_at = new Date().toISOString();
    trackingRecord.processing_time_ms = Date.now() - requestStartTime;
    await trackAIGeneration(trackingRecord);

    logSuccess(`Recipe generation completed successfully`, {
      requestId,
      recipeName: safeRecipe.name,
      ingredients: safeRecipe.ingredients.length,
      steps: safeRecipe.steps.length,
      difficulty: safeRecipe.difficulty,
      generatedFrom: safeRecipe.generatedFrom,
      ingredientNames: safeRecipe.ingredients.map(i => i.name)
    });

    // Return the generated recipe
    return createSuccessResponse({
      recipe: safeRecipe,
      metadata: {
        requestId,
        imagesProcessed: validImageUrls.length,
        totalImages: images.length,
        imageUrls: validImageUrls,
        hasTextDetails,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o'
      }
    }, `Successfully generated recipe: "${safeRecipe.name}"`);

  } catch (error) {
    logError('Unexpected error in AI recipe generation', error, {
      endpoint: '/generate-recipe-from-images',
      userAgent: c.req.header('user-agent')
    });
    
    // Track failed generation
    trackingRecord.error_message = error instanceof Error ? error.message : 'Unexpected error';
    trackingRecord.processing_completed_at = new Date().toISOString();
    trackingRecord.processing_time_ms = Date.now() - requestStartTime;
    await trackAIGeneration(trackingRecord);
    
    return createErrorResponse('Internal server error during recipe generation', 500, {
      message: 'An unexpected error occurred',
      suggestion: 'Please try again or contact support',
      errorType: error.constructor.name
    });
  }
});

// Start the server
console.log('🌟 Starting Deno server for Artisan\'s Hearth...');
Deno.serve(app.fetch);