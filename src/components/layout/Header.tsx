"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LOGO from "@/../public/assets/images/logo.png";

export default function Header() {
    const router = useRouter();

    const handleLogout = () => {
        Cookies.remove("auth_token");
        toast.success("با موفقیت خارج شدید");
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-brand-surface/80 backdrop-blur-md border-b border-white/5 shadow-sm">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* لوگو با تصویر واقعی */}
                    <div className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative w-12 h-12 bg-gradient-to-br from-brand-card to-brand-base border border-silver-dark/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(192,192,192,0.05)] overflow-hidden transition-transform duration-300 group-hover:scale-105">
                            {/* افکت درخشش داخلی */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-silver-light/10 rounded-full blur-xl"></div>

                            {/* تصویر لوگو */}
                            <div className="relative w-14 h-14">
                                <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain" priority />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-silver-light via-silver to-silver-dark tracking-widest">
                                GOLDIMA
                            </h1>
                            <p className="text-[11px] text-silver-dark/70 tracking-wider">پلتفرم تخصصی شمش نقره</p>
                        </div>
                    </div>

                    {/* منوی راست */}
                    <nav className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-brand-text-secondary cursor-pointer hover:text-silver-light hover:bg-brand-hover/50 transition-all duration-300 rounded-lg px-4"
                        >
                            خروج از حساب
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    );
}
