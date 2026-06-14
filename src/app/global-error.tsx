"use client";

import { ServerCrash, RefreshCw } from "lucide-react";
import { AmbientBackground } from "@/components/ui/ambient-background";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="fa" dir="rtl">
            <body>
                <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 text-right">
                    <AmbientBackground dense />
                    <div className="relative z-10 mx-auto w-full max-w-xl rounded-3xl border border-rose-300/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl">
                        <div className="mb-8 inline-block rounded-3xl border border-rose-300/25 bg-rose-400/10 p-6 text-rose-200">
                            <ServerCrash className="h-16 w-16" strokeWidth={1.5} />
                        </div>
                        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">مشکلی در بارگذاری سایت پیش آمده!</h1>
                        <p className="mb-10 text-lg leading-8 text-brand-text-secondary">
                            یک خطای اساسی در برنامه رخ داده است. لطفاً صفحه را مجدداً بارگذاری کنید.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="mx-auto flex cursor-pointer items-center gap-2 rounded-xl border border-silver-light/25 bg-silver-light/15 px-6 py-3 font-bold text-white shadow-silver-glow transition-all hover:-translate-y-1 hover:bg-silver-light/25"
                        >
                            <RefreshCw className="h-5 w-5" />
                            <span>بارگذاری مجدد سایت</span>
                        </button>
                    </div>
                </main>
            </body>
        </html>
    );
}
