import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-2xl border border-silver-dark/15 bg-white/[0.07] shadow-inner shadow-white/[0.02]",
                className
            )}
        />
    );
}

function SkeletonLine({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-full bg-white/10", className)} />;
}

function PageWrap({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("px-4 py-8", className)}>
            <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </div>
    );
}

export function AppShellSkeleton() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-brand-base text-brand-text-primary">
            <AmbientBackground />
            <aside className="fixed bottom-0 right-0 top-0 hidden w-72 border-l border-silver-dark/15 bg-brand-surface/85 p-4 backdrop-blur-xl lg:block">
                <div className="mb-6 flex items-center gap-3">
                    <SkeletonBlock className="h-12 w-12 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                        <SkeletonLine className="h-4 w-28" />
                        <SkeletonLine className="h-3 w-20" />
                    </div>
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-12 rounded-2xl" />
                    ))}
                </div>
                <SkeletonBlock className="absolute bottom-4 left-4 right-4 h-16 rounded-2xl" />
            </aside>
            <header className="fixed left-0 right-0 top-0 z-10 border-b border-white/5 bg-brand-surface/80 px-4 py-3 backdrop-blur-xl lg:right-72">
                <div className="flex items-center justify-between gap-4">
                    <SkeletonBlock className="h-11 w-11 rounded-xl lg:hidden" />
                    <SkeletonLine className="h-5 w-44" />
                    <div className="flex gap-2">
                        <SkeletonBlock className="h-10 w-10 rounded-xl" />
                        <SkeletonBlock className="h-10 w-10 rounded-xl" />
                    </div>
                </div>
            </header>
            <main className="pt-20 lg:pr-72">
                <DashboardPageSkeleton />
            </main>
        </div>
    );
}

export function DashboardPageSkeleton() {
    return (
        <PageWrap>
            <div className="grid gap-5 lg:grid-cols-2">
                <SkeletonBlock className="h-[15rem]" />
                <SkeletonBlock className="h-[15rem]" />
            </div>
            <SkeletonBlock className="h-40" />
            <div className="grid gap-5 md:grid-cols-2">
                <SkeletonBlock className="h-44" />
                <SkeletonBlock className="h-44" />
            </div>
        </PageWrap>
    );
}

export function PricingPageSkeleton() {
    return (
        <PageWrap>
            <Card className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-center">
                    <div className="space-y-4">
                        <SkeletonLine className="h-10 w-44" />
                        <SkeletonLine className="h-8 w-64" />
                        <SkeletonLine className="h-4 w-full max-w-3xl" />
                        <SkeletonLine className="h-4 w-2/3" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-brand-base/45 p-2">
                        <SkeletonBlock className="h-20 rounded-lg" />
                        <SkeletonBlock className="h-20 rounded-lg" />
                        <SkeletonBlock className="h-20 rounded-lg" />
                    </div>
                </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-deep-card backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3">
                                <SkeletonLine className="h-7 w-44" />
                                <SkeletonLine className="h-4 w-28" />
                            </div>
                            <SkeletonBlock className="h-10 w-28 rounded-xl" />
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <SkeletonBlock className="h-12 rounded-xl" />
                            <SkeletonBlock className="h-12 rounded-xl" />
                            <SkeletonBlock className="h-12 rounded-xl" />
                        </div>
                        <div className="mt-5 grid gap-3">
                            <SkeletonBlock className="h-28" />
                            <SkeletonBlock className="h-28" />
                        </div>
                    </Card>
                ))}
            </div>
        </PageWrap>
    );
}

export function StoresPageSkeleton() {
    return (
        <PageWrap>
            <Card className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-center">
                    <div className="space-y-4">
                        <SkeletonLine className="h-10 w-36" />
                        <SkeletonLine className="h-8 w-56" />
                        <SkeletonLine className="h-4 w-full max-w-2xl" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-brand-base/45 p-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <SkeletonBlock key={index} className="h-20 rounded-lg" />
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 text-right shadow-deep-card backdrop-blur-xl">
                <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr_0.8fr_0.9fr] gap-4 border-b border-white/10 p-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonLine key={index} className="h-4 w-full" />
                    ))}
                </div>
                <div className="divide-y divide-white/5">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr_0.8fr_0.9fr] items-center gap-4 p-4">
                            <div className="flex items-center gap-3">
                                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <SkeletonLine className="h-4 w-32" />
                                    <SkeletonLine className="h-3 w-24" />
                                </div>
                            </div>
                            <SkeletonLine className="h-7 w-20 justify-self-center rounded-lg" />
                            <SkeletonLine className="h-7 w-24 justify-self-center rounded-lg" />
                            <SkeletonLine className="h-4 w-28 justify-self-center" />
                            <SkeletonLine className="h-4 w-20 justify-self-center" />
                            <div className="flex justify-center gap-2">
                                <SkeletonBlock className="h-9 w-9 rounded-lg" />
                                <SkeletonBlock className="h-9 w-9 rounded-lg" />
                                <SkeletonBlock className="h-9 w-9 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </PageWrap>
    );
}

export function StoreDetailPageSkeleton() {
    return (
        <PageWrap>
            <Card className="rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="space-y-4">
                        <SkeletonLine className="h-8 w-56" />
                        <div className="flex flex-wrap gap-2">
                            <SkeletonLine className="h-10 w-24 rounded-lg" />
                            <SkeletonLine className="h-10 w-28 rounded-lg" />
                            <SkeletonLine className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <SkeletonBlock className="h-11 w-24 rounded-xl" />
                        <SkeletonBlock className="h-11 w-24 rounded-xl" />
                        <SkeletonBlock className="h-11 w-24 rounded-xl" />
                    </div>
                </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                    <SkeletonLine className="mb-5 h-6 w-40" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                                <SkeletonLine className="h-4 w-24" />
                                <SkeletonBlock className="h-11 rounded-xl" />
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                    <SkeletonLine className="mb-5 h-6 w-44" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                                <SkeletonLine className="h-4 w-24" />
                                <SkeletonBlock className={index === 4 ? "h-28 rounded-xl" : "h-11 rounded-xl"} />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </PageWrap>
    );
}

export function ProfilePageSkeleton() {
    return (
        <PageWrap>
            <Card className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-center">
                    <div className="flex items-center gap-4">
                        <SkeletonBlock className="h-20 w-20 rounded-2xl" />
                        <div className="flex-1 space-y-3">
                            <SkeletonLine className="h-8 w-56" />
                            <SkeletonLine className="h-4 w-72" />
                            <SkeletonLine className="h-8 w-28 rounded-lg" />
                        </div>
                    </div>
                    <SkeletonBlock className="h-28 rounded-2xl" />
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <SkeletonBlock className="h-24" />
                <SkeletonBlock className="h-24" />
                <SkeletonBlock className="h-24" />
            </div>

            <Card className="overflow-hidden border border-silver-dark/20 bg-brand-surface/80 text-right shadow-deep-card backdrop-blur-xl">
                <div className="grid gap-2 border-b border-white/10 bg-brand-base/25 p-2 md:grid-cols-3">
                    <SkeletonBlock className="h-16 rounded-2xl" />
                    <SkeletonBlock className="h-16 rounded-2xl" />
                    <SkeletonBlock className="h-16 rounded-2xl" />
                </div>
                <div className="grid gap-4 p-5 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <SkeletonLine className="h-4 w-28" />
                            <SkeletonBlock className="h-12 rounded-2xl" />
                        </div>
                    ))}
                </div>
            </Card>
        </PageWrap>
    );
}

export function ShareLinkPageSkeleton() {
    return (
        <PageWrap>
            <Card className="rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-6 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                <SkeletonLine className="h-10 w-52 rounded-lg" />
                <SkeletonLine className="mt-5 h-8 w-64" />
                <SkeletonLine className="mt-4 h-4 w-full max-w-3xl" />
                <SkeletonLine className="mt-3 h-4 w-2/3" />
            </Card>
            <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
                <SkeletonBlock className="h-64 rounded-3xl" />
                <SkeletonBlock className="h-64 rounded-3xl" />
            </div>
        </PageWrap>
    );
}

export function AuthPageSkeleton({ wide = false }: { wide?: boolean }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <Card className={cn("relative overflow-hidden rounded-[2rem] border border-silver-dark/20 bg-brand-surface/85 p-7 text-center shadow-2xl backdrop-blur-xl", wide ? "w-full max-w-5xl" : "w-full max-w-md")}>
                <SkeletonBlock className="mx-auto h-24 w-24 rounded-3xl" />
                <SkeletonLine className="mx-auto mt-6 h-8 w-44" />
                <SkeletonLine className="mx-auto mt-3 h-4 w-64 max-w-full" />
                <div className={cn("mt-8 grid gap-4", wide ? "md:grid-cols-2" : "")}>
                    {Array.from({ length: wide ? 8 : 3 }).map((_, index) => (
                        <div key={index} className="space-y-2 text-right">
                            <SkeletonLine className="h-4 w-24" />
                            <SkeletonBlock className="h-12 rounded-2xl" />
                        </div>
                    ))}
                </div>
                <SkeletonBlock className="mt-7 h-12 rounded-2xl" />
            </Card>
        </div>
    );
}

export function StatusPageSkeleton({ tone = "silver" }: { tone?: "silver" | "rose" }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <Card className={cn("relative w-full max-w-xl overflow-hidden rounded-[2rem] border p-7 text-right shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8", tone === "rose" ? "border-rose-200/15 bg-brand-surface/78" : "border-silver-dark/20 bg-brand-surface/75")}>
                <SkeletonLine className="h-10 w-36 rounded-full" />
                <div className="mt-7 flex items-start gap-4">
                    <SkeletonBlock className="h-16 w-16 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-3">
                        <SkeletonLine className="h-8 w-72 max-w-full" />
                        <SkeletonLine className="h-4 w-56 max-w-full" />
                    </div>
                </div>
                <SkeletonBlock className="mt-7 h-36 rounded-3xl" />
                <SkeletonBlock className="mt-5 h-20 rounded-2xl" />
                <SkeletonBlock className="mt-8 h-14 rounded-2xl" />
            </Card>
        </div>
    );
}

export function BusinessLandingPageSkeleton() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-10">
            <AmbientBackground dense />
            <Card className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl">
                <SkeletonBlock className="mx-auto h-24 w-24 rounded-3xl" />
                <SkeletonLine className="mx-auto mt-6 h-8 w-56" />
                <SkeletonLine className="mx-auto mt-4 h-4 w-72 max-w-full" />
                <SkeletonBlock className="mt-8 h-12 rounded-2xl" />
            </Card>
        </div>
    );
}
