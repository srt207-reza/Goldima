import { useMutation, useQuery } from "@tanstack/react-query";
import type {
    ApiProduct,
    PricingRuleRequest,
    PricingRuleResponse,
    ProductBasePriceRequest,
    ProductBasePriceResponse,
    ProductPriceOverrideRequest,
    ProductPriceOverrideResponse,
    ProductPriceResponse,
    ProductPriceTreeDetail,
} from "@/types/api/product";
import {
    createProduct,
    deleteProduct,
    getProducts,
    getProductPrice,
    setBasePrice,
    setOverridePrice,
    setPricingRule,
    updateBasePrice,
    updateOverridePrice,
    updateProduct,
    updatePricingRule,
} from "@/services/api/product";
import { getAccessToken } from "@/lib/auth-storage";

type ProductsQueryOptions = {
    enabled?: boolean;
    refetchInterval?: number | false;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
};

export function useProductsQuery(options: ProductsQueryOptions = {}) {
    return useQuery<ProductPriceTreeDetail[], Error>({
        queryKey: ["api", "products", "list"],
        queryFn: getProducts,
        enabled: Boolean(getAccessToken()) && (options.enabled ?? true),
        refetchInterval: options.refetchInterval,
        refetchOnWindowFocus: options.refetchOnWindowFocus,
        staleTime: options.staleTime,
    });
}

export function useCreateProductMutation() {
    return useMutation<ApiProduct, Error, Partial<ApiProduct>>({
        mutationFn: createProduct,
    });
}

export function useUpdateProductMutation() {
    return useMutation<ApiProduct, Error, { productId: number; payload: Partial<ApiProduct> }>({
        mutationFn: ({ productId, payload }) => updateProduct(productId, payload),
    });
}

export function useDeleteProductMutation() {
    return useMutation<void, Error, number>({
        mutationFn: deleteProduct,
    });
}

/**
 * React Query hook for retrieving a product’s price relative to the
 * currently logged in user. The query is only enabled when the productId
 * is truthy.
 *
 * @param productId Identifier of the product whose price should be fetched.
 */
export function useProductPriceQuery(productId?: number) {
    return useQuery<ProductPriceResponse, Error>({
        queryKey: ["api", "products", "price", productId],
        queryFn: () => getProductPrice(productId as number),
        enabled: typeof productId === "number" && !Number.isNaN(productId),
    });
}

/**
 * Mutation hook for creating or updating a base price. Consumers can
 * differentiate between POST and PUT by choosing the appropriate
 * underlying function. Both return the created/updated base price.
 */
export function useSetBasePriceMutation() {
    return useMutation<ProductBasePriceResponse, Error, ProductBasePriceRequest>({
        mutationFn: setBasePrice,
    });
}

export function useUpdateBasePriceMutation() {
    return useMutation<ProductBasePriceResponse, Error, ProductBasePriceRequest>({
        mutationFn: updateBasePrice,
    });
}

/**
 * Mutation hook for creating or updating a custom price override for a
 * specific user on a product. Consumers can use the POST or PUT variant
 * depending on whether they are creating a new record or updating an
 * existing one.
 */
export function useSetOverridePriceMutation() {
    return useMutation<ProductPriceOverrideResponse, Error, ProductPriceOverrideRequest>({
        mutationFn: setOverridePrice,
    });
}

export function useUpdateOverridePriceMutation() {
    return useMutation<ProductPriceOverrideResponse, Error, ProductPriceOverrideRequest>({
        mutationFn: updateOverridePrice,
    });
}

/**
 * Mutation hook for creating or updating a pricing rule. Use the POST
 * variant to create a new rule and the PUT variant to update an
 * existing one. Both operations return the server’s representation of
 * the rule.
 */
export function useSetPricingRuleMutation() {
    return useMutation<PricingRuleResponse, Error, PricingRuleRequest>({
        mutationFn: setPricingRule,
    });
}

export function useUpdatePricingRuleMutation() {
    return useMutation<PricingRuleResponse, Error, PricingRuleRequest>({
        mutationFn: updatePricingRule,
    });
}
