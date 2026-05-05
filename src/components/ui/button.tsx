// src/components/ui/button.tsx
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
  size?: "default" | "sm";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      default: "bg-gold text-brand-base hover:bg-gold-light shadow-gold-glow hover:shadow-gold-glow-strong",
      ghost: "hover:bg-brand-hover text-brand-text-primary",
    };
    
    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-9 px-4 text-sm",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
