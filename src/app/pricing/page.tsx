"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    BadgeDollarSign,
    Calculator,
    CheckCircle2,
    Edit3,
    Layers3,
    LockKeyhole,
    PackagePlus,
    Percent,
    Plus,
    Save,
    Sparkles,
    Trash2,
    WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicCard } from "@/components/ui/magic-card";
import {
    useCreateProductMutation,
    useCurrentUserQuery,
    useDeleteProductMutation,
    useProductPriceQuery,
    useSetBasePriceMutation,
    useSetPricingRuleMutation,
    useUpdateBasePriceMutation,
    useUpdatePricingRuleMutation,
    useUpdateProductMutation,
} from "@/hooks/api";
import { canViewPricingTools, getNormalizedUserRole } from "@/lib/user-role";
import type { ApiProduct, PricingRuleRequest, PricingRuleType } from "@/types/api/product";
import type { CurrentUser } from "@/types/api/user";

type PricingProduct = {
    localId: string;
    id?: number;
    name: string;
    basePrice: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

type ProductDraft = {
    localId?: string;
    name: string;
    basePrice: string;
    is_active: boolean;
};

type PricingRuleDraft = {
    type: PricingRuleType;
    value: string;
};

const PRODUCTS_STORAGE_KEY = "goldima.pricing.products.v1";
const RULE_STORAGE_PREFIX = "goldima.pricing.rule.v1";
const SELECTED_RULE_PRODUCT_STORAGE_PREFIX = "goldima.pricing.rule.selected-product.v1";

const EMPTY_PRODUCT_DRAFT: ProductDraft = {
    name: "",
    basePrice: "",
    is_active: true,
};

const DEFAULT_RULE_DRAFT: PricingRuleDraft = {
    type: "PERCENT",
    value: "",
};

function formatUsd(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
}

function parseMoney(value: string): number {
    return Number(value.replace(/,/g, ""));
}

function getRuleStorageKey(userId?: string | number, productId?: string | number): string {
    return `${RULE_STORAGE_PREFIX}:${userId ?? "anonymous"}:${productId ?? "global"}`;
}

function getSelectedRuleProductStorageKey(userId?: string | number): string {
    return `${SELECTED_RULE_PRODUCT_STORAGE_PREFIX}:${userId ?? "anonymous"}`;
}

function createLocalId(): string {
    return `product-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStoredProducts(): PricingProduct[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as PricingProduct[];
        return Array.isArray(parsed) ? parsed.filter((item) => item.name) : [];
    } catch {
        return [];
    }
}

function isPricingRuleType(value: unknown): value is PricingRuleType {
    return value === "PERCENT" || value === "FIXED";
}

function readSelectedRuleProductId(userId?: string | number): string {
    if (typeof window === "undefined") return "";

    try {
        return window.localStorage.getItem(getSelectedRuleProductStorageKey(userId)) ?? "";
    } catch {
        return "";
    }
}

function readStoredRule(userId?: string | number, productId?: string | number): PricingRuleDraft {
    if (typeof window === "undefined" || !productId) return DEFAULT_RULE_DRAFT;

    try {
        const raw = window.localStorage.getItem(getRuleStorageKey(userId, productId));
        if (!raw) return DEFAULT_RULE_DRAFT;

        const parsed = JSON.parse(raw) as Partial<PricingRuleDraft>;
        return isPricingRuleType(parsed?.type) && typeof parsed.value === "string"
            ? { type: parsed.type, value: parsed.value }
            : DEFAULT_RULE_DRAFT;
    } catch {
        return DEFAULT_RULE_DRAFT;
    }
}

function calculatePreviewPrice(basePrice: number, rule: PricingRuleDraft): number {
    const value = parseMoney(rule.value);
    if (!Number.isFinite(value) || value < 0) return basePrice;
    return rule.type === "PERCENT" ? basePrice * (1 + value / 100) : basePrice + value;
}

function LoadingState() {
    return (
        <div className="px-4 py-8">
            <Card className="mx-auto max-w-6xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="h-36 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-36 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-36 animate-pulse rounded-lg bg-white/10" />
                </div>
            </Card>
        </div>
    );
}

export default function PricingPage() {
    const { data: currentUser, isLoading } = useCurrentUserQuery();

    if (isLoading) {
        return <LoadingState />;
    }

    if (!currentUser || !canViewPricingTools(currentUser)) {
        return <DeniedState />;
    }

    return <PricingWorkspace key={currentUser.id} currentUser={currentUser} />;
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

function ProductPricePanel({
    product,
    rule,
    selectedRuleProductId,
}: {
    product: PricingProduct;
    rule: PricingRuleDraft;
    selectedRuleProductId: string;
}) {
    const { data, isLoading, isError } = useProductPriceQuery(product.id);
    const shouldPreviewDraftRule = Boolean(product.id && String(product.id) === selectedRuleProductId);
    const previewPrice = shouldPreviewDraftRule ? calculatePreviewPrice(product.basePrice, rule) : product.basePrice;
    const finalPrice = data?.final_price ?? previewPrice;
    const parentPrice = data?.parent_price ?? product.basePrice;

    return (
        <MagicCard className="rounded-2xl bg-brand-base/45 p-4" withBorderBeam={false}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-brand-text-primary">{product.name}</h3>
                    <p className="mt-1 text-xs text-brand-text-secondary">شناسه محصول: {product.id ?? "ثبت نشده"}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-silver-dark/20 bg-silver-light/10 text-silver-light">
                    <BadgeDollarSign className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-brand-text-secondary">قیمت مرجع</p>
                    <p className="mt-2 font-bold text-brand-text-primary">{formatUsd(parentPrice)}</p>
                </div>
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3">
                    <p className="text-xs text-emerald-100">قیمت نهایی</p>
                    <p className="mt-2 font-bold text-emerald-100">{isLoading ? "..." : formatUsd(finalPrice)}</p>
                </div>
            </div>

            {isError ? <p className="mt-3 text-xs text-amber-200">قیمت زنجیره‌ای از API دریافت نشد.</p> : null}

            {data?.levels?.length ? (
                <div className="mt-4 space-y-2">
                    {data.levels.map((level, index) => (
                        <div key={`${level?.role}-${index}`} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                            <span className="text-brand-text-secondary">{level?.role}</span>
                            <span className="font-medium text-brand-text-primary">{formatUsd(level.your_price)}</span>
                        </div>
                    ))}
                </div>
            ) : null}
        </MagicCard>
    );
}

function PricingWorkspace({ currentUser }: { currentUser: CurrentUser }) {
    const queryClient = useQueryClient();
    const createProductMutation = useCreateProductMutation();
    const updateProductMutation = useUpdateProductMutation();
    const deleteProductMutation = useDeleteProductMutation();
    const setBasePriceMutation = useSetBasePriceMutation();
    const updateBasePriceMutation = useUpdateBasePriceMutation();
    const setPricingRuleMutation = useSetPricingRuleMutation();
    const updatePricingRuleMutation = useUpdatePricingRuleMutation();

    const [products, setProducts] = useState<PricingProduct[]>(() => readStoredProducts());
    const [productDraft, setProductDraft] = useState<ProductDraft>(EMPTY_PRODUCT_DRAFT);
    const [selectedRuleProductId, setSelectedRuleProductId] = useState<string>(() => readSelectedRuleProductId(currentUser.id));
    const [pricingRuleDraft, setPricingRuleDraft] = useState<PricingRuleDraft>(() => readStoredRule(currentUser.id, readSelectedRuleProductId(currentUser.id)));

    const role = getNormalizedUserRole(currentUser);
    const isReference = role === "reference";
    const isWholesale = role === "wholesale";
    const isSavingProduct = createProductMutation.isPending || updateProductMutation.isPending || setBasePriceMutation.isPending || updateBasePriceMutation.isPending;
    const isSavingRule = setPricingRuleMutation.isPending || updatePricingRuleMutation.isPending;

    const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
    const ruleProducts = useMemo(() => activeProducts.filter((product) => typeof product.id === "number" && Number.isFinite(product.id)), [activeProducts]);
    const averageBasePrice = useMemo(() => {
        if (!activeProducts.length) return 0;
        return activeProducts.reduce((sum, product) => sum + product.basePrice, 0) / activeProducts.length;
    }, [activeProducts]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
        }
    }, [products]);

    useEffect(() => {
        if (!isWholesale || !ruleProducts.length) return;

        const currentProductStillExists = ruleProducts.some((product) => String(product.id) === selectedRuleProductId);
        if (!selectedRuleProductId || !currentProductStillExists) {
            setSelectedRuleProductId(String(ruleProducts[0].id));
        }
    }, [isWholesale, ruleProducts, selectedRuleProductId]);

    useEffect(() => {
        if (!selectedRuleProductId) return;

        setPricingRuleDraft(readStoredRule(currentUser.id, selectedRuleProductId));

        if (typeof window !== "undefined") {
            window.localStorage.setItem(getSelectedRuleProductStorageKey(currentUser.id), selectedRuleProductId);
        }
    }, [currentUser.id, selectedRuleProductId]);

    const handleProductChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setProductDraft((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleRuleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setPricingRuleDraft((prev) => ({ ...prev, [name]: value }));
    };

    const handleRuleProductChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedRuleProductId(event.target.value);
    };

    const resetProductDraft = () => setProductDraft(EMPTY_PRODUCT_DRAFT);

    const handleEditProduct = (product: PricingProduct) => {
        setProductDraft({
            localId: product.localId,
            name: product.name,
            basePrice: String(product.basePrice),
            is_active: product.is_active,
        });
    };

    const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = productDraft.name.trim();
        const basePrice = parseMoney(productDraft.basePrice);

        if (!name || !Number.isFinite(basePrice) || basePrice < 0) {
            toast.error("نام محصول و قیمت دلاری معتبر را وارد کنید");
            return;
        }

        try {
            const existingProduct = products.find((product) => product.localId === productDraft.localId);
            let savedProduct: ApiProduct;

            if (existingProduct?.id) {
                savedProduct = await updateProductMutation.mutateAsync({
                    productId: existingProduct.id,
                    payload: { name, is_active: productDraft.is_active },
                });
                await updateBasePriceMutation.mutateAsync({ product: existingProduct.id, price: basePrice });
            } else {
                savedProduct = await createProductMutation.mutateAsync({ name, is_active: productDraft.is_active });
                await setBasePriceMutation.mutateAsync({ product: savedProduct.id, price: basePrice });
            }

            const nextProduct: PricingProduct = {
                localId: existingProduct?.localId ?? createLocalId(),
                id: savedProduct.id,
                name: savedProduct.name,
                basePrice,
                is_active: savedProduct.is_active ?? productDraft.is_active,
                created_at: savedProduct.created_at,
                updated_at: savedProduct.updated_at,
            };

            setProducts((prev) => {
                const others = prev.filter((product) => product.localId !== nextProduct.localId);
                return [nextProduct, ...others];
            });
            resetProductDraft();
            toast.success("محصول و قیمت پایه ذخیره شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره محصول با خطا مواجه شد";
            toast.error(message);
        }
    };

    const handleDeleteProduct = async (product: PricingProduct) => {
        try {
            if (product.id) {
                await deleteProductMutation.mutateAsync(product.id);
            }
            setProducts((prev) => prev.filter((item) => item.localId !== product.localId));
            toast.success("محصول حذف شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "حذف محصول با خطا مواجه شد";
            toast.error(message);
        }
    };

    const handleRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = parseMoney(pricingRuleDraft.value);

        if (!Number.isFinite(value) || value < 0) {
            toast.error("مقدار قانون قیمت‌گذاری معتبر نیست");
            return;
        }

        const productId = Number(selectedRuleProductId);

        if (!Number.isInteger(productId) || productId <= 0) {
            toast.error("برای ثبت قانون قیمت‌گذاری، یک کالا را انتخاب کنید");
            return;
        }

        const payload: PricingRuleRequest = {
            product: productId,
            type: pricingRuleDraft.type,
            value,
        };

        try {
            try {
                await updatePricingRuleMutation.mutateAsync(payload);
            } catch {
                await setPricingRuleMutation.mutateAsync(payload);
            }

            if (typeof window !== "undefined") {
                window.localStorage.setItem(getRuleStorageKey(currentUser.id, productId), JSON.stringify(pricingRuleDraft));
                window.localStorage.setItem(getSelectedRuleProductStorageKey(currentUser.id), String(productId));
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["api", "products", "price"] }),
                queryClient.invalidateQueries({ queryKey: ["api", "products", "price", productId] }),
            ]);
            toast.success("قانون قیمت‌گذاری این کالا ذخیره شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره قانون قیمت‌گذاری با خطا مواجه شد";
            toast.error(message);
        }
    };

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
                                <Sparkles className="h-4 w-4" />
                                {isReference ? "قیمت‌گذاری مرجع" : "قانون قیمت عمده‌فروش"}
                            </div>
                            <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">قیمت‌گذاری دلاری محصولات</h1>
                            <p className="mt-3 max-w-3xl leading-8 text-brand-text-secondary">
                                {isReference
                                    ? "محصولات پایه و قیمت دلاری مرجع از این بخش ثبت می‌شوند."
                                    : "قیمت تک‌فروش‌های زیرمجموعه بر اساس قانون دلاری یا درصدی شما محاسبه می‌شود."}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-brand-base/45 p-2">
                            <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                <p className="text-xl font-bold text-brand-text-primary">{products.length}</p>
                                <p className="mt-1 text-xs text-brand-text-secondary">محصول</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                <p className="text-xl font-bold text-brand-text-primary">{activeProducts.length}</p>
                                <p className="mt-1 text-xs text-brand-text-secondary">فعال</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                <p className="text-lg font-bold text-silver-light">{formatUsd(averageBasePrice)}</p>
                                <p className="mt-1 text-xs text-brand-text-secondary">میانگین</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <div className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr]">
                    {isReference ? (
                        <motion.form
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 }}
                            onSubmit={handleProductSubmit}
                            className="space-y-5"
                        >
                            <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                                <div className="mb-5 flex items-center gap-2">
                                    <PackagePlus className="h-5 w-5 text-silver-light" />
                                    <h2 className="text-lg font-bold text-brand-text-primary">محصول مرجع</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="mb-2 block">
                                            نام محصول
                                        </Label>
                                        <Input id="name" name="name" value={productDraft.name} onChange={handleProductChange} placeholder="Silver Bar Turkey 1kg" />
                                    </div>
                                    <div>
                                        <Label htmlFor="basePrice" className="mb-2 block">
                                            قیمت پایه دلار
                                        </Label>
                                        <Input id="basePrice" name="basePrice" value={productDraft.basePrice} onChange={handleProductChange} type="number" min="0" step="0.01" dir="ltr" />
                                    </div>
                                    <label className="flex items-center justify-between rounded-lg border border-white/10 bg-brand-base/45 p-3 text-sm text-brand-text-primary">
                                        محصول فعال باشد
                                        <input
                                            name="is_active"
                                            type="checkbox"
                                            checked={productDraft.is_active}
                                            onChange={handleProductChange}
                                            className="h-4 w-4 cursor-pointer accent-silver-light"
                                        />
                                    </label>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    <Button type="submit" disabled={isSavingProduct} className="gap-2 cursor-pointer">
                                        <Save className="h-4 w-4" />
                                        {productDraft.localId ? "ذخیره" : "ثبت"}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={resetProductDraft}
                                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-silver-dark/20 text-sm font-medium text-brand-text-primary transition hover:bg-white/5"
                                    >
                                        پاک‌کردن
                                    </button>
                                </div>
                            </Card>
                        </motion.form>
                    ) : null}

                    {isWholesale ? (
                        <motion.form
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 }}
                            onSubmit={handleRuleSubmit}
                            className="space-y-5"
                        >
                            <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                                <div className="mb-5 flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-silver-light" />
                                    <h2 className="text-lg font-bold text-brand-text-primary">قانون قیمت‌گذاری شما</h2>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="rule-product" className="mb-2 block">
                                            کالا
                                        </Label>
                                        <select
                                            id="rule-product"
                                            value={selectedRuleProductId}
                                            onChange={handleRuleProductChange}
                                            disabled={!ruleProducts.length}
                                            className="flex h-11 w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text-primary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="">انتخاب کالا</option>
                                            {ruleProducts.map((product) => (
                                                <option key={product.id} value={String(product.id)}>
                                                    {product.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="type" className="mb-2 block">
                                            نوع افزایش
                                        </Label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={pricingRuleDraft.type}
                                            onChange={handleRuleChange}
                                            className="flex h-11 w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text-primary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25"
                                        >
                                            <option value="PERCENT">درصدی</option>
                                            <option value="FIXED">عدد ثابت دلار</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="value" className="mb-2 block">
                                            مقدار
                                        </Label>
                                        <Input id="value" name="value" value={pricingRuleDraft.value} onChange={handleRuleChange} type="number" min="0" step="0.01" dir="ltr" />
                                    </div>
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <Button type="submit" disabled={isSavingRule || !selectedRuleProductId} className="gap-2 cursor-pointer">
                                        {pricingRuleDraft.type === "PERCENT" ? <Percent className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {isSavingRule ? "در حال ذخیره..." : "ذخیره قانون"}
                                    </Button>
                                </div>
                            </Card>
                        </motion.form>
                    ) : null}

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.14 }}
                        className={isReference || isWholesale ? "space-y-4" : "xl:col-span-2"}
                    >
                        <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-5 w-5 text-silver-light" />
                                    <h2 className="text-lg font-bold text-brand-text-primary">محصولات قیمت‌گذاری شده</h2>
                                </div>
                                <span className="rounded-lg border border-white/10 bg-brand-base/45 px-3 py-1 text-xs text-brand-text-secondary">
                                    USD
                                </span>
                            </div>

                            {products.length ? (
                                <div className="space-y-3">
                                    {products.map((product) => (
                                        <div key={product.localId} className="rounded-lg border border-white/10 bg-brand-base/45 p-4">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <h3 className="font-bold text-brand-text-primary">{product.name}</h3>
                                                    <p className="mt-1 text-sm text-brand-text-secondary">
                                                        قیمت پایه: <span className="font-semibold text-silver-light">{formatUsd(product.basePrice)}</span>
                                                    </p>
                                                </div>

                                                {isReference ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditProduct(product)}
                                                            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 text-sm text-brand-text-primary transition hover:bg-white/10"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                            ویرایش
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteProduct(product)}
                                                            disabled={deleteProductMutation.isPending}
                                                            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 text-sm text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            حذف
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-white/10 bg-brand-base/35 p-6 text-center text-brand-text-secondary">
                                    <div>
                                        <WalletCards className="mx-auto mb-3 h-9 w-9 text-silver-light/70" />
                                        <p className="text-sm">هنوز محصولی ثبت نشده است.</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="grid gap-4 lg:grid-cols-3"
                >
                    {activeProducts.map((product) => (
                        <ProductPricePanel key={product.localId} product={product} rule={pricingRuleDraft} selectedRuleProductId={selectedRuleProductId} />
                    ))}
                </motion.section>

                {isWholesale ? (
                    <Card className="border border-emerald-300/20 bg-emerald-400/10 p-4 text-right text-sm leading-7 text-emerald-50">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            قانون قیمت‌گذاری به‌صورت جداگانه برای کالای انتخاب‌شده ذخیره می‌شود.
                        </div>
                    </Card>
                ) : null}
            </div>
        </div>
    );
}
