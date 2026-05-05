export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#080d17] border-t border-white/5 mt-auto relative overflow-hidden">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* ستون اول (درباره) */}
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-silver-light via-silver to-silver-dark mb-4 inline-block">
                            GOLDIMA
                        </h3>
                        <p className="text-sm text-brand-text-secondary leading-relaxed max-w-sm">
                            پلتفرم هوشمند، امن و تخصصی برای مدیریت، رصد و معامله شمش‌های نقره با دسترسی مستقیم به قیمت‌های لحظه‌ای بازارهای جهانی، ترکیه و امارات.
                        </p>
                    </div>

                    {/* ستون دوم (دسترسی سریع) */}
                    <div>
                        <h4 className="text-white font-medium mb-5 text-sm uppercase tracking-wider">دسترسی سریع</h4>
                        <ul className="space-y-3 text-sm text-brand-text-secondary">
                            <li><a href="#" className="hover:text-silver-light transition-colors">شمش نقره ترکیه</a></li>
                            <li><a href="#" className="hover:text-silver-light transition-colors">شمش نقره امارات</a></li>
                            <li><a href="#" className="hover:text-silver-light transition-colors">تاریخچه معاملات</a></li>
                            <li><a href="#" className="hover:text-silver-light transition-colors">قوانین و مقررات</a></li>
                        </ul>
                    </div>

                    {/* ستون سوم (تماس) */}
                    <div>
                        <h4 className="text-white font-medium mb-5 text-sm uppercase tracking-wider">ارتباط با ما</h4>
                        <ul className="space-y-3 text-sm text-brand-text-secondary">
                            <li className="flex items-center gap-2">
                                <span className="text-silver-dark">📍</span> تهران، خیابان فردوسی
                            </li>
                            <li className="flex items-center gap-2" dir="ltr">
                                <span className="text-silver-dark">📞</span> 021 - 1234 5678
                            </li>
                            <li className="flex items-center gap-2" dir="ltr">
                                <span className="text-silver-dark">✉️</span> support@goldima.com
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-brand-text-secondary/70">
                        © {currentYear} تمامی حقوق مادی و معنوی برای پلتفرم گلدیما محفوظ است.
                    </p>
                    <div className="flex gap-4 text-xs text-brand-text-secondary/70">
                        <span>ورژن ۱.۰.۰</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
