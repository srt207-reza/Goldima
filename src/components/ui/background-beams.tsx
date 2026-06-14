import { cn } from "@/lib/utils";

type BackgroundBeamsProps = {
    className?: string;
    dense?: boolean;
};

const beams = [
    "right-[8%] top-[-20%] h-[46rem] rotate-[18deg]",
    "right-[36%] top-[-28%] h-[52rem] rotate-[26deg]",
    "left-[18%] top-[-18%] h-[44rem] rotate-[-22deg]",
    "left-[42%] top-[-30%] h-[50rem] rotate-[-14deg]",
];

export function BackgroundBeams({ className, dense = false }: BackgroundBeamsProps) {
    return (
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
            {beams.slice(0, dense ? beams.length : 3).map((position, index) => (
                <span
                    key={position}
                    className={cn(
                        "goldima-light-beam absolute w-px rounded-full bg-gradient-to-b from-transparent via-silver-light/35 to-transparent opacity-40 blur-[0.5px]",
                        position,
                    )}
                    style={{ animationDelay: `${index * 1.35}s`, animationDuration: `${8 + index * 1.4}s` }}
                />
            ))}
        </div>
    );
}
