import { useMutation } from "@tanstack/react-query";
import {
    logoutUser,
    phoneEmployeeRegister,
    phoneLogin,
    phoneRegister,
    refreshAccessToken,
    sendPhoneOtp,
    verifyPhoneOtp,
} from "@/services/api/auth";
import type {
    LogoutRequest,
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

export function useVerifyPhoneOtpMutation() {
    return useMutation<PhoneVerifyOtpResponse, Error, PhoneVerifyOtpRequest>({
        mutationFn: verifyPhoneOtp,
    });
}

export function usePhoneRegisterMutation() {
    return useMutation<PhoneRegisterResponse, Error, PhoneRegisterRequest>({
        mutationFn: phoneRegister,
    });
}

export function usePhoneEmployeeRegisterMutation() {
    return useMutation<PhoneEmployeeRegisterResponse, Error, PhoneEmployeeRegisterRequest>({
        mutationFn: phoneEmployeeRegister,
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
