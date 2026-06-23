"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Store, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { useParentBusinessProfileQuery } from "@/hooks/api";
import { DEFAULT_PARENT_BUSINESS_HANDLER, getReadableBusinessHandler, normalizeBusinessPathSegment } from "@/lib/business-path";
import { resolveMediaUrl } from "@/lib/media-url";
import LOGO from "@/../public/assets/images/logo.png";

const FloatingParticles = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-2 w-2 rounded-full bg-silver-light/30 animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute right-20 top-40 h-3 w-3 rounded-full bg-silver-metallic/20 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-32 left-1/4 h-2 w-2 rounded-full bg-silver-light/40 animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute right-1/3 top-1/3 h-1 w-1 rounded-full bg-silver-dark/30 animate-float" style={{ animationDelay: "1s" }} />
    </div>
);

function BusinessLogo({ logoUrl, name }: { logoUrl?: string; name: string }) {
    return (
        <div className="mb-5 flex justify-center">
            {logoUrl ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-silver-light/20 bg-brand-base/60 shadow-silver-glow">
                    <img src={logoUrl} alt={name} className="h-full w-full object-contain p-4" />
                </div>
            ) : (
                <div className="relative h-24 w-36">
                    <Image src={LOGO} alt="Goldima" fill className="object-contain drop-shadow-2xl" priority />
                </div>
            )}
        </div>
    );
}

function LoadingCard() {
    return (
        <Card className="relative w-full max-w-md rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
            <ShineBorder className="opacity-60" />
            <div className="mx-auto h-24 w-24 animate-pulse rounded-3xl bg-white/10" />
            <div className="mx-auto mt-6 h-7 w-52 animate-pulse rounded bg-white/10" />
            <div className="mx-auto mt-4 h-4 w-64 animate-pulse rounded bg-white/10" />
        </Card>
    );
}

function OrganizationNotFound({ businessHandler }: { businessHandler: string }) {
    return (
        <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-300/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl">
            <ShineBorder className="opacity-70" />
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-2xl font-black text-rose-100">
                !
            </div>
            <h1 className="text-2xl font-black text-brand-text-primary">چنین سازمانی وجود ندارد</h1>
            <p className="mt-4 leading-8 text-brand-text-secondary">
                لینک معرف برای <span dir="auto" className="font-semibold text-rose-100">{getReadableBusinessHandler(businessHandler)}</span> معتبر نیست.
            </p>
        </Card>
    );
}

export default function BusinessRegistrationLandingPage() {
    const router = useRouter();
    const params = useParams<{ business_name: string }>();
    const businessHandler = useMemo(() => normalizeBusinessPathSegment(params.business_name), [params.business_name]);
    const businessProfileQuery = useParentBusinessProfileQuery(businessHandler);
    const isDefaultGoldima = businessHandler === DEFAULT_PARENT_BUSINESS_HANDLER;
    const businessName = businessProfileQuery.data?.business_name || (isDefaultGoldima ? "Goldima" : getReadableBusinessHandler(businessHandler));
    const logoUrl = useMemo(
        () => resolveMediaUrl(businessProfileQuery.data?.business_logo),
        [businessProfileQuery.data?.business_logo]
    );

    const handleStartRegister = () => {
        router.push(`/login?business_handler=${encodeURIComponent(businessHandler || DEFAULT_PARENT_BUSINESS_HANDLER)}`);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <FloatingParticles />
            <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-silver-light/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

            {!businessHandler || businessProfileQuery.isLoading ? (
                <LoadingCard />
            ) : businessProfileQuery.isError ? (
                <OrganizationNotFound businessHandler={businessHandler} />
            ) : (
                <Card className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-silver-glow">
                    <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                    <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                    <BusinessLogo logoUrl={logoUrl} name={businessName} />

                    <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-xs font-semibold text-silver-light">
                        <Store className="h-4 w-4" />
                        لینک معرف فروشگاه
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-brand-text-primary">{businessName}</h1>
                    <p className="mx-auto mt-4 max-w-sm text-sm leading-8 text-brand-text-secondary">
                        آیا می‌خواهید تحت عنوان زیرمجموعه این فروشگاه ثبت‌نام کنید؟
                    </p>

                    <Button type="button" onClick={handleStartRegister} className="mt-8 w-full cursor-pointer gap-2 text-white">
                        <UserPlus className="h-4 w-4" />
                        ثبت‌نام زیرمجموعه
                    </Button>
                </Card>
            )}
        </div>
    );
}
