import { axiosInstance } from "@/lib/axios";
import type {
    ApiProduct,
    GetProductsResponse,
    PricingRuleRequest,
    PricingRuleResponse,
    ProductBasePriceRequest,
    ProductBasePriceResponse,
    ProductPriceTreeDetail,
    ProductPriceOverrideRequest,
    ProductPriceOverrideResponse,
    ProductPriceResponse,
} from "@/types/api/product";

function normalizeProductsResponse(response: GetProductsResponse | ProductPriceTreeDetail[]): ProductPriceTreeDetail[] {
    if (Array.isArray(response)) {
        return response;
    }

    return Array.isArray(response.data) ? response.data : [];
}

function unwrapData<T>(response: T | { data: T }): T {
    return response && typeof response === "object" && "data" in response ? (response as { data: T }).data : (response as T);
}

/**
 * Retrieve all products with the effective price tree for the current user.
 * This is the pricing page's source of truth for the product list.
 */
export async function getProducts(): Promise<ProductPriceTreeDetail[]> {
    const { data } = await axiosInstance.get<GetProductsResponse | ProductPriceTreeDetail[]>("/api/get_products/");
    return normalizeProductsResponse(data);
}

/**
 * Create a new product. Only users with the MASTER role on the backend
 * are allowed to call this endpoint successfully. The payload should match
 * the backend’s expected product schema. Unknown fields are passed
 * through as-is.
 *
 * @param payload Arbitrary product attributes used to create the product.
 * @returns The created product as returned by the server.
 */
export async function createProduct(payload: Partial<ApiProduct>): Promise<ApiProduct> {
    const { data } = await axiosInstance.post<ApiProduct>("/api/products/", payload);
    return data;
}

/**
 * Update an existing product. Only users with the MASTER role may update
 * products. The product identifier is supplied separately from the data
 * payload to avoid accidental mutation of the primary key field.
 *
 * @param productId The product’s primary key.
 * @param payload Fields to update on the product.
 * @returns The updated product record.
 */
export async function updateProduct(productId: number, payload: Partial<ApiProduct>): Promise<ApiProduct> {
    const { data } = await axiosInstance.put<ApiProduct>(`/api/products/${productId}/`, payload);
    return data;
}

/**
 * Delete an existing product. The backend uses a separate delete route
 * suffixed with `/delete/`. Only MASTER users are permitted to delete.
 *
 * @param productId The identifier of the product to delete.
 */
export async function deleteProduct(productId: number): Promise<void> {
    await axiosInstance.delete(`/api/products/${productId}/delete/`);
}

/**
 * Set or update the base price of a product. According to the API
 * specification, both POST and PUT are allowed and behave identically. This
 * helper uses POST by default. Use `updateBasePrice` to explicitly call
 * PUT.
 *
 * @param payload Contains the product identifier and the new base price.
 * @returns The server’s representation of the base price record.
 */
export async function setBasePrice(payload: ProductBasePriceRequest): Promise<ProductBasePriceResponse> {
    const { data } = await axiosInstance.post<ProductBasePriceResponse | { data: ProductBasePriceResponse }>("/api/products/base-price/", payload);
    return unwrapData(data);
}

/**
 * Explicitly update the base price of a product using PUT. This mirrors
 * `setBasePrice` but uses the PUT verb on the same endpoint.
 *
 * @param payload Contains the product identifier and the new base price.
 * @returns The server’s representation of the base price record.
 */
export async function updateBasePrice(payload: ProductBasePriceRequest): Promise<ProductBasePriceResponse> {
    const { data } = await axiosInstance.put<ProductBasePriceResponse | { data: ProductBasePriceResponse }>("/api/products/base-price/", payload);
    return unwrapData(data);
}

/**
 * Set or update a custom price for a user on a specific product. The
 * backend accepts both POST and PUT for this operation. This helper uses
 * POST by default. Use `updateOverridePrice` to explicitly send a PUT.
 *
 * @param payload Contains identifiers for the product and user, and the override price.
 * @returns The server’s representation of the override record.
 */
export async function setOverridePrice(payload: ProductPriceOverrideRequest): Promise<ProductPriceOverrideResponse> {
    const { data } = await axiosInstance.post<ProductPriceOverrideResponse | { data: ProductPriceOverrideResponse }>("/api/products/override/", payload);
    return unwrapData(data);
}

/**
 * Explicitly update a custom price override using PUT on the same
 * endpoint as `setOverridePrice`.
 *
 * @param payload Contains identifiers for the product and user, and the new price.
 * @returns The server’s representation of the override record.
 */
export async function updateOverridePrice(payload: ProductPriceOverrideRequest): Promise<ProductPriceOverrideResponse> {
    const { data } = await axiosInstance.put<ProductPriceOverrideResponse | { data: ProductPriceOverrideResponse }>("/api/products/override/", payload);
    return unwrapData(data);
}

/**
 * Retrieve the effective price of a product for the current user. The
 * backend resolves the price based on the user’s role and parent chain.
 *
 * @param productId The identifier of the product for which to fetch the price.
 * @returns An object describing the parent price, final price and price levels.
 */
export async function getProductPrice(productId: number): Promise<ProductPriceResponse> {
    const { data } = await axiosInstance.get<ProductPriceResponse>(`/api/products/price/${productId}/`);
    return data;
}

/**
 * Create a pricing rule for the current user. Retailers can choose to
 * apply either a percentage‑based markup or a fixed amount to the prices
 * they inherit from their upstream parent. Both POST and PUT are
 * supported by the backend. This helper uses POST by default.
 *
 * @param payload Contains the product identifier, pricing rule type and value.
 * @returns The server’s representation of the pricing rule.
 */
export async function setPricingRule(payload: PricingRuleRequest): Promise<PricingRuleResponse> {
    const { data } = await axiosInstance.post<PricingRuleResponse | { data: PricingRuleResponse }>("/api/products/pricing-rule/", payload);
    return unwrapData(data);
}

/**
 * Update an existing pricing rule for the current user using PUT.
 *
 * @param payload Contains the product identifier, pricing rule type and new value.
 * @returns The server’s representation of the pricing rule.
 */
export async function updatePricingRule(payload: PricingRuleRequest): Promise<PricingRuleResponse> {
    const { data } = await axiosInstance.put<PricingRuleResponse | { data: PricingRuleResponse }>("/api/products/pricing-rule/", payload);
    return unwrapData(data);
}
