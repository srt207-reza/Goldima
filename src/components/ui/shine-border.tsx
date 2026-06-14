import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type ShineBorderProps = {
    className?: string;
    duration?: string;
};

const maskStyle: CSSProperties = {
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
};

export function ShineBorder({ className, duration = "7s" }: ShineBorderProps) {
    return (
        <span
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0 rounded-[inherit] p-px", className)}
            style={maskStyle}
        >
            <span
                className="absolute inset-[-42%] rounded-[inherit] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0deg,rgba(226,232,240,0.16)_80deg,rgba(226,232,240,0.95)_110deg,rgba(34,197,94,0.36)_145deg,transparent_210deg)] animate-border-beam"
                style={{ animationDuration: duration }}
            />
        </span>
    );
}
