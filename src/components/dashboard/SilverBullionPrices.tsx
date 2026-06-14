"use client";

import { useState, useEffect } from "react";
import { MagicCard } from "@/components/ui/magic-card";

// نوع‌بندی دقیق برای ساختار قیمت‌ها
interface MarketPrices {
    buy: number;
    sell: number;
}
interface BullionData {
    tehranMarket: MarketPrices;
    originMarket: MarketPrices;
}
interface AllPrices {
    turkey: BullionData;
    uae: BullionData;
}

// تابع کمکی برای تبدیل عدد به رشته فارسی با جداکننده هزارگان
const formatPriceToPersian = (price: number): string => {
    const formatted = price.toLocaleString("en-US", { maximumFractionDigits: 0 });
    const persianDigits: { [key: string]: string } = {
        '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
        '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
    };
    return formatted.replace(/[0-9]/g, (digit) => persianDigits[digit]);
};

// -------------------------------------------------------------
// آیکون خالص شمش نقره (قرارگیری سمت راست متن)
// -------------------------------------------------------------
const PureSilverBullionIcon = () => (
    <div className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-500 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-lg blur-lg"></div>
        <svg className="relative w-10 h-10" viewBox="0 0 48 48" fill="none">
            {/* سایه زیر شمش */}
            <rect x="9" y="17" width="32" height="20" rx="2" fill="#000000" opacity="0.3" filter="blur(2px)" />
            
            {/* بدنه اصلی شمش */}
            <rect x="8" y="15" width="32" height="20" rx="2" fill="url(#pureSilverGrad)" stroke="#ffffff" strokeWidth="0.5"/>
            
            {/* خطوط برجستگی (ایجاد حس سه‌بعدی قالب شمش) */}
            <path d="M 11 18 L 37 18 L 34 32 L 14 32 Z" fill="url(#silverInnerGrad)" />
            
            {/* هایلایت نوری و درخشش */}
            <path d="M 11 18 L 18 18 L 15 32 L 14 32 Z" fill="#ffffff" opacity="0.4" />
            <circle cx="15" cy="20" r="1" fill="#ffffff" className="animate-pulse" opacity="0.9"/>
            
            <defs>
                <linearGradient id="pureSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="40%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <linearGradient id="silverInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
            </defs>
        </svg>
    </div>
);

// -------------------------------------------------------------
// آیکون پرچم دایره‌ای ترکیه (قرارگیری سمت چپ متن)
// -------------------------------------------------------------
const TurkeyFlagIcon = () => (
    <svg className="w-8 h-8 drop-shadow-md transition-transform duration-500 group-hover:-rotate-12 shrink-0" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="24" fill="#E30A17" />
        {/* هلال */}
        <path d="M 27 14 A 10 10 0 1 0 27 34 A 12 12 0 1 1 27 14 Z" fill="#ffffff" />
        {/* ستاره */}
        <polygon points="31.5,21.5 32.5,24.5 35.5,24.5 33,26.5 34,29.5 31.5,27.5 29,29.5 30,26.5 27.5,24.5 30.5,24.5" fill="#ffffff" />
    </svg>
);

// -------------------------------------------------------------
// آیکون پرچم دایره‌ای امارات (قرارگیری سمت چپ متن)
// -------------------------------------------------------------
const UAEFlagIcon = () => (
    <svg className="w-8 h-8 drop-shadow-md transition-transform duration-500 group-hover:rotate-12 shrink-0" viewBox="0 0 48 48" fill="none">
        <clipPath id="uae-circle-clip">
            <circle cx="24" cy="24" r="24" />
        </clipPath>
        <g clipPath="url(#uae-circle-clip)">
            <rect x="0" y="0" width="48" height="16" fill="#00732f" />
            <rect x="0" y="16" width="48" height="16" fill="#ffffff" />
            <rect x="0" y="32" width="48" height="16" fill="#000000" />
            <rect x="0" y="0" width="14" height="48" fill="#ff0000" />
        </g>
    </svg>
);

// کامپوننت کوچک برای نمایش تغییرات قیمت (فلش بالا/پایین و درصد)
const PriceChangeIndicator = ({ change }: { change: number }) => {
    const isPositive = change >= 0;
    return (
        <div dir="ltr" className={`flex items-center gap-1 text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <span className="animate-bounce">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(change).toFixed(2)}%</span>
        </div>
    );
};

export default function SilverBullionPrices() {
    // مقادیر اولیه برای قیمت‌ها و تغییرات
    const initialPrices: AllPrices = {
        turkey: {
            tehranMarket: { buy: 54_120_000, sell: 54_350_000 },
            originMarket: { buy: 53_800_000, sell: 54_010_000 },
        },
        uae: {
            tehranMarket: { buy: 55_200_000, sell: 55_450_000 },
            originMarket: { buy: 54_950_000, sell: 55_150_000 },
        },
    };

    const initialChanges: AllPrices = {
        turkey: {
            tehranMarket: { buy: 0.25, sell: 0.31 },
            originMarket: { buy: -0.11, sell: 0.05 },
        },
        uae: {
            tehranMarket: { buy: 1.12, sell: 1.08 },
            originMarket: { buy: 0.95, sell: 1.02 },
        },
    };

    const [prices, setPrices] = useState<AllPrices>(initialPrices);
    const [changes, setChanges] = useState<AllPrices>(initialChanges);

    // شبیه‌سازی به‌روزرسانی قیمت‌ها هر 5 ثانیه
    useEffect(() => {
        const interval = setInterval(() => {
            const updatePrice = (p: number) => p + (Math.random() - 0.5) * 50000;
            const updateChange = () => (Math.random() - 0.5) * 2;

            setPrices(prev => ({
                turkey: {
                    tehranMarket: { buy: updatePrice(prev.turkey.tehranMarket.buy), sell: updatePrice(prev.turkey.tehranMarket.sell) },
                    originMarket: { buy: updatePrice(prev.turkey.originMarket.buy), sell: updatePrice(prev.turkey.originMarket.sell) }
                },
                uae: {
                    tehranMarket: { buy: updatePrice(prev.uae.tehranMarket.buy), sell: updatePrice(prev.uae.tehranMarket.sell) },
                    originMarket: { buy: updatePrice(prev.uae.originMarket.buy), sell: updatePrice(prev.uae.originMarket.sell) }
                }
            }));
            setChanges({
                turkey: {
                    tehranMarket: { buy: updateChange(), sell: updateChange() },
                    originMarket: { buy: updateChange(), sell: updateChange() }
                },
                uae: {
                    tehranMarket: { buy: updateChange(), sell: updateChange() },
                    originMarket: { buy: updateChange(), sell: updateChange() }
                }
            });

        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const PriceRow = ({ label, price, change }: { label: string, price: number, change: number }) => (
        <div className="flex justify-between items-center py-4">
            <span className="text-sm text-brand-text-secondary">{label}</span>
            <div className="flex items-baseline gap-4">
                <PriceChangeIndicator change={change} />
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white tracking-wider font-sans">
                        {formatPriceToPersian(price)}
                    </span>
                    <span className="text-xs text-silver-dark">تومان</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8" dir="rtl">
             {/* هدر بخش قیمت‌ها */}
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="lg:text-3xl text-2xl font-bold text-white">نرخ لحظه‌ای شمش نقره</h2>
                    <p className="text-sm w-3/4 lg:w-full text-brand-text-secondary mt-2">
                        قیمت‌ها بر اساس هر کیلوگرم محاسبه شده و هر ۵ ثانیه به‌روز می‌شوند.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    زنده
                </div>
            </div>

            {/* گرید کارت‌های قیمت */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* کارت شمش ترکیه */}
                <MagicCard className="rounded-3xl bg-brand-surface/50 p-6" spotlightClassName="bg-silver-light/10">
                    {/* هدر کارت: ساختار پرچم (چپ) - متن (وسط) - شمش (راست) */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 mb-6">
                        <div className="flex items-center gap-3">
                            <PureSilverBullionIcon />
                            <h3 className="text-lg lg:text-xl font-bold text-silver-light group-hover:text-white transition-colors">شمش نقره ترکیه</h3>
                        </div>
                        <TurkeyFlagIcon />
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-2 pb-2 border-b border-white/10">بازار تهران</h4>
                            <PriceRow label="خرید" price={prices.turkey.tehranMarket.buy} change={changes.turkey.tehranMarket.buy} />
                            <PriceRow label="فروش" price={prices.turkey.tehranMarket.sell} change={changes.turkey.tehranMarket.sell} />
                        </div>
                         <div>
                            <h4 className="text-sm font-semibold text-white mb-2 pb-2 border-b border-white/10">بازار ترکیه</h4>
                            <PriceRow label="خرید" price={prices.turkey.originMarket.buy} change={changes.turkey.originMarket.buy} />
                            <PriceRow label="فروش" price={prices.turkey.originMarket.sell} change={changes.turkey.originMarket.sell} />
                        </div>
                    </div>
                </MagicCard>

                {/* کارت شمش امارات */}
                <MagicCard className="rounded-3xl bg-brand-surface/50 p-6" spotlightClassName="bg-emerald-400/10">
                    {/* هدر کارت: ساختار پرچم (چپ) - متن (وسط) - شمش (راست) */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 mb-6">
                        <div className="flex items-center gap-3">
                            <PureSilverBullionIcon />
                            <h3 className="text-lg lg:text-xl font-bold text-silver-light group-hover:text-white transition-colors">شمش نقره امارات</h3>
                        </div>
                        <UAEFlagIcon />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-2 pb-2 border-b border-white/10">بازار تهران</h4>
                            <PriceRow label="خرید" price={prices.uae.tehranMarket.buy} change={changes.uae.tehranMarket.buy} />
                            <PriceRow label="فروش" price={prices.uae.tehranMarket.sell} change={changes.uae.tehranMarket.sell} />
                        </div>
                         <div>
                            <h4 className="text-sm font-semibold text-white mb-2 pb-2 border-b border-white/10">بازار امارات</h4>
                            <PriceRow label="خرید" price={prices.uae.originMarket.buy} change={changes.uae.originMarket.buy} />
                            <PriceRow label="فروش" price={prices.uae.originMarket.sell} change={changes.uae.originMarket.sell} />
                        </div>
                    </div>
                </MagicCard>

            </div>
        </div>
    );
}
