import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface VideoUrlInputProps {
  onSubmit: (url: string) => void;
}

export function VideoUrlInput({ onSubmit }: VideoUrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateUrl = (url: string) => {
    // Check if empty
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return false;
    }
    
    // Check if valid YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      setError("Please enter a valid YouTube URL");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateUrl(url)) {
      onSubmit(url);
    }
  };

  // Example URLs for testing
  const loadExampleVideo = () => {
    const exampleUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Astley - Never Gonna Give You Up
    setUrl(exampleUrl);
    if (validateUrl(exampleUrl)) {
      onSubmit(exampleUrl);
    }
  };

  return (
    <div className="card-cozy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium mb-2">
            YouTube Video URL
          </label>
          <div className="flex gap-3">
            <Input
              id="youtube-url"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-cozy flex-1"
            />
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={!url.trim()}
            >
              Load Video
            </Button>
          </div>
          
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Paste any YouTube video URL to get started
          </p>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={loadExampleVideo}
            className="text-xs"
          >
            Load Example Video
          </Button>
        </div>
      </form>
    </div>
  );
}