"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calculator, CheckCircle2, Layers3, LockKeyhole, Percent, Plus, Save, SlidersHorizontal, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useCreateProductMutation,
    useCurrentUserQuery,
    useProductsQuery,
    useSetBasePriceMutation,
    useSetPricingRuleMutation,
    useUpdateBasePriceMutation,
    useUpdateProductMutation,
    useUpdatePricingRuleMutation,
} from "@/hooks/api";
import {
    findTradingMarket,
    findTradingProduct,
    getTradingMarket,
    TRADING_PRODUCTS,
    type TradingMarketKey,
    type TradingProductDefinition,
    type TradingProductKey,
} from "@/constants/trading-board";
import { canViewPricingTools, getNormalizedUserRole } from "@/lib/user-role";
import type { PricingRuleRequest, PricingRuleType, ProductPriceSection, ProductPriceTreeDetail } from "@/types/api/product";
import type { CurrentUser } from "@/types/api/user";

type MarketDraft = {
    base_price_id?: number;
    marketKey: TradingMarketKey;
    marketValue: string;
    buyPrice: string;
    sellPrice: string;
    is_active: boolean;
};

type ProductDraft = {
    productId?: number;
    name: string;
    is_active: boolean;
    purity: string;
    weight: string;
    unit: string;
    markets: Record<TradingMarketKey, MarketDraft>;
};

type RuleTarget = {
    product: ProductPriceTreeDetail;
    section: ProductPriceSection;
    productDefinition: TradingProductDefinition;
    marketKey: TradingMarketKey;
};

type RuleDraft = {
    targetKey: string;
    type: PricingRuleType;
    value: string;
};

const MARKET_API_NAMES: Record<TradingMarketKey, string> = {
    tehran: "Tehran",
    uae: "UAE",
    turkey: "Turkey",
};

function getProductId(product: ProductPriceTreeDetail): number {
    return Number(product.product_id ?? product.id);
}

function formatMoney(value: number | null | undefined): string {
    return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function parseMoney(value: string): number {
    return Number(value.replace(/,/g, ""));
}

function hasInputValue(value: string): boolean {
    return value.trim() !== "";
}

function toInputValue(value: unknown): string {
    return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function getProductByDefinition(products: ProductPriceTreeDetail[], definition: TradingProductDefinition): ProductPriceTreeDetail | undefined {
    return products.find((product) => findTradingProduct(product.name)?.key === definition.key);
}

function createDraft(definition: TradingProductDefinition, product?: ProductPriceTreeDetail): ProductDraft {
    const markets = definition.markets.reduce<Record<TradingMarketKey, MarketDraft>>((acc, marketKey) => {
        const marketDefinition = getTradingMarket(marketKey);
        const section = product?.prices?.find((price) => findTradingMarket(price.market)?.key === marketKey);

        acc[marketKey] = {
            base_price_id: section?.base_price_id,
            marketKey,
            marketValue: section?.market || MARKET_API_NAMES[marketKey] || marketDefinition.label,
            buyPrice: toInputValue(section?.base_buy_price),
            sellPrice: toInputValue(section?.base_sell_price),
            is_active: section?.is_active ?? false,
        };

        return acc;
    }, {} as Record<TradingMarketKey, MarketDraft>);

    return {
        productId: product ? getProductId(product) : undefined,
        name: product?.name || definition.title,
        is_active: product?.is_active ?? true,
        purity: toInputValue(product?.purity ?? (definition.key.includes("silver") ? 999.9 : "")),
        weight: toInputValue(product?.weight ?? (definition.key.includes("silver") ? 1000 : "")),
        unit: product?.unit || (definition.key.includes("silver") ? "گرم" : ""),
        markets,
    };
}

function buildDrafts(products: ProductPriceTreeDetail[]): Record<TradingProductKey, ProductDraft> {
    return TRADING_PRODUCTS.reduce<Record<TradingProductKey, ProductDraft>>((acc, definition) => {
        acc[definition.key] = createDraft(definition, getProductByDefinition(products, definition));
        return acc;
    }, {} as Record<TradingProductKey, ProductDraft>);
}

function buildRuleTargets(products: ProductPriceTreeDetail[]): RuleTarget[] {
    return products.flatMap((product) => {
        const productDefinition = findTradingProduct(product.name);
        if (!productDefinition || product.is_active === false) return [];

        return (product.prices ?? [])
            .map((section) => {
                const market = findTradingMarket(section.market);
                if (!market || section.is_active === false || !productDefinition.markets.includes(market.key)) return null;

                return {
                    product,
                    section,
                    productDefinition,
                    marketKey: market.key,
                };
            })
            .filter((target): target is RuleTarget => Boolean(target));
    });
}

function targetKey(target: RuleTarget): string {
    return `${getProductId(target.product)}:${target.section.base_price_id}`;
}

function LoadingState() {
    return (
        <div className="px-4 py-8">
            <Card className="mx-auto max-w-6xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="h-56 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-56 animate-pulse rounded-lg bg-white/10" />
                </div>
            </Card>
        </div>
    );
}

function DeniedState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto w-full max-w-3xl border border-rose-300/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="inline-flex items-center gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
                    <LockKeyhole className="h-4 w-4" />
                    دسترسی محدود
                </div>
                <h1 className="mt-5 text-2xl font-bold text-brand-text-primary">قیمت‌گذاری برای نقش فعلی فعال نیست</h1>
                <p className="mt-4 leading-8 text-brand-text-secondary">این بخش برای مرجع و عمده‌فروش فعال است.</p>
            </Card>
        </div>
    );
}

function ActiveToggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
    const Icon = checked ? ToggleRight : ToggleLeft;

    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                checked ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-zinc-400/20 bg-white/5 text-brand-text-secondary"
            }`}
        >
            <Icon className="h-5 w-5" />
            {label}
        </button>
    );
}

function ReferenceProductCard({
    definition,
    draft,
    onDraftChange,
    onSave,
    isSaving,
}: {
    definition: TradingProductDefinition;
    draft: ProductDraft;
    onDraftChange: (draft: ProductDraft) => void;
    onSave: () => void;
    isSaving: boolean;
}) {
    const setProductField = (field: keyof ProductDraft, value: string | boolean) => {
        onDraftChange({ ...draft, [field]: value });
    };

    const setMarketField = (marketKey: TradingMarketKey, field: keyof MarketDraft, value: string | boolean) => {
        onDraftChange({
            ...draft,
            markets: {
                ...draft.markets,
                [marketKey]: {
                    ...draft.markets[marketKey],
                    [field]: value,
                },
            },
        });
    };

    return (
        <Card className="overflow-hidden border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-deep-card backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-black text-brand-text-primary">{definition.title}</h2>
                    <p className="mt-2 text-sm text-brand-text-secondary">مدیریت قیمت خرید/فروش و فعال بودن بازارها</p>
                </div>
                <ActiveToggle checked={draft.is_active} onChange={(checked) => setProductField("is_active", checked)} label={draft.is_active ? "سکشن فعال" : "سکشن غیرفعال"} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div>
                    <Label className="mb-2 block">عیار</Label>
                    <Input value={draft.purity} onChange={(event) => setProductField("purity", event.target.value)} dir="ltr" placeholder="999.9" />
                </div>
                <div>
                    <Label className="mb-2 block">وزن</Label>
                    <Input value={draft.weight} onChange={(event) => setProductField("weight", event.target.value)} dir="ltr" placeholder="1000" />
                </div>
                <div>
                    <Label className="mb-2 block">واحد</Label>
                    <Input value={draft.unit} onChange={(event) => setProductField("unit", event.target.value)} placeholder="گرم" />
                </div>
            </div>

            <div className="mt-5 grid gap-3">
                {definition.markets.map((marketKey) => {
                    const market = getTradingMarket(marketKey);
                    const marketDraft = draft.markets[marketKey];

                    return (
                        <div key={marketKey} className="rounded-2xl border border-white/10 bg-brand-base/45 p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-brand-text-primary">{market.label}</h3>
                                    <p className="mt-1 text-xs text-brand-text-secondary">شناسه بخش: {marketDraft.base_price_id ?? "ثبت نشده"}</p>
                                </div>
                                <ActiveToggle checked={marketDraft.is_active} onChange={(checked) => setMarketField(marketKey, "is_active", checked)} label={marketDraft.is_active ? "بازار فعال" : "بازار غیرفعال"} />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <Label className="mb-2 block">قیمت خرید</Label>
                                    <Input value={marketDraft.buyPrice} onChange={(event) => setMarketField(marketKey, "buyPrice", event.target.value)} type="number" min="0" step="1" dir="ltr" />
                                </div>
                                <div>
                                    <Label className="mb-2 block">قیمت فروش</Label>
                                    <Input value={marketDraft.sellPrice} onChange={(event) => setMarketField(marketKey, "sellPrice", event.target.value)} type="number" min="0" step="1" dir="ltr" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 flex justify-end">
                <Button type="button" onClick={onSave} disabled={isSaving} className="cursor-pointer gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "در حال ذخیره..." : "ذخیره سکشن"}
                </Button>
            </div>
        </Card>
    );
}

export default function PricingPage() {
    const { data: currentUser, isLoading } = useCurrentUserQuery();

    if (isLoading) return <LoadingState />;

    if (!currentUser || !canViewPricingTools(currentUser)) {
        return <DeniedState />;
    }

    return <PricingWorkspace key={currentUser.id} currentUser={currentUser} />;
}

function PricingWorkspace({ currentUser }: { currentUser: CurrentUser }) {
    const queryClient = useQueryClient();
    const createProductMutation = useCreateProductMutation();
    const updateProductMutation = useUpdateProductMutation();
    const setBasePriceMutation = useSetBasePriceMutation();
    const updateBasePriceMutation = useUpdateBasePriceMutation();
    const setPricingRuleMutation = useSetPricingRuleMutation();
    const updatePricingRuleMutation = useUpdatePricingRuleMutation();
    const { data: apiProducts = [], isLoading: isProductsLoading, isError: isProductsError } = useProductsQuery();

    const [drafts, setDrafts] = useState<Record<TradingProductKey, ProductDraft>>(() => buildDrafts([]));
    const [ruleDraft, setRuleDraft] = useState<RuleDraft>({ targetKey: "", type: "PERCENT", value: "" });

    const role = getNormalizedUserRole(currentUser);
    const isReference = role === "reference";
    const isWholesale = role === "wholesale";
    const isSavingReference = createProductMutation.isPending || updateProductMutation.isPending || setBasePriceMutation.isPending || updateBasePriceMutation.isPending;
    const isSavingRule = setPricingRuleMutation.isPending || updatePricingRuleMutation.isPending;

    const ruleTargets = useMemo(() => buildRuleTargets(apiProducts), [apiProducts]);
    const selectedRuleTarget = useMemo(
        () => ruleTargets.find((target) => targetKey(target) === ruleDraft.targetKey) ?? ruleTargets[0],
        [ruleDraft.targetKey, ruleTargets],
    );

    useEffect(() => {
        setDrafts(buildDrafts(apiProducts));
    }, [apiProducts]);

    useEffect(() => {
        if (!selectedRuleTarget) return;
        setRuleDraft((prev) => (prev.targetKey ? prev : { ...prev, targetKey: targetKey(selectedRuleTarget) }));
    }, [selectedRuleTarget]);

    const refreshProducts = async () => {
        await queryClient.invalidateQueries({ queryKey: ["api", "products", "list"] });
        await queryClient.invalidateQueries({ queryKey: ["api", "products", "price"] });
    };

    const handleSaveProduct = async (definition: TradingProductDefinition) => {
        const draft = drafts[definition.key];
        const productPayload = {
            name: definition.title,
            is_active: draft.is_active,
            purity: draft.purity.trim() ? parseMoney(draft.purity) : null,
            weight: draft.weight.trim() ? parseMoney(draft.weight) : null,
            unit: draft.unit.trim(),
        };

        try {
            let productId = draft.productId;

            if (productId) {
                await updateProductMutation.mutateAsync({
                    productId,
                    payload: productPayload,
                });
            } else {
                const createdProduct = await createProductMutation.mutateAsync(productPayload);
                productId = createdProduct.id;
            }

            const marketMutations = definition.markets.flatMap((marketKey) => {
                const marketDraft = draft.markets[marketKey];
                const market = getTradingMarket(marketKey);
                const hasSavedSection = typeof marketDraft.base_price_id === "number";
                const hasBuyPrice = hasInputValue(marketDraft.buyPrice);
                const hasSellPrice = hasInputValue(marketDraft.sellPrice);
                const shouldPersistMarket = hasSavedSection || marketDraft.is_active || hasBuyPrice || hasSellPrice;

                if (!shouldPersistMarket) {
                    return [];
                }

                if (!hasBuyPrice || !hasSellPrice) {
                    throw new Error(`برای ${definition.title} - ${market.label} قیمت خرید و فروش را وارد کنید`);
                }

                const buyPrice = parseMoney(marketDraft.buyPrice);
                const sellPrice = parseMoney(marketDraft.sellPrice);

                if (!Number.isFinite(buyPrice) || buyPrice < 0 || !Number.isFinite(sellPrice) || sellPrice < 0) {
                    throw new Error(`قیمت ${definition.title} - ${market.label} معتبر نیست`);
                }

                return [
                    (hasSavedSection ? updateBasePriceMutation : setBasePriceMutation).mutateAsync({
                        product: productId as number,
                        market: marketDraft.marketValue,
                        buy_price: buyPrice,
                        price: sellPrice,
                        is_active: marketDraft.is_active,
                    }),
                ];
            });

            await Promise.all(marketMutations);

            await refreshProducts();
            toast.success(`${definition.title} ذخیره شد`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره قیمت‌ها با خطا مواجه شد";
            toast.error(message);
        }
    };

    const handleRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedRuleTarget) {
            toast.error("یک محصول و بازار را انتخاب کنید");
            return;
        }

        const value = parseMoney(ruleDraft.value);
        if (!Number.isFinite(value) || value < 0) {
            toast.error("مقدار قانون معتبر نیست");
            return;
        }

        const payload: PricingRuleRequest = {
            product_id: getProductId(selectedRuleTarget.product),
            base_price_id: selectedRuleTarget.section.base_price_id,
            type: ruleDraft.type,
            value,
        };

        try {
            try {
                await updatePricingRuleMutation.mutateAsync(payload);
            } catch {
                await setPricingRuleMutation.mutateAsync(payload);
            }

            await refreshProducts();
            toast.success("قانون قیمت‌گذاری ذخیره شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره قانون قیمت‌گذاری با خطا مواجه شد";
            toast.error(message);
        }
    };

    if (isProductsLoading) return <LoadingState />;

    if (isProductsError) {
        return (
            <div className="px-4 py-10">
                <Card className="mx-auto max-w-3xl border border-amber-300/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-brand-text-primary">دریافت محصولات قیمت‌گذاری با خطا مواجه شد</h2>
                    <p className="mt-3 leading-7 text-brand-text-secondary">لطفا دوباره تلاش کنید.</p>
                    <Button type="button" className="mt-5" onClick={() => queryClient.invalidateQueries({ queryKey: ["api", "products", "list"] })}>
                        تلاش دوباره
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="px-4 py-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 text-right shadow-2xl shadow-black/20 backdrop-blur-xl"
                >
                    <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                                <SlidersHorizontal className="h-4 w-4" />
                                {isReference ? "قیمت‌گذاری مرجع" : "قانون قیمت عمده‌فروش"}
                            </div>
                            <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">مدیریت قیمت تابلو</h1>
                            <p className="mt-3 max-w-3xl leading-8 text-brand-text-secondary">
                                {isReference
                                    ? "فقط ۵ آیتم اصلی تابلو مدیریت می‌شوند. برای هر آیتم می‌توانید سکشن کامل یا بازارهای تهران، امارات و ترکیه را فعال/غیرفعال کنید."
                                    : "قانون شما روی قیمت مرجع هر محصول و بازار اعمال می‌شود و برای زیرمجموعه‌ها نمایش داده خواهد شد."}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-brand-base/45 p-2">
                            <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                <p className="text-xl font-bold text-brand-text-primary">۵</p>
                                <p className="mt-1 text-xs text-brand-text-secondary">آیتم</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                <p className="text-xl font-bold text-brand-text-primary">{ruleTargets.length}</p>
                                <p className="mt-1 text-xs text-brand-text-secondary">بازار فعال</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                <p className="text-xl font-bold text-silver-light">{isReference ? "MASTER" : "RULE"}</p>
                                <p className="mt-1 text-xs text-brand-text-secondary">حالت</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {isReference ? (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {TRADING_PRODUCTS.map((definition) => (
                            <ReferenceProductCard
                                key={definition.key}
                                definition={definition}
                                draft={drafts[definition.key]}
                                onDraftChange={(draft) => setDrafts((prev) => ({ ...prev, [definition.key]: draft }))}
                                onSave={() => void handleSaveProduct(definition)}
                                isSaving={isSavingReference}
                            />
                        ))}
                    </div>
                ) : null}

                {isWholesale ? (
                    <form onSubmit={handleRuleSubmit} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                        <Card className="border border-silver-dark/20 bg-brand-surface/85 p-5 text-right shadow-deep-card backdrop-blur-xl">
                            <div className="mb-5 flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-silver-light" />
                                <h2 className="text-lg font-bold text-brand-text-primary">قانون قیمت‌گذاری شما</h2>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <Label htmlFor="target" className="mb-2 block">محصول و بازار</Label>
                                    <select
                                        id="target"
                                        value={ruleDraft.targetKey}
                                        onChange={(event: ChangeEvent<HTMLSelectElement>) => setRuleDraft((prev) => ({ ...prev, targetKey: event.target.value }))}
                                        className="flex h-11 w-full rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-sm text-brand-text-primary outline-none transition focus:border-silver-light/70 focus:ring-2 focus:ring-silver-light/25"
                                    >
                                        {ruleTargets.map((target) => {
                                            const market = getTradingMarket(target.marketKey);
                                            return (
                                                <option key={targetKey(target)} value={targetKey(target)}>
                                                    {target.productDefinition.title} - {market.label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="type" className="mb-2 block">نوع افزایش</Label>
                                        <select
                                            id="type"
                                            value={ruleDraft.type}
                                            onChange={(event: ChangeEvent<HTMLSelectElement>) => setRuleDraft((prev) => ({ ...prev, type: event.target.value as PricingRuleType }))}
                                            className="flex h-11 w-full rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-sm text-brand-text-primary outline-none transition focus:border-silver-light/70 focus:ring-2 focus:ring-silver-light/25"
                                        >
                                            <option value="PERCENT">درصدی</option>
                                            <option value="FIXED">عدد ثابت</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="value" className="mb-2 block">مقدار</Label>
                                        <Input id="value" value={ruleDraft.value} onChange={(event) => setRuleDraft((prev) => ({ ...prev, value: event.target.value }))} type="number" min="0" step="0.01" dir="ltr" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <Button type="submit" disabled={isSavingRule || !selectedRuleTarget} className="cursor-pointer gap-2">
                                    {ruleDraft.type === "PERCENT" ? <Percent className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    {isSavingRule ? "در حال ذخیره..." : "ذخیره قانون"}
                                </Button>
                            </div>
                        </Card>

                        <Card className="border border-emerald-300/20 bg-emerald-400/10 p-5 text-right text-emerald-50">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-1 h-5 w-5" />
                                <div>
                                    <h3 className="font-bold">پیش‌نمایش قیمت مرجع</h3>
                                    {selectedRuleTarget ? (
                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                                                <p className="text-xs text-emerald-100/80">خرید فعلی</p>
                                                <p className="mt-2 text-2xl font-black">{formatMoney(selectedRuleTarget.section.buy_price)}</p>
                                            </div>
                                            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                                                <p className="text-xs text-emerald-100/80">فروش فعلی</p>
                                                <p className="mt-2 text-2xl font-black">{formatMoney(selectedRuleTarget.section.sell_price)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm leading-7">برای ثبت قانون ابتدا یک بازار فعال توسط مرجع لازم است.</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </form>
                ) : null}

                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                    <div className="mb-5 flex items-center gap-2">
                        <Layers3 className="h-5 w-5 text-silver-light" />
                        <h2 className="text-lg font-bold text-brand-text-primary">نمای کلی بازارهای فعال</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {ruleTargets.length ? (
                            ruleTargets.map((target) => {
                                const market = getTradingMarket(target.marketKey);
                                return (
                                    <div key={targetKey(target)} className="rounded-2xl border border-white/10 bg-brand-base/45 p-4">
                                        <p className="font-bold text-brand-text-primary">{target.productDefinition.title}</p>
                                        <p className="mt-1 text-xs text-brand-text-secondary">{market.label}</p>
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                            <div className="rounded-xl bg-white/[0.04] p-3">
                                                <p className="text-brand-text-secondary">خرید</p>
                                                <p className="mt-1 font-bold text-brand-text-primary">{formatMoney(target.section.buy_price)}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/[0.04] p-3">
                                                <p className="text-brand-text-secondary">فروش</p>
                                                <p className="mt-1 font-bold text-brand-text-primary">{formatMoney(target.section.sell_price)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-brand-base/35 p-6 text-center text-brand-text-secondary md:col-span-2 xl:col-span-3">
                                بازار فعالی برای نمایش وجود ندارد.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
