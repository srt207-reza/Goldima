"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useCurrentUserQuery } from "@/hooks/api";
import { buildBusinessUrl, normalizeBusinessPathSegment } from "@/lib/business-path";

function LoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card flex items-center justify-center px-4">
            <Card className="w-full max-w-lg p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl text-right">
                <div className="h-6 w-32 animate-pulse rounded bg-silver-dark/20 mb-4" />
                <div className="h-4 w-full animate-pulse rounded bg-silver-dark/20 mb-2" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-silver-dark/20" />
            </Card>
        </div>
    );
}

function PendingState({ businessName }: { businessName: string }) {
    const businessUrl = buildBusinessUrl(businessName);

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card flex items-center justify-center px-4 py-10">
            <Card className="relative w-full max-w-xl p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl text-right">
                <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200 text-sm font-medium mb-5">
                    حساب هنوز تایید نشده است
                </div>
                <h1 className="text-3xl font-bold mb-3 text-brand-text-primary">دسترسی به داشبورد هنوز فعال نیست</h1>
                <p className="text-brand-text-secondary leading-8 mb-6">
                    این لینک اختصاصی بعد از تایید مرجع فعال می‌شود. تا آن زمان، وضعیت شما باید از PENDING به APPROVED تغییر کند.
                </p>
                <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-5 space-y-3">
                    <div>
                        <p className="text-xs text-brand-text-secondary mb-1">لینک اختصاصی</p>
                        <div className="break-all text-silver-light font-semibold">{businessUrl}</div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link href="/pending" className="inline-flex items-center justify-center rounded-lg border border-silver-dark/30 px-6 py-3 font-medium text-brand-text-primary transition-all duration-200 hover:bg-brand-hover/50">
                        صفحه pending
                    </Link>
                    <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 font-medium text-brand-base transition-all duration-200 hover:bg-gold-light shadow-gold-glow hover:shadow-gold-glow-strong">
                        ورود به حساب
                    </Link>
                </div>
            </Card>
        </div>
    );
}

function ApprovedDashboard({ businessName, user }: { businessName: string; user: Record<string, unknown> }) {
    const internalBusinessHref = `/${businessName}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card px-4 py-10">
            <div className="mx-auto w-full max-w-5xl">
                <Card className="relative p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl text-right">
                    <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-emerald-200 text-sm font-medium mb-5">
                        حساب فعال است
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                        <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent">
                            داشبورد {businessName}
                        </span>
                    </h1>
                    <p className="text-brand-text-secondary leading-8 mb-8">
                        اطلاعات حساب شما بعد از تایید مرجع نمایش داده می‌شود.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(user)
                            .filter(([key, value]) => Boolean(value) && ["username", "first_name", "last_name", "email", "birth_date", "business_name", "address", "telephone", "status"].includes(key))
                            .map(([key, value]) => (
                                <div key={key} className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                                    <p className="text-xs text-brand-text-secondary mb-1">{key}</p>
                                    <p className="text-brand-text-primary font-medium break-words">{String(value)}</p>
                                </div>
                            ))}
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link href={internalBusinessHref} className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 font-medium text-brand-base transition-all duration-200 hover:bg-gold-light shadow-gold-glow hover:shadow-gold-glow-strong">
                            رفتن به لینک اختصاصی
                        </Link>
                        <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-silver-dark/30 px-6 py-3 font-medium text-brand-text-primary transition-all duration-200 hover:bg-brand-hover/50">
                            صفحه اصلی
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default function BusinessLandingPage() {
    const params = useParams<{ business_name: string }>();
    const router = useRouter();
    const { data: currentUser, isLoading, isError } = useCurrentUserQuery();

    const routeBusinessName = useMemo(() => normalizeBusinessPathSegment(params.business_name), [params.business_name]);
    const userBusinessName = useMemo(() => normalizeBusinessPathSegment(currentUser?.business_name), [currentUser?.business_name]);

    useEffect(() => {
        if (!isLoading && currentUser?.status === "APPROVED" && userBusinessName && routeBusinessName && userBusinessName !== routeBusinessName) {
            router.replace(`/${userBusinessName}`);
        }
    }, [currentUser?.status, isLoading, routeBusinessName, router, userBusinessName]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (isError || !currentUser) {
        return <PendingState businessName={routeBusinessName} />;
    }

    if (currentUser.status !== "APPROVED") {
        return <PendingState businessName={routeBusinessName || userBusinessName || currentUser.business_name || ""} />;
    }

    if (!routeBusinessName || routeBusinessName !== userBusinessName) {
        return <LoadingState />;
    }

    return <ApprovedDashboard businessName={routeBusinessName} user={currentUser} />;
}
