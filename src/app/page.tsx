import SilverBullionPrices from "@/components/dashboard/SilverBullionPrices";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default function HomePage() {
    return (
        <>
            <Header />
            <main className="grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 container mx-auto max-w-7xl">
                {/* بنر خوش‌آمدگویی (بدون تغییر) */}
                <div className="relative overflow-hidden bg-brand-surface/40 backdrop-blur-xl border border-silver-dark/20 rounded-3xl p-8 md:p-10 mb-16 shadow-silver-glow group">
                    {/* افکت‌های نوری پس‌زمینه با موشن */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-silver-light/5 rounded-full blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:-translate-y-4"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-hover/40 rounded-full blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:translate-x-4"></div>

                    {/* ذرات شناور */}
                    <div className="absolute top-10 right-20 w-2 h-2 bg-silver-light/30 rounded-full animate-float"></div>
                    <div
                        className="absolute top-32 right-40 w-1.5 h-1.5 bg-silver-metallic/40 rounded-full animate-float"
                        style={{ animationDelay: "1s" }}
                    ></div>
                    <div
                        className="absolute bottom-20 left-32 w-2 h-2 bg-silver-dark/30 rounded-full animate-float"
                        style={{ animationDelay: "2s" }}
                    ></div>

                    {/* خط درخشان متحرک */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-l from-transparent via-silver-light/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-silver-light to-transparent animate-pulse"></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                        {/* آیکون با موشن پیشرفته */}
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-base to-brand-card border border-silver-dark/30 rounded-2xl flex items-center justify-center shadow-lg shadow-silver/10 transform rotate-3 transition-all duration-500 group-hover:rotate-0 group-hover:scale-110 group-hover:shadow-silver-glow relative overflow-hidden">
                            {/* افکت درخشش */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-silver-light/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                            <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-10 h-10 text-silver-metallic group-hover:text-silver-light transition-colors duration-500 relative z-10"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                                />
                            </svg>
                        </div>

                        {/* محتوای متنی راست‌چین با تایپوگرافی بهبود یافته */}
                        <div className="text-right flex-1">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight tracking-tight">
                                به داشبورد{" "}
                                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-l from-silver-light via-silver to-silver-dark group-hover:from-silver-dark group-hover:via-silver-light group-hover:to-silver transition-all duration-700 animate-pulse">
                                    GOLDIMA
                                </span>{" "}
                                خوش آمدید
                            </h1>
                            <p className="text-brand-text-secondary text-base md:text-lg font-light leading-relaxed max-w-3xl">
                                مدیریت حرفه‌ای، رصد لحظه‌ای و معاملات امن شمش‌های نقره ترکیه و امارات در یک پلتفرم
                                یکپارچه.
                            </p>

                            {/* نوار پیشرفت یا خط تزئینی */}
                            <div className="mt-4 h-1 w-24 bg-gradient-to-l from-silver-light to-transparent rounded-full opacity-50 group-hover:w-40 group-hover:opacity-100 transition-all duration-700"></div>
                        </div>
                    </div>
                </div>

                {/* کامپوننت جدید قیمت‌های زنده */}
                <SilverBullionPrices />

                {/* بخش ویژگی‌ها (بدون تغییر) */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ... (کارت‌های ویژگی‌ها مثل قبل باقی می‌مانند) ... */}
                    {/* کارت اول */}
                    <div className="bg-brand-surface/30 border border-white/5 hover:border-silver-dark/30 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-silver-glow group cursor-default">
                        <div className="w-16 h-16 mx-auto bg-brand-card rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-brand-hover transition-colors duration-300">
                            <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8 text-silver-metallic"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                                />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white text-lg mb-3">به‌روزرسانی در لحظه</h3>
                        <p className="text-sm text-brand-text-secondary leading-relaxed">
                            اتصال مستقیم به بازارهای جهانی؛ قیمت‌ها به صورت کاملاً خودکار و بدون تاخیر به‌روزرسانی
                            می‌شوند.
                        </p>
                    </div>

                    {/* کارت دوم */}
                    <div className="bg-brand-surface/30 border border-white/5 hover:border-silver-dark/30 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-silver-glow group cursor-default">
                        <div className="w-16 h-16 mx-auto bg-brand-card rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-brand-hover transition-colors duration-300">
                            <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8 text-silver-metallic"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                                />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white text-lg mb-3">امنیت سازمانی</h3>
                        <p className="text-sm text-brand-text-secondary leading-relaxed">
                            رمزنگاری پیشرفته داده‌ها و استفاده از پروتکل‌های امنیتی برای محافظت از دارایی‌ها و اطلاعات
                            شما.
                        </p>
                    </div>

                    {/* کارت سوم */}
                    <div className="bg-brand-surface/30 border border-white/5 hover:border-silver-dark/30 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-silver-glow group cursor-default">
                        <div className="w-16 h-16 mx-auto bg-brand-card rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-brand-hover transition-colors duration-300">
                            <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8 text-silver-metallic"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
                                />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white text-lg mb-3">پشتیبانی VIP</h3>
                        <p className="text-sm text-brand-text-secondary leading-relaxed">
                            تیم متخصص ما به صورت ۲۴ ساعته در ۷ روز هفته آماده ارائه مشاوره و رفع مشکلات احتمالی شماست.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
