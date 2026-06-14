import { cn } from "@/lib/utils";

type MorphingTextProps = {
    words?: string[];
    className?: string;
};

const defaultWords = ["GOLDIMA", "NOROS", "SILVER", "MARKET"];

export function MorphingText({ words = defaultWords, className }: MorphingTextProps) {
    const duration = Math.max(words.length * 3.2, 9.6);

    return (
        <>
            <svg aria-hidden="true" className="absolute h-0 w-0" focusable="false">
                <filter id="goldima-morph-threshold">
                    <feColorMatrix
                        in="SourceGraphic"
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -110"
                    />
                </filter>
            </svg>
            <div aria-hidden="true" className={cn("goldima-morph-text pointer-events-none relative select-none", className)}>
                {words.map((word, index) => (
                    <span
                        key={`${word}-${index}`}
                        className="goldima-morph-word"
                        style={{ animationDelay: `${index * 3.2}s`, animationDuration: `${duration}s` }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </>
    );
}
