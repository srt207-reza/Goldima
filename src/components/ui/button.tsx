import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "ghost";
    size?: "default" | "sm";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", children, ...props }, ref) => {
        const baseStyles =
            "group/btn relative inline-flex items-center justify-center overflow-hidden rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-silver-light/45 focus:ring-offset-2 focus:ring-offset-brand-base active:scale-[0.98] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-55";

        const variants = {
            default:
                "border border-silver-light/25 bg-gradient-to-l from-silver-light/95 via-silver-metallic to-silver-dark text-brand-base shadow-silver-glow hover:shadow-silver-glow-strong hover:brightness-110",
            ghost:
                "border border-silver-dark/20 bg-white/[0.03] text-brand-text-primary hover:border-silver-light/25 hover:bg-white/[0.07] hover:text-white",
        };

        const sizes = {
            default: "h-11 px-6 py-2",
            sm: "h-9 px-4 text-sm",
        };

        return (
            <button className={cn(baseStyles, variants[variant], sizes[size], className)} ref={ref} {...props}>
                <span className="pointer-events-none absolute inset-y-0 right-[-35%] z-0 w-1/3 rotate-12 bg-white/30 blur-md transition-transform duration-700 group-hover/btn:-translate-x-[420%]" />
                <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
            </button>
        );
    },
);

Button.displayName = "Button";
export { Button };
