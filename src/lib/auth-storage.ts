import Cookies from "js-cookie";

export const ACCESS_TOKEN_COOKIE = "auth_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
};

export type AuthTokenPair = {
    access: string;
    refresh?: string;
};

function readCookie(name: string): string | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    return Cookies.get(name);
}

export function getAccessToken(): string | undefined {
    return readCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | undefined {
    return readCookie(REFRESH_TOKEN_COOKIE);
}

export function setAuthTokens(tokens: AuthTokenPair): void {
    if (tokens.access) {
        Cookies.set(ACCESS_TOKEN_COOKIE, tokens.access, {
            ...cookieOptions,
            expires: 1,
        });
    }

    if (tokens.refresh) {
        Cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh, {
            ...cookieOptions,
            expires: 30,
        });
    }
}

export function clearAuthTokens(): void {
    Cookies.remove(ACCESS_TOKEN_COOKIE, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_COOKIE, { path: "/" });
}

export function hasAccessToken(value: unknown): value is { access: string; refresh?: string } {
    return Boolean(
        value &&
            typeof value === "object" &&
            typeof (value as { access?: unknown }).access === "string" &&
            (typeof (value as { refresh?: unknown }).refresh === "undefined" ||
                typeof (value as { refresh?: unknown }).refresh === "string"),
    );
}
