"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowDown, ArrowUp, Banknote, Gem, RefreshCw } from "lucide-react";
import { useProductsQuery } from "@/hooks/api";
import {
    findTradingMarket,
    findTradingProduct,
    TRADING_PRODUCTS,
    type TradingMarketDefinition,
    type TradingProductDefinition,
} from "@/constants/trading-board";
import type { ProductPriceSection, ProductPriceTreeDetail } from "@/types/api/product";

const REFRESH_INTERVAL_MS = 10_000;

type BoardSection = ProductPriceSection & {
    marketDefinition: TradingMarketDefinition;
};

type BoardItem = {
    definition: TradingProductDefinition;
    product?: ProductPriceTreeDetail;
    sections: BoardSection[];
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: index * 0.08,
            duration: 0.5,
            ease: "easeOut",
        },
    }),
};

function toFiniteNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatMoney(value: unknown): string {
    return new Intl.NumberFormat("fa-IR", {
        maximumFractionDigits: 0,
    }).format(toFiniteNumber(value));
}

function getUnitLabel(product: ProductPriceTreeDetail | undefined, definition: TradingProductDefinition): string {
    if (definition.unitLabel) return definition.unitLabel;

    const weight = product?.weight ? `${formatMoney(product.weight)} ${product.unit || ""}`.trim() : "";
    return weight || "قیمت لحظه‌ای";
}

function buildBoardItems(products: ProductPriceTreeDetail[]): BoardItem[] {
    const productMap = new Map<string, ProductPriceTreeDetail>();

    products.forEach((product) => {
        const definition = findTradingProduct(product.name);
        if (definition) productMap.set(definition.key, product);
    });

    return TRADING_PRODUCTS.map((definition) => {
        const product = productMap.get(definition.key);
        const activeSections = (product?.prices ?? [])
            .map((section) => {
                const marketDefinition = findTradingMarket(section.market);
                return marketDefinition ? { ...section, marketDefinition } : null;
            })
            .filter((section): section is BoardSection => Boolean(section))
            .filter((section) => section.is_active !== false)
            .filter((section) => definition.markets.includes(section.marketDefinition.key))
            .sort((a, b) => definition.markets.indexOf(a.marketDefinition.key) - definition.markets.indexOf(b.marketDefinition.key));

        return {
            definition,
            product,
            sections: activeSections,
        };
    }).filter((item) => item.product?.is_active !== false && item.sections.length > 0);
}

function FlagBadge({ market }: { market: TradingMarketDefinition }) {
    const tone = {
        tehran: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
        uae: "border-sky-300/25 bg-sky-400/10 text-sky-100",
        turkey: "border-red-300/25 bg-red-400/10 text-red-100",
    }[market.key];

    return (
        <span className={`inline-flex h-7 min-w-10 items-center justify-center rounded-lg border px-2 text-[0.7rem] font-black tracking-wide ${tone}`}>
            {market.code}
        </span>
    );
}

function PriceLine({
    label,
    value,
    currency,
    trend,
}: {
    label: string;
    value: number | null;
    currency: string;
    trend: "up" | "down";
}) {
    const Icon = trend === "up" ? ArrowUp : ArrowDown;
    const tone = trend === "up" ? "text-emerald-300" : "text-rose-300";

    return (
        <div className="grid grid-cols-[1.35rem_2.75rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.035] px-3 py-2.5 text-sm shadow-inner shadow-black/10">
            <Icon className={`h-3.5 w-3.5 ${tone}`} />
            <span className="text-brand-text-secondary">{label}</span>
            <span className="min-w-0 text-left font-black tabular-nums text-brand-text-primary goldima-price-glow" dir="ltr">
                {formatMoney(value)}
            </span>
            <span className="text-[0.7rem] font-semibold text-silver-dark">{currency}</span>
        </div>
    );
}

function MarketBlock({ section, compact = false }: { section: BoardSection; compact?: boolean }) {
    const market = section.marketDefinition;

    return (
        <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.7)]" />
                    <h3 className={`${compact ? "text-sm" : "text-base"} truncate font-black text-brand-text-primary`}>
                        {market.label}
                    </h3>
                </div>
                <FlagBadge market={market} />
            </div>

            <div className="space-y-2">
                <PriceLine label="خرید" value={section.buy_price} currency={market.currency} trend="down" />
                <PriceLine label="فروش" value={section.sell_price ?? section.final_price} currency={market.currency} trend="up" />
            </div>
        </div>
    );
}

function ProductMark({ type }: { type: "silver" | "cash" | "transfer" }) {
    if (type === "silver") {
        return (
            <div className="relative grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-silver-light/20 bg-gradient-to-br from-white/15 via-silver-dark/10 to-white/5 shadow-silver-glow">
                <div className="absolute inset-x-2 top-2 h-px bg-white/50" />
                <Gem className="relative h-6 w-6 text-silver-light" />
            </div>
        );
    }

    return (
        <div className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 shadow-emerald-glow">
            <Banknote className="h-7 w-7" />
        </div>
    );
}

function ProductCard({
    item,
    variant = "normal",
    index,
}: {
    item: BoardItem;
    variant?: "normal" | "wide" | "compact";
    index: number;
}) {
    const isSilver = item.definition.key.includes("silver");
    const isTransfer = item.definition.key.includes("transfer");
    const sections = item.sections;
    const accent = isSilver ? "from-silver-light/30" : isTransfer ? "from-emerald-300/24" : "from-amber-300/24";

    return (
        <motion.article
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { duration: 0.22 } }}
            className={[
                "goldima-panel-sweep group relative overflow-hidden rounded-2xl border border-silver-dark/20 bg-brand-card/78 text-right shadow-deep-card backdrop-blur-xl",
                "transition-colors duration-300 hover:border-silver-light/35",
                variant === "wide" ? "min-h-[9.2rem] p-5 lg:p-6" : "min-h-[15rem] p-5",
            ].join(" ")}
        >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l ${accent} via-white/45 to-transparent`} />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),transparent_36%,rgba(255,255,255,0.025))]" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 text-[9rem] font-black leading-none text-white/[0.035]">
                {isSilver ? "AG" : isTransfer ? "FX" : "$"}
            </div>

            <div className="relative z-10 flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold leading-6 text-brand-text-secondary">{getUnitLabel(item.product, item.definition)}</p>
                        <h2 className="mt-1 truncate text-xl font-black text-brand-text-primary sm:text-2xl">
                            {item.definition.title}
                        </h2>
                    </div>
                    <ProductMark type={isSilver ? "silver" : isTransfer ? "transfer" : "cash"} />
                </div>

                <div
                    className={[
                        "grid flex-1 gap-4",
                        variant === "wide"
                            ? "grid-cols-1 lg:grid-cols-3"
                            : sections.length > 1
                              ? "grid-cols-1 md:grid-cols-2"
                              : "grid-cols-1",
                    ].join(" ")}
                >
                    {sections.map((section, sectionIndex) => (
                        <motion.div
                            key={`${section.base_price_id}-${section.market}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 + index * 0.06 + sectionIndex * 0.05, duration: 0.36 }}
                            className={sectionIndex > 0 ? "border-r border-white/10 pr-4 max-md:border-r-0 max-md:pr-0" : ""}
                        >
                            <MarketBlock section={section} compact={variant === "wide"} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.article>
    );
}

function LoadingState() {
    return (
        <div className="grid gap-5">
            <div className="grid gap-5 xl:grid-cols-2">
                <div className="h-60 animate-pulse rounded-2xl border border-silver-dark/15 bg-brand-card/70" />
                <div className="h-60 animate-pulse rounded-2xl border border-silver-dark/15 bg-brand-card/70" />
            </div>
            <div className="h-36 animate-pulse rounded-2xl border border-silver-dark/15 bg-brand-card/70" />
            <div className="grid gap-5 xl:grid-cols-2">
                <div className="h-44 animate-pulse rounded-2xl border border-silver-dark/15 bg-brand-card/70" />
                <div className="h-44 animate-pulse rounded-2xl border border-silver-dark/15 bg-brand-card/70" />
            </div>
        </div>
    );
}

export default function HomePage() {
    const {
        data: apiProducts = [],
        isError,
        isLoading,
        refetch,
    } = useProductsQuery({
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    const boardItems = useMemo(() => buildBoardItems(apiProducts), [apiProducts]);
    const getItem = (key: string) => boardItems.find((item) => item.definition.key === key);
    const turkeySilver = getItem("turkey_silver");
    const uaeSilver = getItem("uae_silver");
    const usdCash = getItem("usd_cash");
    const tryTransfer = getItem("try_transfer");
    const aedTransfer = getItem("aed_transfer");

    return (
        <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(226,232,240,0.06),transparent_28%,rgba(16,185,129,0.055)_62%,transparent)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45" />

            <div className="relative z-10 mx-auto w-full max-w-7xl">
                {isLoading ? (
                    <LoadingState />
                ) : isError ? (
                    <div className="grid min-h-[28rem] place-items-center rounded-2xl border border-rose-300/20 bg-brand-card/80 p-8 text-center shadow-deep-card backdrop-blur-xl">
                        <div>
                            <RefreshCw className="mx-auto h-10 w-10 text-rose-200" />
                            <p className="mt-4 text-xl font-black text-brand-text-primary">دریافت قیمت‌ها با خطا مواجه شد</p>
                            <button
                                type="button"
                                onClick={() => {
                                    void refetch();
                                }}
                                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-silver-light/20 bg-silver-light/10 px-5 font-bold text-brand-text-primary transition hover:bg-silver-light/15"
                            >
                                <RefreshCw className="h-4 w-4" />
                                تلاش دوباره
                            </button>
                        </div>
                    </div>
                ) : boardItems.length ? (
                    <div className="grid content-start gap-5">
                        <div className="grid gap-5 xl:grid-cols-2">
                            {uaeSilver ? <ProductCard item={uaeSilver} index={0} /> : null}
                            {turkeySilver ? <ProductCard item={turkeySilver} index={1} /> : null}
                        </div>

                        {usdCash ? <ProductCard item={usdCash} variant="wide" index={2} /> : null}

                        <div className="grid gap-5 xl:grid-cols-2">
                            {aedTransfer ? <ProductCard item={aedTransfer} variant="compact" index={3} /> : null}
                            {tryTransfer ? <ProductCard item={tryTransfer} variant="compact" index={4} /> : null}
                        </div>
                    </div>
                ) : (
                    <div className="grid min-h-[28rem] place-items-center rounded-2xl border border-dashed border-silver-dark/30 bg-brand-card/70 p-8 text-center shadow-deep-card backdrop-blur-xl">
                        <div>
                            <p className="text-2xl font-black text-brand-text-primary">قیمت فعالی برای نمایش وجود ندارد</p>
                            <p className="mt-3 text-sm font-semibold leading-7 text-brand-text-secondary">
                                محصولات یا بازارهای غیرفعال در تابلو نمایش داده نمی‌شوند.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
