import * as React from "react";
import { cn } from "@/lib/utils";
import { ShineBorder } from "./shine-border";

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
    withBorderBeam?: boolean;
    spotlightClassName?: string;
}

const MagicCard = React.forwardRef<HTMLDivElement, MagicCardProps>(
    ({ className, children, withBorderBeam = true, spotlightClassName, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "group relative overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/70 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-silver-light/30 hover:shadow-silver-glow",
                    className,
                )}
                {...props}
            >
                <div
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-silver-light/10 blur-3xl opacity-0 transition-all duration-700 group-hover:scale-125 group-hover:opacity-100",
                        spotlightClassName,
                    )}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-silver-light/70 to-transparent opacity-60"
                />
                {withBorderBeam ? <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" /> : null}
                <div className="relative z-10">{children}</div>
            </div>
        );
    },
);

MagicCard.displayName = "MagicCard";
export { MagicCard };
