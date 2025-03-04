
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'neo' | 'flat';
  hover?: boolean;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'flat', hover = false, children, ...props }, ref) => {
    const variantStyles = {
      glass: "glass-effect",
      neo: "neomorphism",
      flat: "bg-card border rounded-lg shadow-sm"
    };
    
    const hoverStyles = hover ? "transition-all duration-300 hover:shadow-md hover:-translate-y-1" : "";
    
    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
