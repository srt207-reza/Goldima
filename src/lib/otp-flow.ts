import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { normalizeDigits, normalizeMobileUsername } from "@/services/api/auth";

export const OTP_CODE_LENGTH = 6;
export const PENDING_PHONE_REGISTER_STORAGE_KEY = "goldima:pending-phone-register";

export type OtpMode = "login" | "register";

export type StoredLogoUpload = {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    dataUrl: string;
};

export type PendingPhoneRegisterPayload = {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    business_name: string;
    business_handler: string;
    address: string;
    province: string;
    city: string;
    telephone: string;
    parent_business_handler?: string;
    business_logo?: StoredLogoUpload | null;
};

type BuildOtpPageUrlOptions = {
    mode: OtpMode;
    username: string;
    businessHandler?: string;
};

function assertBrowserStorage(): Storage {
    if (typeof window === "undefined") {
        throw new Error("ذخیره‌سازی موقت فقط در مرورگر قابل استفاده است.");
    }

    return window.sessionStorage;
}

export function normalizeOtpCode(value: string): string {
    return normalizeDigits(value).replace(/\D/g, "").slice(0, OTP_CODE_LENGTH);
}

export function isOtpComplete(value: string): boolean {
    return normalizeOtpCode(value).length === OTP_CODE_LENGTH;
}

export function buildOtpPageUrl({ mode, username, businessHandler }: BuildOtpPageUrlOptions): string {
    const params = new URLSearchParams({
        mode,
        username: normalizeMobileUsername(username),
    });

    const normalizedBusinessHandler = normalizeBusinessPathSegment(businessHandler || DEFAULT_PARENT_BUSINESS_HANDLER);
    if (normalizedBusinessHandler) {
        params.set("business_handler", normalizedBusinessHandler);
    }

    return `/otp?${params.toString()}`;
}

export function normalizeOtpMode(value: string | null): OtpMode {
    return value === "register" ? "register" : "login";
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("خواندن فایل لوگو با خطا مواجه شد."));
        reader.readAsDataURL(file);
    });
}

export async function toStoredLogoUpload(file: File | null | undefined): Promise<StoredLogoUpload | null> {
    if (!file) return null;

    return {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        dataUrl: await fileToDataUrl(file),
    };
}

export async function storedLogoUploadToFile(upload: StoredLogoUpload | null | undefined): Promise<File | null> {
    if (!upload?.dataUrl) return null;

    const response = await fetch(upload.dataUrl);
    const blob = await response.blob();

    return new File([blob], upload.name, {
        type: upload.type,
        lastModified: upload.lastModified,
    });
}

export async function savePendingPhoneRegisterPayload(payload: Omit<PendingPhoneRegisterPayload, "business_logo"> & { business_logo?: File | null }): Promise<void> {
    const storage = assertBrowserStorage();
    const storedPayload: PendingPhoneRegisterPayload = {
        ...payload,
        username: normalizeMobileUsername(payload.username),
        birth_date: normalizeDigits(payload.birth_date),
        business_handler: (payload.business_handler || payload.business_name).trim(),
        telephone: normalizeDigits(payload.telephone),
        parent_business_handler: normalizeBusinessPathSegment(payload.parent_business_handler || DEFAULT_PARENT_BUSINESS_HANDLER),
        business_logo: await toStoredLogoUpload(payload.business_logo),
    };

    storage.setItem(PENDING_PHONE_REGISTER_STORAGE_KEY, JSON.stringify(storedPayload));
}

export function getPendingPhoneRegisterPayload(): PendingPhoneRegisterPayload | null {
    try {
        const storage = assertBrowserStorage();
        const rawPayload = storage.getItem(PENDING_PHONE_REGISTER_STORAGE_KEY);
        if (!rawPayload) return null;

        const payload = JSON.parse(rawPayload) as PendingPhoneRegisterPayload;
        if (!payload || typeof payload !== "object" || !payload.username) return null;

        return payload;
    } catch {
        return null;
    }
}

export function clearPendingPhoneRegisterPayload(): void {
    try {
        assertBrowserStorage().removeItem(PENDING_PHONE_REGISTER_STORAGE_KEY);
    } catch {
        // no-op
    }
}
