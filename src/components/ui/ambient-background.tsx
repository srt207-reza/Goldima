import { cn } from "@/lib/utils";

type AmbientBackgroundProps = {
    className?: string;
    dense?: boolean;
};

export function AmbientBackground({ className, dense = false }: AmbientBackgroundProps) {
    return (
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(226,232,240,0.10),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,0.08),transparent_26%),linear-gradient(135deg,rgba(11,17,32,0.98),rgba(17,24,39,0.94)_48%,rgba(31,41,55,0.78))]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_18%,transparent_72%)]" />
            <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-silver-light/10 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl animate-float" />
            <span className="absolute right-[12%] top-24 h-1.5 w-1.5 rounded-full bg-silver-light/50 animate-float" />
            <span className="absolute left-[18%] top-1/3 h-2 w-2 rounded-full bg-silver-metallic/35 animate-float [animation-delay:1.2s]" />
            <span className="absolute bottom-28 right-[36%] h-1 w-1 rounded-full bg-emerald-300/45 animate-float [animation-delay:2s]" />
            {dense ? (
                <>
                    <span className="absolute left-[35%] top-20 h-1 w-1 rounded-full bg-silver-light/35 animate-float [animation-delay:2.8s]" />
                    <span className="absolute bottom-44 left-[42%] h-1.5 w-1.5 rounded-full bg-silver-dark/35 animate-float [animation-delay:3.4s]" />
                </>
            ) : null}
        </div>
    );
}
