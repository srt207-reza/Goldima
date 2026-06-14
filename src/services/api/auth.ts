import { isValidJalaaliDate } from "jalaali-js";
import { axiosInstance } from "@/lib/axios";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import type {
    AuthTokenPairLike,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
    RegisterRequest,
    RegisterResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
} from "@/types/api/auth";

const MOBILE_USERNAME_REGEX = /^(\+98|0)?9\d{9}$/;
const PERSIAN_DIGIT_MAP: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
};

function normalizeDigits(value: string): string {
    return value.replace(/[۰-۹٠-٩]/g, (digit) => PERSIAN_DIGIT_MAP[digit] ?? digit);
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function assertRequired(value: string, label: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${label} الزامی است.`);
    }
}

function validateMobile(value: string, label = "شماره موبایل"): void {
    assertRequired(value, label);
    if (!MOBILE_USERNAME_REGEX.test(value.trim())) {
        throw new Error(`${label} نامعتبر است.`);
    }
}

function validateTelephone(value: string): void {
    assertRequired(value, "تلفن");
}

function validatePassword(value: string): void {
    assertRequired(value, "رمز عبور");
    if (!PASSWORD_REGEX.test(value)) {
        throw new Error("رمز عبور باید حداقل ۸ کاراکتر، شامل حروف بزرگ و کوچک، عدد و کاراکتر ویژه باشد.");
    }
}

function validateEmail(value: string): void {
    assertRequired(value, "ایمیل");
    if (!EMAIL_REGEX.test(value.trim())) {
        throw new Error("ایمیل وارد شده معتبر نیست.");
    }
}

function validateIsoDate(value: string): void {
    assertRequired(value, "تاریخ تولد");

    const trimmedValue = normalizeDigits(value.trim());
    if (!ISO_DATE_REGEX.test(trimmedValue)) {
        throw new Error("تاریخ تولد باید در قالب YYYY-MM-DD باشد.");
    }

    const [year, month, day] = trimmedValue.split("-").map((part) => Number(part));
    if (![year, month, day].every((part) => Number.isInteger(part)) || !isValidJalaaliDate(year, month, day)) {
        throw new Error("تاریخ تولد شمسی معتبر نیست.");
    }
}

function validateRegisterPayload(payload: RegisterRequest): void {
    validateMobile(payload.username, "نام کاربری");
    validatePassword(payload.password);
    assertRequired(payload.first_name, "نام");
    assertRequired(payload.last_name, "نام خانوادگی");
    validateEmail(payload.email);
    validateIsoDate(payload.birth_date);
    assertRequired(payload.business_name, "نام کسب‌وکار");
    assertRequired(payload.business_handler, "شناسه لینک اختصاصی");
    if (!/^[-a-zA-Z0-9_]+$/.test(payload.business_handler.trim())) {
        throw new Error("شناسه لینک اختصاصی فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و آندرلاین باشد.");
    }
    assertRequired(payload.address, "آدرس");
    validateTelephone(payload.telephone);
}

function validateLoginPayload(payload: LoginRequest): void {
    validateMobile(payload.username, "نام کاربری");
    assertRequired(payload.password, "رمز عبور");
}

function validateLogoutPayload(payload: LogoutRequest): void {
    assertRequired(payload.refresh, "refresh token");
}

function validateTokenRefreshPayload(payload: TokenRefreshRequest): void {
    assertRequired(payload.refresh, "refresh token");
}

function normalizeTokenPair(data: unknown): AuthTokenPairLike {
    if (
        data &&
        typeof data === "object" &&
        typeof (data as AuthTokenPairLike).access === "string"
    ) {
        return {
            access: (data as AuthTokenPairLike).access,
            refresh:
                typeof (data as AuthTokenPairLike).refresh === "string"
                    ? (data as AuthTokenPairLike).refresh
                    : undefined,
        };
    }

    throw new Error("پاسخ سرور برای توکن معتبر نیست.");
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
    validateLoginPayload(payload);

    const { data } = await axiosInstance.post<unknown>("/api/login/", payload);
    const tokens = normalizeTokenPair(data);

    if (!tokens.refresh) {
        throw new Error("توکن refresh در پاسخ ورود دریافت نشد.");
    }

    return {
        access: tokens.access,
        refresh: tokens.refresh,
    };
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
    validateRegisterPayload(payload);

    const { parent_business_handler, ...requestPayload } = payload;
    const parentBusinessHandler = normalizeBusinessPathSegment(parent_business_handler || DEFAULT_PARENT_BUSINESS_HANDLER);
    const registerEndpoint = `/api/${encodeURIComponent(parentBusinessHandler)}/register/`;

    const { data } = await axiosInstance.post<unknown>(registerEndpoint, requestPayload);
    return data;
}

export async function logoutUser(payload: LogoutRequest): Promise<LogoutResponse> {
    validateLogoutPayload(payload);
    await axiosInstance.post("/api/logout/", payload);
}

export async function refreshAccessToken(
    payload: TokenRefreshRequest,
): Promise<TokenRefreshResponse> {
    validateTokenRefreshPayload(payload);

    const { data } = await axiosInstance.post<unknown>("/api/token/refresh/", payload);
    const tokens = normalizeTokenPair(data);

    return {
        access: tokens.access,
        refresh: tokens.refresh,
    };
}
