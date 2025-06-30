import React from 'react';
import { BaseComponentProps, SizeVariantProps } from './types';
import { buildDaisyUIClasses } from './utils';

export interface CardProps 
  extends BaseComponentProps, 
          SizeVariantProps {
  // Card-specific style variants
  bordered?: boolean;
  dash?: boolean;
  side?: boolean;
  imageFull?: boolean;
  
  // Card content props
  image?: string | React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}

export interface CardBodyProps extends BaseComponentProps {}
export interface CardTitleProps extends BaseComponentProps {}
export interface CardActionsProps extends BaseComponentProps {
  justify?: 'start' | 'center' | 'end';
}

/**
 * DaisyUI Card Component
 * 
 * Supports all DaisyUI card variants:
 * - Sizes: xs, sm, md (default), lg, xl
 * - Styles: bordered, dash border
 * - Layouts: side layout, full image background
 * - Modifiers: compact spacing
 * 
 * @example
 * <Card title="Card Title" image="/image.jpg" size="lg">
 *   <p>Card content goes here</p>
 *   <Card.Actions>
 *     <Button>Action 1</Button>
 *     <Button>Action 2</Button>
 *   </Card.Actions>
 * </Card>
 * 
 * <Card side bordered>
 *   <figure><img src="/image.jpg" alt="Album" /></figure>
 *   <Card.Body>
 *     <Card.Title>Album Title</Card.Title>
 *     <p>Description</p>
 *   </Card.Body>
 * </Card>
 */
export const Card: React.FC<CardProps> & {
  Body: React.FC<CardBodyProps>;
  Title: React.FC<CardTitleProps>;
  Actions: React.FC<CardActionsProps>;
} = ({
  children,
  className,
  size,
  bordered,
  dash,
  side,
  imageFull,
  image,
  title,
  actions,
  compact,
  ...props
}) => {
  const cardClasses = buildDaisyUIClasses('card', {
    size,
    className,
    additionalClasses: [
      bordered ? 'card-border' : '',
      dash ? 'card-dash' : '',
      side ? 'card-side' : '',
      imageFull ? 'image-full' : '',
      compact ? 'card-compact' : ''
    ].filter(Boolean)
  });

  return (
    <div className={cardClasses} {...props}>
      {/* Image/Figure */}
      {image && (
        <figure className={imageFull ? 'relative' : ''}>
          {typeof image === 'string' ? (
            <img src={image} alt="" className="w-full h-auto" />
          ) : (
            image
          )}
        </figure>
      )}

      {/* Card Body */}
      <div className="card-body">
        {/* Title */}
        {title && (
          <h2 className="card-title">
            {title}
          </h2>
        )}

        {/* Content */}
        {children}

        {/* Actions */}
        {actions && (
          <div className="card-actions justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Card sub-components
Card.Body = ({ children, className, ...props }: CardBodyProps) => (
  <div className={`card-body ${className || ''}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className, ...props }: CardTitleProps) => (
  <h2 className={`card-title ${className || ''}`} {...props}>
    {children}
  </h2>
);

Card.Actions = ({ 
  children, 
  className, 
  justify = 'end',
  ...props 
}: CardActionsProps) => {
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center', 
    end: 'justify-end'
  }[justify];

  return (
    <div 
      className={`card-actions ${justifyClass} ${className || ''}`} 
      {...props}
    >
      {children}
    </div>
  );
};

// Convenience components for common card types
export const PricingCard: React.FC<Omit<CardProps, 'title'> & { 
  planName: string;
  price: string;
  features: string[];
  popular?: boolean;
  actionText?: string;
  onAction?: () => void;
}> = ({
  planName,
  price,
  features,
  popular,
  actionText = 'Subscribe',
  onAction,
  ...props
}) => (
  <Card {...props} className={`relative ${props.className || ''}`}>
    {popular && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <span className="badge badge-primary">Most Popular</span>
      </div>
    )}
    <Card.Body>
      <Card.Title>{planName}</Card.Title>
      <p className="text-3xl font-bold">{price}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Card.Actions>
        <button 
          className="btn btn-primary btn-block"
          onClick={onAction}
        >
          {actionText}
        </button>
      </Card.Actions>
    </Card.Body>
  </Card>
);

export const ImageCard: React.FC<Omit<CardProps, 'image'> & {
  src: string;
  alt?: string;
}> = ({ src, alt, ...props }) => (
  <Card image={<img src={src} alt={alt || ''} />} {...props} />
);

export const SideCard: React.FC<Omit<CardProps, 'side'>> = (props) => (
  <Card side {...props} />
);

export const BorderedCard: React.FC<Omit<CardProps, 'bordered'>> = (props) => (
  <Card bordered {...props} />
);

export default Card;