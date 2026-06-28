import axios, { type AxiosError } from "axios";
import { isValidJalaaliDate } from "jalaali-js";
import { axiosInstance } from "@/lib/axios";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import type {
    AuthTokenPairLike,
    AuthBusinessProfile,
    AuthUserDetail,
    LogoutRequest,
    LogoutResponse,
    PhoneEmployeeRegisterRequest,
    PhoneEmployeeRegisterResponse,
    PhoneLoginRequest,
    PhoneLoginResponse,
    PhoneRegisterRequest,
    PhoneRegisterResponse,
    PhoneSendOtpRequest,
    PhoneSendOtpResponse,
    PhoneVerifyOtpRequest,
    PhoneVerifyOtpResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
} from "@/types/api/auth";

const MOBILE_USERNAME_REGEX = /^(\+98|0)?9\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const OTP_CODE_REGEX = /^\d{6}$/;
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export class ActiveOtpCodeError extends Error {
    isRegistered?: boolean;

    constructor(message: string, isRegistered?: boolean) {
        super(message);
        this.name = "ActiveOtpCodeError";
        this.isRegistered = isRegistered;
    }
}

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

function validateBusinessLogo(file?: File | string | null): void {
    if (!file || typeof file === "string") return;

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

function validatePhoneVerifyOtpPayload(payload: PhoneVerifyOtpRequest): void {
    validatePhoneLoginPayload(payload);
}

function validatePhoneRegisterPayload(payload: PhoneRegisterRequest): void {
    validateMobile(payload.username, "شماره موبایل");
    validateOtpCode(payload.code);
    assertRequired(payload.first_name, "نام");
    assertRequired(payload.last_name, "نام خانوادگی");
    validateEmail(payload.email);
    validateIsoDate(payload.birth_date);
    assertRequired(payload.business_name, "نام کسب‌وکار");
    assertRequired(payload.address, "آدرس");
    assertRequired(payload.province, "استان");
    assertRequired(payload.city, "شهر");
    validateTelephone(payload.telephone);
    validateBusinessLogo(payload.business_logo);
}

function validatePhoneEmployeeRegisterPayload(payload: PhoneEmployeeRegisterRequest): void {
    validateMobile(payload.username, "شماره موبایل");
    validateOtpCode(payload.code);
    assertRequired(payload.first_name, "نام");
    assertRequired(payload.last_name, "نام خانوادگی");
    validateEmail(payload.email);
    validateIsoDate(payload.birth_date);

    if (!Number.isInteger(payload.business_id) || payload.business_id <= 0) {
        throw new Error("شناسه فروشگاه معتبر نیست.");
    }
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

function getActiveOtpIsRegistered(error: AxiosError<unknown>): boolean | undefined {
    const data = error.response?.data;

    if (!data || typeof data !== "object") {
        return undefined;
    }

    const record = data as Record<string, unknown>;
    return typeof record.is_registered === "boolean" ? record.is_registered : undefined;
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

type RawAuthUser = Partial<AuthUserDetail> & {
    id?: string | number;
    business?: Partial<AuthBusinessProfile> | null;
};

type RawAuthBusinessProfile = {
    id?: string | number;
    user?: RawAuthUser | null;
    business_name?: string | null;
    business_handler?: string | null;
    address?: string | null;
    province?: string | null;
    city?: string | null;
    telephone?: string | null;
    business_logo?: string | null;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

function normalizeAuthUser(user: RawAuthUser): AuthUserDetail {
    return {
        id: String(user.id ?? ""),
        username: String(user.username ?? ""),
        first_name: String(user.first_name ?? ""),
        last_name: String(user.last_name ?? ""),
        email: String(user.email ?? ""),
        birth_date: typeof user.birth_date === "string" ? user.birth_date : null,
        role: String(user.role ?? ""),
        status: String(user.status ?? ""),
        parent: typeof user.parent === "string" ? user.parent : null,
        is_employee: Boolean(user.is_employee),
        last_login: typeof user.last_login === "string" ? user.last_login : null,
        date_joined: typeof user.date_joined === "string" ? user.date_joined : undefined,
    };
}

function normalizeAuthBusinessProfileFromUser(user: RawAuthUser): AuthBusinessProfile {
    const business = user.business;

    if (!business || typeof business !== "object") {
        throw new Error("پاسخ سرور شامل اطلاعات فروشگاه نیست.");
    }

    return {
        id: Number(business.id ?? 0),
        user: normalizeAuthUser(user),
        business_name: String(business.business_name ?? ""),
        business_handler:
            typeof business.business_handler === "string"
                ? business.business_handler
                : null,
        address: String(business.address ?? ""),
        province: String(business.province ?? ""),
        city: String(business.city ?? ""),
        telephone: String(business.telephone ?? ""),
        business_logo:
            typeof business.business_logo === "string"
                ? business.business_logo
                : null,
        is_active:
            typeof business.is_active === "boolean"
                ? business.is_active
                : true,
        created_at: String(business.created_at ?? ""),
        updated_at: String(business.updated_at ?? ""),
    };
}

function normalizeAuthBusinessProfileFromRawBusiness(
    business: RawAuthBusinessProfile,
    user: RawAuthUser
): AuthBusinessProfile {
    return {
        id: Number(business.id ?? 0),
        user: normalizeAuthUser(user),
        business_name: String(business.business_name ?? ""),
        business_handler:
            typeof business.business_handler === "string"
                ? business.business_handler
                : null,
        address: String(business.address ?? ""),
        province: String(business.province ?? ""),
        city: String(business.city ?? ""),
        telephone: String(business.telephone ?? ""),
        business_logo:
            typeof business.business_logo === "string"
                ? business.business_logo
                : null,
        is_active:
            typeof business.is_active === "boolean"
                ? business.is_active
                : true,
        created_at: String(business.created_at ?? ""),
        updated_at: String(business.updated_at ?? ""),
    };
}

function normalizePhoneAuthResponse<
    T extends
        | PhoneLoginResponse
        | PhoneRegisterResponse
        | PhoneEmployeeRegisterResponse,
>(data: unknown): T {
    const tokens = normalizeTokenPair(data);

    if (!tokens.refresh) {
        throw new Error("توکن refresh در پاسخ ورود/ثبت‌نام دریافت نشد.");
    }

    const record =
        data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : {};

    const rawUser =
        record.user && typeof record.user === "object"
            ? (record.user as RawAuthUser)
            : null;

    const rawUserProfile =
        record.user_profile && typeof record.user_profile === "object"
            ? (record.user_profile as RawAuthBusinessProfile)
            : null;

    if (rawUser) {
        const userProfile =
            rawUser.business && typeof rawUser.business === "object"
                ? normalizeAuthBusinessProfileFromUser(rawUser)
                : rawUserProfile
                    ? normalizeAuthBusinessProfileFromRawBusiness(rawUserProfile, rawUser)
                    : null;

        if (userProfile) {
            return {
                access: tokens.access,
                refresh: tokens.refresh,
                user: userProfile.user,
                user_profile: userProfile,
            } as T;
        }
    }

    if (rawUserProfile) {
        const profileUser =
            rawUserProfile.user && typeof rawUserProfile.user === "object"
                ? rawUserProfile.user
                : null;

        if (!profileUser) {
            return {
                ...(record as object),
                access: tokens.access,
                refresh: tokens.refresh,
                user_profile: rawUserProfile,
            } as T;
        }

        return {
            ...(record as object),
            access: tokens.access,
            refresh: tokens.refresh,
            user: normalizeAuthUser(profileUser),
            user_profile: normalizeAuthBusinessProfileFromRawBusiness(rawUserProfile, profileUser),
        } as T;
    }

    throw new Error("پاسخ ورود/ثبت‌نام سرور معتبر نیست.");
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
    const businessHandler = (payload.business_handler || payload.business_name).trim();

    appendFormValue(formData, "username", normalizeMobileUsername(payload.username));
    appendFormValue(formData, "code", normalizeOtpCode(payload.code));
    appendFormValue(formData, "first_name", payload.first_name);
    appendFormValue(formData, "last_name", payload.last_name);
    appendFormValue(formData, "email", payload.email);
    appendFormValue(formData, "birth_date", normalizeDigits(payload.birth_date));
    appendFormValue(formData, "business_name", payload.business_name);
    appendFormValue(formData, "business_handler", businessHandler);
    appendFormValue(formData, "address", payload.address);
    appendFormValue(formData, "province", payload.province);
    appendFormValue(formData, "city", payload.city);
    appendFormValue(formData, "telephone", normalizeDigits(payload.telephone));
    appendFormValue(formData, "business_logo", payload.business_logo);
    appendFormValue(formData, "parent_business_handler", parentBusinessHandler);

    return formData;
}

function hasBusinessLogoFile(payload: PhoneRegisterRequest): boolean {
    return typeof File !== "undefined" && payload.business_logo instanceof File;
}

function buildPhoneRegisterJsonPayload(payload: PhoneRegisterRequest) {
    const parentBusinessHandler = normalizeBusinessPathSegment(payload.parent_business_handler || DEFAULT_PARENT_BUSINESS_HANDLER);
    const businessHandler = (payload.business_handler || payload.business_name).trim();

    return {
        username: normalizeMobileUsername(payload.username),
        code: normalizeOtpCode(payload.code),
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email: payload.email.trim(),
        birth_date: normalizeDigits(payload.birth_date.trim()),
        business_name: payload.business_name.trim(),
        business_handler: businessHandler,
        address: payload.address.trim(),
        province: payload.province.trim(),
        city: payload.city.trim(),
        telephone: normalizeDigits(payload.telephone.trim()),
        business_logo: typeof payload.business_logo === "string" ? payload.business_logo.trim() || null : null,
        parent_business_handler: parentBusinessHandler,
    };
}

export async function sendPhoneOtp(payload: PhoneSendOtpRequest): Promise<PhoneSendOtpResponse> {
    try {
        validateSendOtpPayload(payload);

        const { data } = await axiosInstance.post<PhoneSendOtpResponse>("/api/phone/send-otp/", {
            phone_number: normalizeMobileUsername(payload.phone_number),
        });

        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 425) {
            throw new ActiveOtpCodeError(
                getApiErrorMessage(error, "کد تایید قبلاً برای این شماره ارسال شده است."),
                getActiveOtpIsRegistered(error),
            );
        }

        throw new Error(getApiErrorMessage(error, "ارسال کد تایید با خطا مواجه شد."));
    }
}

export async function phoneLogin(payload: PhoneLoginRequest): Promise<PhoneLoginResponse> {
    try {
        validatePhoneLoginPayload(payload);

        const { data } = await axiosInstance.post<unknown>("/api/phone/login/", {
            username: normalizeMobileUsername(payload.username),
            code: normalizeOtpCode(payload.code),
        });

        return normalizePhoneAuthResponse<PhoneLoginResponse>(data);
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "ورود با کد تایید با خطا مواجه شد."));
    }
}

export async function verifyPhoneOtp(payload: PhoneVerifyOtpRequest): Promise<PhoneVerifyOtpResponse> {
    try {
        validatePhoneVerifyOtpPayload(payload);

        const { data } = await axiosInstance.post<PhoneVerifyOtpResponse>("/api/phone/verify/", {
            username: normalizeMobileUsername(payload.username),
            code: normalizeOtpCode(payload.code),
        });

        return data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "کد تایید معتبر نیست."));
    }
}

export async function phoneRegister(payload: PhoneRegisterRequest): Promise<PhoneRegisterResponse> {
    try {
        validatePhoneRegisterPayload(payload);

        const hasLogoFile = hasBusinessLogoFile(payload);
        const requestPayload = hasLogoFile ? buildPhoneRegisterFormData(payload) : buildPhoneRegisterJsonPayload(payload);
        const { data } = await axiosInstance.post<unknown>(
            "/api/phone/register/",
            requestPayload,
            hasLogoFile
                ? {
                      headers: {
                          "Content-Type": "multipart/form-data",
                      },
                  }
                : undefined
        );

        return normalizePhoneAuthResponse<PhoneRegisterResponse>(data);
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "ثبت‌نام با کد تایید با خطا مواجه شد."));
    }
}

export async function phoneEmployeeRegister(
    payload: PhoneEmployeeRegisterRequest
): Promise<PhoneEmployeeRegisterResponse> {
    try {
        validatePhoneEmployeeRegisterPayload(payload);

        const { data } = await axiosInstance.post<unknown>(
            "/api/phone/employee/register/",
            {
                username: normalizeMobileUsername(payload.username),
                code: normalizeOtpCode(payload.code),
                first_name: payload.first_name.trim(),
                last_name: payload.last_name.trim(),
                email: payload.email.trim(),
                birth_date: normalizeDigits(payload.birth_date.trim()),
                business_id: payload.business_id,
            }
        );

        return normalizePhoneAuthResponse<PhoneEmployeeRegisterResponse>(data);
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "ثبت‌نام کارمند با خطا مواجه شد."));
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
