export const MOBILE_USERNAME_REGEX = /^(\+98|0)?9\d{9}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type LoginRequest = {
    username: string;
    password: string;
};

export type LoginResponse = {
    access: string;
    refresh: string;
};

export type LogoutRequest = {
    refresh: string;
};

export type LogoutResponse = void;

export type RegisterRequest = {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    business_name: string;
    business_handler: string;
    address: string;
    telephone: string;
    business_logo?: string;
    parent_business_handler?: string;
};

export type RegisterResponse = unknown;

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
