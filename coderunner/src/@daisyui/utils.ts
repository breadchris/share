import { DaisyUIColor, DaisyUISize, DaisyUIStyle } from './types';

// Utility function to combine class names, filtering out undefined/falsy values
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Generate color class for a component
export function getColorClass(
  component: string, 
  color?: DaisyUIColor
): string | undefined {
  return color ? `${component}-${color}` : undefined;
}

// Generate size class for a component
export function getSizeClass(
  component: string, 
  size?: DaisyUISize
): string | undefined {
  return size ? `${component}-${size}` : undefined;
}

// Generate style variant class for a component
export function getStyleClass(
  component: string, 
  variant?: DaisyUIStyle
): string | undefined {
  return variant ? `${component}-${variant}` : undefined;
}

// Generate state classes
export function getStateClasses(
  component: string,
  active?: boolean,
  disabled?: boolean,
  loading?: boolean
): string[] {
  const classes: string[] = [];
  
  if (active) classes.push(`${component}-active`);
  if (disabled) classes.push(`${component}-disabled`);
  if (loading) classes.push('loading');
  
  return classes;
}

// Generate modifier classes for buttons
export function getModifierClasses(
  component: string,
  wide?: boolean,
  block?: boolean,
  circle?: boolean,
  square?: boolean
): string[] {
  const classes: string[] = [];
  
  if (wide) classes.push(`${component}-wide`);
  if (block) classes.push(`${component}-block`);
  if (circle) classes.push(`${component}-circle`);
  if (square) classes.push(`${component}-square`);
  
  return classes;
}

// Main utility to build complete class string for any DaisyUI component
export function buildDaisyUIClasses(
  baseClass: string,
  options: {
    color?: DaisyUIColor;
    size?: DaisyUISize;
    variant?: DaisyUIStyle;
    active?: boolean;
    disabled?: boolean;
    loading?: boolean;
    wide?: boolean;
    block?: boolean;
    circle?: boolean;
    square?: boolean;
    className?: string;
    additionalClasses?: string[];
  } = {}
): string {
  const {
    color,
    size,
    variant,
    active,
    disabled,
    loading,
    wide,
    block,
    circle,
    square,
    className,
    additionalClasses = []
  } = options;

  return cn(
    baseClass,
    getColorClass(baseClass, color),
    getSizeClass(baseClass, size),
    getStyleClass(baseClass, variant),
    ...getStateClasses(baseClass, active, disabled, loading),
    ...getModifierClasses(baseClass, wide, block, circle, square),
    ...additionalClasses,
    className
  );
}