"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useCurrentUserQuery } from "@/hooks/api";
import { canViewReferenceTools } from "@/lib/user-role";

function LoadingState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto w-full max-w-4xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/10" />
            </Card>
        </div>
    );
}

function DeniedState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto w-full max-w-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
                    دسترسی محدود
                </div>
                <h1 className="mt-5 text-3xl font-bold text-brand-text-primary">فقط نقش مرجع می‌تواند این بخش را ببیند</h1>
                <p className="mt-4 leading-8 text-brand-text-secondary">
                    برای مشاهده لیست فروشگاه‌ها، باید با نقش مرجع وارد شوید. در حالت عمومی فقط داشبورد اصلی قابل مشاهده است.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-medium text-brand-base transition-all hover:bg-gold-light">
                        ورود به حساب
                    </Link>
                    <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-silver-dark/20 px-6 py-3 font-medium text-brand-text-primary transition-all hover:bg-white/5">
                        بازگشت به داشبورد
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default function StoresPage() {
    const { data: currentUser, isLoading } = useCurrentUserQuery();

    if (isLoading) {
        return <LoadingState />;
    }

    if (!canViewReferenceTools(currentUser)) {
        return <DeniedState />;
    }

    return (
        <div className="px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <div className="rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                    <div className="inline-flex rounded-full border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                        بخش مرجع
                    </div>
                    <h1 className="mt-5 text-3xl font-bold text-brand-text-primary">لیست فروشگاه‌ها</h1>
                    <p className="mt-4 max-w-3xl leading-8 text-brand-text-secondary">
                        این صفحه برای مدیریت و مشاهده فروشگاه‌های وابسته به مرجع در نظر گرفته شده است. داده‌ها در ادامه می‌تواند از API واقعی لود شود.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[
                        { title: "فروشگاه نقره آریا", status: "فعال", city: "تهران" },
                        { title: "فروشگاه نقره مهر", status: "در انتظار", city: "اصفهان" },
                        { title: "فروشگاه نقره پارسیان", status: "فعال", city: "شیراز" },
                    ].map((store) => (
                        <Card key={store.title} className="border border-silver-dark/20 bg-brand-surface/70 p-5 text-right backdrop-blur-xl">
                            <p className="text-lg font-semibold text-brand-text-primary">{store.title}</p>
                            <p className="mt-2 text-sm text-brand-text-secondary">شهر: {store.city}</p>
                            <p className="mt-1 text-sm text-brand-text-secondary">وضعیت: {store.status}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
