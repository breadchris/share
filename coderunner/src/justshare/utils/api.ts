// API utility functions for JustShare

import type {
  Content,
  Group,
  Tag,
  TimelineResponse,
  CreateContentRequest,
  CreateGroupRequest,
  JoinGroupRequest,
  UploadResponse,
  GroupSettings,
  GroupMembership
} from '../types';

const API_BASE = '/api';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new APIError(response.status, errorMessage);
  }

  return response.json();
}

// Content API
export async function createContent(request: CreateContentRequest): Promise<Content> {
  return fetchJSON(`${API_BASE}/content`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getTimeline(
  groupId: string,
  offset = 0,
  limit = 20
): Promise<TimelineResponse> {
  const params = new URLSearchParams({
    group_id: groupId,
    offset: offset.toString(),
    limit: limit.toString(),
  });
  const response = await fetchJSON(`${API_BASE}/content?${params}`);
  
  // Debug logging for timeline responses
  console.log('API Debug - Raw timeline response:', response);
  
  // Transform nested content structure to flat structure
  if (response.content && Array.isArray(response.content)) {
    console.log('API Debug - Transforming nested content structure');
    response.content = response.content.map((item: any, index: number) => {
      console.log(`API Debug - Before transform[${index}]:`, item);
      
      // Check if content is nested under .Content property
      if (item.Content && typeof item.Content === 'object') {
        const transformedContent = {
          ...item.Content,          // Flatten content properties to top level
          user_info: item.user_info // Keep user_info as nested property
        };
        console.log(`API Debug - After transform[${index}]:`, transformedContent);
        console.log(`API Debug - Transformed type[${index}]:`, transformedContent.type, 'typeof:', typeof transformedContent.type);
        return transformedContent;
      }
      
      // If already flat structure, return as is
      console.log(`API Debug - Content[${index}] already flat:`, item);
      return item;
    });
  }
  
  return response;
}

export async function getContent(contentId: string): Promise<Content> {
  const response = await fetchJSON(`${API_BASE}/content/${contentId}`);
  
  // Transform nested content structure if needed
  if (response.Content && typeof response.Content === 'object') {
    console.log('API Debug - Transforming single content response');
    return {
      ...response.Content,
      user_info: response.user_info
    };
  }
  
  return response;
}

export async function deleteContent(contentId: string): Promise<{ success: boolean; message: string; id: string }> {
  return fetchJSON(`${API_BASE}/content/${contentId}`, {
    method: 'DELETE',
  });
}

// Threading API
export async function getReplies(
  contentId: string,
  offset = 0,
  limit = 20
): Promise<TimelineResponse> {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });
  
  return fetchJSON(`${API_BASE}/content/${contentId}/replies?${params}`);
}

export async function createReply(
  parentContentId: string,
  request: Omit<CreateContentRequest, 'parent_content_id'>
): Promise<Content> {
  const replyRequest: CreateContentRequest = {
    ...request,
    parent_content_id: parentContentId,
  };
  
  return fetchJSON(`${API_BASE}/content`, {
    method: 'POST',
    body: JSON.stringify(replyRequest),
  });
}

// Group API
export async function createGroup(request: CreateGroupRequest): Promise<Group> {
  return fetchJSON(`${API_BASE}/groups`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function joinGroup(request: JoinGroupRequest): Promise<Group> {
  return fetchJSON(`${API_BASE}/groups/join`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getUserGroups(): Promise<Group[]> {
  return fetchJSON(`${API_BASE}/groups`);
}

// Tag API
export async function searchTags(query = ''): Promise<Tag[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : '';
  return fetchJSON(`${API_BASE}/tags/search${params}`);
}

// File Upload API
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new APIError(response.status, errorMessage);
  }

  return response.json();
}

// Utility functions
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Group Management API
export async function getGroupSettings(groupId: string): Promise<GroupSettings> {
  return fetchJSON(`${API_BASE}/groups/${groupId}`);
}

export async function getGroupMembers(groupId: string): Promise<GroupMembership[]> {
  return fetchJSON(`${API_BASE}/groups/${groupId}/members`);
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; message: string; id: string }> {
  return fetchJSON(`${API_BASE}/groups/${groupId}`, {
    method: 'DELETE',
  });
}