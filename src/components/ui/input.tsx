import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-sm text-brand-text-primary shadow-inner shadow-black/10 outline-none transition-all duration-300 placeholder:text-brand-text-secondary/70 hover:border-silver-dark/70 focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25 disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";
export { Input };
