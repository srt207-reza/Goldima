"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, LogOut, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { useCurrentUserQuery, useLogoutMutation } from "@/hooks/api";
import { clearAuthTokens, getAccessToken, getRefreshToken } from "@/lib/auth-storage";
import { DEFAULT_SUSPENDED_REASON } from "@/lib/auth-routing";

const FloatingParticles = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-12 top-24 h-2 w-2 animate-float rounded-full bg-rose-200/35" />
        <div className="absolute right-20 top-44 h-3 w-3 animate-float rounded-full bg-silver-light/25" style={{ animationDelay: "1.4s" }} />
        <div className="absolute bottom-28 left-1/4 h-2 w-2 animate-float rounded-full bg-silver-metallic/30" style={{ animationDelay: "2.8s" }} />
        <div className="absolute bottom-40 right-1/3 h-1.5 w-1.5 animate-float rounded-full bg-rose-100/25" style={{ animationDelay: "4s" }} />
    </div>
);

function SuspendedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const logoutMutation = useLogoutMutation();
    const { data: currentUser } = useCurrentUserQuery();
    const hasToken = Boolean(getAccessToken() || getRefreshToken());

    const businessName = useMemo(
        () =>
            currentUser?.business_name ||
            searchParams.get("business_name") ||
            "حساب کاربری شما",
        [currentUser?.business_name, searchParams],
    );

    const reason = useMemo(
        () =>
            currentUser?.suspend_reason?.trim() ||
            searchParams.get("reason")?.trim() ||
            searchParams.get("suspend_reason")?.trim() ||
            DEFAULT_SUSPENDED_REASON,
        [currentUser?.suspend_reason, searchParams],
    );

    const handleLogout = async () => {
        const refresh = getRefreshToken();

        try {
            if (refresh) {
                await logoutMutation.mutateAsync({ refresh });
            }

            clearAuthTokens();
            toast.success("با موفقیت خارج شدید");
            router.replace("/login");
        } catch (error) {
            clearAuthTokens();
            const message = error instanceof Error ? error.message : "خروج با خطا مواجه شد";
            toast.error(message);
            router.replace("/login");
        }
    };

    return (
        <Card className="group relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-rose-200/15 bg-brand-surface/78 p-7 text-right shadow-2xl shadow-black/35 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-rose-100/25 sm:p-8">
            <ShineBorder className="opacity-35 transition-opacity duration-700 group-hover:opacity-90" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,113,133,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_44%)]" />
            <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-rose-300/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-silver-light/10 blur-3xl" />
            <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-rose-100/60 to-transparent opacity-80" />

            <div className="relative">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-100">
                    <ShieldOff className="h-4 w-4" />
                    حساب تعلیق شده
                </div>

                <div className="mb-7 flex items-start gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-100 shadow-lg shadow-rose-950/20">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-3xl font-black leading-tight text-brand-text-primary sm:text-4xl">
                            دسترسی حساب شما تعلیق شده است
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                            {businessName} در حال حاضر امکان ورود به پنل را ندارد.
                        </p>
                    </div>
                </div>

                <div className="rounded-3xl border border-silver-dark/20 bg-brand-base/45 p-5 shadow-inner shadow-black/10">
                    <p className="mb-3 text-xs font-bold text-brand-text-secondary">دلیل تعلیق</p>
                    <p className="whitespace-pre-wrap text-justify text-sm leading-8 text-brand-text-primary">
                        {reason}
                    </p>
                </div>

                <div className="mt-5 rounded-2xl border border-silver-light/10 bg-white/[0.03] p-4 text-sm leading-7 text-brand-text-secondary">
                    برای پیگیری وضعیت حساب، با پشتیبانی Goldima تماس بگیرید. تا زمان رفع تعلیق، دسترسی به داشبورد و بخش‌های مدیریتی فعال نخواهد بود.
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="group/logout relative mt-8 inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border border-rose-300/20 bg-rose-400/10 px-6 text-sm font-bold text-rose-50 shadow-lg shadow-rose-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200/35 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="pointer-events-none absolute inset-y-0 right-0 w-24 translate-x-full bg-gradient-to-l from-white/20 to-transparent blur-xl transition-transform duration-700 group-hover/logout:-translate-x-[420%]" />
                    <LogOut className="h-4 w-4" />
                    {logoutMutation.isPending ? "در حال خروج..." : hasToken ? "خروج از حساب کاربری" : "بازگشت به ورود"}
                </button>
            </div>
        </Card>
    );
}

export default function SuspendedPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <FloatingParticles />
            <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-rose-300/5 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl" />
            <Suspense
                fallback={
                    <Card className="relative flex h-80 w-full max-w-lg items-center justify-center border border-silver-dark/20 bg-brand-surface/80 p-8 backdrop-blur-xl">
                        <div className="animate-pulse text-silver-light">در حال بارگذاری...</div>
                    </Card>
                }
            >
                <SuspendedContent />
            </Suspense>
        </div>
    );
}
