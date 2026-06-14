"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ServerCrash, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("Application Error:", error);
    }, [error]);

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base p-4" dir="rtl">
            <AmbientBackground dense />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="relative overflow-hidden rounded-[2rem] border border-rose-300/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl md:p-10">
                    <ShineBorder className="opacity-70" />
                    <div className="relative mx-auto mb-6 h-24 w-24">
                        <div className="absolute inset-0 animate-pulse rounded-full bg-rose-400/20 blur-xl" />
                        <div className="relative flex h-full w-full items-center justify-center rounded-full border border-rose-300/30 bg-brand-base shadow-inner">
                            <ServerCrash className="h-10 w-10 text-rose-300" />
                        </div>
                    </div>

                    <h1 className="mb-3 text-2xl font-black text-white md:text-3xl">اوه! خطایی رخ داد</h1>
                    <p className="mb-8 text-sm leading-relaxed text-brand-text-secondary md:text-base">
                        متاسفانه در برقراری ارتباط با سرور مشکلی پیش آمده است. دوباره تلاش کنید یا به داشبورد برگردید.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => reset()}
                            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3.5 font-medium text-rose-100 transition-all duration-300 hover:bg-rose-400/20 active:scale-95"
                        >
                            <RotateCcw className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-180" />
                            <span>تلاش مجدد</span>
                        </button>

                        <Link
                            href="/"
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-silver-dark/20 bg-brand-base/65 px-4 py-3.5 font-medium text-slate-300 transition-all duration-300 hover:bg-brand-hover hover:text-white active:scale-95"
                        >
                            <Home className="h-5 w-5" />
                            <span>بازگشت به صفحه اصلی</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
