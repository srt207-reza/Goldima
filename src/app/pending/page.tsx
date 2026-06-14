"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { buildBusinessUrl, normalizeBusinessPathSegment } from "@/lib/business-path";

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
    const searchParams = useSearchParams();

    const businessHandler = searchParams.get("business_handler") ?? "";
    const businessName = searchParams.get("business_name") ?? "";

    const normalizedBusinessHandler = useMemo(
        () => normalizeBusinessPathSegment(businessHandler),
        [businessHandler]
    );

    const businessPath = normalizedBusinessHandler || businessHandler;
    const businessUrl = businessPath ? buildBusinessUrl(businessPath) : "—";
    const internalBusinessHref = businessPath ? `/${businessPath}` : "/";

    return (
        <Card className="relative w-full max-w-lg p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl hover:shadow-silver-glow transition-all duration-500 hover:-translate-y-2 group text-right">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="mb-8">
                <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200 text-sm font-medium mb-5">
                    در انتظار تایید مرجع
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-wider">
                    <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                        ثبت‌نام با موفقیت انجام شد
                    </span>
                </h1>

                <p className="text-brand-text-secondary leading-8">
                    اطلاعات شما برای بررسی ارسال شد. پس از تایید مرجع، دسترسی داشبورد و لینک اختصاصی فعال می‌شود.
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
                    تا زمانی که ادمین وضعیت شما را از{" "}
                    <span className="text-brand-text-primary font-semibold">PENDING</span>{" "}
                    به{" "}
                    <span className="text-brand-text-primary font-semibold">APPROVED</span>{" "}
                    تغییر ندهد، داشبورد فعال نمی‌شود.
                </div>
            </div>

            <div className="mt-8">
                <Link
                    href={internalBusinessHref}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-silver-dark/30 px-6 py-3 font-medium text-brand-text-primary transition-all duration-200 hover:bg-brand-hover/50"
                >
                    مشاهده لینک اختصاصی
                </Link>
            </div>
        </Card>
    );
}

export default function PendingPage() {
    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card overflow-hidden px-4">
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