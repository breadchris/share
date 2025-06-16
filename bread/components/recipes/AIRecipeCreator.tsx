import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Upload, X, Sparkles, Camera, FileImage, Loader2, Brain, Wand2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { BreadRecipe } from '../BreadTypes';
import { generateRecipeFromImages } from '../../utils/aiRecipeGenerator';
import { useUser } from '../../contexts/UserContext';
import { saveRecipe } from '../../lib/supabase';

interface AIRecipeCreatorProps {
  onRecipeCreated: (recipe: BreadRecipe) => void;
  onBack: () => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  id: string;
}

export function AIRecipeCreator({ onRecipeCreated, onBack }: AIRecipeCreatorProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  // Handle file selection
  const handleFileChange = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];
    const maxImages = 5;
    
    for (let i = 0; i < Math.min(files.length, maxImages - images.length); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image file`);
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Please use images under 5MB.`);
        continue;
      }

      const imageId = `img-${Date.now()}-${i}`;
      const preview = URL.createObjectURL(file);
      
      newImages.push({
        file,
        preview,
        id: imageId
      });
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${newImages.length} image${newImages.length !== 1 ? 's' : ''}`);
    }

    if (images.length + newImages.length >= maxImages) {
      toast.info(`Maximum of ${maxImages} images allowed`);
    }
  }, [images.length]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Remove image
  const removeImage = (imageId: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // Handle file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Generate recipe using AI
  const handleGenerateRecipe = async () => {
    // Check if user has provided either images OR text details
    const hasImages = images.length > 0;
    const hasTextDetails = recipeName.trim() || additionalNotes.trim();
    
    if (!hasImages && !hasTextDetails) {
      toast.error('Please provide either images or recipe details to generate a recipe');
      return;
    }

    if (!user) {
      toast.error('Please sign in to create recipes');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('🤖 Starting AI recipe generation');
      console.log(`📸 Processing ${images.length} image(s)`);
      console.log(`📝 Recipe details: ${recipeName ? `Name: "${recipeName}"` : 'No name'}, ${additionalNotes ? `Notes: "${additionalNotes.substring(0, 50)}..."` : 'No notes'}`);
      
      // Show progress toast
      if (hasImages) {
        toast.info('Analyzing your images...', {
          description: 'AI is examining the ingredients and techniques'
        });
      } else {
        toast.info('Generating recipe from description...', {
          description: 'AI is creating your custom bread recipe'
        });
      }

      const generatedRecipe = await generateRecipeFromImages({
        images: images.map(img => img.file),
        recipeName: recipeName.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined
      });

      console.log('✅ Recipe generated successfully:', generatedRecipe.name);
      
      // Update the recipe with user information
      const recipeToSave: BreadRecipe = {
        ...generatedRecipe,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isUserCreated: true
      };

      // Show saving progress
      toast.info('Saving your recipe...', {
        description: 'Almost ready!'
      });

      // Save the recipe to the database
      console.log('💾 Saving AI-generated recipe to database');
      const saveResult = await saveRecipe(recipeToSave);

      if (saveResult.success) {
        console.log('✅ Recipe saved successfully to database');
        
        toast.success('AI recipe created successfully!', {
          description: `"${recipeToSave.name}" with ${recipeToSave.steps.length} steps is ready to bake!`
        });

        // Call the success callback with the saved recipe
        onRecipeCreated(recipeToSave);
      } else {
        console.error('❌ Failed to save recipe to database:', saveResult.error);
        toast.error('Failed to save recipe', {
          description: saveResult.error || 'Database error occurred'
        });
      }

    } catch (error) {
      console.error('❌ Error generating recipe:', error);
      
      let errorMessage = 'Failed to generate recipe';
      let errorDescription = 'Please try again or create a recipe manually';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('connect')) {
          errorDescription = 'Check your internet connection and try again';
        } else if (error.message.includes('temporarily unavailable')) {
          errorDescription = 'AI service is busy, please try again in a few moments';
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const hasContent = images.length > 0 || recipeName.trim() || additionalNotes.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-dusty-rose/20 to-muted-blue/20 rounded-full">
            <Brain className="h-8 w-8 text-deep-olive" />
          </div>
          <h1 className="text-deep-olive">AI Recipe Creator</h1>
        </div>
        <p className="text-secondary max-w-2xl mx-auto">
          Create recipes using AI with images, text descriptions, or both. Our AI will analyze your input 
          and generate detailed instructions, timing, and ingredient lists.
        </p>
      </div>

      {/* Recipe Name Input */}
      <Card className="border-soft-brown/30">
        <CardHeader>
          <CardTitle className="text-deep-olive flex items-center gap-2">
            <Type className="h-5 w-5" />
            Recipe Details
          </CardTitle>
          <CardDescription>
            Describe what you'd like to bake (images optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipe-name">Recipe Name (Optional)</Label>
            <Input
              id="recipe-name"
              placeholder="e.g., Rustic Sourdough Bread"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="mt-1 input-cozy"
            />
            <p className="text-xs text-secondary mt-1">
              Leave blank to let AI suggest a name based on your description or images
            </p>
          </div>
          
          <div>
            <Label htmlFor="additional-notes">Recipe Description & Notes</Label>
            <Textarea
              id="additional-notes"
              placeholder="Describe the bread you want to make, any special techniques, dietary restrictions, ingredients you have, or preferences..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="mt-1 min-h-[100px] input-cozy"
              rows={4}
            />
            <p className="text-xs text-secondary mt-1">
              Be as detailed as you like - more details help create better recipes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Compact Image Upload Area */}
      <Card className="border-soft-brown/30">
        <CardHeader>
          <CardTitle className="text-deep-olive flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Add Images (Optional)
          </CardTitle>
          <CardDescription>
            Upload up to 5 images to help the AI understand your vision
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Compact Upload Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-dusty-rose bg-dusty-rose/10' 
                : 'border-soft-brown/30 hover:border-dusty-rose/50 hover:bg-dusty-rose/5'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-dusty-rose/20 rounded-full">
                <Upload className="h-5 w-5 text-dusty-rose" />
              </div>
              
              <div>
                <h4 className="text-deep-olive text-sm">
                  {isDragging ? 'Drop images here' : 'Add bread images'}
                </h4>
                <p className="text-secondary text-xs mb-2">
                  Drag & drop or click to browse
                </p>
                
                <div className="flex flex-wrap gap-1 justify-center text-xs text-soft-brown/60">
                  <span className="bg-dusty-rose/20 px-2 py-0.5 rounded text-xs">JPEG</span>
                  <span className="bg-dusty-rose/20 px-2 py-0.5 rounded text-xs">PNG</span>
                  <span className="bg-dusty-rose/20 px-2 py-0.5 rounded text-xs">WebP</span>
                  <span className="bg-dusty-rose/20 px-2 py-0.5 rounded text-xs">Max 5MB</span>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Images Grid */}
          {images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-deep-olive text-sm mb-2 flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Uploaded Images ({images.length}/5)
              </h4>
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border border-soft-brown/20">
                      <ImageWithFallback
                        src={image.preview}
                        alt="Recipe image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 bg-cloud-white/90 hover:bg-cloud-white border-soft-brown/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Authentication Check */}
      {!user && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 text-sm mb-2">Sign in required</h4>
                <p className="text-sm text-red-700">
                  Please sign in to save your AI-generated recipes. You can still generate recipes, 
                  but they won't be saved to your collection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Generation Tips */}
      <Card className="border-muted-blue/30 bg-muted-blue/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-deep-olive mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-deep-olive text-sm mb-2">Tips for better AI results</h4>
              <ul className="text-sm text-soft-brown space-y-1">
                <li>• Describe the type of bread, texture, and flavors you want</li>
                <li>• Mention any dietary restrictions or special ingredients</li>
                <li>• Include photos of ingredients, process, or similar breads</li>
                <li>• Clear, well-lit images work best for analysis</li>
                <li>• Multiple angles help the AI understand texture and style</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-soft-brown text-soft-brown hover:bg-dusty-rose/10 hover:text-deep-olive"
        >
          Back to Recipe Options
        </Button>

        <Button
          onClick={handleGenerateRecipe}
          disabled={!hasContent || isGenerating || !user}
          className="bg-gradient-to-r from-deep-olive to-dusty-rose hover:from-deep-olive/90 hover:to-dusty-rose/90 text-cloud-white min-w-[160px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Recipe
            </>
          )}
        </Button>
      </div>
    </div>
  );
}