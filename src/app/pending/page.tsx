"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { useCurrentUserQuery } from "@/hooks/api";
import { getAccessToken } from "@/lib/auth-storage";
import { buildBusinessUrl, normalizeBusinessPathSegment } from "@/lib/business-path";
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

function PendingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: currentUser, isFetching, refetch } = useCurrentUserQuery();
    const hasAuthToken = useMemo(() => Boolean(getAccessToken()), []);

    const businessHandler = searchParams.get("business_handler") ?? currentUser?.business_handler ?? "";
    const businessName = searchParams.get("business_name") ?? currentUser?.business_name ?? "";
    const userStatus = String(currentUser?.status ?? "PENDING").toUpperCase();
    const currentRole = getNormalizedUserRole(currentUser);

    const normalizedBusinessHandler = useMemo(
        () => normalizeBusinessPathSegment(businessHandler),
        [businessHandler]
    );

    const businessPath = normalizedBusinessHandler || businessHandler;
    const businessUrl = businessPath ? buildBusinessUrl(businessPath) : "—";
    const internalBusinessHref = businessPath ? `/${businessPath}` : "/";

    useEffect(() => {
        if (!hasAuthToken) return;

        const intervalId = window.setInterval(() => {
            void refetch();
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [hasAuthToken, refetch]);

    useEffect(() => {
        if (!currentUser) return;

        if (currentRole === "reference" || currentUser.status === "APPROVED") {
            router.replace("/");
            router.refresh();
        }
    }, [currentRole, currentUser, router]);

    return (
        <Card className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-silver-glow group">
            <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="mb-8">
                <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200 text-sm font-medium mb-5">
                    {userStatus === "REJECTED" ? "رد شده" : isFetching ? "در حال بررسی وضعیت..." : "در انتظار تایید مرجع"}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-wider">
                    <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                        {userStatus === "REJECTED" ? "درخواست شما رد شده است" : "ثبت‌نام با موفقیت انجام شد"}
                    </span>
                </h1>

                <p className="text-brand-text-secondary leading-8">
                    {userStatus === "REJECTED"
                        ? "برای فعال‌سازی حساب، با مرجع یا پشتیبانی سیستم هماهنگ کنید."
                        : "اطلاعات شما برای بررسی ارسال شد. پس از تایید مرجع، دسترسی داشبورد و لینک اختصاصی فعال می‌شود."}
                </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-5">
                <div>
                    <p className="text-xs text-brand-text-secondary mb-1">لینک اختصاصی شما</p>
                    <div className="break-all text-silver-light font-semibold leading-7">
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
            </div>

            <div className="mt-8 grid gap-3">
                <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={!hasAuthToken}
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-silver-dark/30 bg-white/[0.03] px-6 py-3 font-medium text-brand-text-primary transition-all duration-200 hover:border-silver-light/25 hover:bg-brand-hover/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    بررسی دوباره وضعیت
                </button>

                <Link
                    href={internalBusinessHref}
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-silver-dark/30 bg-white/[0.03] px-6 py-3 font-medium text-brand-text-primary transition-all duration-200 hover:border-silver-light/25 hover:bg-brand-hover/50"
                >
                    مشاهده لینک اختصاصی
                </Link>
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
