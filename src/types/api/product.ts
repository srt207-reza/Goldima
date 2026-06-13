// Type definitions for product-related API entities.

/**
 * A product record returned from the API. Only a handful of fields are defined
 * here based on the provided OpenAPI specification. Unknown properties are
 * allowed so that the type remains forward compatible with additional
 * attributes returned by the server.
 */
export type ApiProduct = {
    /** Unique identifier for the product. */
    id: number;
    /** Human‑readable name of the product. */
    name: string;
    /** Flag indicating whether the product is active. */
    is_active?: boolean;
    /** ISO 8601 timestamp at which the product was created. */
    created_at?: string;
    /** ISO 8601 timestamp at which the product was last updated. */
    updated_at?: string;
    /** Additional properties returned by the backend. */
    [key: string]: unknown;
};

/**
 * Request payload for setting the base price of a product. Only `product` and
 * `price` are required per the OpenAPI spec.
 */
export interface ProductBasePriceRequest {
    product: number;
    price: number;
}

/**
 * Response type for the base price endpoint. The backend returns a record
 * containing the product and its current base price. Unknown keys are
 * preserved to accommodate future API extensions.
 */
export type ProductBasePriceResponse = {
    id?: number;
    product: number;
    price: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

/**
 * Request payload for overriding a product’s price for a specific user.
 */
export interface ProductPriceOverrideRequest {
    product: number;
    /** Identifier of the user for whom the price is being overridden. */
    user: string;
    price: number;
}

/**
 * Response type for the override price endpoint. Mirrors the request
 * structure and includes additional metadata from the server when
 * available.
 */
export type ProductPriceOverrideResponse = {
    id?: number;
    product: number;
    user: string;
    price: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

/**
 * Enumerated pricing rule types supported by the API. Retailers can choose
 * to add a fixed amount or a percentage over their upstream price.
 */
export type PricingRuleType = "PERCENT" | "FIXED";

/**
 * Request payload for creating or updating a pricing rule for the
 * currently authenticated user. Both `type` and `value` are mandatory.
 */
export interface PricingRuleRequest {
    type: PricingRuleType;
    value: number;
}

/**
 * Response type for the pricing rule endpoint. Mirrors the request but may
 * include additional metadata returned by the server.
 */
export type PricingRuleResponse = {
    id?: number;
    type: PricingRuleType;
    value: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

/**
 * Response type for retrieving a product’s price relative to the current
 * user. The backend returns the parent price, final price and an array of
 * level descriptors that explain how the final price was derived across
 * hierarchical roles. Unknown keys are preserved for forward compatibility.
 */
export interface ProductPriceResponse {
    parent_price: number;
    final_price: number;
    levels: Array<{
        role: string;
        parent_price: number;
        your_price: number;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}