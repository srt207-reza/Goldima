import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        container: {
            center: true,
            padding: "1.5rem",
            screens: {
                "2xl": "1360px",
            },
        },
        extend: {
            colors: {
                // پالت نقره‌ای (بر اساس متن لوگو)
                silver: {
                    DEFAULT: "#C0C0C0", 
                    light: "#E2E8F0",   
                    dark: "#94A3B8",
                    metallic: "#A0AEC0",
                },
                // پالت برند (بر اساس پس‌زمینه سرمه‌ای لوگو)
                brand: {
                    base: "#0B1120",      // پس‌زمینه اصلی (سرمه‌ای بسیار تیره)
                    surface: "#111827",   // پس‌زمینه دوم 
                    card: "#1F2937",      // پس‌زمینه کارت‌ها
                    hover: "#374151",     // رنگ هاور
                    border: "#4B5563",    // خطوط جداکننده
                    text: {
                        primary: "#F3F4F6",   // متن اصلی
                        secondary: "#9CA3AF", // متن فرعی
                    },
                },
                success: "#22C55E",
                warning: "#F59E0B",
                danger: "#EF4444",
            },
            fontFamily: {
                vazir: ["var(--font-vazirmatn)", "sans-serif"],
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    from: { opacity: "0", transform: "translateY(10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                },
                "border-beam": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                },
                "shimmer-slide": {
                    "0%": { transform: "translateX(120%)" },
                    "100%": { transform: "translateX(-120%)" },
                },
                "soft-pulse": {
                    "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
                    "50%": { opacity: "0.9", transform: "scale(1.05)" },
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.5s ease-out forwards",
                "float": "float 3s ease-in-out infinite",
                "border-beam": "border-beam 7s linear infinite",
                "shimmer-slide": "shimmer-slide 1.8s ease-in-out infinite",
                "soft-pulse": "soft-pulse 4s ease-in-out infinite",
            },
            boxShadow: {
                // تغییر سایه‌ها به نقره‌ای/آبی
                'silver-glow': '0 0 15px rgba(192, 192, 192, 0.2)',
                'silver-glow-strong': '0 0 25px rgba(192, 192, 192, 0.4)',
                'emerald-glow': '0 0 30px rgba(34, 197, 94, 0.18)',
                'deep-card': '0 24px 80px rgba(2, 6, 23, 0.34)',
            }
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        function ({ addUtilities }: any) {
            addUtilities({
                ".scrollbar-hide": {
                    "-ms-overflow-style": "none",
                    "scrollbar-width": "none",
                    "&::-webkit-scrollbar": { display: "none" },
                },
            });
        },
    ],
};

export default config;
