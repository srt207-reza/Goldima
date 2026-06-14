import { useId } from "react";
import { cn } from "@/lib/utils";

type AnimatedGridPatternProps = {
    className?: string;
    width?: number;
    height?: number;
    strokeDasharray?: string;
    squares?: Array<[number, number]>;
};

const defaultSquares: Array<[number, number]> = [
    [4, 2],
    [7, 4],
    [10, 1],
    [13, 6],
    [15, 3],
    [18, 5],
    [21, 2],
    [24, 7],
    [27, 4],
    [30, 6],
];

export function AnimatedGridPattern({
    className,
    width = 72,
    height = 72,
    strokeDasharray = "4 8",
    squares = defaultSquares,
}: AnimatedGridPatternProps) {
    const id = useId().replace(/:/g, "");

    return (
        <svg aria-hidden="true" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
            <defs>
                <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
                    <path
                        d={`M ${width} 0 L 0 0 0 ${height}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray={strokeDasharray}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
            <g className="goldima-grid-cells">
                {squares.map(([x, y], index) => (
                    <rect
                        key={`${x}-${y}-${index}`}
                        width={width - 1}
                        height={height - 1}
                        x={x * width + 1}
                        y={y * height + 1}
                        fill="currentColor"
                        className="goldima-grid-cell"
                        style={{ animationDelay: `${index * 0.45}s` }}
                    />
                ))}
            </g>
        </svg>
    );
}
