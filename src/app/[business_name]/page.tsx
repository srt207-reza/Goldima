"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { normalizeBusinessPathSegment } from "@/lib/business-path";

export default function BusinessRegistrationLandingPage() {
    const router = useRouter();
    const params = useParams<{ business_name: string }>();
    const businessHandler = useMemo(() => normalizeBusinessPathSegment(params.business_name), [params.business_name]);

    useEffect(() => {
        if (!businessHandler) return;
        router.replace(`/register?business_handler=${encodeURIComponent(businessHandler)}`);
    }, [businessHandler, router]);

    return (
        <div className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-base px-4">
            <AmbientBackground dense />
            <Card className="group relative w-full max-w-sm overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
                <ShineBorder className="opacity-80" />
                <h1 className="text-3xl font-bold tracking-wider">
                    <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">GOLDIMA</span>
                </h1>
            </Card>
        </div>
    );
}
