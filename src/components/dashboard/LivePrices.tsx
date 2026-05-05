"use client";

import { useState, useEffect, useRef } from "react";

// --- توابع کمکی برای فرمت اعداد ---
const toPersianNum = (num: number) => {
    return new Intl.NumberFormat("fa-IR").format(Math.round(num));
};

const getUnitText = (num: number) => {
    if (num >= 1000000) {
        const m = Math.floor(num / 1000000);
        const k = Math.floor((num % 1000000) / 1000);
        return `${toPersianNum(m)} میلیون ${k > 0 ? `و ${toPersianNum(k)} هزار ` : ""}تومان`;
    } else if (num >= 1000) {
        return `${toPersianNum(Math.floor(num / 1000))} هزار تومان`;
    }
    return `${toPersianNum(num)} تومان`;
};

// --- کامپوننت داخلی کارت قیمت با افکت آپدیت زنده ---
const PriceCard = ({ title, subtitle, price, change, icon }: any) => {
    const prevPriceRef = useRef(price);
    const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);

    useEffect(() => {
        if (price > prevPriceRef.current) setFlashColor("green");
        else if (price < prevPriceRef.current) setFlashColor("red");
        
        prevPriceRef.current = price;
        const timer = setTimeout(() => setFlashColor(null), 1000);
        return () => clearTimeout(timer);
    }, [price]);

    const isPositive = change >= 0;

    return (
        <div className="relative group overflow-hidden bg-brand-surface/40 backdrop-blur-md border border-white/5 hover:border-silver-dark/40 rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow">
            {/* افکت نوری پس زمینه کارت */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-silver-light/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-card border border-white/5 flex items-center justify-center text-silver-metallic group-hover:scale-110 transition-transform duration-500 shadow-inner">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg tracking-wide">{title}</h3>
                        <p className="text-xs text-brand-text-secondary mt-1">{subtitle}</p>
                    </div>
                </div>
                {/* درصد تغییرات */}
                <div className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border ${
                    isPositive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                    <span dir="ltr">{toPersianNum(Math.abs(change))}%</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isPositive ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"} />
                    </svg>
                </div>
            </div>

            <div className="relative z-10">
                <div className={`text-3xl font-bold flex items-end gap-2 transition-colors duration-500 ${
                    flashColor === "green" ? "text-green-400" : flashColor === "red" ? "text-red-400" : "text-silver-light"
                }`}>
                    {toPersianNum(price)}
                    <span className="text-sm text-brand-text-secondary font-normal mb-1">تومان</span>
                </div>
                {/* نمایش واضح میلیون و هزار */}
                <div className="mt-2 text-sm text-silver-dark/80 font-light bg-brand-base/50 inline-block px-3 py-1 rounded-lg border border-white/5">
                    معادل: {getUnitText(price)}
                </div>
            </div>
        </div>
    );
};

// --- کامپوننت اصلی مدیریت قیمت‌ها ---
export default function LivePrices() {
    const [prices, setPrices] = useState({
        silverGranules: 42500, // ساچمه نقره جایگزین طلا شد
        silverRaw: 41800,
        silverBarUAE: 43500000, // قیمت‌های واقعی‌تر برای شمش‌های کیلویی
        silverBarTurkey: 43200000,
        nadirBarTurkey: 44100000,
    });

    const [changes, setChanges] = useState({
        granules: 2.3,
        raw: -1.2,
        uae: 0.8,
        turkey: 1.5,
        nadir: -0.5,
    });

    // شبیه‌سازی به‌روزرسانی قیمت‌ها هر 5 ثانیه
    useEffect(() => {
        const interval = setInterval(() => {
            setPrices((prev) => ({
                silverGranules: prev.silverGranules + (Math.random() - 0.5) * 500,
                silverRaw: prev.silverRaw + (Math.random() - 0.5) * 400,
                silverBarUAE: prev.silverBarUAE + (Math.random() - 0.5) * 50000,
                silverBarTurkey: prev.silverBarTurkey + (Math.random() - 0.5) * 45000,
                nadirBarTurkey: prev.nadirBarTurkey + (Math.random() - 0.5) * 60000,
            }));

            setChanges({
                granules: (Math.random() - 0.5) * 5,
                raw: (Math.random() - 0.5) * 3,
                uae: (Math.random() - 0.5) * 2,
                turkey: (Math.random() - 0.5) * 2,
                nadir: (Math.random() - 0.5) * 2,
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // آیکون عمومی شمش برای جلوگیری از تکرار کد SVG
    const BarIcon = () => (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
    );

    return (
        <div className="space-y-8">
            {/* هدر بخش قیمت‌ها */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-silver-light to-silver-dark flex items-center gap-3">
                        تابلوی معاملات زنده
                    </h2>
                    <p className="text-sm text-brand-text-secondary mt-2">
                        قیمت‌ها بر اساس بازار آزاد و به صورت لحظه‌ای محاسبه می‌شوند.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-brand-surface/50 border border-white/5 px-4 py-2 rounded-full shadow-inner">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-silver-light">آپدیت زنده (هر ۵ ثانیه)</span>
                </div>
            </div>

            {/* گرید قیمت‌ها */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PriceCard
                    title="ساچمه نقره"
                    subtitle="هر گرم خالص (عیار ۹۹۹)"
                    price={prices.silverGranules}
                    change={changes.granules}
                    icon={
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3h-7.5c-.621 0-1.125-.504-1.125-1.125m-9.75 0h7.5" />
                        </svg>
                    }
                />

                <PriceCard
                    title="نقره خام"
                    subtitle="هر گرم (عیار ۹۲۵)"
                    price={prices.silverRaw}
                    change={changes.raw}
                    icon={
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                        </svg>
                    }
                />

                <PriceCard
                    title="شمش نقره امارات"
                    subtitle="هر کیلوگرم (پلمپ)"
                    price={prices.silverBarUAE}
                    change={changes.uae}
                    icon={<BarIcon />}
                />

                <PriceCard
                    title="شمش نقره ترکیه"
                    subtitle="هر کیلوگرم (پلمپ)"
                    price={prices.silverBarTurkey}
                    change={changes.turkey}
                    icon={<BarIcon />}
                />

                <PriceCard
                    title="شمش Nadir ترکیه"
                    subtitle="هر کیلوگرم (سرتیفیکیت دار)"
                    price={prices.nadirBarTurkey}
                    change={changes.nadir}
                    icon={<BarIcon />}
                />

                {/* کارت "به زودی" با استایل متالیک/نقره ای */}
                <div className="relative overflow-hidden bg-gradient-to-br from-brand-surface to-brand-base border border-dashed border-silver-dark/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-not-allowed">
                    <div className="w-16 h-16 rounded-2xl bg-brand-card/50 flex items-center justify-center mb-4 border border-white/5">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-silver-dark group-hover:text-silver transition-colors duration-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-silver-light mb-1">افزودن دارایی جدید</h3>
                    <p className="text-sm text-brand-text-secondary">
                        به زودی ابزارهای جدید اضافه خواهد شد
                    </p>
                </div>
            </div>
        </div>
    );
}
