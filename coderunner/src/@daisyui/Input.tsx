import React from 'react';
import { CommonDaisyUIProps } from './types';
import { buildDaisyUIClasses } from './utils';

export interface InputProps 
  extends CommonDaisyUIProps,
          Omit<React.InputHTMLAttributes<HTMLInputElement>, 'color' | 'size'> {
  // Input-specific props
  bordered?: boolean;
  ghost?: boolean;
  error?: boolean;
  
  // Input wrapper props
  label?: React.ReactNode;
  labelAlt?: React.ReactNode;
  helperText?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * DaisyUI Input Component
 * 
 * Supports all DaisyUI input variants:
 * - Colors: primary, secondary, accent, info, success, warning, error
 * - Sizes: xs, sm, md (default), lg
 * - Styles: bordered, ghost
 * - States: disabled, error state
 * 
 * @example
 * <Input placeholder="Enter text" />
 * <Input color="primary" size="lg" bordered />
 * <Input label="Email" helperText="We'll never share your email" />
 * <Input leftIcon={<SearchIcon />} placeholder="Search..." />
 */
export const Input: React.FC<InputProps> = ({
  children,
  className,
  color,
  size,
  variant,
  active,
  disabled,
  loading,
  bordered,
  ghost,
  error,
  label,
  labelAlt,
  helperText,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const inputClasses = buildDaisyUIClasses('input', {
    color: error ? 'error' : color,
    size,
    disabled,
    className,
    additionalClasses: [
      bordered ? 'input-bordered' : '',
      ghost ? 'input-ghost' : '',
      'w-full'
    ].filter(Boolean)
  });

  const inputElement = (
    <input
      className={inputClasses}
      disabled={disabled}
      {...props}
    />
  );

  // Simple input without wrapper
  if (!label && !labelAlt && !helperText && !leftIcon && !rightIcon) {
    return inputElement;
  }

  // Input with wrapper for labels, icons, etc.
  return (
    <div className="form-control w-full">
      {/* Label */}
      {(label || labelAlt) && (
        <label className="label">
          {label && <span className="label-text">{label}</span>}
          {labelAlt && <span className="label-text-alt">{labelAlt}</span>}
        </label>
      )}

      {/* Input with icons */}
      {(leftIcon || rightIcon) ? (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50">
              {leftIcon}
            </div>
          )}
          <input
            className={`${inputClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50">
              {rightIcon}
            </div>
          )}
        </div>
      ) : (
        inputElement
      )}

      {/* Helper text */}
      {helperText && (
        <label className="label">
          <span className={`label-text-alt ${error ? 'text-error' : ''}`}>
            {helperText}
          </span>
        </label>
      )}
    </div>
  );
};

// Convenience components for common input types
export const TextInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="text" {...props} />
);

export const EmailInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="email" {...props} />
);

export const PasswordInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="password" {...props} />
);

export const NumberInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="number" {...props} />
);

export const SearchInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="search" {...props} />
);

export const BorderedInput: React.FC<Omit<InputProps, 'bordered'>> = (props) => (
  <Input bordered {...props} />
);

export const GhostInput: React.FC<Omit<InputProps, 'ghost'>> = (props) => (
  <Input ghost {...props} />
);

export default Input;