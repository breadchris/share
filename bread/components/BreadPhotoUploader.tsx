import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Camera, Upload, X, Sparkles, Share2, AlertCircle } from 'lucide-react';
import { uploadAndSaveBreadPhoto, mockUploadBreadPhoto, validateImageFile, compressImage } from '../utils/photoUpload';
import { toast } from 'sonner';

interface BreadPhotoUploaderProps {
  userId?: string; // Optional because user might not be logged in
  breadId: string;
  breadName: string;
  onPhotoUploaded?: (photoUrl: string) => void;
}

export function BreadPhotoUploader({ 
  userId, 
  breadId, 
  breadName,
  onPhotoUploaded 
}: BreadPhotoUploaderProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle camera capture
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };
  
  // Handle file upload
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection with validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset any previous errors
    setUploadError(null);

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    try {
      // Compress large images
      let processedFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB
        toast.info('Optimizing image...');
        processedFile = await compressImage(file);
        console.log(`📐 Image compressed: ${file.size} → ${processedFile.size} bytes`);
      }

      setPhoto(processedFile);
      const previewUrl = URL.createObjectURL(processedFile);
      setPhotoPreview(previewUrl);
      
      toast.success('Photo selected successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. Please try another file.');
      setUploadError('Failed to process image');
    }
  };
  
  // Clear selected photo
  const handleClearPhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle share/upload process
  const handleShareBread = async () => {
    if (!photo) {
      toast.error('Please add a photo of your bread first!');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      let photoUrl: string | null = null;
      
      // If user is logged in, upload to Supabase with full functionality
      if (userId) {
        console.log('🔐 User authenticated, uploading to Supabase');
        photoUrl = await uploadAndSaveBreadPhoto(
          photo, 
          userId, 
          breadId, 
          breadName, 
          comment.trim()
        );
        
        if (photoUrl) {
          toast.success('Your bread has been shared with the community!', {
            description: 'Other bakers can now see your creation'
          });
        } else {
          throw new Error('Failed to upload photo');
        }
      } else {
        // Mock upload for users who aren't logged in
        console.log('👤 Guest user, using mock upload');
        photoUrl = await mockUploadBreadPhoto(photo, breadId);
        
        toast.info('Photo preview created!', {
          description: 'Sign in to save your bread creations permanently'
        });
      }
      
      if (photoUrl) {
        setIsShared(true);
        if (onPhotoUploaded) {
          onPhotoUploaded(photoUrl);
        }
      }
    } catch (error) {
      console.error('❌ Error sharing bread:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(errorMessage);
      
      toast.error('Failed to share your bread', {
        description: 'Please try again or check your internet connection'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-amber-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-100/70 to-amber-50/50 border-b border-amber-100 space-y-1">
        <CardTitle className="font-serif italic text-xl">Share Your Creation</CardTitle>
        <CardDescription>
          Show off your beautiful {breadName} to the community!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Upload Error Display */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Upload Error</p>
              <p>{uploadError}</p>
            </div>
          </div>
        )}

        {photoPreview ? (
          <div className="relative rounded-lg overflow-hidden mb-4 border border-amber-200">
            <ImageWithFallback
              src={photoPreview}
              alt={`Your ${breadName}`}
              width={800}
              height={500}
              className="w-full aspect-[4/3] object-cover"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white border-amber-200"
              onClick={handleClearPhoto}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Photo info */}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {photo && `${(photo.size / 1024 / 1024).toFixed(1)}MB`}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              variant="outline"
              className="h-auto py-6 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 flex flex-col items-center gap-2"
              onClick={handleCameraCapture}
              disabled={isUploading}
            >
              <Camera className="h-6 w-6 text-amber-700" />
              <span className="text-sm font-medium text-amber-900">Take Photo</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-6 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 flex flex-col items-center gap-2"
              onClick={handleFileUpload}
              disabled={isUploading}
            >
              <Upload className="h-6 w-6 text-amber-700" />
              <span className="text-sm font-medium text-amber-900">Upload Image</span>
            </Button>
            
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium text-amber-900">
            Add a comment (optional)
          </label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this recipe..."
            className="min-h-[80px] border-amber-200 bg-amber-50/50 focus-visible:ring-amber-400"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isUploading}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {comment.length}/500 characters
          </div>
        </div>

        {/* User status message */}
        {!userId && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <span className="font-medium">💡 Tip:</span> Sign in to save your bread photos permanently and join the community!
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end border-t border-amber-100 pt-4">
        {isShared ? (
          <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-md">
            <Sparkles className="h-4 w-4 mr-2" />
            <span className="font-medium">
              {userId ? 'Shared with community!' : 'Preview created!'}
            </span>
          </div>
        ) : (
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            onClick={handleShareBread}
            disabled={isUploading || !photo || !!uploadError}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {isUploading ? (
              'Uploading...'
            ) : userId ? (
              'Share Your Bread'
            ) : (
              'Create Preview'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}