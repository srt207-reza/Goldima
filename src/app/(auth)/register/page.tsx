// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// آیکون لوگو با موشن
const LogoIcon = () => (
    <div className="relative w-20 h-20 group">
        <div className="absolute inset-0 bg-gradient-to-br from-silver-light/30 to-silver-metallic/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700 animate-pulse"></div>
        
        <svg className="relative w-20 h-20 transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-110" viewBox="0 0 80 80" fill="none">
            <rect x="15" y="25" width="50" height="30" rx="3" fill="url(#registerGrad)" className="drop-shadow-2xl"/>
            <line x1="20" y1="32" x2="60" y2="32" stroke="#fff" strokeWidth="1" opacity="0.4" className="group-hover:opacity-70 transition-opacity"/>
            <line x1="20" y1="40" x2="60" y2="40" stroke="#fff" strokeWidth="1" opacity="0.4" className="group-hover:opacity-70 transition-opacity"/>
            <line x1="20" y1="48" x2="60" y2="48" stroke="#fff" strokeWidth="1" opacity="0.4" className="group-hover:opacity-70 transition-opacity"/>
            <text x="40" y="48" fontSize="24" fontWeight="bold" fill="#0B1120" textAnchor="middle" className="font-sans">G</text>
            <circle cx="55" cy="32" r="3" fill="#fff" opacity="0.8" className="animate-ping"/>
            
            <defs>
                <linearGradient id="registerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E2E8F0" />
                    <stop offset="50%" stopColor="#C0C0C0" />
                    <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>
            </defs>
        </svg>
    </div>
);

// ذرات شناور
const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-2 h-2 bg-silver-light/30 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-silver-metallic/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-1/4 w-2 h-2 bg-silver-light/40 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-silver-dark/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-10 w-2 h-2 bg-silver-light/25 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
    </div>
);

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
                formData
            );

            const { token, name } = response.data;
            Cookies.set("auth_token", token, { expires: 30 });

            toast.success(`ثبت‌نام موفقیت‌آمیز بود! خوش آمدی ${name}`);
            router.push("/");
            router.refresh();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "خطایی در ثبت‌نام رخ داد";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-base via-brand-surface to-brand-card overflow-hidden">
            <FloatingParticles />
            
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-silver-light/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-silver-metallic/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <Card className="relative w-full max-w-md p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 shadow-2xl hover:shadow-silver-glow transition-all duration-500 hover:-translate-y-2 group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <LogoIcon />
                    </div>
                    
                    <h1 className="text-4xl font-bold mb-2 tracking-wider text-right">
                        <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                            GOLDIMA
                        </span>
                    </h1>
                    <p className="text-brand-text-secondary text-right leading-relaxed">ثبت‌نام و ایجاد حساب کاربری جدید</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="group/input">
                        <Label htmlFor="name" className="text-brand-text-primary text-right block mb-2">نام و نام خانوادگی</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="مثال: علی رضایی"
                            className="transition-all duration-300 focus:scale-[1.02] text-right"
                        />
                    </div>

                    <div className="group/input">
                        <Label htmlFor="mobile" className="text-brand-text-primary text-right block mb-2">شماره موبایل</Label>
                        <Input
                            id="mobile"
                            name="mobile"
                            type="tel"
                            required
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="09123456789"
                            dir="ltr"
                            className="transition-all duration-300 focus:scale-[1.02]"
                        />
                    </div>

                    <div className="group/input">
                        <Label htmlFor="password" className="text-brand-text-primary text-right block mb-2">رمز عبور</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
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
                        className="w-full !mt-8 relative overflow-hidden group/btn" 
                        disabled={loading}
                    >
                        <span className="relative z-10">{loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-silver-light/0 via-silver-light/20 to-silver-light/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-brand-text-secondary">
                    <p className="text-right leading-relaxed">
                        قبلاً ثبت‌نام کرده‌اید؟{" "}
                        <a href="/login" className="text-silver-light hover:text-white transition-colors font-semibold">
                            ورود به حساب
                        </a>
                    </p>
                </div>
            </Card>
        </div>
    );
}
