"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import toast from "react-hot-toast";
import { ArrowRight, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { usePhoneLoginMutation, usePhoneRegisterMutation, useSendPhoneOtpMutation, useVerifyPhoneOtpMutation } from "@/hooks/api";
import { getPostAuthUrl, getPendingUrl } from "@/lib/auth-routing";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { setAuthTokens } from "@/lib/auth-storage";
import {
    buildOtpPageUrl,
    clearPendingPhoneRegisterPayload,
    getPendingPhoneRegisterPayload,
    isOtpComplete,
    normalizeOtpCode,
    normalizeOtpMode,
    OTP_CODE_LENGTH,
    storedLogoUploadToFile,
    type PendingPhoneRegisterPayload,
} from "@/lib/otp-flow";
import { normalizeMobileUsername } from "@/services/api/auth";
import LOGO from "@/../public/assets/images/logo.png";

const createEmptyDigits = () => Array.from({ length: OTP_CODE_LENGTH }, () => "");

function LogoIcon() {
    return (
        <div className="relative mx-auto h-24 w-24 group">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-silver-light/25 via-white/10 to-silver-metallic/20 blur-2xl animate-soft-pulse" />
            <div className="relative h-24 w-24 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6">
                <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain drop-shadow-2xl" priority />
            </div>
        </div>
    );
}

function getMaskedPhone(value: string): string {
    const normalized = normalizeMobileUsername(value);
    if (normalized.length < 7) return normalized;
    return `${normalized.slice(0, 4)}•••${normalized.slice(-4)}`;
}

export default function OtpPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const phoneLoginMutation = usePhoneLoginMutation();
    const phoneRegisterMutation = usePhoneRegisterMutation();
    const sendOtpMutation = useSendPhoneOtpMutation();
    const verifyOtpMutation = useVerifyPhoneOtpMutation();

    const mode = useMemo(() => normalizeOtpMode(searchParams.get("mode")), [searchParams]);
    const username = useMemo(() => normalizeMobileUsername(searchParams.get("username") || ""), [searchParams]);
    const businessHandler = useMemo(
        () => normalizeBusinessPathSegment(searchParams.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER) || DEFAULT_PARENT_BUSINESS_HANDLER,
        [searchParams],
    );

    const [digits, setDigits] = useState<string[]>(createEmptyDigits);
    const [pendingRegisterPayload, setPendingRegisterPayload] = useState<PendingPhoneRegisterPayload | null>(null);
    const [isBootstrapped, setIsBootstrapped] = useState(false);

    const code = useMemo(() => digits.join(""), [digits]);
    const isRegisterMode = mode === "register";
    const isPending = phoneLoginMutation.isPending || phoneRegisterMutation.isPending || sendOtpMutation.isPending || verifyOtpMutation.isPending;

    useEffect(() => {
        if (!username) {
            toast.error("شماره موبایل برای تایید کد پیدا نشد.");
            router.replace(`/login?business_handler=${encodeURIComponent(businessHandler)}`);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            if (isRegisterMode) {
                const payload = getPendingPhoneRegisterPayload();
                setPendingRegisterPayload(payload && normalizeMobileUsername(payload.username) === username ? payload : null);
            }

            setIsBootstrapped(true);
            inputRefs.current[0]?.focus();
        }, 150);

        return () => window.clearTimeout(timeoutId);
    }, [businessHandler, isRegisterMode, router, username]);

    const setDigitAt = (index: number, value: string) => {
        const normalized = normalizeOtpCode(value);

        setDigits((prev) => {
            const next = [...prev];

            if (!normalized) {
                next[index] = "";
                return next;
            }

            normalized.split("").forEach((digit, offset) => {
                const targetIndex = index + offset;
                if (targetIndex < OTP_CODE_LENGTH) {
                    next[targetIndex] = digit;
                }
            });

            return next;
        });

        const nextIndex = Math.min(index + Math.max(normalized.length, 1), OTP_CODE_LENGTH - 1);
        window.setTimeout(() => inputRefs.current[nextIndex]?.focus(), 10);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            event.preventDefault();
            setDigits((prev) => {
                const next = [...prev];
                next[index - 1] = "";
                return next;
            });
            inputRefs.current[index - 1]?.focus();
            return;
        }

        if (event.key === "ArrowRight" && index > 0) {
            event.preventDefault();
            inputRefs.current[index - 1]?.focus();
        }

        if (event.key === "ArrowLeft" && index < OTP_CODE_LENGTH - 1) {
            event.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pastedCode = normalizeOtpCode(event.clipboardData.getData("text"));
        if (!pastedCode) return;

        setDigits((prev) => {
            const next = [...prev];
            pastedCode.split("").forEach((digit, index) => {
                if (index < OTP_CODE_LENGTH) next[index] = digit;
            });
            return next;
        });

        window.setTimeout(() => inputRefs.current[Math.min(pastedCode.length, OTP_CODE_LENGTH) - 1]?.focus(), 10);
    };

    const handleResendOtp = async () => {
        try {
            const response = await sendOtpMutation.mutateAsync({ phone_number: username });

            if (isRegisterMode && response.is_registered) {
                clearPendingPhoneRegisterPayload();
                toast.success("این شماره قبلاً ثبت‌نام شده است. کد ورود ارسال شد.");
                router.replace(buildOtpPageUrl({ mode: "login", username, businessHandler }));
                return;
            }

            setDigits(createEmptyDigits());
            inputRefs.current[0]?.focus();
            toast.success("کد ۶ رقمی جدید ارسال شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ارسال مجدد کد با خطا مواجه شد";
            toast.error(message);
        }
    };

    const handleSubmit = async () => {
        if (!isOtpComplete(code)) {
            toast.error("کد تایید باید ۶ رقم باشد.");
            inputRefs.current[digits.findIndex((digit) => !digit) || 0]?.focus();
            return;
        }

        try {
            const verifyResponse = await verifyOtpMutation.mutateAsync({ username, code });
            const shouldRegister = typeof verifyResponse.is_registered === "boolean" ? !verifyResponse.is_registered : isRegisterMode;

            if (!shouldRegister) {
                clearPendingPhoneRegisterPayload();
                const response = await phoneLoginMutation.mutateAsync({ username, code });
                setAuthTokens({ access: response.access, refresh: response.refresh });
                toast.success("ورود موفقیت‌آمیز بود");
                router.replace(getPostAuthUrl(response.user_profile, businessHandler));
                return;
            }

            if (!pendingRegisterPayload) {
                toast.error("اطلاعات ثبت‌نام پیدا نشد. لطفاً فرم ثبت‌نام را دوباره تکمیل کنید.");
                router.replace(`/register?business_handler=${encodeURIComponent(businessHandler)}&username=${encodeURIComponent(username)}`);
                return;
            }

            const logoFile = await storedLogoUploadToFile(pendingRegisterPayload.business_logo);
            const response = await phoneRegisterMutation.mutateAsync({
                username: pendingRegisterPayload.username,
                code,
                first_name: pendingRegisterPayload.first_name,
                last_name: pendingRegisterPayload.last_name,
                email: pendingRegisterPayload.email,
                birth_date: pendingRegisterPayload.birth_date,
                business_name: pendingRegisterPayload.business_name,
                business_handler: pendingRegisterPayload.business_handler,
                address: pendingRegisterPayload.address,
                province: pendingRegisterPayload.province,
                city: pendingRegisterPayload.city,
                telephone: pendingRegisterPayload.telephone,
                business_logo: logoFile,
                parent_business_handler: pendingRegisterPayload.parent_business_handler || businessHandler,
            });

            clearPendingPhoneRegisterPayload();
            setAuthTokens({ access: response.access, refresh: response.refresh });
            toast.success("ثبت‌نام با موفقیت انجام شد");
            router.replace(getPendingUrl(response.user_profile, businessHandler));
        } catch (error) {
            const message = error instanceof Error ? error.message : isRegisterMode ? "ثبت‌نام با کد تایید با خطا مواجه شد" : "ورود با کد تایید با خطا مواجه شد";
            toast.error(message);
            setDigits(createEmptyDigits());
            inputRefs.current[0]?.focus();
        }
    };

    const editUrl = isRegisterMode
        ? `/register?business_handler=${encodeURIComponent(businessHandler)}&username=${encodeURIComponent(username)}&otp_sent=1`
        : `/login?business_handler=${encodeURIComponent(businessHandler)}&username=${encodeURIComponent(username)}`;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-10">
            <AmbientBackground dense />
            <div className="absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-silver-light/10 blur-3xl animate-soft-pulse" />
            <div className="absolute -bottom-24 left-1/5 h-96 w-96 rounded-full bg-silver-metallic/10 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute inset-x-0 top-16 mx-auto h-px max-w-4xl bg-gradient-to-l from-transparent via-silver-light/30 to-transparent" />

            <Card className="group relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-silver-dark/20 bg-brand-surface/85 p-6 text-center shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow sm:p-8">
                <ShineBorder className="opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-l from-transparent via-silver-light to-transparent opacity-70" />
                <div className="absolute -right-12 top-20 h-32 w-32 rounded-full bg-silver-light/10 blur-3xl animate-soft-pulse" />
                <div className="absolute -left-10 bottom-10 h-36 w-36 rounded-full bg-silver-metallic/10 blur-3xl animate-pulse" />

                <div className="relative">
                    <LogoIcon />
                    <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100">
                        <ShieldCheck className="h-4 w-4" />
                        تایید امن شماره موبایل
                    </div>

                    <h1 className="mt-6 text-3xl font-black tracking-tight text-brand-text-primary sm:text-4xl">
                        کد ۶ رقمی را وارد کنید
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-brand-text-secondary">
                        کد تایید برای شماره <span dir="ltr" className="font-semibold text-silver-light">{getMaskedPhone(username)}</span> ارسال شده است.
                        {isRegisterMode ? " بعد از تایید، ثبت‌نام شما نهایی می‌شود." : " بعد از تایید وارد حساب می‌شوید."}
                    </p>

                    {isRegisterMode && isBootstrapped && !pendingRegisterPayload ? (
                        <div className="mt-6 rounded-2xl border border-danger/25 bg-danger/10 p-4 text-right text-sm leading-7 text-red-100">
                            اطلاعات ثبت‌نام موقت پیدا نشد. احتمالاً صفحه refresh شده یا session پاک شده است. از فرم ثبت‌نام دوباره وارد شوید.
                        </div>
                    ) : null}

                    <div dir="ltr" className="mt-8 flex justify-center gap-2 sm:gap-3">
                        {digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(node) => {
                                    inputRefs.current[index] = node;
                                }}
                                value={digit}
                                onChange={(event) => setDigitAt(index, event.target.value)}
                                onKeyDown={(event) => handleKeyDown(event, index)}
                                onPaste={handlePaste}
                                inputMode="numeric"
                                autoComplete={index === 0 ? "one-time-code" : "off"}
                                aria-label={`رقم ${index + 1} کد تایید`}
                                maxLength={1}
                                disabled={isPending || (isRegisterMode && isBootstrapped && !pendingRegisterPayload)}
                                className="h-14 w-11 rounded-2xl border border-silver-dark/30 bg-brand-base/70 text-center text-2xl font-black text-silver-light shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all duration-300 placeholder:text-brand-text-secondary focus:-translate-y-1 focus:scale-105 focus:border-silver-light focus:bg-silver-light/10 focus:shadow-silver-glow disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-14"
                            />
                        ))}
                    </div>

                    <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending || !isOtpComplete(code) || (isRegisterMode && isBootstrapped && !pendingRegisterPayload)}
                            className="w-full cursor-pointer gap-2 text-white disabled:cursor-not-allowed"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {phoneLoginMutation.isPending || phoneRegisterMutation.isPending || verifyOtpMutation.isPending ? "در حال تایید..." : "تایید و ادامه"}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleResendOtp}
                            disabled={isPending || !username}
                            className="w-full cursor-pointer gap-2 border border-silver-dark/20 bg-white/5 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`h-4 w-4 ${sendOtpMutation.isPending ? "animate-spin" : ""}`} />
                            {sendOtpMutation.isPending ? "در حال ارسال..." : "ارسال مجدد"}
                        </Button>
                    </div>

                    <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-silver-dark/20 bg-brand-base/40 px-4 py-3 text-sm text-brand-text-secondary sm:flex-row">
                        <Link href={editUrl} className="inline-flex items-center gap-2 font-semibold text-silver-light transition hover:text-white">
                            <ArrowRight className="h-4 w-4" />
                            اصلاح اطلاعات
                        </Link>
                        <span className="text-xs leading-6">کد را می‌توانید کامل paste کنید؛ باکس‌ها خودکار پر می‌شوند.</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
