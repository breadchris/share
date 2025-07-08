import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Content } from '../types';

export interface SwipeableContentItemProps {
  content: Content;
  onSelect: (content: Content) => void;
  onDelete: (content: Content) => void;
  children: React.ReactNode;
}

export const SwipeableContentItem: React.FC<SwipeableContentItemProps> = ({
  content,
  onSelect,
  onDelete,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [actionTriggered, setActionTriggered] = useState<'select' | 'delete' | null>(null);

  const SWIPE_THRESHOLD = 80; // Pixels to trigger action
  const MAX_SWIPE = 120; // Maximum swipe distance

  const resetSwipe = useCallback(() => {
    setSwipeDistance(0);
    setActionTriggered(null);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsAnimating(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPosRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startPosRef.current.x;
    const deltaY = Math.abs(currentY - startPosRef.current.y);

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (deltaY > 30) return;

    // Prevent default to stop scrolling during horizontal swipe
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }

    // Constrain swipe distance
    const constrainedDistance = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
    setSwipeDistance(constrainedDistance);

    // Determine which action would be triggered
    if (constrainedDistance > SWIPE_THRESHOLD) {
      setActionTriggered('select');
    } else if (constrainedDistance < -SWIPE_THRESHOLD) {
      setActionTriggered('delete');
    } else {
      setActionTriggered(null);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!startPosRef.current) return;

    if (actionTriggered === 'select') {
      onSelect(content);
    } else if (actionTriggered === 'delete') {
      onDelete(content);
    }

    startPosRef.current = null;
    resetSwipe();
  }, [actionTriggered, content, onSelect, onDelete, resetSwipe]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
    setIsAnimating(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startPosRef.current || e.buttons !== 1) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = Math.abs(e.clientY - startPosRef.current.y);

    // Only handle horizontal swipes
    if (deltaY > 30) return;

    const constrainedDistance = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
    setSwipeDistance(constrainedDistance);

    if (constrainedDistance > SWIPE_THRESHOLD) {
      setActionTriggered('select');
    } else if (constrainedDistance < -SWIPE_THRESHOLD) {
      setActionTriggered('delete');
    } else {
      setActionTriggered(null);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!startPosRef.current) return;

    if (actionTriggered === 'select') {
      onSelect(content);
    } else if (actionTriggered === 'delete') {
      onDelete(content);
    }

    startPosRef.current = null;
    resetSwipe();
  }, [actionTriggered, content, onSelect, onDelete, resetSwipe]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      startPosRef.current = null;
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      <div className="absolute inset-0 flex">
        {/* Left action (Select) - visible when swiping right */}
        <div
          className={`flex items-center justify-center bg-green-500 text-white transition-all duration-300 ${
            swipeDistance > 0 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: Math.max(0, swipeDistance),
            transform: swipeDistance > SWIPE_THRESHOLD ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {swipeDistance > 20 && (
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-1">✓</div>
              <span className="text-xs font-medium">Select</span>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right action (Delete) - visible when swiping left */}
        <div
          className={`flex items-center justify-center bg-red-500 text-white transition-all duration-300 ${
            swipeDistance < 0 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: Math.max(0, -swipeDistance),
            transform: swipeDistance < -SWIPE_THRESHOLD ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {swipeDistance < -20 && (
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-1">🗑️</div>
              <span className="text-xs font-medium">Delete</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Item */}
      <div
        ref={containerRef}
        className={`relative bg-white ${isAnimating ? 'transition-transform duration-300' : ''}`}
        style={{
          transform: `translateX(${swipeDistance}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={resetSwipe}
      >
        {children}
      </div>

      {/* Haptic feedback indicator */}
      {actionTriggered && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <div
            className={`w-3 h-3 rounded-full ${
              actionTriggered === 'select' ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}
          />
        </div>
      )}
    </div>
  );
};