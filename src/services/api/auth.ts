import axios, { type AxiosError } from "axios";
import { isValidJalaaliDate } from "jalaali-js";
import { axiosInstance } from "@/lib/axios";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import type {
    AuthTokenPairLike,
    LogoutRequest,
    LogoutResponse,
    PhoneLoginRequest,
    PhoneLoginResponse,
    PhoneRegisterRequest,
    PhoneRegisterResponse,
    PhoneSendOtpRequest,
    PhoneSendOtpResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
} from "@/types/api/auth";

const MOBILE_USERNAME_REGEX = /^(\+98|0)?9\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const OTP_CODE_REGEX = /^\d{6}$/;
const BUSINESS_HANDLER_REGEX = /^[-a-zA-Z0-9_]+$/;
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

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

export function normalizeDigits(value: string): string {
    return value.replace(/[۰-۹٠-٩]/g, (digit) => PERSIAN_DIGIT_MAP[digit] ?? digit);
}

export function normalizeMobileUsername(value: string): string {
    return normalizeDigits(value).trim();
}

function normalizeOtpCode(value: string): string {
    return normalizeDigits(value).trim();
}

function assertRequired(value: string, label: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${label} الزامی است.`);
    }
}

function validateMobile(value: string, label = "شماره موبایل"): void {
    assertRequired(value, label);
    if (!MOBILE_USERNAME_REGEX.test(normalizeMobileUsername(value))) {
        throw new Error(`${label} نامعتبر است.`);
    }
}

function validateOtpCode(value: string): void {
    assertRequired(value, "کد تایید");
    if (!OTP_CODE_REGEX.test(normalizeOtpCode(value))) {
        throw new Error("کد تایید باید ۶ رقم باشد.");
    }
}

function validateTelephone(value: string): void {
    assertRequired(value, "تلفن");
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

function validateBusinessLogo(file?: File | null): void {
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
        throw new Error("فرمت لوگو باید PNG، JPG، WEBP یا SVG باشد.");
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
        throw new Error("حجم لوگو نباید بیشتر از ۲ مگابایت باشد.");
    }
}

function validateSendOtpPayload(payload: PhoneSendOtpRequest): void {
    validateMobile(payload.phone_number);
}

function validatePhoneLoginPayload(payload: PhoneLoginRequest): void {
    validateMobile(payload.username, "شماره موبایل");
    validateOtpCode(payload.code);
}

function validatePhoneRegisterPayload(payload: PhoneRegisterRequest): void {
    validateMobile(payload.username, "شماره موبایل");
    validateOtpCode(payload.code);
    assertRequired(payload.first_name, "نام");
    assertRequired(payload.last_name, "نام خانوادگی");
    validateEmail(payload.email);
    validateIsoDate(payload.birth_date);
    assertRequired(payload.business_name, "نام کسب‌وکار");
    assertRequired(payload.business_handler, "شناسه لینک اختصاصی");

    if (!BUSINESS_HANDLER_REGEX.test(payload.business_handler.trim())) {
        throw new Error("شناسه لینک اختصاصی فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و آندرلاین باشد.");
    }

    assertRequired(payload.address, "آدرس");
    validateTelephone(payload.telephone);
    validateBusinessLogo(payload.business_logo);
}

function validateLogoutPayload(payload: LogoutRequest): void {
    assertRequired(payload.refresh, "refresh token");
}

function validateTokenRefreshPayload(payload: TokenRefreshRequest): void {
    assertRequired(payload.refresh, "refresh token");
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : fallback;
    }

    const axiosError = error as AxiosError<unknown>;
    const data = axiosError.response?.data;

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;

        if (typeof record.message === "string") return record.message;
        if (typeof record.detail === "string") return record.detail;

        const firstValidationError = Object.values(record).find((value) => Array.isArray(value) && typeof value[0] === "string");
        if (Array.isArray(firstValidationError) && typeof firstValidationError[0] === "string") {
            return firstValidationError[0];
        }
    }

    return fallback;
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

function appendFormValue(formData: FormData, key: string, value: string | File | null | undefined): void {
    if (value === null || typeof value === "undefined") return;

    if (value instanceof File) {
        formData.append(key, value);
        return;
    }

    if (value.trim().length > 0) {
        formData.append(key, value.trim());
    }
}

function buildPhoneRegisterFormData(payload: PhoneRegisterRequest): FormData {
    const formData = new FormData();
    const parentBusinessHandler = normalizeBusinessPathSegment(payload.parent_business_handler || DEFAULT_PARENT_BUSINESS_HANDLER);

    appendFormValue(formData, "username", normalizeMobileUsername(payload.username));
    appendFormValue(formData, "code", normalizeOtpCode(payload.code));
    appendFormValue(formData, "first_name", payload.first_name);
    appendFormValue(formData, "last_name", payload.last_name);
    appendFormValue(formData, "email", payload.email);
    appendFormValue(formData, "birth_date", normalizeDigits(payload.birth_date));
    appendFormValue(formData, "business_name", payload.business_name);
    appendFormValue(formData, "business_handler", normalizeBusinessPathSegment(payload.business_handler));
    appendFormValue(formData, "address", payload.address);
    appendFormValue(formData, "telephone", normalizeDigits(payload.telephone));
    appendFormValue(formData, "business_logo", payload.business_logo);
    appendFormValue(formData, "parent_business_handler", parentBusinessHandler);

    return formData;
}

export async function sendPhoneOtp(payload: PhoneSendOtpRequest): Promise<PhoneSendOtpResponse> {
    try {
        validateSendOtpPayload(payload);

        const { data } = await axiosInstance.post<PhoneSendOtpResponse>("/api/phone/send-otp/", {
            phone_number: normalizeMobileUsername(payload.phone_number),
        });

        return data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "ارسال کد تایید با خطا مواجه شد."));
    }
}

export async function phoneLogin(payload: PhoneLoginRequest): Promise<PhoneLoginResponse> {
    try {
        validatePhoneLoginPayload(payload);

        const { data } = await axiosInstance.post<PhoneLoginResponse>("/api/phone/login/", {
            username: normalizeMobileUsername(payload.username),
            code: normalizeOtpCode(payload.code),
        });

        const tokens = normalizeTokenPair(data);
        if (!tokens.refresh) {
            throw new Error("توکن refresh در پاسخ ورود دریافت نشد.");
        }

        return data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "ورود با کد تایید با خطا مواجه شد."));
    }
}

export async function phoneRegister(payload: PhoneRegisterRequest): Promise<PhoneRegisterResponse> {
    try {
        validatePhoneRegisterPayload(payload);

        const formData = buildPhoneRegisterFormData(payload);
        const { data } = await axiosInstance.post<PhoneRegisterResponse>("/api/phone/register/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const tokens = normalizeTokenPair(data);
        if (!tokens.refresh) {
            throw new Error("توکن refresh در پاسخ ثبت‌نام دریافت نشد.");
        }

        return data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "ثبت‌نام با کد تایید با خطا مواجه شد."));
    }
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

export const loginUser = phoneLogin;
export const registerUser = phoneRegister;
