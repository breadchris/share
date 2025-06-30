import React from 'react';
import { CommonDaisyUIProps, BaseComponentProps } from './types';
import { buildDaisyUIClasses } from './utils';

export interface CheckboxProps 
  extends CommonDaisyUIProps,
          Omit<React.InputHTMLAttributes<HTMLInputElement>, 'color' | 'size' | 'type'> {
  // Checkbox-specific props
  label?: React.ReactNode;
  labelPosition?: 'left' | 'right';
  indeterminate?: boolean;
  
  // Wrapper props
  helperText?: React.ReactNode;
  error?: boolean;
}

/**
 * DaisyUI Checkbox Component
 * 
 * Supports all DaisyUI checkbox variants:
 * - Colors: primary, secondary, accent, info, success, warning, error
 * - Sizes: xs, sm, md (default), lg
 * - States: disabled, checked, indeterminate
 * 
 * @example
 * <Checkbox label="Accept terms and conditions" />
 * <Checkbox color="primary" size="lg" checked />
 * <Checkbox label="Subscribe to newsletter" helperText="You can unsubscribe anytime" />
 * <Checkbox indeterminate label="Select all" />
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  children,
  className,
  color,
  size,
  variant,
  active,
  disabled,
  loading,
  label,
  labelPosition = 'right',
  indeterminate,
  helperText,
  error,
  checked,
  onChange,
  ...props
}) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  const checkboxClasses = buildDaisyUIClasses('checkbox', {
    color: error ? 'error' : color,
    size,
    disabled,
    className
  });

  // Handle indeterminate state
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const checkboxElement = (
    <input
      ref={checkboxRef}
      type="checkbox"
      className={checkboxClasses}
      disabled={disabled}
      checked={checked}
      onChange={onChange}
      {...props}
    />
  );

  // Simple checkbox without label
  if (!label && !children && !helperText) {
    return checkboxElement;
  }

  const labelContent = label || children;

  // Checkbox with label
  return (
    <div className="form-control">
      <label className="label cursor-pointer justify-start gap-3">
        {labelPosition === 'left' && labelContent && (
          <span className="label-text">{labelContent}</span>
        )}
        
        {checkboxElement}
        
        {labelPosition === 'right' && labelContent && (
          <span className="label-text">{labelContent}</span>
        )}
      </label>
      
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

// Convenience components for common checkbox types
export const PrimaryCheckbox: React.FC<Omit<CheckboxProps, 'color'>> = (props) => (
  <Checkbox color="primary" {...props} />
);

export const SecondaryCheckbox: React.FC<Omit<CheckboxProps, 'color'>> = (props) => (
  <Checkbox color="secondary" {...props} />
);

export const AccentCheckbox: React.FC<Omit<CheckboxProps, 'color'>> = (props) => (
  <Checkbox color="accent" {...props} />
);

export const IndeterminateCheckbox: React.FC<Omit<CheckboxProps, 'indeterminate'>> = (props) => (
  <Checkbox indeterminate {...props} />
);

// Checkbox group component
export interface CheckboxGroupProps extends BaseComponentProps {
  options: Array<{
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  color?: CommonDaisyUIProps['color'];
  size?: CommonDaisyUIProps['size'];
  direction?: 'horizontal' | 'vertical';
  helperText?: React.ReactNode;
  error?: boolean;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  value = [],
  onChange,
  color,
  size,
  direction = 'vertical',
  helperText,
  error,
  className,
  ...props
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (!onChange) return;
    
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  const containerClasses = `
    ${direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}
    ${className || ''}
  `.trim();

  return (
    <div className="form-control" {...props}>
      <div className={containerClasses}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            color={color}
            size={size}
            error={error}
            disabled={option.disabled}
            checked={value.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
          />
        ))}
      </div>
      
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

export default Checkbox;