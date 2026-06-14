import { cn } from "@/lib/utils";

type MeteorsProps = {
    className?: string;
    number?: number;
};

export function Meteors({ className, number = 10 }: MeteorsProps) {
    const meteors = Array.from({ length: number });

    return (
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
            {meteors.map((_, index) => (
                <span
                    key={index}
                    className="goldima-meteor absolute h-px w-28 rounded-full bg-gradient-to-l from-silver-light via-silver-light/60 to-transparent opacity-0 shadow-[0_0_16px_rgba(226,232,240,0.18)]"
                    style={{
                        top: `${4 + ((index * 17) % 74)}%`,
                        left: `${-20 - ((index * 13) % 24)}%`,
                        animationDelay: `${index * 0.95}s`,
                        animationDuration: `${7 + (index % 5)}s`,
                    }}
                />
            ))}
        </div>
    );
}
