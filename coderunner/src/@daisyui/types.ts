// Base types for DaisyUI components
export type DaisyUIColor = 
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type DaisyUISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type DaisyUIStyle = 'outline' | 'soft' | 'ghost' | 'dash' | 'link';

export type DaisyUIState = 'active' | 'disabled' | 'loading';

// Common props interface
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Color variant props
export interface ColorVariantProps {
  color?: DaisyUIColor;
}

// Size variant props  
export interface SizeVariantProps {
  size?: DaisyUISize;
}

// Style variant props
export interface StyleVariantProps {
  variant?: DaisyUIStyle;
}

// State props
export interface StateProps {
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

// Modifier props for specific components
export interface ModifierProps {
  wide?: boolean;
  block?: boolean;
  circle?: boolean;
  square?: boolean;
  responsive?: boolean;
}

// Combined common props
export interface CommonDaisyUIProps 
  extends BaseComponentProps, 
          ColorVariantProps, 
          SizeVariantProps, 
          StyleVariantProps, 
          StateProps {}