export interface VideoAnnotation {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  type: 'marker' | 'range';
}

export interface AnnotationManagerProps {
  annotations: VideoAnnotation[];
  currentTime: number;
  videoDuration: number;
  onAnnotationsChange: (annotations: VideoAnnotation[]) => void;
  onSeekTo: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}