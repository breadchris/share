# JustShare - Mobile Content Capture & Sharing Platform

This document provides guidance for developing the JustShare application, a mobile-first platform for capturing and sharing content in real-time with group collaboration features.

## Architecture Overview

JustShare is built around the concept of "content" as an atomic model - each piece of content (text, image, audio, clipboard) exists independently and belongs to a group's timeline.

### Core Models

1. **Content** - Atomic content model
   - Text, images, audio recordings, clipboard data
   - Belongs to a group
   - Can have multiple tags
   - Timestamped for timeline ordering

2. **Group** - Collaboration spaces
   - Has a unique join code for sharing
   - Contains a timeline of content
   - Multiple users can be members

3. **Tag** - Content organization
   - Searchable and autocomplete-enabled
   - Can be created on-the-fly or reused
   - Associated with content via many-to-many relationship

### Key Principles

- **Speed First**: Interface optimized for rapid content capture
- **Mobile Optimized**: Touch-friendly, gesture-based navigation
- **Timeline-Centric**: Content is organized chronologically in "the stream"
- **Group Collaboration**: Real-time sharing within group contexts
- **Minimal Friction**: Tags and organization are secondary to content capture

## Component Structure

### Main Application
- **JustShare.tsx** - Root component managing app state
- **Timeline.tsx** - Main content stream with infinite scroll
- **ContentCapture.tsx** - Speed-optimized input interface

### Content Management
- **ContentViewer.tsx** - Full-screen content detail view
- **MediaCapture.tsx** - Camera, microphone, clipboard integration
- **TagInput.tsx** - Smart tag selection/creation interface

### Group Features
- **GroupSelector.tsx** - Horizontal scrollable group navigation
- **GroupManager.tsx** - Create/join group functionality

## Mobile Optimization

### Interface Design
- Large touch targets (minimum 44px)
- Gesture-based navigation (swipe, long-press)
- Bottom-aligned primary actions for thumb accessibility
- Minimal UI chrome to maximize content space

### Performance
- Virtual scrolling for timeline performance
- Lazy loading of media content
- Local storage for offline capability
- Progressive Web App (PWA) features

### User Experience
- One-handed operation optimized
- Quick capture with minimal taps
- Visual feedback for all interactions
- Smooth animations and transitions

## Data Flow

1. **Content Creation**: User captures content → immediately saved to current group
2. **Timeline Navigation**: User scrolls → loads historical content with pagination
3. **Group Switching**: User taps group → loads that group's timeline
4. **Content Detail**: User taps content → opens dedicated view with return navigation

## API Patterns

### RESTful Endpoints
- `POST /justshare/api/content` - Create new content
- `GET /justshare/api/content?group_id=X&offset=Y` - Timeline pagination
- `POST /justshare/api/groups` - Create group
- `POST /justshare/api/groups/join` - Join group by code
- `GET /justshare/api/tags/search?q=X` - Tag autocomplete

### Real-time Updates
- WebSocket connections for live group timeline updates
- Optimistic UI updates for immediate feedback
- Conflict resolution for concurrent edits

## File Organization

```
justshare/
├── CLAUDE.md                 # This documentation
├── JustShare.tsx             # Main application component
├── components/
│   ├── Timeline.tsx          # Content stream
│   ├── ContentCapture.tsx    # Input interface
│   ├── ContentViewer.tsx     # Detail view
│   ├── GroupSelector.tsx     # Group navigation
│   ├── GroupManager.tsx      # Group management
│   ├── MediaCapture.tsx      # Media input
│   └── TagInput.tsx          # Tag interface
├── hooks/
│   ├── useTimeline.ts        # Timeline data management
│   ├── useGroups.ts          # Group state
│   └── useMediaCapture.ts    # Device media access
├── types/
│   └── index.tsx              # TypeScript interfaces
└── utils/
    ├── api.ts                # API client functions
    └── media.ts              # Media processing utilities
```

## Development Guidelines

### TypeScript Interfaces
- Strict typing for all props and state
- Proper error handling for media APIs
- Null safety for optional content fields

### Styling
- Tailwind CSS for consistent mobile-first design
- Custom utilities for touch targets
- Dark/light mode support

### Testing
- Component testing for user interactions
- Mock media APIs for testing
- Timeline scrolling performance tests

### Accessibility
- Screen reader support
- Keyboard navigation fallbacks
- High contrast mode compatibility
- Voice input integration