export const MOBILE_USERNAME_REGEX = /^(\+98|0)?9\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type AuthUserRole = "MASTER" | "WHOLESALER" | "RETAIL" | string;
export type AuthUserStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

export type AuthUserDetail = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string | null;
    role: AuthUserRole;
    status: AuthUserStatus;
};

export type AuthBusinessProfile = {
    id: number;
    user: AuthUserDetail;
    business_name: string;
    business_handler: string | null;
    address: string;
    province: string;
    city: string;
    telephone: string;
    business_logo: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type PhoneSendOtpRequest = {
    phone_number: string;
};

export type PhoneSendOtpResponse = {
    success: boolean;
    is_registered: boolean;
    message: string;
};

export type PhoneLoginRequest = {
    username: string;
    code: string;
};

export type PhoneVerifyOtpRequest = PhoneLoginRequest;

export type PhoneVerifyOtpResponse = {
    success: boolean;
    message: string;
    is_registered?: boolean;
};

export type PhoneAuthResponse = {
    access: string;
    refresh: string;
    user_profile: AuthBusinessProfile;
};

export type PhoneLoginResponse = PhoneAuthResponse;

export type PhoneRegisterRequest = {
    username: string;
    code: string;
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
    business_logo?: File | string | null;
    parent_business_handler?: string;
};

export type PhoneRegisterResponse = PhoneAuthResponse;

export type LogoutRequest = {
    refresh: string;
};

export type LogoutResponse = void;

export type TokenRefreshRequest = {
    refresh: string;
};

export type TokenRefreshResponse = {
    access: string;
    refresh?: string;
};

export type AuthTokenPairLike = {
    access: string;
    refresh?: string;
};

export type LoginRequest = PhoneLoginRequest;
export type LoginResponse = PhoneLoginResponse;
export type RegisterRequest = PhoneRegisterRequest;
export type RegisterResponse = PhoneRegisterResponse;
