"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/hooks/api";
import { setAuthTokens } from "@/lib/auth-storage";
import { getCurrentUser } from "@/services/api/user";
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
        <div
            className="absolute top-20 left-10 w-2 h-2 bg-silver-light/30 rounded-full animate-float"
            style={{ animationDelay: "0s" }}
        ></div>
        <div
            className="absolute top-40 right-20 w-3 h-3 bg-silver-metallic/20 rounded-full animate-float"
            style={{ animationDelay: "2s" }}
        ></div>
        <div
            className="absolute bottom-32 left-1/4 w-2 h-2 bg-silver-light/40 rounded-full animate-float"
            style={{ animationDelay: "4s" }}
        ></div>
        <div
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-silver-dark/30 rounded-full animate-float"
            style={{ animationDelay: "1s" }}
        ></div>
        <div
            className="absolute bottom-20 right-10 w-2 h-2 bg-silver-light/25 rounded-full animate-float"
            style={{ animationDelay: "3s" }}
        ></div>
    </div>
);

export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLoginMutation();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
        const response = await loginMutation.mutateAsync({
            username: formData.username.trim(),
            password: formData.password,
        });

        setAuthTokens(response);

        const currentUser = await getCurrentUser();

        const role = String(currentUser.data.user.role ?? "").toUpperCase();
        const status = String(currentUser.data.user.status ?? "").toUpperCase();

        toast.success("ورود موفقیت‌آمیز بود");

        if (role === "MASTER" || status === "APPROVED") {
            router.replace("/");
            return;
        }

        const params = new URLSearchParams({
            business_handler: currentUser.data.business_handler ?? "",
            business_name: currentUser.data.business_name ?? "",
        });

        router.replace(`/pending?${params.toString()}&business_handler=${encodeURIComponent(currentUser.data.business_handler ?? '')}`);
    } catch (error) {
        setFormData({
            username: "",
            password: "",
        });

        const message = error instanceof Error ? error.message : "ورود با خطا مواجه شد";
        toast.error(message);
    }
};

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card overflow-hidden">
            <FloatingParticles />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-silver-light/5 rounded-full blur-3xl animate-pulse"></div>
            <div
                className="absolute bottom-0 right-1/4 w-96 h-96 bg-silver-metallic/5 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
            ></div>

            <Card className="relative mx-4 w-full max-w-md p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl hover:shadow-silver-glow transition-all duration-500 hover:-translate-y-2 group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <LogoIcon />
                    </div>

                    <h1 className="text-4xl font-bold mb-2 tracking-wider">
                        <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                            GOLDIMA
                        </span>
                    </h1>
                    <p className="text-brand-text-secondary leading-relaxed">ورود به حساب کاربری</p>
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
                            autoComplete="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="09123456789"
                            dir="ltr"
                            className="transition-all duration-300 focus:scale-[1.02]"
                        />
                    </div>

                    <div className="group/input">
                        <Label htmlFor="password" className="text-brand-text-primary text-right block mb-2">
                            رمز عبور
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            dir="ltr"
                            className="transition-all duration-300 focus:scale-[1.02]"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full cursor-pointer !mt-8 relative overflow-hidden group/btn"
                        disabled={loginMutation.isPending}
                    >
                        <span className="relative text-white z-10">
                            {loginMutation.isPending ? "در حال ورود..." : "ورود"}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-silver-light/0 via-silver-light/20 to-silver-light/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-brand-text-secondary">
                    <p className="text-right leading-relaxed">
                        حساب کاربری ندارید؟{" "}
                        <Link
                            href="/register"
                            className="text-silver-light hover:text-white transition-colors font-semibold"
                        >
                            ثبت‌نام کنید
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
