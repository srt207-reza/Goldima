import SilverBullionPrices from "@/components/dashboard/SilverBullionPrices";
import Footer from "@/components/layout/Footer";
import { MagicCard } from "@/components/ui/magic-card";

const features = [
    {
        title: "به‌روزرسانی در لحظه",
        description: "اتصال مستقیم به بازارهای جهانی؛ قیمت‌ها به صورت کاملاً خودکار و بدون تاخیر به‌روزرسانی می‌شوند.",
        iconPath: "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
    },
    {
        title: "امنیت سازمانی",
        description: "رمزنگاری پیشرفته داده‌ها و استفاده از پروتکل‌های امنیتی برای محافظت از دارایی‌ها و اطلاعات شما.",
        iconPath:
            "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    },
    {
        title: "پشتیبانی VIP",
        description: "تیم متخصص ما به صورت ۲۴ ساعته در ۷ روز هفته آماده ارائه مشاوره و رفع مشکلات احتمالی شماست.",
        iconPath:
            "M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z",
    },
];

export default function HomePage() {
    return (
        <>
            <main className="container mx-auto max-w-7xl grow px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <MagicCard className="mb-16 p-8 md:p-10" spotlightClassName="bg-silver-light/15">
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-hover/40 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:translate-x-4" />
                    <div className="absolute top-10 right-20 h-2 w-2 animate-float rounded-full bg-silver-light/30" />
                    <div className="absolute top-32 right-40 h-1.5 w-1.5 animate-float rounded-full bg-silver-metallic/40 [animation-delay:1s]" />
                    <div className="absolute bottom-20 left-32 h-2 w-2 animate-float rounded-full bg-silver-dark/30 [animation-delay:2s]" />

                    <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
                        <div className="relative flex h-20 w-20 rotate-3 items-center justify-center overflow-hidden rounded-2xl border border-silver-dark/30 bg-gradient-to-br from-brand-base to-brand-card shadow-lg shadow-silver/10 transition-all duration-500 group-hover:rotate-0 group-hover:scale-110 group-hover:shadow-silver-glow">
                            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-tr from-transparent via-silver-light/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                            <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="relative z-10 h-10 w-10 text-silver-metallic transition-colors duration-500 group-hover:text-silver-light"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                                />
                            </svg>
                        </div>

                        <div className="flex-1 text-right">
                            <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                                به داشبورد{" "}
                                <span className="inline-block animate-pulse bg-gradient-to-l from-silver-light via-silver to-silver-dark bg-clip-text text-transparent transition-all duration-700 group-hover:from-silver-dark group-hover:via-silver-light group-hover:to-silver">
                                    GOLDIMA
                                </span>{" "}
                                خوش آمدید
                            </h1>
                            <p className="max-w-3xl text-base font-light leading-relaxed text-brand-text-secondary md:text-lg">
                                مدیریت حرفه‌ای، رصد لحظه‌ای و معاملات امن شمش‌های نقره ترکیه و امارات در یک پلتفرم یکپارچه.
                            </p>
                            <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-l from-silver-light to-transparent opacity-50 transition-all duration-700 group-hover:w-40 group-hover:opacity-100" />
                        </div>
                    </div>
                </MagicCard>

                <SilverBullionPrices />

                <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {features.map((feature) => (
                        <MagicCard key={feature.title} className="p-8 text-center" spotlightClassName="bg-emerald-400/10">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-brand-card transition-colors duration-300 group-hover:bg-brand-hover">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-silver-metallic">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.iconPath} />
                                </svg>
                            </div>
                            <h3 className="mb-3 text-lg font-semibold text-white">{feature.title}</h3>
                            <p className="text-sm leading-relaxed text-brand-text-secondary">{feature.description}</p>
                        </MagicCard>
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
