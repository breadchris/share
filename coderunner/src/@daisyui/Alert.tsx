import React from 'react';
import { CommonDaisyUIProps } from './types';
import { buildDaisyUIClasses } from './utils';

export interface AlertProps extends CommonDaisyUIProps {
  // Alert-specific props
  icon?: React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  
  // Layout variants
  horizontal?: boolean;
}

/**
 * DaisyUI Alert Component
 * 
 * Supports all DaisyUI alert variants:
 * - Colors: info (default), success, warning, error
 * - Content: icon, title, description, actions
 * - Closable functionality
 * 
 * @example
 * <Alert color="success">Your changes have been saved!</Alert>
 * <Alert color="warning" icon={<WarningIcon />} title="Warning">
 *   This action cannot be undone.
 * </Alert>
 * <Alert color="error" closable onClose={() => console.log('closed')}>
 *   An error occurred while processing your request.
 * </Alert>
 */
export const Alert: React.FC<AlertProps> = ({
  children,
  className,
  color = 'info',
  size,
  variant,
  active,
  disabled,
  loading,
  icon,
  title,
  actions,
  closable,
  onClose,
  horizontal,
  ...props
}) => {
  const alertClasses = buildDaisyUIClasses('alert', {
    color,
    className
  });

  // Default icons for different alert types
  const defaultIcons = {
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    ),
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  const displayIcon = icon !== null ? (icon || defaultIcons[color as keyof typeof defaultIcons]) : null;

  return (
    <div className={alertClasses} role="alert" {...props}>
      {/* Icon */}
      {displayIcon && displayIcon}

      {/* Content */}
      <div className="flex-1">
        {title && <h3 className="font-bold">{title}</h3>}
        {children && <div className="text-sm">{children}</div>}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex-none">
          {actions}
        </div>
      )}

      {/* Close button */}
      {closable && (
        <div className="flex-none">
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Close alert"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Convenience components for different alert types
export const InfoAlert: React.FC<Omit<AlertProps, 'color'>> = (props) => (
  <Alert color="info" {...props} />
);

export const SuccessAlert: React.FC<Omit<AlertProps, 'color'>> = (props) => (
  <Alert color="success" {...props} />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'color'>> = (props) => (
  <Alert color="warning" {...props} />
);

export const ErrorAlert: React.FC<Omit<AlertProps, 'color'>> = (props) => (
  <Alert color="error" {...props} />
);

export const ClosableAlert: React.FC<Omit<AlertProps, 'closable'>> = (props) => (
  <Alert closable {...props} />
);

// Toast-style alert hook for programmatic alerts
export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    content: React.ReactNode;
    type: 'info' | 'success' | 'warning' | 'error';
    options?: ToastOptions;
  }>>([]);

  const addToast = (
    content: React.ReactNode, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    options: ToastOptions = {}
  ) => {
    const id = Math.random().toString(36).substring(2);
    const newToast = { id, content, type, options };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = options.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="toast toast-top toast-end">
      {toasts.map(toast => (
        <Alert
          key={toast.id}
          color={toast.type}
          closable
          onClose={() => removeToast(toast.id)}
        >
          {toast.content}
        </Alert>
      ))}
    </div>
  );

  return {
    addToast,
    removeToast,
    ToastContainer,
    toasts
  };
};