import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
    clearAuthTokens,
    getAccessToken,
    getRefreshToken,
    setAuthTokens,
} from "@/lib/auth-storage";
import type { TokenRefreshResponse } from "@/types/api/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

const refreshClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

type RetriableConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

const AUTH_PATHS = ["/api/login/", "/api/register/", "/api/logout/", "/api/token/refresh/"];

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        const url = config.url ?? "";
        const isAuthRoute = AUTH_PATHS.some((path) => url.includes(path));

        if (accessToken && !isAuthRoute) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

let refreshPromise: Promise<TokenRefreshResponse> | null = null;

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalConfig = error.config as RetriableConfig | undefined;

        if (!originalConfig || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const requestUrl = originalConfig.url ?? "";
        const isAuthRoute = AUTH_PATHS.some((path) => requestUrl.includes(path));

        if (originalConfig._retry || isAuthRoute) {
            return Promise.reject(error);
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearAuthTokens();
            return Promise.reject(error);
        }

        originalConfig._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = refreshClient
                    .post<TokenRefreshResponse>(
                        "/api/token/refresh/",
                        {
                            refresh: refreshToken,
                        },
                        {
                            headers: getAccessToken()
                                ? {
                                      Authorization: `Bearer ${getAccessToken()}`,
                                  }
                                : undefined,
                        },
                    )
                    .then((response) => response.data)
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            const refreshedTokens = await refreshPromise;
            setAuthTokens({
                access: refreshedTokens.access,
                refresh: refreshedTokens.refresh ?? refreshToken,
            });

            //@ts-ignore
            originalConfig.headers = {
                ...(originalConfig.headers ?? {}),
                Authorization: `Bearer ${refreshedTokens.access}`,
            };
            return axiosInstance(originalConfig);
        } catch (refreshError) {
            clearAuthTokens();
            return Promise.reject(refreshError);
        }
    },
);
