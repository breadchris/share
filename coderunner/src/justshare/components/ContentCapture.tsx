import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ContentCaptureProps, Content, CreateContentRequest } from '../types';
import { createContent, uploadFile, getErrorMessage } from '../utils/api';
import { captureImage, captureImageFromFile, pasteFromClipboard, AudioRecorder, getDeviceCapabilities } from '../utils/media';
import { parseURL, isPrimaryURL, getBasicURLMetadata } from '../utils/url';
import { TagInput } from './TagInput';

export const ContentCapture: React.FC<ContentCaptureProps> = ({
  currentGroup,
  onContentCreated,
  onGroupChange,
}) => {
  const [captureMode, setCaptureMode] = useState<'text' | 'image' | 'audio' | 'clipboard' | null>(null);
  const [textContent, setTextContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTagInput, setShowTagInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const capabilities = getDeviceCapabilities();

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textContent]);

  useEffect(() => {
    // Focus text input when in text mode
    if (captureMode === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [captureMode]);

  const resetForm = useCallback(() => {
    setTextContent('');
    setTags([]);
    setCaptureMode(null);
    setShowTagInput(false);
    setError(null);
    setIsRecording(false);
    setRecordingTime(0);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const handleSubmitContent = useCallback(async (request: CreateContentRequest) => {
    if (!currentGroup) {
      setError('No group selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const content = await createContent({
        ...request,
        group_id: currentGroup.id,
        tags: tags.length > 0 ? tags : undefined,
      });
      
      onContentCreated(content);
      resetForm();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentGroup, tags, onContentCreated, resetForm]);

  const handleTextSubmit = useCallback(() => {
    console.log("Handling text submission:", textContent);
    if (!textContent.trim()) return;
    
    const trimmedText = textContent.trim();
    
    // Check if the text is primarily a URL
    if (isPrimaryURL(trimmedText)) {
      const urlInfo = parseURL(trimmedText);
      if (urlInfo.isValid) {
        const metadata = getBasicURLMetadata(urlInfo);
        
        handleSubmitContent({
          type: 'url',
          data: urlInfo.url,
          group_id: '', // Will be set in handleSubmitContent
          metadata: {
            domain: urlInfo.domain,
            isYouTube: urlInfo.isYouTube,
            youtubeVideoId: urlInfo.youtubeVideoId,
            title: metadata.title,
            description: metadata.description,
            thumbnail: metadata.thumbnail,
          },
        });
        return;
      }
    }
    
    // Default to text content
    handleSubmitContent({
      type: 'text',
      data: trimmedText,
      group_id: '', // Will be set in handleSubmitContent
    });
  }, [textContent, handleSubmitContent]);

  const handleImageCapture = useCallback(async () => {
    try {
      const result = await captureImage();
      
      // Convert data URL to File for upload
      const response = await fetch(result.data);
      const blob = await response.blob();
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Upload file
      const uploadResult = await uploadFile(file);
      
      await handleSubmitContent({
        type: 'image',
        data: uploadResult.url,
        group_id: '', // Will be set in handleSubmitContent
        metadata: {
          ...result.metadata,
          filename: uploadResult.filename,
          size: uploadResult.size,
        },
      });
    } catch (error) {
      setError(getErrorMessage(error));
      setCaptureMode(null);
    }
  }, [handleSubmitContent]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      
      // Upload the file first
      const uploadResult = await uploadFile(file);
      
      // Determine content type based on file type
      let contentType: 'image' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        contentType = 'image';
      } else if (file.type.startsWith('audio/')) {
        contentType = 'audio';
      }
      
      await handleSubmitContent({
        type: contentType,
        data: uploadResult.url,
        group_id: '', // Will be set in handleSubmitContent
        metadata: {
          filename: uploadResult.filename,
          size: uploadResult.size,
          originalName: file.name,
          mimeType: file.type,
        },
      });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setCaptureMode(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [handleSubmitContent]);

  const handleAudioToggle = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      try {
        if (audioRecorderRef.current) {
          const result = await audioRecorderRef.current.stopRecording();
          
          // Convert data URL to File for upload
          const response = await fetch(result.data);
          const blob = await response.blob();
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
          
          // Upload file
          const uploadResult = await uploadFile(file);
          
          await handleSubmitContent({
            type: 'audio',
            data: uploadResult.url,
            group_id: '', // Will be set in handleSubmitContent
            metadata: {
              ...result.metadata,
              filename: uploadResult.filename,
              size: uploadResult.size,
              duration: recordingTime,
            },
          });
        }
      } catch (error) {
        setError(getErrorMessage(error));
      } finally {
        setIsRecording(false);
        setRecordingTime(0);
        setCaptureMode(null);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      }
    } else {
      // Start recording
      try {
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.startRecording();
        
        setIsRecording(true);
        setRecordingTime(0);
        
        // Update recording time
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (error) {
        setError(getErrorMessage(error));
        setCaptureMode(null);
      }
    }
  }, [isRecording, recordingTime, handleSubmitContent]);

  const handleClipboardPaste = useCallback(async () => {
    try {
      const result = await pasteFromClipboard();
      
      if (result.metadata?.type === 'image') {
        // Convert data URL to File for upload
        const response = await fetch(result.data);
        const blob = await response.blob();
        const file = new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type });
        
        // Upload file
        const uploadResult = await uploadFile(file);
        
        await handleSubmitContent({
          type: 'image',
          data: uploadResult.url,
          group_id: '', // Will be set in handleSubmitContent
          metadata: {
            ...result.metadata,
            filename: uploadResult.filename,
            size: uploadResult.size,
          },
        });
      } else {
        // Text content
        await handleSubmitContent({
          type: 'clipboard',
          data: result.data,
          group_id: '', // Will be set in handleSubmitContent
          metadata: result.metadata,
        });
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setCaptureMode(null);
    }
  }, [handleSubmitContent]);

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentGroup) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-2xl mb-2">👥</div>
        <p>Select or create a group to start sharing</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 text-xs mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Text Input Mode */}
      {captureMode === 'text' && (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Share what's on your mind..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleTextSubmit();
              }
            }}
          />
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              🏷️ Tags {tags.length > 0 && `(${tags.length})`}
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={resetForm}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Recording Mode */}
      {captureMode === 'audio' && (
        <div className="text-center space-y-4">
          <div className="text-6xl">
            {isRecording ? '🎙️' : '🎤'}
          </div>
          
          {isRecording && (
            <div className="text-2xl font-mono text-red-500">
              {formatRecordingTime(recordingTime)}
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleAudioToggle}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-full text-white font-medium ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:bg-gray-300`}
            >
              {isRecording ? 'Stop & Share' : 'Start Recording'}
            </button>
          </div>
        </div>
      )}

      {/* Tag Input */}
      {showTagInput && (
        <TagInput
          selectedTags={tags}
          onTagsChange={setTags}
          placeholder="Add tags..."
        />
      )}

      {/* Quick Action Buttons */}
      {!captureMode && (
        <div className="grid grid-cols-2 gap-3">
          {/* Text */}
          <button
            onClick={() => setCaptureMode('text')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="text-2xl mb-1">📝</div>
            <span className="text-sm text-gray-700">Text</span>
          </button>

          {/* Image */}
          <button
            onClick={() => {
              if (capabilities.hasCamera) {
                setCaptureMode('image');
                handleImageCapture();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="text-2xl mb-1">📷</div>
            <span className="text-sm text-gray-700">
              {capabilities.hasCamera ? 'Camera' : 'Photo'}
            </span>
          </button>

          {/* Audio */}
          {capabilities.hasMicrophone && (
            <button
              onClick={() => setCaptureMode('audio')}
              className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="text-2xl mb-1">🎤</div>
              <span className="text-sm text-gray-700">Audio</span>
            </button>
          )}

          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="text-2xl mb-1">📎</div>
            <span className="text-sm text-gray-700">Upload</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};