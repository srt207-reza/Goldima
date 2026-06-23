"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { useCurrentUserQuery, useParentBusinessProfileQuery } from "@/hooks/api";
import { getAccessToken } from "@/lib/auth-storage";
import { buildBusinessUrl, DEFAULT_PARENT_BUSINESS_HANDLER, getReadableBusinessHandler, normalizeBusinessPathSegment } from "@/lib/business-path";
import { resolveMediaUrl } from "@/lib/media-url";
import { getNormalizedUserRole } from "@/lib/user-role";
import LOGO from "@/../public/assets/images/logo.png";

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

function SponsorIdentity({
    name,
    logoUrl,
    isLoading,
}: {
    name: string;
    logoUrl?: string;
    isLoading?: boolean;
}) {
    return (
        <div className="mb-7 flex items-center gap-4 rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
            {logoUrl ? (
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-silver-light/20 bg-brand-base/60">
                    <img src={logoUrl} alt={name} className="h-full w-full object-contain p-2" />
                </div>
            ) : (
                <div className="relative h-14 w-20 shrink-0">
                    <Image src={LOGO} alt="Goldima" fill className="object-contain" priority />
                </div>
            )}
            <div className="min-w-0 text-right">
                <p className="text-xs text-brand-text-secondary">مرجع ثبت‌نام</p>
                <p className="truncate text-lg font-bold text-brand-text-primary">{isLoading ? "در حال دریافت..." : name}</p>
            </div>
        </div>
    );
}

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
    const hasAuthToken = useMemo(() => Boolean(getAccessToken()), []);

    const businessHandler = searchParams.get("business_handler") ?? currentUser?.business_handler ?? "";
    const businessName = searchParams.get("business_name") ?? currentUser?.business_name ?? "";
    const parentBusinessHandler = normalizeBusinessPathSegment(searchParams.get("parent_business_handler") || "");
    const userStatus = String(currentUser?.status ?? "PENDING").toUpperCase();
    const currentRole = getNormalizedUserRole(currentUser);
    const isLinkedToParent = parentBusinessHandler !== "" && parentBusinessHandler !== DEFAULT_PARENT_BUSINESS_HANDLER;
    const parentProfileQuery = useParentBusinessProfileQuery(parentBusinessHandler);
    const sponsorName = parentProfileQuery.data?.business_name || (isLinkedToParent ? getReadableBusinessHandler(parentBusinessHandler) : "Goldima");
    const sponsorLogoUrl = useMemo(
        () => resolveMediaUrl(parentProfileQuery.data?.business_logo),
        [parentProfileQuery.data?.business_logo]
    );

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

    if (isLinkedToParent && parentProfileQuery.isError) {
        return <OrganizationNotFound businessHandler={parentBusinessHandler} />;
    }

    return (
        <Card className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-silver-glow group">
            <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="mb-8">
                <SponsorIdentity
                    name={sponsorName}
                    logoUrl={sponsorLogoUrl}
                    isLoading={isLinkedToParent && parentProfileQuery.isFetching}
                />

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
