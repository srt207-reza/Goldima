// src/components/ui/card.tsx
import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-brand-border bg-brand-card text-brand-text-primary shadow-sm ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
export { Card };
