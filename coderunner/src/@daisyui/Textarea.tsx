import React from 'react';
import { CommonDaisyUIProps } from './types';
import { buildDaisyUIClasses } from './utils';

export interface TextareaProps 
  extends CommonDaisyUIProps,
          Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'color' | 'size'> {
  // Textarea-specific props
  bordered?: boolean;
  ghost?: boolean;
  error?: boolean;
  
  // Textarea wrapper props
  label?: React.ReactNode;
  labelAlt?: React.ReactNode;
  helperText?: React.ReactNode;
  
  // Auto-sizing
  autoSize?: boolean;
  minRows?: number;
  maxRows?: number;
}

/**
 * DaisyUI Textarea Component
 * 
 * Supports all DaisyUI textarea variants:
 * - Colors: primary, secondary, accent, info, success, warning, error
 * - Sizes: xs, sm, md (default), lg
 * - Styles: bordered, ghost
 * - States: disabled, error state
 * - Auto-sizing functionality
 * 
 * @example
 * <Textarea placeholder="Enter your message..." />
 * <Textarea color="primary" size="lg" bordered />
 * <Textarea label="Description" helperText="Maximum 500 characters" />
 * <Textarea autoSize minRows={3} maxRows={10} />
 */
export const Textarea: React.FC<TextareaProps> = ({
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
  autoSize,
  minRows = 3,
  maxRows,
  onChange,
  ...props
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const textareaClasses = buildDaisyUIClasses('textarea', {
    color: error ? 'error' : color,
    size,
    disabled,
    className,
    additionalClasses: [
      bordered ? 'textarea-bordered' : '',
      ghost ? 'textarea-ghost' : '',
      'w-full'
    ].filter(Boolean)
  });

  // Auto-resize functionality
  const handleAutoResize = React.useCallback(() => {
    if (autoSize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      
      const newHeight = textarea.scrollHeight;
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
      const minHeight = minRows * lineHeight;
      const maxHeight = maxRows ? maxRows * lineHeight : Infinity;
      
      textarea.style.height = `${Math.min(Math.max(newHeight, minHeight), maxHeight)}px`;
    }
  }, [autoSize, minRows, maxRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoSize) {
      handleAutoResize();
    }
    onChange?.(e);
  };

  React.useEffect(() => {
    if (autoSize) {
      handleAutoResize();
    }
  }, [handleAutoResize, autoSize]);

  const textareaElement = (
    <textarea
      ref={textareaRef}
      className={textareaClasses}
      disabled={disabled}
      rows={autoSize ? minRows : props.rows}
      onChange={handleChange}
      style={{
        resize: autoSize ? 'none' : undefined,
        overflow: autoSize ? 'hidden' : undefined,
        ...props.style
      }}
      {...props}
    >
      {children}
    </textarea>
  );

  // Simple textarea without wrapper
  if (!label && !labelAlt && !helperText) {
    return textareaElement;
  }

  // Textarea with wrapper for labels, helper text, etc.
  return (
    <div className="form-control w-full">
      {/* Label */}
      {(label || labelAlt) && (
        <label className="label">
          {label && <span className="label-text">{label}</span>}
          {labelAlt && <span className="label-text-alt">{labelAlt}</span>}
        </label>
      )}

      {/* Textarea */}
      {textareaElement}

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

// Convenience components for common textarea types
export const BorderedTextarea: React.FC<Omit<TextareaProps, 'bordered'>> = (props) => (
  <Textarea bordered {...props} />
);

export const GhostTextarea: React.FC<Omit<TextareaProps, 'ghost'>> = (props) => (
  <Textarea ghost {...props} />
);

export const AutoSizeTextarea: React.FC<Omit<TextareaProps, 'autoSize'>> = (props) => (
  <Textarea autoSize {...props} />
);

export default Textarea;