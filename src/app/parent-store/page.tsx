"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Mail, MapPin, Phone, ShieldCheck, Store, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrentUserQuery, useUserQuery } from "@/hooks/api";
import { getBusinessLabel, getDisplayName, getNormalizedUserRole } from "@/lib/user-role";
import { getStoreRoleLabel } from "@/constants/user-taxonomy";
import { resolveMediaUrl } from "@/lib/media-url";

function ParentStoreLoading() {
    return (
        <div className="px-4 py-8">
            <Card className="mx-auto max-w-5xl border border-silver-dark/20 bg-brand-surface/80 p-6 text-right shadow-deep-card backdrop-blur-xl">
                <div className="h-7 w-56 animate-pulse rounded bg-white/10" />
                <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <div className="h-52 animate-pulse rounded-2xl bg-white/10" />
                    <div className="h-52 animate-pulse rounded-2xl bg-white/10" />
                </div>
            </Card>
        </div>
    );
}

export default function ParentStorePage() {
    const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUserQuery();
    const parentId = currentUser?.parent || "";
    const parentQuery = useUserQuery(parentId || undefined);

    if (isCurrentUserLoading || parentQuery.isLoading) {
        return <ParentStoreLoading />;
    }

    if (!currentUser?.parent) {
        return (
            <div className="px-4 py-10">
                <Card className="mx-auto max-w-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right shadow-deep-card backdrop-blur-xl">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm font-bold text-silver-light">
                        <Building2 className="h-4 w-4" />
                        ارتباط با فروشگاه والد
                    </div>
                    <h1 className="mt-5 text-2xl font-black text-brand-text-primary">فروشگاه والد برای حساب شما ثبت نشده است</h1>
                    <p className="mt-3 leading-8 text-brand-text-secondary">این بخش فقط برای حساب‌هایی نمایش داده می‌شود که زیرمجموعه فروشگاه دیگری هستند.</p>
                </Card>
            </div>
        );
    }

    if (parentQuery.isError || !parentQuery.data) {
        return (
            <div className="px-4 py-10">
                <Card className="mx-auto max-w-3xl border border-rose-300/20 bg-rose-400/10 p-8 text-right text-rose-100 shadow-deep-card backdrop-blur-xl">
                    دریافت اطلاعات فروشگاه والد با خطا مواجه شد.
                </Card>
            </div>
        );
    }

    const parent = parentQuery.data;
    const role = getNormalizedUserRole(parent);
    const logoUrl = resolveMediaUrl(parent.business_logo);
    const contactPhone = parent.telephone || parent.username || "";
    const parentName = getBusinessLabel(parent);
    const personName = getDisplayName(parent);

    return (
        <main className="px-4 py-8">
            <div className="mx-auto max-w-5xl space-y-5">
                <div className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 p-6 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-xl border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm font-bold text-silver-light">
                                <Building2 className="h-4 w-4" />
                                ارتباط با فروشگاه والد
                            </div>
                            <h1 className="mt-4 text-2xl font-black text-brand-text-primary sm:text-3xl">{parentName}</h1>
                            <p className="mt-2 text-sm leading-7 text-brand-text-secondary">اطلاعات تماس و مشخصات فروشگاهی که حساب شما زیرمجموعه آن است.</p>
                        </div>

                        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-silver-dark/20 bg-brand-base/50 text-silver-light">
                            {logoUrl ? (
                                <span
                                    role="img"
                                    aria-label={parentName}
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url("${logoUrl.replace(/"/g, "%22")}")` }}
                                />
                            ) : (
                                <Store className="h-8 w-8" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                    <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                        <h2 className="text-lg font-bold text-brand-text-primary">مشخصات فروشگاه</h2>
                        <div className="mt-5 space-y-3">
                            <div className="rounded-2xl border border-white/10 bg-brand-base/40 p-4">
                                <p className="text-xs text-brand-text-secondary">نقش فروشگاه</p>
                                <p className="mt-2 inline-flex items-center gap-2 font-bold text-brand-text-primary">
                                    <ShieldCheck className="h-4 w-4 text-silver-light" />
                                    {getStoreRoleLabel(role)}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-brand-base/40 p-4">
                                <p className="text-xs text-brand-text-secondary">مسئول حساب</p>
                                <p className="mt-2 inline-flex items-center gap-2 font-bold text-brand-text-primary">
                                    <UserRound className="h-4 w-4 text-silver-light" />
                                    {personName}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                        <h2 className="text-lg font-bold text-brand-text-primary">راه‌های ارتباطی</h2>
                        <div className="mt-5 grid gap-3">
                            <div className="rounded-2xl border border-white/10 bg-brand-base/40 p-4">
                                <p className="text-xs text-brand-text-secondary">شماره تماس</p>
                                {contactPhone ? (
                                    <a href={`tel:${contactPhone}`} dir="ltr" className="mt-2 inline-flex items-center gap-2 font-bold text-silver-light">
                                        <Phone className="h-4 w-4" />
                                        {contactPhone}
                                    </a>
                                ) : (
                                    <p className="mt-2 text-brand-text-secondary">ثبت نشده است</p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-brand-base/40 p-4">
                                <p className="text-xs text-brand-text-secondary">ایمیل</p>
                                {parent.email ? (
                                    <a href={`mailto:${parent.email}`} dir="ltr" className="mt-2 inline-flex items-center gap-2 font-bold text-silver-light">
                                        <Mail className="h-4 w-4" />
                                        {parent.email}
                                    </a>
                                ) : (
                                    <p className="mt-2 text-brand-text-secondary">ثبت نشده است</p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-brand-base/40 p-4">
                                <p className="text-xs text-brand-text-secondary">آدرس</p>
                                <p className="mt-2 flex items-start gap-2 leading-8 text-brand-text-primary">
                                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-silver-light" />
                                    {parent.address || "ثبت نشده است"}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-silver-dark/20 bg-white/5 px-4 py-3 text-sm font-bold text-brand-text-primary transition hover:bg-white/10">
                    بازگشت به داشبورد
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </div>
        </main>
    );
}
