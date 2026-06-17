"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    BadgeDollarSign,
    BarChart3,
    ChevronDown,
    ChevronUp,
    Clock3,
    Gem,
    Layers3,
    Radio,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import { useCurrentUserQuery, useProductsQuery } from "@/hooks/api";
import { getBusinessLabel, getNormalizedUserRole } from "@/lib/user-role";
import type { PriceTreeLevel, ProductPriceTreeDetail } from "@/types/api/product";
import LOGO from "@/../public/assets/images/logo.png";
import BULLION_IMAGE from "@/../public/assets/images/products/img1.webp";

type BoardProduct = ProductPriceTreeDetail & {
    basePrice: number;
    parentPrice: number;
    finalPrice: number;
    changeAmount: number;
    changeRate: number;
    currentLevel?: PriceTreeLevel;
};

const REFRESH_INTERVAL_MS = 8_000;
const MAX_VISIBLE_PRODUCTS = 14;

function useNow() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    return now;
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
    return new Intl.NumberFormat("fa-IR", { maximumFractionDigits }).format(Number.isFinite(value) ? value : 0);
}

function formatPrice(value: number): string {
    return new Intl.NumberFormat("fa-IR", {
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatSignedPrice(value: number): string {
    const sign = value > 0 ? "+" : "";
    return `${sign}${formatPrice(value)}`;
}

function formatTime(date: Date): string {
    return new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("fa-IR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    }).format(date);
}

function formatUpdatedAt(timestamp: number, fallback: Date): string {
    return formatTime(timestamp ? new Date(timestamp) : fallback);
}

function getLevels(product: ProductPriceTreeDetail): PriceTreeLevel[] {
    return Array.isArray(product.levels) ? product.levels : [];
}

function getFiniteNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getBasePrice(product: ProductPriceTreeDetail): number {
    const levels = getLevels(product);
    const masterLevel = levels.find((level) => level.role?.toUpperCase() === "MASTER");
    const firstLevel = levels[0];
    return getFiniteNumber(masterLevel?.your_price, getFiniteNumber(firstLevel?.your_price, product.final_price));
}

function getParentPrice(product: ProductPriceTreeDetail, basePrice: number): number {
    const levels = getLevels(product);
    const lastLevel = levels[levels.length - 1];
    return getFiniteNumber(lastLevel?.parent_price, basePrice);
}

function getCurrentLevel(product: ProductPriceTreeDetail): PriceTreeLevel | undefined {
    const levels = getLevels(product);
    return levels[levels.length - 1];
}

function normalizeBoardProduct(product: ProductPriceTreeDetail): BoardProduct {
    const basePrice = getBasePrice(product);
    const parentPrice = getParentPrice(product, basePrice);
    const finalPrice = getFiniteNumber(product.final_price, parentPrice);
    const changeAmount = finalPrice - basePrice;
    const changeRate = basePrice > 0 ? (changeAmount / basePrice) * 100 : 0;

    return {
        ...product,
        levels: getLevels(product),
        basePrice,
        parentPrice,
        finalPrice,
        changeAmount,
        changeRate,
        currentLevel: getCurrentLevel(product),
    };
}

function getRuleLabel(product: BoardProduct): string {
    const level = product.currentLevel;
    if (level?.note === "override") return "دستی";
    if (level?.rule_type === "PERCENT") return "درصدی";
    if (level?.rule_type === "FIXED") return "ثابت";
    return "مرجع";
}

function getRoleLabel(role: ReturnType<typeof getNormalizedUserRole>): string {
    if (role === "reference") return "مرجع";
    if (role === "wholesale") return "عمده فروش";
    if (role === "retail") return "خرده فروش";
    return "کاربر";
}

function MetricTile({
    icon: Icon,
    label,
    value,
    tone = "silver",
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    tone?: "silver" | "gold" | "green" | "rose";
}) {
    const toneClass = {
        silver: "border-slate-200/15 bg-white/[0.045] text-slate-100",
        gold: "border-amber-300/25 bg-amber-300/10 text-amber-100",
        green: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
        rose: "border-rose-300/25 bg-rose-400/10 text-rose-100",
    }[tone];

    return (
        <div className={`goldima-panel-sweep rounded-lg border p-4 ${toneClass}`}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300">{label}</span>
                <Icon className="h-5 w-5 shrink-0" />
            </div>
            <div className="mt-3 min-h-8 text-2xl font-black leading-none text-white lg:text-3xl" dir="ltr">
                {value}
            </div>
        </div>
    );
}

function PriceDelta({ product }: { product: BoardProduct }) {
    const isUp = product.changeAmount >= 0;
    const Icon = isUp ? ChevronUp : ChevronDown;

    return (
        <div
            className={[
                "inline-flex h-11 min-w-24 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-black",
                isUp ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-rose-300/25 bg-rose-400/10 text-rose-200",
            ].join(" ")}
            dir="ltr"
        >
            <Icon className="h-4 w-4" />
            {formatNumber(Math.abs(product.changeRate), 1)}%
        </div>
    );
}

function ProductPriceRow({ product, index }: { product: BoardProduct; index: number }) {
    return (
        <div
            className="goldima-row-reveal grid min-h-20 grid-cols-[3rem_minmax(0,1.15fr)_minmax(7rem,0.75fr)_minmax(8rem,0.9fr)_6rem] items-center gap-3 border-b border-white/8 px-4 py-3 last:border-b-0 max-md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(7rem,0.8fr)]"
            style={{ animationDelay: `${index * 70}ms` }}
        >
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-sm font-black text-slate-200">
                {formatNumber(index + 1)}
            </div>

            <div className="min-w-0">
                <div className="truncate text-xl font-black text-white lg:text-2xl">{product.name}</div>
                <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Layers3 className="h-3.5 w-3.5 text-amber-200" />
                    <span>{getRuleLabel(product)}</span>
                </div>
            </div>

            <div className="text-left max-md:hidden">
                <div className="text-xs font-bold text-slate-400">قیمت مرجع</div>
                <div className="mt-1 text-lg font-bold text-slate-200" dir="ltr">
                    {formatPrice(product.basePrice)}
                </div>
            </div>

            <div className="text-left">
                <div className="text-xs font-bold text-amber-100">قیمت نهایی</div>
                <div className="mt-1 text-2xl font-black text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.25)]" dir="ltr">
                    {formatPrice(product.finalPrice)}
                </div>
            </div>

            <div className="justify-self-end max-md:hidden">
                <PriceDelta product={product} />
            </div>
        </div>
    );
}

function PriceTicker({ products }: { products: BoardProduct[] }) {
    if (!products.length) return null;

    const tickerProducts = [...products, ...products];

    return (
        <div className="overflow-hidden rounded-lg border border-amber-300/20 bg-black/40 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <div className="goldima-price-ticker flex w-max items-center gap-10 px-4">
                {tickerProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="flex items-center gap-3 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.65)]" />
                        <span className="text-sm font-bold text-slate-300">{product.name}</span>
                        <span className="font-mono text-xl font-black text-amber-100" dir="ltr">
                            {formatPrice(product.finalPrice)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">USD</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyBoard() {
    return (
        <div className="grid min-h-[48vh] place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-8 text-center">
            <div>
                <BadgeDollarSign className="mx-auto h-12 w-12 text-amber-200" />
                <h2 className="mt-5 text-2xl font-black text-white">محصول فعالی برای نمایش وجود ندارد</h2>
                <p className="mt-3 text-sm text-slate-400">محصولات قیمت گذاری شده در این تابلو نمایش داده می شوند.</p>
            </div>
        </div>
    );
}

export default function HomePage() {
    const now = useNow();
    const { data: currentUser } = useCurrentUserQuery();
    const {
        data: apiProducts = [],
        dataUpdatedAt,
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useProductsQuery({
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    const role = getNormalizedUserRole(currentUser);
    const roleLabel = getRoleLabel(role);
    const businessLabel = getBusinessLabel(currentUser);

    const products = useMemo(
        () =>
            apiProducts
                .filter((product) => product.is_active !== false)
                .map(normalizeBoardProduct)
                .sort((a, b) => b.finalPrice - a.finalPrice),
        [apiProducts],
    );

    const featuredProduct = products[0];
    const visibleProducts = products.slice(0, MAX_VISIBLE_PRODUCTS);
    const averageFinalPrice = products.length
        ? products.reduce((sum, product) => sum + product.finalPrice, 0) / products.length
        : 0;
    const totalPremium = products.reduce((sum, product) => sum + product.changeAmount, 0);
    const marketTone = totalPremium >= 0 ? "green" : "rose";

    return (
        <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#060708] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#060708_0%,#111827_46%,#17120a_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="goldima-live-scan pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-amber-200 via-white to-emerald-300" />

            <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col gap-4 p-3 sm:p-4 lg:p-5 2xl:p-6">
                <header className="goldima-panel-sweep grid gap-4 rounded-lg border border-white/10 bg-black/40 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[auto_1fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-amber-200/25 p-1.5 shadow-[0_0_35px_rgba(251,191,36,0.18)]">
                            <Image src={LOGO} alt="GOLDIMA" fill className="object-contain p-1" priority sizes="64px" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-black text-amber-200" dir="ltr">
                                GOLDIMA LIVE
                                <Radio className="h-4 w-4 animate-pulse text-emerald-300" />
                            </div>
                            <h1 className="mt-2 truncate text-3xl font-black leading-tight text-white lg:text-5xl">
                                تابلوی لحظه ای قیمت محصولات
                            </h1>
                        </div>
                    </div>

                    <div className="grid gap-2 text-right lg:justify-self-center lg:text-center">
                        <div className="text-sm font-bold text-slate-300">{businessLabel}</div>
                        <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                            <span className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100">
                                {roleLabel}
                            </span>
                            <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                                قیمت زنده
                            </span>
                            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300">
                                بروزرسانی {formatUpdatedAt(dataUpdatedAt, now)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-left">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Clock3 className="h-4 w-4 text-amber-200" />
                                {formatDate(now)}
                            </div>
                            <div className="mt-3 font-mono text-xl font-black leading-none text-white" dir="ltr">
                                {formatTime(now)}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                void refetch();
                            }}
                            className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-amber-100 transition hover:border-amber-200/30 hover:bg-amber-200/10"
                            title="بروزرسانی"
                            aria-label="بروزرسانی قیمت ها"
                        >
                            <RefreshCw className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid flex-1 place-items-center rounded-lg border border-white/10 bg-black/35">
                        <div className="text-center">
                            <RefreshCw className="mx-auto h-10 w-10 animate-spin text-amber-200" />
                            <p className="mt-4 text-lg font-bold text-slate-300">در حال دریافت قیمت ها</p>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="grid flex-1 place-items-center rounded-lg border border-rose-300/20 bg-rose-500/10 p-8 text-center">
                        <div>
                            <ShieldCheck className="mx-auto h-12 w-12 text-rose-100" />
                            <h2 className="mt-5 text-2xl font-black text-white">دریافت قیمت ها با خطا مواجه شد</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    void refetch();
                                }}
                                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
                            >
                                <RefreshCw className="h-4 w-4" />
                                تلاش دوباره
                            </button>
                        </div>
                    </div>
                ) : products.length ? (
                    <>
                        <section className="grid flex-1 gap-4 xl:grid-cols-[0.78fr_1.22fr]">
                            <div className="flex min-h-0 flex-col gap-4">
                                <div className="goldima-panel-sweep overflow-hidden rounded-lg border border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(15,23,42,0.62))] shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
                                    <div className="relative min-h-[25rem] p-5">
                                        <div className="absolute inset-0 opacity-45">
                                            <Image
                                                src={BULLION_IMAGE}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                priority
                                                sizes="(min-width: 1280px) 40vw, 100vw"
                                            />
                                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.36)_48%,rgba(0,0,0,0.82))]" />
                                        </div>

                                        <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-between">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-sm font-black text-amber-100">
                                                        <Sparkles className="h-5 w-5" />
                                                        محصول شاخص
                                                    </div>
                                                    <h2 className="mt-5 truncate text-3xl font-black text-white lg:text-5xl">
                                                        {featuredProduct.name}
                                                    </h2>
                                                </div>
                                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-amber-200/25 bg-amber-200/10 text-amber-100">
                                                    <Gem className="h-7 w-7" />
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                                                <div className="text-sm font-bold text-slate-300">قیمت نهایی</div>
                                                <div className="mt-3 flex items-end justify-between gap-4">
                                                    <div className="goldima-price-glow font-mono text-5xl font-black leading-none text-amber-100 lg:text-7xl" dir="ltr">
                                                        {formatPrice(featuredProduct.finalPrice)}
                                                    </div>
                                                    <span className="mb-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-black text-slate-300">
                                                        USD
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <MetricTile icon={Layers3} label="محصول فعال" value={formatNumber(products.length)} tone="gold" />
                                    <MetricTile icon={BarChart3} label="میانگین قیمت" value={formatPrice(averageFinalPrice)} />
                                    <MetricTile icon={TrendingUp} label="بیشترین قیمت" value={formatPrice(featuredProduct.finalPrice)} tone="green" />
                                    <MetricTile icon={Activity} label="اختلاف کل" value={formatSignedPrice(totalPremium)} tone={marketTone} />
                                </div>
                            </div>

                            <div className="goldima-panel-sweep min-h-0 overflow-hidden rounded-lg border border-white/10 bg-black/35 shadow-[0_30px_90px_rgba(0,0,0,0.3)]">
                                <div className="grid h-12 grid-cols-[3rem_minmax(0,1.15fr)_minmax(7rem,0.75fr)_minmax(8rem,0.9fr)_6rem] items-center gap-3 border-b border-amber-300/20 bg-white/[0.05] px-4 text-xs font-black text-slate-400 max-md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(7rem,0.8fr)]">
                                    <span>#</span>
                                    <span>محصول</span>
                                    <span className="text-left max-md:hidden">مرجع</span>
                                    <span className="text-left text-amber-100">نهایی</span>
                                    <span className="text-left max-md:hidden">تغییر</span>
                                </div>

                                <div className="max-h-[62vh] overflow-y-auto scrollbar-hide">
                                    {visibleProducts.map((product, index) => (
                                        <ProductPriceRow key={product.id} product={product} index={index} />
                                    ))}
                                </div>
                            </div>
                        </section>

                        <PriceTicker products={products} />
                    </>
                ) : (
                    <EmptyBoard />
                )}
            </div>
        </main>
    );
}
