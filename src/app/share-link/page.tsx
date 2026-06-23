"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Copy, ExternalLink, Link2, Share2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagicCard } from "@/components/ui/magic-card";
import { useCurrentUserQuery } from "@/hooks/api";
import { normalizeBusinessPathSegment } from "@/lib/business-path";
import { getBusinessLabel } from "@/lib/user-role";

function LoadingState() {
    return (
        <div className="px-4 py-8">
            <Card className="mx-auto max-w-5xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-7 w-52 animate-pulse rounded bg-white/10" />
                <div className="mt-6 h-40 animate-pulse rounded-3xl bg-white/10" />
            </Card>
        </div>
    );
}

export default function ShareLinkPage() {
    const { data: currentUser, isLoading } = useCurrentUserQuery();
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            setOrigin(window.location.origin.replace(/\/$/, ""));
        });

        return () => cancelAnimationFrame(frameId);
    }, []);

    const businessHandler = useMemo(
        () => normalizeBusinessPathSegment(currentUser?.business_handler ?? ""),
        [currentUser?.business_handler]
    );

    const businessName = getBusinessLabel(currentUser);
    const shareUrl = businessHandler ? `${origin || ""}/${businessHandler}` : "";
    const canShare = Boolean(shareUrl);

    const handleCopy = async (value: string, successMessage: string) => {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            toast.success(successMessage);
        } catch {
            toast.error("کپی لینک با خطا مواجه شد");
        }
    };

    const handleNativeShare = async () => {
        if (!canShare) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `لینک اشتراک‌گذاری ${businessName}`,
                    text: "از طریق این لینک می‌توانید زیرمجموعه این کسب‌وکار ثبت‌نام کنید.",
                    url: shareUrl,
                });
                return;
            }

            await handleCopy(shareUrl, "لینک اشتراک‌گذاری کپی شد");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            toast.error("اشتراک‌گذاری لینک با خطا مواجه شد");
        }
    };

    if (isLoading || !currentUser) {
        return <LoadingState />;
    }

    return (
        <div className="px-4 py-8">
            <div className="mx-auto w-full max-w-6xl space-y-6 text-right">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
                >
                    <div className="inline-flex items-center gap-2 rounded-lg border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                        <Sparkles className="h-4 w-4" />
                        اشتراک‌گذاری لینک اختصاصی
                    </div>

                    <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">لینک معرف {businessName}</h1>
                    <p className="mt-3 max-w-3xl leading-8 text-brand-text-secondary">
                        این لینک بر اساس business_handler کسب‌وکار ساخته می‌شود. هر کاربری از این لینک وارد شود، در مسیر ثبت‌نام زیرمجموعه همین کسب‌وکار قرار می‌گیرد.
                    </p>
                </motion.section>

                {!canShare ? (
                    <Card className="border border-amber-400/25 bg-amber-400/10 p-5 text-right text-amber-100 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-bold">برای ساخت لینک اشتراک‌گذاری، business_handler ثبت نشده است.</p>
                                <p className="mt-2 leading-7 text-amber-100/80">
                                    ابتدا از صفحه پروفایل مقدار لینک اختصاصی را وارد و ذخیره کنید، سپس لینک اشتراک‌گذاری فعال می‌شود.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.08 }}
                        className="grid gap-5 xl:grid-cols-[1fr_0.85fr]"
                    >
                        <MagicCard className="rounded-3xl bg-brand-surface/80 p-5" withBorderBeam>
                            <div className="mb-5 flex items-center gap-2">
                                <Link2 className="h-5 w-5 text-silver-light" />
                                <h2 className="text-lg font-bold text-brand-text-primary">لینک عمومی کسب‌وکار</h2>
                            </div>

                            <div className="space-y-3">
                                <Input value={shareUrl} readOnly dir="ltr" className="text-left" />
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button type="button" onClick={() => handleCopy(shareUrl, "لینک اشتراک‌گذاری کپی شد")} className="gap-2">
                                        <Copy className="h-4 w-4" />
                                        کپی لینک
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={handleNativeShare} className="gap-2">
                                        <Share2 className="h-4 w-4" />
                                        اشتراک‌گذاری
                                    </Button>
                                    <Link
                                        href={`/${businessHandler}`}
                                        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-silver-dark/20 bg-white/[0.03] px-6 py-2 font-semibold text-brand-text-primary transition-all hover:border-silver-light/25 hover:bg-white/[0.07]"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        مشاهده لینک
                                    </Link>
                                </div>
                            </div>
                        </MagicCard>

                        {/* <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                            <div className="mb-5 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-silver-light" />
                                <h2 className="text-lg font-bold text-brand-text-primary">لینک مستقیم ثبت‌نام</h2>
                            </div>

                            <p className="leading-8 text-brand-text-secondary">
                                این لینک کاربر را مستقیماً به فرم ثبت‌نام با business_handler شما می‌برد.
                            </p>
                            <div className="mt-4 space-y-3">
                                <Input value={registerUrl} readOnly dir="ltr" className="text-left" />
                                <Button type="button" variant="ghost" onClick={() => handleCopy(registerUrl, "لینک مستقیم ثبت‌نام کپی شد")} className="gap-2">
                                    <Copy className="h-4 w-4" />
                                    کپی لینک ثبت‌نام
                                </Button>
                            </div>
                        </Card> */}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
