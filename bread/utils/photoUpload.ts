import { uploadBreadPhoto as supabaseUploadBreadPhoto, UploadResult } from '../lib/supabase';
import { toast } from 'sonner';

// Function to upload a photo using the enhanced Supabase functions
export async function uploadBreadPhoto(
  file: File, 
  userId: string, 
  breadId: string
): Promise<string | null> {
  try {
    console.log('🔼 Starting photo upload via enhanced supabase function');
    
    // Use the enhanced upload function from supabase.ts
    const result: UploadResult = await supabaseUploadBreadPhoto(
      file,
      userId,
      breadId,
      'user-upload', // Default breadName for component compatibility
      undefined, // No comment
      undefined  // No rating
    );
    
    if (result.success && result.url) {
      console.log('✅ Photo upload successful:', result.url);
      return result.url;
    } else {
      console.error('❌ Photo upload failed:', result.error);
      toast.error(result.error || 'Failed to upload photo');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in upload process:', error);
    toast.error('Something went wrong with the upload');
    return null;
  }
}

// Enhanced function to save the bread result with proper error handling
export async function saveBreadResult(
  userId: string,
  breadId: string,
  breadName: string,
  photoUrl: string,
  comment: string = '',
  rating?: number
): Promise<boolean> {
  try {
    console.log('💾 Saving bread result to database');
    
    // Since the enhanced uploadBreadPhoto already saves to bread_photos table,
    // we don't need to save again. Just return success.
    // The photo was already saved during the upload process.
    
    console.log('✅ Bread result already saved during upload process');
    return true;
  } catch (error) {
    console.error('❌ Error in save process:', error);
    toast.error('Something went wrong while saving your bread result');
    return false;
  }
}

// Enhanced function specifically for the BreadPhotoUploader component
export async function uploadAndSaveBreadPhoto(
  file: File,
  userId: string,
  breadId: string,
  breadName: string,
  comment: string = '',
  rating?: number
): Promise<string | null> {
  try {
    console.log('🔼 Starting comprehensive bread photo upload');
    
    // Use the enhanced upload function that handles both file upload and database save
    const result: UploadResult = await supabaseUploadBreadPhoto(
      file,
      userId,
      breadId,
      breadName,
      comment || undefined,
      rating
    );
    
    if (result.success && result.url) {
      console.log('✅ Comprehensive upload successful:', result.url);
      toast.success('Your bread photo has been shared with the community!');
      return result.url;
    } else {
      console.error('❌ Comprehensive upload failed:', result.error);
      toast.error(result.error || 'Failed to upload and save photo');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in comprehensive upload process:', error);
    toast.error('Something went wrong with the upload process');
    return null;
  }
}

// Mock function when there's no user (for demo purposes)
export async function mockUploadBreadPhoto(
  file: File,
  breadId: string
): Promise<string> {
  console.log('🎭 Using mock upload for non-authenticated user');
  
  // This creates a local object URL for preview purposes
  // In a real app, you would need to be logged in to upload
  const mockUrl = URL.createObjectURL(file);
  
  // Simulate a delay like a real upload
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Mock upload completed:', mockUrl);
  return mockUrl;
}

// Helper function to validate file before upload
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image must be smaller than 5MB'
    };
  }
  
  return { valid: true };
}

// Helper function to compress image if needed
export async function compressImage(file: File, maxWidth: number = 1200): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Return original if compression fails
        }
      }, file.type, 0.8); // 80% quality
    };
    
    img.src = URL.createObjectURL(file);
  });
}