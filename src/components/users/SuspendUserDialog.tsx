"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, X } from "lucide-react";

type SuspendUserDialogProps = {
    isOpen: boolean;
    userName: string;
    isSubmitting?: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
};

export function SuspendUserDialog({
    isOpen,
    userName,
    isSubmitting = false,
    onClose,
    onConfirm,
}: SuspendUserDialogProps) {
    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen ? (
                <SuspendUserDialogPanel
                    userName={userName}
                    isSubmitting={isSubmitting}
                    onClose={onClose}
                    onConfirm={onConfirm}
                />
            ) : null}
        </AnimatePresence>,
        document.body
    );
}

function SuspendUserDialogPanel({
    userName,
    isSubmitting = false,
    onClose,
    onConfirm,
}: Omit<SuspendUserDialogProps, "isOpen">) {
    const [reason, setReason] = useState("");
    const normalizedReason = reason.trim();

    return (
        <motion.div
            className="fixed inset-0 z-[9999] grid min-h-dvh place-items-center bg-black/75 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="suspend-user-title"
                className="relative max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-3xl border border-rose-300/20 bg-brand-surface/95 p-6 text-right shadow-2xl shadow-black/40"
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,113,133,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_45%)]" />
                <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-rose-100/55 to-transparent" />

                <div className="relative">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="absolute left-0 top-0 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-brand-text-secondary transition hover:bg-white/10 hover:text-brand-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="بستن"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-100 shadow-lg shadow-rose-950/10">
                        <Ban className="h-6 w-6" />
                    </div>

                    <h2 id="suspend-user-title" className="text-2xl font-black text-brand-text-primary">
                        تعلیق حساب کاربری
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                        دلیل تعلیق حساب {userName} را بنویسید. این متن برای کاربر در صفحه تعلیق نمایش داده می‌شود.
                    </p>

                    <div className="mt-5">
                        <label htmlFor="suspend-reason" className="mb-2 block text-sm font-bold text-brand-text-primary">
                            دلیل تعلیق
                        </label>
                        <textarea
                            id="suspend-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            rows={5}
                            maxLength={500}
                            placeholder="مثلاً به دلیل تغییر وضعیت فروشگاه بالادستی یا مغایرت اطلاعات حساب..."
                            className="w-full resize-none rounded-2xl border border-silver-dark/20 bg-brand-base/55 px-4 py-3 text-sm leading-7 text-brand-text-primary outline-none transition placeholder:text-brand-text-secondary/70 focus:border-rose-200/40 focus:bg-brand-base/75"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-brand-text-secondary">
                            <span>ثبت دلیل برای تعلیق الزامی است.</span>
                            <span dir="ltr">{normalizedReason.length}/500</span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-brand-text-secondary transition hover:bg-white/10 hover:text-brand-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            onClick={() => onConfirm(normalizedReason)}
                            disabled={isSubmitting || !normalizedReason}
                            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-5 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Ban className="h-4 w-4" />
                            {isSubmitting ? "در حال تعلیق..." : "تعلیق حساب"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
