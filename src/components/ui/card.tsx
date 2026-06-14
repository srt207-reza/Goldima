import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "rounded-2xl border border-brand-border/80 bg-brand-card/80 text-brand-text-primary shadow-sm backdrop-blur-sm transition-colors duration-300",
                className,
            )}
            {...props}
        />
    );
});

Card.displayName = "Card";
export { Card };
