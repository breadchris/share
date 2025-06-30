// Core Types for JustShare

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Content {
  id: string;
  type: 'text' | 'image' | 'audio' | 'clipboard' | 'file' | 'url';
  data: string;
  media_url?: string;
  mime_type?: string;
  file_size?: number;
  group_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  tag_names?: string[];
  metadata?: Record<string, any>;
  user_info?: User;
}

export interface Group {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface GroupMembership {
  id: string;
  user_id: string;
  group_id: string;
  role: 'admin' | 'member';
  created_at: string;
  user?: User;
}

export interface GroupWithMembership extends Group {
  user_role?: 'admin' | 'member';
  member_count?: number;
}

export interface GroupSettings {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  members: GroupMembership[];
  user_role: 'admin' | 'member';
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  user_id: string;
  created_at: string;
}

export interface TimelineResponse {
  content: Content[];
  next_offset: number;
  has_more: boolean;
}

export interface CreateContentRequest {
  type: 'text' | 'image' | 'audio' | 'clipboard' | 'file' | 'url';
  data: string;
  group_id: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateGroupRequest {
  name: string;
}

export interface JoinGroupRequest {
  join_code: string;
}

export interface DeleteGroupRequest {
  group_id: string;
}

export interface UploadResponse {
  filename: string;
  url: string;
  mime_type: string;
  size: number;
}

// UI State Types
export interface AppState {
  currentGroup: Group | null;
  userGroups: Group[];
  timeline: Content[];
  isLoading: boolean;
  hasMore: boolean;
  nextOffset: number;
  captureMode: 'text' | 'image' | 'audio' | 'clipboard' | 'url' | null;
  selectedContent: Content | null;
}

// Component Props
export interface ContentCaptureProps {
  currentGroup: Group | null;
  onContentCreated: (content: Content) => void;
  onGroupChange: (group: Group) => void;
}

export interface TimelineProps {
  content: Content[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onContentClick: (content: Content) => void;
  onContentSelect?: (content: Content) => void;
  onContentDelete?: (contentId: string) => void;
}

export interface GroupSelectorProps {
  groups: Group[];
  currentGroup: Group | null;
  currentUser: User | null;
  onGroupSelect: (group: Group) => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  showContentCapture?: boolean;
  onToggleContentCapture?: () => void;
}

export interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export interface MediaCaptureProps {
  type: 'image' | 'audio';
  onCapture: (data: string, metadata?: Record<string, any>) => void;
  onCancel: () => void;
}

export interface ContentViewerProps {
  content: Content;
  onClose: () => void;
  onEdit?: (content: Content) => void;
  onDelete?: (contentId: string) => void;
}

export interface GroupSettingsProps {
  group: Group | null;
  onClose: () => void;
  onGroupDeleted?: (groupId: string) => void;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}