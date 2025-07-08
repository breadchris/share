// Media utilities for capturing images, audio, and clipboard

export interface CaptureResult {
  data: string;
  metadata?: Record<string, any>;
}

// Image capture utilities
export async function captureImage(): Promise<CaptureResult> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.srcObject = stream;
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.play();
        
        // Wait a bit for the video to stabilize
        setTimeout(() => {
          if (context) {
            context.drawImage(video, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            resolve({
              data: dataURL,
              metadata: {
                width: canvas.width,
                height: canvas.height,
                format: 'jpeg',
                timestamp: new Date().toISOString(),
              },
            });
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        }, 1000);
      };

      video.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        reject(new Error('Failed to access camera'));
      };
    });
  } catch (error) {
    throw new Error(`Camera access denied: ${error}`);
  }
}

// File input capture (fallback for image)
export async function captureImageFromFile(file: File): Promise<CaptureResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      resolve({
        data: dataURL,
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        },
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Audio recording utilities
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Record in 100ms chunks
    } catch (error) {
      throw new Error(`Microphone access denied: ${error}`);
    }
  }

  async stopRecording(): Promise<CaptureResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = () => {
          const dataURL = reader.result as string;
          
          // Stop the stream
          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
          }
          
          resolve({
            data: dataURL,
            metadata: {
              duration: 0, // Could be calculated if needed
              format: 'webm',
              size: audioBlob.size,
              timestamp: new Date().toISOString(),
            },
          });
        };
        
        reader.onerror = () => reject(new Error('Failed to read audio data'));
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

// Clipboard utilities
export async function pasteFromClipboard(): Promise<CaptureResult> {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported');
    }

    // Try to read clipboard items first (for images, etc.)
    if (navigator.clipboard.read) {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          // Check for images
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const reader = new FileReader();
              
              return new Promise((resolve, reject) => {
                reader.onload = () => {
                  resolve({
                    data: reader.result as string,
                    metadata: {
                      type: 'image',
                      mimeType: type,
                      size: blob.size,
                      timestamp: new Date().toISOString(),
                    },
                  });
                };
                reader.onerror = () => reject(new Error('Failed to read clipboard image'));
                reader.readAsDataURL(blob);
              });
            }
          }
        }
      } catch (error) {
        console.warn('Failed to read clipboard items, falling back to text');
      }
    }

    // Fallback to text
    const text = await navigator.clipboard.readText();
    if (!text) {
      throw new Error('Clipboard is empty');
    }

    return {
      data: text,
      metadata: {
        type: 'text',
        length: text.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new Error(`Clipboard access denied: ${error}`);
  }
}

// Device capability detection
export function getDeviceCapabilities() {
  return {
    hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    hasMicrophone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    hasClipboard: !!(navigator.clipboard),
    hasFileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}

// Utility for checking permissions
export async function checkMediaPermissions() {
  const permissions = {
    camera: 'denied' as PermissionState,
    microphone: 'denied' as PermissionState,
  };

  if (navigator.permissions) {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      permissions.camera = cameraPermission.state;
    } catch (error) {
      console.warn('Failed to check camera permission');
    }

    try {
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      permissions.microphone = micPermission.state;
    } catch (error) {
      console.warn('Failed to check microphone permission');
    }
  }

  return permissions;
}