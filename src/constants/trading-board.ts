export type TradingProductKey = "turkey_silver" | "uae_silver" | "usd_cash" | "try_transfer" | "aed_transfer";
export type TradingMarketKey = "tehran" | "uae" | "turkey";

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
    shortTitle: string;
    unitLabel?: string;
    aliases: string[];
    markets: TradingMarketKey[];
};

export const TRADING_MARKETS: TradingMarketDefinition[] = [
    {
        key: "tehran",
        label: "بازار تهران",
        code: "IR",
        currency: "دلار",
        aliases: ["tehran", "تهران", "iran", "ایران", "بازار تهران"],
    },
    {
        key: "uae",
        label: "بازار امارات",
        code: "AE",
        currency: "درهم",
        aliases: ["uae", "emirates", "dubai", "امارات", "دبی", "بازار امارات"],
    },
    {
        key: "turkey",
        label: "بازار ترکیه",
        code: "TR",
        currency: "لیر",
        aliases: ["turkey", "turkiye", "istanbul", "ترکیه", "استانبول", "بازار ترکیه"],
    },
];

export const TRADING_PRODUCTS: TradingProductDefinition[] = [
    {
        key: "turkey_silver",
        title: "شمش نقره ترکیه (ندیر)",
        shortTitle: "شمش نقره ترکیه",
        unitLabel: "عیار 999.9 | 1000 گرم",
        aliases: ["شمش نقره ترکیه", "نقره ترکیه", "ندیر", "نadir", "nadir", "turkey silver", "silver turkey"],
        markets: ["tehran", "turkey"],
    },
    {
        key: "uae_silver",
        title: "شمش نقره امارات",
        shortTitle: "شمش نقره امارات",
        unitLabel: "عیار 999.9 | 1000 گرم",
        aliases: ["شمش نقره امارات", "نقره امارات", "uae silver", "emirates silver", "silver uae"],
        markets: ["tehran", "uae"],
    },
    {
        key: "try_transfer",
        title: "حواله لیر ترکیه",
        shortTitle: "حواله لیر",
        aliases: ["حواله لیر ترکیه", "حواله لیر", "لیر ترکیه", "try transfer", "lira transfer"],
        markets: ["tehran", "turkey"],
    },
    {
        key: "aed_transfer",
        title: "حواله درهم امارات",
        shortTitle: "حواله درهم",
        aliases: ["حواله درهم امارات", "حواله درهم", "درهم امارات", "aed transfer", "dirham transfer"],
        markets: ["tehran", "uae"],
    },
    {
        key: "usd_cash",
        title: "اسکناس دلار آمریکا",
        shortTitle: "اسکناس دلار",
        aliases: ["اسکناس دلار آمریکا", "اسکناس دلار", "دلار آمریکا", "usd cash", "dollar cash", "usd"],
        markets: ["tehran", "uae", "turkey"],
    },
];

function normalizeLookup(value: string): string {
    return value
        .toLowerCase()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[()\[\]{}،,.]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function findTradingProduct(name: string): TradingProductDefinition | undefined {
    const normalizedName = normalizeLookup(name);

    return TRADING_PRODUCTS.find((product) =>
        product.aliases.some((alias) => normalizedName.includes(normalizeLookup(alias))),
    );
}

export function findTradingMarket(name: string): TradingMarketDefinition | undefined {
    const normalizedName = normalizeLookup(name);

    return TRADING_MARKETS.find((market) =>
        market.aliases.some((alias) => normalizedName.includes(normalizeLookup(alias))),
    );
}

export function getTradingMarket(key: TradingMarketKey): TradingMarketDefinition {
    return TRADING_MARKETS.find((market) => market.key === key) ?? TRADING_MARKETS[0];
}
