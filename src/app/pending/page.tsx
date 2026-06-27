"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, Suspense } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { useCurrentUserQuery, useLogoutMutation, useParentBusinessProfileQuery } from "@/hooks/api";
import { clearAuthTokens, getAccessToken, getRefreshToken } from "@/lib/auth-storage";
import { DEFAULT_PARENT_BUSINESS_HANDLER, getReadableBusinessHandler, normalizeBusinessPathSegment } from "@/lib/business-path";
import { getNormalizedUserRole } from "@/lib/user-role";

const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
            className="absolute top-20 left-10 w-2 h-2 bg-silver-light/30 rounded-full animate-float"
            style={{ animationDelay: "0s" }}
        />
        <div
            className="absolute top-40 right-20 w-3 h-3 bg-silver-metallic/20 rounded-full animate-float"
            style={{ animationDelay: "2s" }}
        />
        <div
            className="absolute bottom-32 left-1/4 w-2 h-2 bg-silver-light/40 rounded-full animate-float"
            style={{ animationDelay: "4s" }}
        />
        <div
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-silver-dark/30 rounded-full animate-float"
            style={{ animationDelay: "1s" }}
        />
    </div>
);

function OrganizationNotFound({ businessHandler }: { businessHandler: string }) {
    const readableBusinessHandler = getReadableBusinessHandler(businessHandler);

    return (
        <Card className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-300/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl">
            <ShineBorder className="opacity-70" />
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-2xl font-black text-rose-100">
                !
            </div>
            <h1 className="text-2xl font-black text-brand-text-primary">چنین سازمانی وجود ندارد</h1>
            <p className="mt-4 leading-8 text-brand-text-secondary">
                لینک زیرمجموعه برای <span dir="auto" className="font-semibold text-rose-100">{readableBusinessHandler}</span> معتبر نیست.
            </p>
            <Link
                href={`/login?business_handler=${encodeURIComponent(DEFAULT_PARENT_BUSINESS_HANDLER)}`}
                className="mt-7 inline-flex h-11 items-center justify-center rounded-xl border border-silver-light/20 bg-silver-light/10 px-5 text-sm font-bold text-brand-text-primary transition hover:bg-silver-light/15"
            >
                ثبت‌نام زیرمجموعه Goldima
            </Link>
        </Card>
    );
}

function PendingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: currentUser, isFetching, refetch } = useCurrentUserQuery();
    const logoutMutation = useLogoutMutation();
    const hasAuthToken = useMemo(() => Boolean(getAccessToken()), []);

    const parentBusinessHandler = normalizeBusinessPathSegment(searchParams.get("parent_business_handler") || "");
    const userStatus = String(currentUser?.status ?? "PENDING").toUpperCase();
    const currentRole = getNormalizedUserRole(currentUser);
    const isLinkedToParent = parentBusinessHandler !== "" && parentBusinessHandler !== DEFAULT_PARENT_BUSINESS_HANDLER;
    const parentProfileQuery = useParentBusinessProfileQuery(parentBusinessHandler);

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

    useEffect(() => {
        if (!hasAuthToken) return;

        const intervalId = window.setInterval(() => {
            void refetch();
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [hasAuthToken, refetch]);

    useEffect(() => {
        if (!currentUser) return;

        if ((currentRole === "reference" && !currentUser.is_employee) || userStatus === "APPROVED") {
            router.replace("/");
            router.refresh();
        }
    }, [currentRole, currentUser, router, userStatus]);

    if (isLinkedToParent && parentProfileQuery.isError) {
        return <OrganizationNotFound businessHandler={parentBusinessHandler} />;
    }

    return (
        <Card className="group relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-silver-dark/20 bg-brand-surface/75 p-7 text-right shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-silver-light/25 hover:shadow-silver-glow sm:p-8">
            <ShineBorder className="opacity-35 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-silver-light/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-amber-300/8 blur-3xl" />
            <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-silver-light/70 to-transparent opacity-70" />

            <div className="relative mb-8">

                <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200 text-sm font-medium mb-5">
                    {userStatus === "REJECTED" ? "رد شده" : isFetching ? "در حال بررسی وضعیت..." : "در انتظار تایید مرجع"}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-wider">
                    <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                        {userStatus === "REJECTED" ? "درخواست شما رد شده است" : "ثبت‌نام با موفقیت انجام شد!"}
                    </span>
                </h1>

                <p className="text-brand-text-secondary text-justify leading-8">
                    {userStatus === "REJECTED"
                        ? "برای فعال‌سازی حساب، با مرجع یا پشتیبانی سیستم هماهنگ کنید."
                        : `
                            پس از بررسی و تأیید مشخصات ثبت‌شده توسط بخش پشتیبانی، حساب کاربری فعال خواهد شد. در صورت وجود هرگونه نقص یا مغایرت در مشخصات ارسالی، جهت تکمیل مشخصات با شما تماس گرفته خواهد ‌شد.
لطفاً در نظر داشته باشید که فرآیند بررسی و تأیید اطلاعات در روزهای کاری، حداکثر تا ۲۴ ساعت زمان‌بر می‌باشد.
همچنین با هرگونه تغییر در وضعیت حساب کاربری، این صفحه به‌صورت خودکار به‌روزرسانی خواهد شد.
در صورت نیاز به پشتیبانی، می‌توانید از طریق شماره ۰۹۱۲۱۱۱۲۲۳۳ با واحد پشتیبانی در ارتباط باشید.
                        `}
                </p>
            </div>

            {/* <div className="space-y-4 rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-5">
                <div>
                    <p className="text-xs text-brand-text-secondary mb-1">لینک اختصاصی شما</p>
                    <div dir="ltr" className="break-all text-silver-light font-semibold leading-7">
                        {businessUrl}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-brand-text-secondary mb-1">نام شرکت</p>
                    <div className="text-brand-text-primary font-medium">
                        {businessName || "—"}
                    </div>
                </div>

                <div className="text-sm text-brand-text-secondary leading-7">
                    وضعیت فعلی حساب شما: <span className="text-brand-text-primary font-semibold">{userStatus}</span>
                    <br />
                    {hasAuthToken ? "این صفحه هر چند ثانیه وضعیت حساب را دوباره از سرور بررسی می‌کند." : "برای بررسی خودکار وضعیت، ابتدا وارد حساب شوید."}
                </div>
            </div> */}

            <div className="mt-8 border-t border-silver-dark/15 pt-6">
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    aria-label="خروج از حساب کاربری"
                    className="group/logout relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-rose-300/20 bg-rose-400/10 px-6 py-6 text-sm font-bold text-transparent shadow-lg shadow-rose-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200/35 hover:bg-rose-400/15 hover:shadow-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="pointer-events-none absolute inset-y-0 right-0 w-24 translate-x-full bg-gradient-to-l from-white/20 to-transparent blur-xl transition-transform duration-700 group-hover/logout:-translate-x-[420%]" />
                    <span className="absolute inset-0 flex items-center justify-center text-rose-50">
                        {logoutMutation.isPending ? "در حال خروج..." : "خروج از حساب کاربری"}
                    </span>
                </button>
            </div>
        </Card>
    );
}

export default function PendingPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4">
            <AmbientBackground dense />
            <FloatingParticles />

            <div className="absolute top-0 left-1/4 w-96 h-96 bg-silver-light/5 rounded-full blur-3xl animate-pulse" />

            <div
                className="absolute bottom-0 right-1/4 w-96 h-96 bg-silver-metallic/5 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
            />

            <Suspense
                fallback={
                    <Card className="relative w-full max-w-lg p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 flex items-center justify-center h-96">
                        <div className="animate-pulse text-silver-light">در حال بارگذاری...</div>
                    </Card>
                }
            >
                <PendingContent />
            </Suspense>
        </div>
    );
}
