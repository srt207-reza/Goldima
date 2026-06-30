"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    useCallback,
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
import { CheckCircle2, Edit, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { usePhoneLoginMutation, useSendPhoneOtpMutation, useVerifyPhoneOtpMutation } from "@/hooks/api";
import { getPostAuthUrl, getSuspendedUrl } from "@/lib/auth-routing";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { saveRegisterOtpSession } from "@/lib/otp-session";
import { setAuthTokens } from "@/lib/auth-storage";
import { normalizeDigits, normalizeMobileUsername, SuspendedAccountError } from "@/services/api/auth";
import LOGO from "@/../public/assets/images/logo.png";

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
type OtpFlow = "login" | "register";
type OtpStatus = "idle" | "checking" | "success" | "error";

const createEmptyOtpDigits = () => Array.from({ length: OTP_LENGTH }, () => "");

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
    index,
    value,
    active,
    status,
    disabled,
    inputRef,
    onChange,
    onKeyDown,
    onPaste,
    onFocus,
    mergeStep,
}: {
    index: number;
    value: string;
    active: boolean;
    status: OtpStatus;
    disabled: boolean;
    inputRef: (element: HTMLInputElement | null) => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    mergeStep: number;
}) {
    const isAnimated = status !== "idle";
    const mergeOffset = (2.5 - index) * mergeStep;
    const stateClasses =
        status === "success"
            ? "border-emerald-300/80 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.28)]"
            : status === "error"
                ? "border-rose-300/80 text-rose-100 shadow-[0_0_24px_rgba(251,113,133,0.28)]"
                : active || value
                    ? "border-silver-light/60 shadow-silver-glow"
                    : "border-silver-dark/30";

    return (
        <motion.div
            className="relative z-0"
            animate={
                isAnimated
                    ? {
                        x: mergeOffset,
                        scale: status === "checking" ? 0.76 : 0.7,
                        opacity: status === "checking" ? 0.34 : 0.18,
                    }
                    : { x: 0, scale: 1, opacity: 1 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
        >
            <AnimatePresence>
                {value ? (
                    <motion.span
                        className={[
                            "pointer-events-none absolute -inset-1 rounded-[1.35rem] border",
                            status === "error" ? "border-rose-300/70" : status === "success" ? "border-emerald-300/70" : "border-silver-light/60",
                        ].join(" ")}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0.25, 0.95, 0.25], scale: [0.96, 1.08, 0.96] }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 1.1, repeat: status === "checking" ? Infinity : 0, ease: "easeInOut", delay: index * 0.04 }}
                    />
                ) : null}
            </AnimatePresence>
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
                disabled={disabled}
                className={[
                    "h-14 w-11 rounded-2xl border bg-brand-base/55 text-center text-2xl font-bold text-brand-text-primary shadow-inner outline-none transition-all duration-300 sm:h-16 sm:w-14",
                    "hover:border-silver-light/50 focus:scale-110 focus:border-silver-light focus:bg-brand-surface focus:ring-4 focus:ring-silver-light/20 disabled:cursor-not-allowed",
                    stateClasses,
                ].join(" ")}
            />
        </motion.div>
    );
}

export default function OtpPage() {
    const router = useRouter();
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const errorResetTimeoutRef = useRef<number | null>(null);
    const phoneLoginMutation = usePhoneLoginMutation();
    const sendOtpMutation = useSendPhoneOtpMutation();
    const verifyOtpMutation = useVerifyPhoneOtpMutation();

    const [username, setUsername] = useState("");
    const [parentBusinessHandler, setParentBusinessHandler] = useState(DEFAULT_PARENT_BUSINESS_HANDLER);
    const [flow, setFlow] = useState<OtpFlow>("login");
    const [digits, setDigits] = useState<string[]>(createEmptyOtpDigits);
    const [activeIndex, setActiveIndex] = useState(0);
    const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [mergeStep] = useState(() => (typeof window !== "undefined" && window.innerWidth >= 640 ? 68 : 52));
    const submittedCodeRef = useRef("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const usernameFromQuery = normalizeMobileUsername(params.get("username") || "");
        const handlerFromQuery = normalizeBusinessPathSegment(params.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER);
        const flowFromQuery = params.get("flow") === "register" ? "register" : "login";

        if (!usernameFromQuery) {
            router.replace("/login");
            return;
        }

        const frameId = requestAnimationFrame(() => {
            setUsername(usernameFromQuery);
            setParentBusinessHandler(handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);
            setFlow(flowFromQuery);
            inputRefs.current[0]?.focus();
        });

        return () => cancelAnimationFrame(frameId);
    }, [router]);

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timeoutId = window.setTimeout(() => {
            setResendCooldown((current) => Math.max(current - 1, 0));
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [resendCooldown]);

    useEffect(() => {
        return () => {
            if (errorResetTimeoutRef.current) {
                window.clearTimeout(errorResetTimeoutRef.current);
            }
        };
    }, []);

    const otpCode = useMemo(() => digits.join(""), [digits]);
    const isPending = phoneLoginMutation.isPending || sendOtpMutation.isPending || verifyOtpMutation.isPending;
    const isSubmittingOtp = otpStatus === "checking" || phoneLoginMutation.isPending || verifyOtpMutation.isPending;
    const areOtpInputsLocked = otpStatus !== "idle" || phoneLoginMutation.isPending || verifyOtpMutation.isPending;

    const clearErrorResetTimer = useCallback(() => {
        if (!errorResetTimeoutRef.current) return;

        window.clearTimeout(errorResetTimeoutRef.current);
        errorResetTimeoutRef.current = null;
    }, []);

    const reopenOtpInputs = useCallback(() => {
        clearErrorResetTimer();
        submittedCodeRef.current = "";
        setDigits(createEmptyOtpDigits());
        setOtpStatus("idle");
        setActiveIndex(0);
        requestAnimationFrame(() => inputRefs.current[0]?.focus());
    }, [clearErrorResetTimer]);

    const resetOtpAnimationState = () => {
        if (otpStatus === "checking") return;

        clearErrorResetTimer();
        submittedCodeRef.current = "";

        if (otpStatus !== "idle") {
            setOtpStatus("idle");
        }
    };

    const fillDigits = (value: string, startIndex = 0) => {
        const normalized = normalizeOtpValue(value);
        if (!normalized) return;

        resetOtpAnimationState();

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

        resetOtpAnimationState();

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
        if (resendCooldown > 0) {
            toast.error(`برای ارسال مجدد ${resendCooldown.toLocaleString("fa-IR")} ثانیه صبر کنید`);
            return;
        }

        setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);

        try {
            const response = await sendOtpMutation.mutateAsync({ phone_number: username });
            setFlow(response.is_registered ? "login" : "register");
            setDigits(createEmptyOtpDigits());
            submittedCodeRef.current = "";
            setOtpStatus("idle");
            inputRefs.current[0]?.focus();
            toast.success("کد تایید ارسال شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ارسال کد تایید با خطا مواجه شد";
            toast.error(message);
        }
    };

    const submitOtp = useCallback(async (code: string, source: "auto" | "manual" = "manual") => {
        if (source === "auto" && submittedCodeRef.current === code) {
            return;
        }

        if (code.length !== OTP_LENGTH) {
            toast.error("کد تایید ۶ رقمی را کامل وارد کنید");
            return;
        }

        submittedCodeRef.current = code;
        setOtpStatus("checking");

        try {
            const verifyResponse = await verifyOtpMutation.mutateAsync({ username, code });
            const shouldRegister = typeof verifyResponse.is_registered === "boolean" ? !verifyResponse.is_registered : flow === "register";

            if (shouldRegister) {
                setOtpStatus("success");
                await new Promise((resolve) => window.setTimeout(resolve, 420));

                saveRegisterOtpSession({
                    username,
                    code,
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

            const response = await phoneLoginMutation.mutateAsync({ username, code });
            setAuthTokens({ access: response.access, refresh: response.refresh });
            setOtpStatus("success");
            await new Promise((resolve) => window.setTimeout(resolve, 420));
            router.replace(getPostAuthUrl(response.user_profile, parentBusinessHandler));
        } catch (error) {
            if (error instanceof SuspendedAccountError) {
                setOtpStatus("error");
                router.replace(getSuspendedUrl({
                    parentBusinessHandler,
                    reason: error.reason,
                }));
                return;
            }

            const message = error instanceof Error ? error.message : "کد تایید معتبر نیست";
            setOtpStatus("error");
            toast.error(message);

            clearErrorResetTimer();
            errorResetTimeoutRef.current = window.setTimeout(() => {
                reopenOtpInputs();
            }, 950);
        }
    }, [clearErrorResetTimer, flow, parentBusinessHandler, phoneLoginMutation, reopenOtpInputs, router, username, verifyOtpMutation]);

    useEffect(() => {
        if (otpCode.length !== OTP_LENGTH || isSubmittingOtp || submittedCodeRef.current === otpCode) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void submitOtp(otpCode, "auto");
        }, 360);

        return () => window.clearTimeout(timeoutId);
    }, [isSubmittingOtp, otpCode, submitOtp]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await submitOtp(otpCode, "manual");
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
                        <p
                            onClick={() => router.replace(flow === "register" ? `/register?business_handler=${encodeURIComponent(parentBusinessHandler)}` : `/login?business_handler=${encodeURIComponent(parentBusinessHandler)}`)}
                            className="mt-3 gap-2 inline-flex justify-center items-center cursor-pointer text-sm font-medium text-silver-light" dir="ltr">
                            <Edit size={18} className="mb-1"/>
                            {username}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-7">
                        <div className="relative mx-auto flex min-h-20 items-center justify-center" dir="ltr">
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {digits.map((digit, index) => (
                                    <OtpBox
                                        key={index}
                                        index={index}
                                        value={digit}
                                        active={activeIndex === index}
                                        status={otpStatus}
                                        disabled={areOtpInputsLocked}
                                        mergeStep={mergeStep}
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

                            <AnimatePresence>
                                {otpStatus !== "idle" ? (
                                    <motion.div
                                        className={[
                                            "pointer-events-none absolute inset-0 z-30 m-auto grid h-16 w-16 place-items-center rounded-2xl border bg-brand-surface shadow-2xl backdrop-blur-xl",
                                            otpStatus === "success"
                                                ? "border-emerald-300/60 shadow-[0_0_34px_rgba(52,211,153,0.35)]"
                                                : otpStatus === "error"
                                                    ? "border-rose-300/60 shadow-[0_0_34px_rgba(251,113,133,0.35)]"
                                                    : "border-silver-light/50 shadow-silver-glow",
                                        ].join(" ")}
                                        initial={{ opacity: 0, scale: 0.65, rotate: -8 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.65, rotate: 8 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    >
                                        {otpStatus === "checking" ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-silver-light" />
                                        ) : otpStatus === "success" ? (
                                            <CheckCircle2 className="h-9 w-9 text-emerald-300" />
                                        ) : (
                                            <XCircle className="h-9 w-9 text-rose-300" />
                                        )}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        <Button type="submit" className="w-full cursor-pointer" disabled={isPending || otpStatus === "checking"}>
                            {phoneLoginMutation.isPending || verifyOtpMutation.isPending || otpStatus === "checking" ? "در حال بررسی..." : "تایید و ادامه"}
                        </Button>
                    </form>

                    <div className="mt-5 flex items-center justify-center gap-3 text-xs font-semibold">
                        {/* <button
                            type="button"
                            className="cursor-pointer text-brand-text-secondary transition-colors hover:text-white"
                        >
                            اصلاح شماره
                        </button> */}
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={sendOtpMutation.isPending || resendCooldown > 0}
                            className="cursor-pointer text-silver-light transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {sendOtpMutation.isPending ? "در حال ارسال..." : resendCooldown > 0 ? `ارسال مجدد (${resendCooldown.toLocaleString("fa-IR")} ثانیه)` : "ارسال مجدد کد"}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
