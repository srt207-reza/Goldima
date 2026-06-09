import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import AppProviders from "@/components/providers/AppProviders";
import AppShell from "@/components/layout/AppShell";
import "../styles/globals.css";

export const metadata: Metadata = {
    title: "گلدیما | مدیریت آنلاین شمش نقره",
    description: "پلتفرم هوشمند برای مدیریت و خرید و فروش آنلاین شمش نقره.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="fa" dir="rtl" className="scroll-smooth">
            <body
                cz-shortcut-listen="true"
                className="flex flex-col min-h-screen bg-brand-base text-brand-text-primary antialiased selection:bg-silver-dark/30"
            >
                <AppProviders><AppShell>{children}</AppShell></AppProviders>

                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: "#1F2937",
                            color: "#F3F4F6",
                            border: "1px solid #4B5563",
                            fontFamily: "var(--font-vazirmatn)",
                        },
                        success: {
                            iconTheme: {
                                primary: "#22C55E",
                                secondary: "#F3F4F6",
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: "#EF4444",
                                secondary: "#F3F4F6",
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
