import React from 'react';
import { CommonDaisyUIProps, ModifierProps } from './types';
import { buildDaisyUIClasses } from './utils';

export interface ButtonProps 
  extends CommonDaisyUIProps, 
          ModifierProps,
          Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'size'> {
  // Additional button-specific props
  htmlType?: 'button' | 'submit' | 'reset';
  href?: string; // For link-style buttons
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * DaisyUI Button Component
 * 
 * Supports all DaisyUI button variants:
 * - Colors: neutral, primary, secondary, accent, info, success, warning, error
 * - Sizes: xs, sm, md (default), lg, xl
 * - Styles: outline, soft, ghost, dash, link
 * - States: active, disabled, loading
 * - Modifiers: wide, block, circle, square
 * 
 * @example
 * <Button color="primary" size="lg">Primary Button</Button>
 * <Button variant="outline" color="secondary">Outline Button</Button>
 * <Button loading disabled>Loading Button</Button>
 * <Button circle color="primary">+</Button>
 */
export const Button: React.FC<ButtonProps> = ({
  children,
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
  htmlType = 'button',
  href,
  icon,
  iconPosition = 'left',
  onClick,
  ...props
}) => {
  const buttonClasses = buildDaisyUIClasses('btn', {
    color,
    size,
    variant,
    active,
    disabled: disabled || loading,
    loading,
    wide,
    block,
    circle,
    square,
    className
  });

  // Render as link if href is provided
  if (href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        onClick={disabled || loading ? undefined : onClick as any}
        {...(props as any)}
      >
        {renderContent()}
      </a>
    );
  }

  // Render as button
  return (
    <button
      type={htmlType}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={disabled || loading ? undefined : onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );

  function renderContent() {
    if (loading) {
      return (
        <>
          <span className="loading loading-spinner"></span>
          {children && <span>{children}</span>}
        </>
      );
    }

    if (icon && children) {
      return iconPosition === 'left' ? (
        <>
          {icon}
          <span>{children}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {icon}
        </>
      );
    }

    return icon || children;
  }
};

// Convenience components for common button types
export const PrimaryButton: React.FC<Omit<ButtonProps, 'color'>> = (props) => (
  <Button color="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'color'>> = (props) => (
  <Button color="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export const LinkButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="link" {...props} />
);

export const CircleButton: React.FC<Omit<ButtonProps, 'circle'>> = (props) => (
  <Button circle {...props} />
);

export const SquareButton: React.FC<Omit<ButtonProps, 'square'>> = (props) => (
  <Button square {...props} />
);

export const WideButton: React.FC<Omit<ButtonProps, 'wide'>> = (props) => (
  <Button wide {...props} />
);

export const BlockButton: React.FC<Omit<ButtonProps, 'block'>> = (props) => (
  <Button block {...props} />
);

export default Button;