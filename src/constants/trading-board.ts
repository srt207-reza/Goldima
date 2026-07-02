export type TradingMarketKey = "tehran" | "uae" | "turkey";

export type TradingProductKey = "turkey_silver" | "uae_silver" | "usd_cash" | "try_transfer" | "aed_transfer";

export type TradingMarketDefinition = {
    key: TradingMarketKey;
    label: string;
    code: string;
    currency: string;
    aliases: string[];
};

export type TradingProductDefinition = {
    key: TradingProductKey;
    title: string;
    unitLabel?: string;
    markets: TradingMarketKey[];
    aliases: string[];
};

export const TRADING_MARKETS: TradingMarketDefinition[] = [
    {
        key: "tehran",
        label: "بازار تهران",
        code: "IR",
        currency: "ریال",
        aliases: ["tehran", "تهران", "iran", "ir", "بازار تهران"],
    },
    {
        key: "uae",
        label: "بازار امارات",
        code: "AE",
        currency: "درهم",
        aliases: ["uae", "emirates", "dubai", "دبی", "امارات", "بازار امارات"],
    },
    {
        key: "turkey",
        label: "بازار ترکیه",
        code: "TR",
        currency: "لیر",
        aliases: ["turkey", "turkiye", "ترکیه", "بازار ترکیه"],
    },
];

export const TRADING_PRODUCTS: TradingProductDefinition[] = [
    {
        key: "turkey_silver",
        title: "شمش نقره ترکیه (ندیر)",
        unitLabel: "عیار ۹۹۹.۹ - ۱۰۰۰ گرم",
        markets: ["tehran", "turkey"],
        aliases: [
            "turkey silver",
            "turkish silver",
            "nadir turkey silver",
            "nadir silver",
            "nadir",
            "ندیر",
            "شمش نقره ترکیه",
            "شمش نقره ترکیه ندیر",
            "شمش نقره ترکیه (ندیر)",
        ],
    },
    {
        key: "uae_silver",
        title: "شمش نقره امارات",
        unitLabel: "عیار ۹۹۹.۹ - ۱۰۰۰ گرم",
        markets: ["tehran", "uae"],
        aliases: [
            "uae silver",
            "emirates silver",
            "dubai silver",
            "شمش نقره امارات",
            "شمش نقره دبی",
        ],
    },
    {
        key: "usd_cash",
        title: "اسکناس دلار آمریکا",
        markets: ["tehran", "uae", "turkey"],
        aliases: [
            "usd cash",
            "usd",
            "dollar cash",
            "us dollar",
            "american dollar",
            "اسکناس دلار",
            "اسکناس دلار آمریکا",
            "دلار آمریکا",
            "دلار",
        ],
    },
    {
        key: "try_transfer",
        title: "حواله لیر ترکیه",
        markets: ["tehran"],
        aliases: [
            "try transfer",
            "turkish lira transfer",
            "lira transfer",
            "حواله لیر",
            "حواله لیر ترکیه",
            "لیر ترکیه",
        ],
    },
    {
        key: "aed_transfer",
        title: "حواله درهم امارات",
        markets: ["tehran"],
        aliases: [
            "aed transfer",
            "dirham transfer",
            "uae dirham transfer",
            "حواله درهم",
            "حواله درهم امارات",
            "درهم امارات",
        ],
    },
];

function normalizeLookupValue(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[ي]/g, "ی")
        .replace(/[ك]/g, "ک")
        .replace(/[\u200c_\-()]/g, " ")
        .replace(/\s+/g, " ");
}

function includesAlias(value: string, aliases: string[]): boolean {
    const normalizedAliases = aliases.map(normalizeLookupValue);
    return normalizedAliases.some((alias) => value === alias || value.includes(alias) || alias.includes(value));
}

export function findTradingMarket(market: unknown): TradingMarketDefinition | undefined {
    const normalized = normalizeLookupValue(market);
    if (!normalized) return undefined;

    return TRADING_MARKETS.find((definition) => definition.key === normalized || includesAlias(normalized, definition.aliases));
}

export function getTradingMarket(key: TradingMarketKey): TradingMarketDefinition {
    const market = TRADING_MARKETS.find((definition) => definition.key === key);
    if (!market) {
        throw new Error(`Trading market "${key}" is not defined.`);
    }

    return market;
}

export function findTradingProduct(productName: unknown): TradingProductDefinition | undefined {
    const normalized = normalizeLookupValue(productName);
    if (!normalized) return undefined;

    return TRADING_PRODUCTS.find((definition) => definition.key === normalized || includesAlias(normalized, definition.aliases));
}
