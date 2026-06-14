"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { buildBusinessUrl, normalizeBusinessPathSegment } from "@/lib/business-path";

/**
 * Public business-handler page.
 *
 * This route is only used as an invitation/registration entry point for a
 * downstream user. It must never render the dashboard. Dashboard access is
 * handled exclusively through the protected root route after login and after
 * the user is approved.
 */
export default function BusinessRegistrationLandingPage() {
    const params = useParams<{ business_name: string }>();
    const businessHandler = useMemo(() => normalizeBusinessPathSegment(params.business_name), [params.business_name]);
    const businessUrl = buildBusinessUrl(businessHandler);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-10">
            <AmbientBackground dense />
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-silver-light/5 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl" />

            <Card className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right shadow-2xl backdrop-blur-xl group">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="mb-6 inline-flex rounded-full border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                    ثبت‌نام زیرمجموعه
                </div>
                <h1 className="text-3xl font-bold text-brand-text-primary">ورود به زنجیره فروش</h1>
                <p className="mt-4 leading-8 text-brand-text-secondary">
                    این لینک برای ثبت‌نام زیرمجموعه ساخته شده است. بعد از ثبت‌نام، حساب شما تا تایید مدیر در وضعیت انتظار می‌ماند و هیچ دسترسی به داشبورد نخواهید داشت.
                </p>

                <div className="mt-6 rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                    <p className="text-xs text-brand-text-secondary">لینک معرف</p>
                    <p className="mt-2 break-all font-semibold text-silver-light">{businessUrl}</p>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href={`/register?business_handler=${encodeURIComponent(businessHandler)}`}
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-silver-light/25 bg-silver-light/15 px-6 py-3 font-semibold text-white shadow-silver-glow transition-all hover:bg-silver-light/25"
                    >
                        ثبت‌نام از طریق این لینک
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-silver-dark/20 px-6 py-3 font-medium text-brand-text-primary transition-all hover:bg-white/5"
                    >
                        ورود به حساب
                    </Link>
                </div>
            </Card>
        </div>
    );
}
