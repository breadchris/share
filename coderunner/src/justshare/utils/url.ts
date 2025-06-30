// URL detection and parsing utilities for JustShare

export interface URLInfo {
  url: string;
  domain: string;
  isYouTube: boolean;
  youtubeVideoId?: string;
  isValid: boolean;
}

export interface URLMetadata {
  title?: string;
  description?: string;
  thumbnail?: string;
  domain: string;
  favicon?: string;
}

/**
 * Checks if a string is a valid URL
 */
export function isValidURL(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts URL information including YouTube video detection
 */
export function parseURL(text: string): URLInfo {
  const cleanText = text.trim();
  
  if (!isValidURL(cleanText)) {
    return {
      url: cleanText,
      domain: '',
      isYouTube: false,
      isValid: false,
    };
  }

  const url = new URL(cleanText);
  const domain = url.hostname.toLowerCase();
  
  // Check if it's a YouTube URL
  const isYouTube = domain === 'youtube.com' || 
                   domain === 'www.youtube.com' || 
                   domain === 'youtu.be' || 
                   domain === 'm.youtube.com';

  let youtubeVideoId: string | undefined;
  
  if (isYouTube) {
    youtubeVideoId = extractYouTubeVideoId(cleanText);
  }

  return {
    url: cleanText,
    domain,
    isYouTube,
    youtubeVideoId,
    isValid: true,
  };
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    // Handle youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      const vParam = urlObj.searchParams.get('v');
      if (vParam) {
        return vParam;
      }
      
      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) {
        return embedMatch[1];
      }
      
      // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) {
        return shortsMatch[1];
      }
    }
    
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Checks if text contains a URL (for auto-detection)
 */
export function containsURL(text: string): boolean {
  // Simple regex to detect URLs in text
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return urlRegex.test(text);
}

/**
 * Extracts the first URL from text
 */
export function extractFirstURL(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

/**
 * Checks if text is primarily a URL (vs text that contains a URL)
 */
export function isPrimaryURL(text: string): boolean {
  const trimmed = text.trim();
  const url = extractFirstURL(trimmed);
  
  if (!url) return false;
  
  // If the URL makes up most of the text content, consider it primary
  const urlLength = url.length;
  const totalLength = trimmed.length;
  
  return urlLength / totalLength > 0.8;
}

/**
 * Generates a YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Generates YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Extracts basic metadata from URL for display
 */
export function getBasicURLMetadata(urlInfo: URLInfo): URLMetadata {
  const metadata: URLMetadata = {
    domain: urlInfo.domain,
  };

  if (urlInfo.isYouTube && urlInfo.youtubeVideoId) {
    metadata.thumbnail = getYouTubeThumbnail(urlInfo.youtubeVideoId);
    metadata.title = 'YouTube Video';
    metadata.description = 'Click to watch video';
  } else {
    metadata.title = urlInfo.domain;
    metadata.description = urlInfo.url;
  }

  return metadata;
}

/**
 * Format domain name for display (remove www, etc.)
 */
export function formatDomainForDisplay(domain: string): string {
  return domain.replace(/^www\./, '').toLowerCase();
}