import { useMutation } from "@tanstack/react-query";
import {
    logoutUser,
    phoneLogin,
    phoneRegister,
    refreshAccessToken,
    sendPhoneOtp,
} from "@/services/api/auth";
import type {
    LogoutRequest,
    PhoneLoginRequest,
    PhoneLoginResponse,
    PhoneRegisterRequest,
    PhoneRegisterResponse,
    PhoneSendOtpRequest,
    PhoneSendOtpResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
} from "@/types/api/auth";

export function useSendPhoneOtpMutation() {
    return useMutation<PhoneSendOtpResponse, Error, PhoneSendOtpRequest>({
        mutationFn: sendPhoneOtp,
    });
}

export function usePhoneLoginMutation() {
    return useMutation<PhoneLoginResponse, Error, PhoneLoginRequest>({
        mutationFn: phoneLogin,
    });
}

export function usePhoneRegisterMutation() {
    return useMutation<PhoneRegisterResponse, Error, PhoneRegisterRequest>({
        mutationFn: phoneRegister,
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

export const useLoginMutation = usePhoneLoginMutation;
export const useRegisterMutation = usePhoneRegisterMutation;
