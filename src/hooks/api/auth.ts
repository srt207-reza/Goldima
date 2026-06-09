import { useMutation } from "@tanstack/react-query";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from "@/services/api/auth";
import type {
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RegisterRequest,
    RegisterResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
} from "@/types/api/auth";

export function useLoginMutation() {
    return useMutation<LoginResponse, Error, LoginRequest>({
        mutationFn: loginUser,
    });
}

export function useRegisterMutation() {
    return useMutation<RegisterResponse, Error, RegisterRequest>({
        mutationFn: registerUser,
    });
}

export function useLogoutMutation() {
    return useMutation<void, Error, LogoutRequest>({
        mutationFn: logoutUser,
    });
}

export function useRefreshTokenMutation() {
    return useMutation<TokenRefreshResponse, Error, TokenRefreshRequest>({
        mutationFn: refreshAccessToken,
    });
}
