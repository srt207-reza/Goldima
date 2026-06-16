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
import { useSendPhoneOtpMutation } from "@/hooks/api";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { normalizeMobileUsername } from "@/services/api/auth";
import LOGO from "@/../public/assets/images/logo.png";

const LogoIcon = () => (
    <div className="relative h-32 w-32 group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-silver-light/30 to-silver-metallic/30 blur-2xl transition-all duration-700 group-hover:blur-3xl animate-pulse" />
        <div className="relative h-32 w-32 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
            <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain drop-shadow-2xl" priority />
        </div>
    </div>
);

const FloatingParticles = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-2 w-2 rounded-full bg-silver-light/30 animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute right-20 top-40 h-3 w-3 rounded-full bg-silver-metallic/20 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-32 left-1/4 h-2 w-2 rounded-full bg-silver-light/40 animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute right-1/3 top-1/3 h-1 w-1 rounded-full bg-silver-dark/30 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 right-10 h-2 w-2 rounded-full bg-silver-light/25 animate-float" style={{ animationDelay: "3s" }} />
    </div>
);

export default function LoginPage() {
    const router = useRouter();
    const sendOtpMutation = useSendPhoneOtpMutation();

    const [username, setUsername] = useState("");
    const [parentBusinessHandler, setParentBusinessHandler] = useState(DEFAULT_PARENT_BUSINESS_HANDLER);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const handler = normalizeBusinessPathSegment(params.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER);
        const usernameFromQuery = normalizeMobileUsername(params.get("username") || "");

        setParentBusinessHandler(handler || DEFAULT_PARENT_BUSINESS_HANDLER);

        if (usernameFromQuery) {
            setUsername(usernameFromQuery);
        }
    }, []);

    const normalizedUsername = useMemo(() => normalizeMobileUsername(username), [username]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            const response = await sendOtpMutation.mutateAsync({ phone_number: username });
            const params = new URLSearchParams({
                username: normalizedUsername,
                business_handler: parentBusinessHandler,
                flow: response.is_registered ? "login" : "register",
            });

            toast.success("کد تایید ارسال شد");
            router.replace(`/otp?${params.toString()}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "ارسال کد تایید با خطا مواجه شد";
            toast.error(message);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4">
            <AmbientBackground dense />
            <FloatingParticles />
            <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-silver-light/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

            <Card className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-silver-glow">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <LogoIcon />
                    </div>

                    <h1 className="mb-2 text-4xl font-bold tracking-wider">
                        <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">GOLDIMA</span>
                    </h1>
                    <p className="leading-relaxed text-brand-text-secondary">ورود با شماره موبایل</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="group/input">
                        <Label htmlFor="username" className="mb-2 block text-right text-brand-text-primary">
                            شماره موبایل
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            required
                            value={username}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
                            placeholder="09123456789"
                            dir="ltr"
                            className="transition-all duration-300 focus:scale-[1.02]"
                        />
                    </div>

                    <Button type="submit" className="w-full cursor-pointer !mt-8" disabled={sendOtpMutation.isPending}>
                        {sendOtpMutation.isPending ? "در حال ارسال..." : "دریافت کد تایید"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
