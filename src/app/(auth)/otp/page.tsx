"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type ClipboardEvent,
    type FormEvent,
    type KeyboardEvent,
} from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { usePhoneLoginMutation, useSendPhoneOtpMutation } from "@/hooks/api";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { saveRegisterOtpSession } from "@/lib/otp-session";
import { setAuthTokens } from "@/lib/auth-storage";
import { normalizeDigits, normalizeMobileUsername } from "@/services/api/auth";
import type { AuthBusinessProfile } from "@/types/api/auth";
import LOGO from "@/../public/assets/images/logo.png";

const OTP_LENGTH = 6;
type OtpFlow = "login" | "register";

function getPendingUrl(profile: AuthBusinessProfile): string {
    const params = new URLSearchParams({
        business_handler: profile.business_handler ?? "",
        business_name: profile.business_name ?? "",
    });

    return `/pending?${params.toString()}`;
}

function getPostAuthUrl(profile: AuthBusinessProfile): string {
    const role = String(profile.user?.role ?? "").toUpperCase();
    const status = String(profile.user.status ?? "").toUpperCase();

    if (role === "MASTER" || status === "APPROVED") return "/";
    return getPendingUrl(profile);
}

function normalizeOtpValue(value: string): string {
    return normalizeDigits(value).replace(/\D/g, "").slice(0, OTP_LENGTH);
}

const LogoIcon = () => (
    <div className="relative mx-auto h-24 w-24 group">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-silver-light/30 via-white/10 to-emerald-400/20 blur-2xl animate-soft-pulse" />
        <div className="relative h-24 w-24 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
            <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain drop-shadow-2xl" priority />
        </div>
    </div>
);

function OtpBox({
    value,
    active,
    inputRef,
    onChange,
    onKeyDown,
    onPaste,
    onFocus,
}: {
    value: string;
    active: boolean;
    inputRef: (element: HTMLInputElement | null) => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
    onFocus: () => void;
}) {
    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onFocus={onFocus}
            maxLength={1}
            dir="ltr"
            className={[
                "h-14 w-11 rounded-2xl border bg-brand-base/55 text-center text-2xl font-bold text-brand-text-primary shadow-inner outline-none transition-all duration-300 sm:h-16 sm:w-14",
                "hover:border-silver-light/50 focus:scale-110 focus:border-silver-light focus:bg-brand-surface focus:ring-4 focus:ring-silver-light/20",
                active || value ? "border-silver-light/60 shadow-silver-glow" : "border-silver-dark/30",
            ].join(" ")}
        />
    );
}

export default function OtpPage() {
    const router = useRouter();
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const phoneLoginMutation = usePhoneLoginMutation();
    const sendOtpMutation = useSendPhoneOtpMutation();

    const [username, setUsername] = useState("");
    const [parentBusinessHandler, setParentBusinessHandler] = useState(DEFAULT_PARENT_BUSINESS_HANDLER);
    const [flow, setFlow] = useState<OtpFlow>("login");
    const [digits, setDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const usernameFromQuery = normalizeMobileUsername(params.get("username") || "");
        const handlerFromQuery = normalizeBusinessPathSegment(params.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER);
        const flowFromQuery = params.get("flow") === "register" ? "register" : "login";

        if (!usernameFromQuery) {
            router.replace("/login");
            return;
        }

        setUsername(usernameFromQuery);
        setParentBusinessHandler(handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);
        setFlow(flowFromQuery);

        requestAnimationFrame(() => inputRefs.current[0]?.focus());
    }, [router]);

    const otpCode = useMemo(() => digits.join(""), [digits]);
    const isPending = phoneLoginMutation.isPending || sendOtpMutation.isPending;

    const fillDigits = (value: string, startIndex = 0) => {
        const normalized = normalizeOtpValue(value);
        if (!normalized) return;

        setDigits((prev) => {
            const next = [...prev];
            normalized.split("").forEach((digit, offset) => {
                const targetIndex = startIndex + offset;
                if (targetIndex < OTP_LENGTH) next[targetIndex] = digit;
            });
            return next;
        });

        const nextFocusIndex = Math.min(startIndex + normalized.length, OTP_LENGTH - 1);
        requestAnimationFrame(() => inputRefs.current[nextFocusIndex]?.focus());
    };

    const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
        const value = normalizeOtpValue(event.target.value);

        if (value.length > 1) {
            fillDigits(value, index);
            return;
        }

        setDigits((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });

        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            return;
        }

        if (event.key === "ArrowLeft" && index < OTP_LENGTH - 1) {
            event.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }

        if (event.key === "ArrowRight" && index > 0) {
            event.preventDefault();
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        fillDigits(event.clipboardData.getData("text"), index);
    };

    const handleResendOtp = async () => {
        try {
            await sendOtpMutation.mutateAsync({ phone_number: username });
            setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
            inputRefs.current[0]?.focus();
            toast.success("کد تایید ارسال شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ارسال کد تایید با خطا مواجه شد";
            toast.error(message);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (otpCode.length !== OTP_LENGTH) {
            toast.error("کد تایید ۶ رقمی را کامل وارد کنید");
            return;
        }

        try {
            if (flow === "register") {
                saveRegisterOtpSession({
                    username,
                    code: otpCode,
                    business_handler: parentBusinessHandler,
                });

                const params = new URLSearchParams({
                    username,
                    business_handler: parentBusinessHandler,
                    otp_ready: "1",
                });

                router.replace(`/register?${params.toString()}`);
                return;
            }

            const response = await phoneLoginMutation.mutateAsync({ username, code: otpCode });
            setAuthTokens({ access: response.access, refresh: response.refresh });
            router.replace(getPostAuthUrl(response.user_profile));
        } catch (error) {
            const message = error instanceof Error ? error.message : "کد تایید معتبر نیست";
            toast.error(message);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-silver-light/10 blur-3xl animate-soft-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl animate-float" />

            <Card className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-7 text-center shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow sm:p-8">
                <ShineBorder className="opacity-80" duration="5s" />
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-silver-light to-transparent" />
                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-silver-light/10 blur-3xl transition-all duration-700 group-hover:scale-125" />

                <div className="relative z-10">
                    <LogoIcon />

                    <div className="mt-6">
                        <h1 className="text-3xl font-bold tracking-wider text-brand-text-primary">کد تایید</h1>
                        <p className="mt-3 text-sm font-medium text-silver-light" dir="ltr">{username}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-7">
                        <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
                            {digits.map((digit, index) => (
                                <OtpBox
                                    key={index}
                                    value={digit}
                                    active={activeIndex === index}
                                    inputRef={(element) => {
                                        inputRefs.current[index] = element;
                                    }}
                                    onChange={(event) => handleChange(index, event)}
                                    onKeyDown={(event) => handleKeyDown(index, event)}
                                    onPaste={(event) => handlePaste(index, event)}
                                    onFocus={() => setActiveIndex(index)}
                                />
                            ))}
                        </div>

                        <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                            {phoneLoginMutation.isPending ? "در حال بررسی..." : flow === "register" ? "ادامه ثبت‌نام" : "ورود"}
                        </Button>
                    </form>

                    <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => router.replace(flow === "register" ? `/register?business_handler=${encodeURIComponent(parentBusinessHandler)}` : `/login?business_handler=${encodeURIComponent(parentBusinessHandler)}`)}
                            className="cursor-pointer text-brand-text-secondary transition-colors hover:text-white"
                        >
                            اصلاح شماره
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={sendOtpMutation.isPending}
                            className="cursor-pointer text-silver-light transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {sendOtpMutation.isPending ? "در حال ارسال..." : "ارسال مجدد"}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
