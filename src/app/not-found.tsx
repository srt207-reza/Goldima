"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SearchX, Home, ArrowLeft } from "lucide-react";
import { AmbientBackground } from "@/components/ui/ambient-background";

export default function NotFound() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-base p-4" dir="rtl">
            <AmbientBackground dense />

            <div className="relative z-10 w-full max-w-lg text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative mb-8 inline-block"
                >
                    <div className="select-none bg-gradient-to-b from-white to-slate-700 bg-clip-text text-[150px] font-black leading-none text-transparent md:text-[200px]">
                        404
                    </div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="mt-4 rounded-full border-4 border-brand-base bg-brand-card p-4 text-silver-light shadow-silver-glow">
                            <SearchX className="h-16 w-16" />
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h1 className="mb-4 text-3xl font-bold text-white">مسیر را گم کرده‌اید!</h1>
                    <p className="mx-auto mb-10 max-w-md text-lg leading-relaxed text-brand-text-secondary">
                        صفحه‌ای که به دنبال آن هستید وجود ندارد، نام آن تغییر کرده و یا به صورت موقت از دسترس خارج شده است.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Link
                        href="/"
                        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-silver-light/25 bg-silver-light/15 px-8 py-3.5 font-medium text-white shadow-silver-glow transition-all duration-300 hover:bg-silver-light/25 active:scale-95 sm:w-auto"
                    >
                        <Home className="h-5 w-5" />
                        <span>بازگشت به خانه</span>
                    </Link>

                    <Link
                        href="/profile"
                        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-silver-dark/20 bg-brand-surface/80 px-8 py-3.5 font-medium text-slate-300 transition-all duration-300 hover:bg-brand-hover hover:text-white active:scale-95 sm:w-auto"
                    >
                        <span>تنظیمات حساب</span>
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
