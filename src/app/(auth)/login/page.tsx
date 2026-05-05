// src/app/login/page.tsx
"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LOGO from "@/../public/assets/images/logo.png";

// کامپوننت لوگو با افکت‌های موشن
const LogoIcon = () => (
    <div className="relative w-32 h-32 group">
        {/* افکت نوری پس‌زمینه */}
        <div className="absolute inset-0 bg-gradient-to-br from-silver-light/30 to-silver-metallic/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700 animate-pulse"></div>
        
        {/* تصویر لوگو */}
        <div className="relative w-32 h-32 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
            <Image
                src={LOGO}
                alt="GOLDIMA Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
            />
        </div>
        
        {/* درخشش */}
        {/* <div className="absolute top-2 right-2 w-3 h-3 bg-white/80 rounded-full animate-ping"></div> */}
    </div>
);

// ذرات شناور در پس‌زمینه
const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-silver-light/30 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-silver-metallic/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-silver-light/40 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-silver-dark/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-silver-light/25 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
    </div>
);

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        console.log("🔍 شروع لاگین...");
        console.log("📝 Username:", formData.username);
        console.log("📝 Password:", formData.password);

        if (formData.username.trim() === "admin" && formData.password.trim() === "admin") {
            console.log("✅ اعتبارسنجی موفق");

            Cookies.set("auth_token", "fake-admin-token-for-goldima", {
                expires: 1,
                path: "/",
                sameSite: "lax",
            });

            const checkCookie = Cookies.get("auth_token");
            console.log("🍪 کوکی بعد از ست شدن:", checkCookie);

            if (checkCookie) {
                toast.success("ورود موفقیت‌آمیز! در حال انتقال...");
                console.log("🚀 در حال انتقال به صفحه اصلی...");

                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
            } else {
                toast.error("خطا در ذخیره اطلاعات لاگین");
                console.error("❌ کوکی ست نشد!");
                setLoading(false);
            }
        } else {
            console.log("❌ نام کاربری یا رمز عبور اشتباه");
            toast.error("نام کاربری یا رمز عبور اشتباه است");
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card overflow-hidden">
            {/* ذرات شناور */}
            <FloatingParticles />
            
            {/* افکت‌های نوری پس‌زمینه */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-silver-light/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-silver-metallic/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <Card className="relative mx-4 w-full max-w-md p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl hover:shadow-silver-glow transition-all duration-500 hover:-translate-y-2 group">
                {/* خط درخشان بالای کارت */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <LogoIcon />
                    </div>
                    
                    <h1 className="text-4xl -mt-6 block text-center font-bold mb-2 tracking-wider text-right">
                        <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                            GOLDIMA
                        </span>
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group/input">
                        <Label htmlFor="username" className="text-brand-text-primary text-right block mb-2">
                            نام کاربری
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="admin"
                            autoComplete="username"
                            className="transition-all duration-300 focus:scale-[1.02] text-right"
                            disabled={loading}
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
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="admin"
                            autoComplete="current-password"
                            className="transition-all duration-300 focus:scale-[1.02] text-right"
                            disabled={loading}
                        />
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full cursor-pointer !mt-8 relative overflow-hidden group/btn" 
                        disabled={loading}
                    >
                        <span className="relative text-white z-10">{loading ? "در حال ورود..." : "ورود به داشبورد"}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-silver-light/0 via-silver-light/20 to-silver-light/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-brand-text-secondary">
                    <p className="text-right leading-relaxed">
                        برای ورود از نام کاربری و رمز عبور <span className="text-silver-light font-semibold">admin</span> استفاده کنید
                    </p>
                </div>
            </Card>
        </div>
    );
}
