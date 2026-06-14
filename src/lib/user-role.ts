import type { ApiUser } from "@/types/api/user";

export type NormalizedUserRole = "reference" | "wholesale" | "retail" | "unknown";

const normalizeText = (value: unknown): string => {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[._-]+/g, "");
};

const ROLE_ALIASES: Record<Exclude<NormalizedUserRole, "unknown">, string[]> = {
    reference: ["مرجع", "master", "MASTER", "reference", "referrer", "agent", "reseller"],
    wholesale: ["عمدهفروش", "عمده", "wholesale", "wholesaler", "bulk"],
    retail: ["تکفروش", "تک", "retail", "retailer", "single"],
};

export function getNormalizedUserRole(user?: ApiUser | null): NormalizedUserRole {
    if (!user) {
        return "unknown";
    }

    const candidateFields: unknown[] = [
        user.role,
        user.user_role,
        user.account_type,
        user.business_role,
        user.type,
    ];

    for (const candidate of candidateFields) {
        const normalized = normalizeText(candidate);

        if (!normalized) continue;

        for (const [role, aliases] of Object.entries(ROLE_ALIASES) as [
            Exclude<NormalizedUserRole, "unknown">,
            string[],
        ][]) {
            if (aliases.some((alias) => normalizeText(alias) === normalized || normalized.includes(normalizeText(alias)))) {
                return role;
            }
        }

        return "unknown";
    }

    return "unknown";
}

export function canViewReferenceTools(user?: ApiUser | null): boolean {
    return getNormalizedUserRole(user) === "reference";
}

export function canViewUserManagement(user?: ApiUser | null): boolean {
    const role = getNormalizedUserRole(user);
    return role === "reference" || role === "wholesale";
}

export function canViewPricingTools(user?: ApiUser | null): boolean {
    const role = getNormalizedUserRole(user);
    return role === "reference" || role === "wholesale";
}

export function getDisplayName(user?: ApiUser | null): string {
    if (!user) {
        return "GOLDIMA";
    }

    const fullName = [user.first_name, user.last_name].map((part) => (typeof part === "string" ? part.trim() : "")).filter(Boolean).join(" ");

    if (fullName) {
        return fullName;
    }

    if (typeof user.business_name === "string" && user.business_name.trim()) {
        return user.business_name.trim();
    }

    if (typeof user.username === "string" && user.username.trim()) {
        return user.username.trim();
    }

    return "GOLDIMA";
}

export function getBusinessLabel(user?: ApiUser | null): string {
    if (user?.business_name && String(user.business_name).trim()) {
        return String(user.business_name).trim();
    }

    return getDisplayName(user);
}
