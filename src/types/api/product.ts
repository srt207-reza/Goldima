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
    purity?: number | null;
    weight?: number | null;
    unit?: string;
    /** Flag indicating whether the product is active. */
    is_active?: boolean;
    /** ISO 8601 timestamp at which the product was created. */
    created_at?: string;
    /** ISO 8601 timestamp at which the product was last updated. */
    updated_at?: string;
    /** Additional properties returned by the backend. */
    [key: string]: unknown;
};

export type PriceTreeLevel = {
    role: string;
    user_id: string;
    parent_price: number;
    your_price: number;
    rule_type: PricingRuleType | string | null;
    rule_value: number | null;
    note: string | null;
    [key: string]: unknown;
};

export type ProductPriceSection = {
    base_price_id: number;
    market: string;
    is_active: boolean;
    base_buy_price: number;
    base_sell_price: number;
    buy_price: number | null;
    sell_price: number | null;
    final_price: number | null;
    [key: string]: unknown;
};

export type PriceAppliesTo = "BUY" | "SELL";

export type ProductPriceTreeDetail = ApiProduct & {
    product_id?: number;
    prices?: ProductPriceSection[];
    buy_price?: number | null;
    sell_price?: number | null;
    final_price?: number | null;
    levels?: PriceTreeLevel[];
};

export type GetProductsResponse = {
    data: ProductPriceTreeDetail[];
};

/**
 * Request payload for setting the base price of a product. Only `product` and
 * `price` are required per the OpenAPI spec.
 */
export interface ProductBasePriceRequest {
    product: number;
    market: string;
    buy_price: number;
    price: number;
    is_active?: boolean;
}

/**
 * Response type for the base price endpoint. The backend returns a record
 * containing the product and its current base price. Unknown keys are
 * preserved to accommodate future API extensions.
 */
export type ProductBasePriceResponse = {
    id?: number;
    product: number;
    market?: string;
    buy_price?: number;
    price: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

/**
 * Request payload for overriding a product’s price for a specific user.
 */
export interface ProductPriceOverrideRequest {
    product_id: number;
    base_price?: number;
    base_price_id?: number;
    /** Identifier of the user for whom the price is being overridden. */
    user_id: string;
    price: number;
    applies_to: PriceAppliesTo;
}

/**
 * Response type for the override price endpoint. Mirrors the request
 * structure and includes additional metadata from the server when
 * available.
 */
export type ProductPriceOverrideResponse = {
    id?: number;
    product: number;
    base_price?: number | null;
    user: string;
    price: number;
    applies_to?: PriceAppliesTo;
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
    /** Product identifier that this pricing rule belongs to. */
    product_id: number;
    base_price_id?: number | null;
    type: PricingRuleType;
    value: number;
    applies_to: PriceAppliesTo;
}

/**
 * Response type for the pricing rule endpoint. Mirrors the request but may
 * include additional metadata returned by the server.
 */
export type PricingRuleResponse = {
    id?: number;
    product?: number;
    product_id?: number;
    base_price_id?: number | null;
    type: PricingRuleType;
    value: number;
    applies_to?: PriceAppliesTo;
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
    parent_price: number | null;
    buy_price: number | null;
    sell_price: number | null;
    final_price: number | null;
    levels?: PriceTreeLevel[];
    [key: string]: unknown;
}
