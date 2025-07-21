import { useState, useEffect } from 'react';

/**
 * Custom hook to detect screen size changes and provide responsive breakpoints
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Create listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

/**
 * Predefined responsive breakpoint hooks
 */
export const useResponsive = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isSmallMobile = useMediaQuery('(max-width: 479px)');
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');

  return {
    isMobile,
    isTablet, 
    isDesktop,
    isSmallMobile,
    isTouchDevice,
    // Convenience combinations
    isMobileOrTablet: isMobile || isTablet,
    isDesktopOrTablet: isDesktop || isTablet,
  };
};

/**
 * Hook to detect if the current device supports touch
 */
export const useTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(hasTouch);
  }, []);

  return isTouch;
};

/**
 * Hook to get current screen size category
 */
export const useScreenSize = () => {
  const { isMobile, isTablet, isDesktop, isSmallMobile } = useResponsive();
  
  if (isSmallMobile) return 'small-mobile';
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  return 'unknown';
};