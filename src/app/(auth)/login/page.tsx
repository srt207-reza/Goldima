"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { usePhoneLoginMutation, useSendPhoneOtpMutation } from "@/hooks/api";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { setAuthTokens } from "@/lib/auth-storage";
import { normalizeMobileUsername } from "@/services/api/auth";
import type { AuthBusinessProfile } from "@/types/api/auth";
import LOGO from "@/../public/assets/images/logo.png";

const LogoIcon = () => (
    <div className="relative w-32 h-32 group">
        <div className="absolute inset-0 bg-gradient-to-br from-silver-light/30 to-silver-metallic/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700 animate-pulse"></div>
        <div className="relative w-32 h-32 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
            <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain drop-shadow-2xl" priority />
        </div>
    </div>
);

const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-silver-light/30 rounded-full animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-40 right-20 w-3 h-3 bg-silver-metallic/20 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-silver-light/40 rounded-full animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-silver-dark/30 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-silver-light/25 rounded-full animate-float" style={{ animationDelay: "3s" }} />
    </div>
);

type LoginStep = "phone" | "otp";

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

    if (role === "MASTER" || status === "APPROVED") {
        return "/";
    }

    return getPendingUrl(profile);
}

export default function LoginPage() {
    const router = useRouter();
    const sendOtpMutation = useSendPhoneOtpMutation();
    const phoneLoginMutation = usePhoneLoginMutation();

    const [step, setStep] = useState<LoginStep>("phone");
    const [formData, setFormData] = useState({
        username: "",
        code: "",
    });
    const [parentBusinessHandler, setParentBusinessHandler] = useState(DEFAULT_PARENT_BUSINESS_HANDLER);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const handler = normalizeBusinessPathSegment(params.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER);
        const usernameFromQuery = normalizeMobileUsername(params.get("username") || "");
        const otpHasBeenSent = params.get("otp_sent") === "1";

        setParentBusinessHandler(handler || DEFAULT_PARENT_BUSINESS_HANDLER);

        if (usernameFromQuery) {
            setFormData((prev) => ({ ...prev, username: usernameFromQuery }));
        }

        if (usernameFromQuery && otpHasBeenSent) {
            setStep("otp");
        }
    }, []);

    const isPending = sendOtpMutation.isPending || phoneLoginMutation.isPending;
    const normalizedUsername = useMemo(() => normalizeMobileUsername(formData.username), [formData.username]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSendOtp = async () => {
        const response = await sendOtpMutation.mutateAsync({ phone_number: formData.username });

        if (response.is_registered) {
            toast.success("کد تایید برای شما ارسال شد");
            setStep("otp");
            setFormData((prev) => ({ ...prev, username: normalizedUsername, code: "" }));
            return;
        }

        toast.success("کد تایید ارسال شد. اطلاعات ثبت‌نام را تکمیل کنید.");
        const params = new URLSearchParams({
            username: normalizedUsername,
            otp_sent: "1",
            business_handler: parentBusinessHandler,
        });
        router.replace(`/register?${params.toString()}`);
    };

    const handlePhoneLogin = async () => {
        const response = await phoneLoginMutation.mutateAsync({
            username: formData.username,
            code: formData.code,
        });

        setAuthTokens({ access: response.access, refresh: response.refresh });
        toast.success("ورود موفقیت‌آمیز بود");
        router.replace(getPostAuthUrl(response.user_profile));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            if (step === "phone") {
                await handleSendOtp();
                return;
            }

            await handlePhoneLogin();
        } catch (error) {
            const message = error instanceof Error ? error.message : "عملیات ورود با خطا مواجه شد";
            toast.error(message);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4">
            <AmbientBackground dense />
            <FloatingParticles />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-silver-light/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-silver-metallic/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

            <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-silver-glow group">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <LogoIcon />
                    </div>

                    <h1 className="text-4xl font-bold mb-2 tracking-wider">
                        <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">GOLDIMA</span>
                    </h1>
                    <p className="text-brand-text-secondary leading-relaxed">
                        {step === "phone" ? "ورود با شماره موبایل" : "کد تایید ارسال‌شده را وارد کنید"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="group/input">
                        <Label htmlFor="username" className="text-brand-text-primary text-right block mb-2">
                            شماره موبایل
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            required
                            disabled={step === "otp"}
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="09123456789"
                            dir="ltr"
                            className="transition-all duration-300 focus:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                        />
                    </div>

                    {step === "otp" ? (
                        <div className="group/input">
                            <Label htmlFor="code" className="text-brand-text-primary text-right block mb-2">
                                کد تایید
                            </Label>
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="4829"
                                dir="ltr"
                                className="transition-all duration-300 focus:scale-[1.02]"
                            />
                            <button
                                type="button"
                                onClick={() => setStep("phone")}
                                className="mt-3 cursor-pointer text-xs font-medium text-silver-light transition-colors hover:text-white"
                            >
                                اصلاح شماره موبایل
                            </button>
                        </div>
                    ) : null}

                    <Button type="submit" className="w-full cursor-pointer !mt-8 relative overflow-hidden group/btn" disabled={isPending}>
                        {isPending ? "در حال بررسی..." : step === "phone" ? "دریافت کد تایید" : "ورود"}
                    </Button>
                </form>

            </Card>
        </div>
    );
}
