import { normalizeBusinessPathSegment } from "@/lib/business-path";

export type RegisterOtpSession = {
    username: string;
    code: string;
    business_handler: string;
    created_at: number;
};

const REGISTER_OTP_SESSION_KEY = "goldima:register-otp-session";
const REGISTER_OTP_SESSION_TTL_MS = 10 * 60 * 1000;

function canUseSessionStorage(): boolean {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function normalizeUsername(value: string): string {
    return value.trim();
}

export function saveRegisterOtpSession(session: Omit<RegisterOtpSession, "created_at">): void {
    if (!canUseSessionStorage()) return;

    const payload: RegisterOtpSession = {
        username: normalizeUsername(session.username),
        code: session.code.trim(),
        business_handler: normalizeBusinessPathSegment(session.business_handler),
        created_at: Date.now(),
    };

    window.sessionStorage.setItem(REGISTER_OTP_SESSION_KEY, JSON.stringify(payload));
}

export function readRegisterOtpSession(filters?: {
    username?: string;
    business_handler?: string;
}): RegisterOtpSession | null {
    if (!canUseSessionStorage()) return null;

    const rawSession = window.sessionStorage.getItem(REGISTER_OTP_SESSION_KEY);
    if (!rawSession) return null;

    try {
        const session = JSON.parse(rawSession) as Partial<RegisterOtpSession>;
        const createdAt = typeof session.created_at === "number" ? session.created_at : 0;

        if (!session.username || !session.code || Date.now() - createdAt > REGISTER_OTP_SESSION_TTL_MS) {
            clearRegisterOtpSession();
            return null;
        }

        const normalizedSession: RegisterOtpSession = {
            username: normalizeUsername(session.username),
            code: session.code.trim(),
            business_handler: normalizeBusinessPathSegment(session.business_handler || ""),
            created_at: createdAt,
        };

        if (filters?.username && normalizedSession.username !== normalizeUsername(filters.username)) {
            return null;
        }

        if (
            filters?.business_handler &&
            normalizedSession.business_handler !== normalizeBusinessPathSegment(filters.business_handler)
        ) {
            return null;
        }

        return normalizedSession;
    } catch {
        clearRegisterOtpSession();
        return null;
    }
}

export function clearRegisterOtpSession(): void {
    if (!canUseSessionStorage()) return;
    window.sessionStorage.removeItem(REGISTER_OTP_SESSION_KEY);
}
