"use client";

import { ServerCrash, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="fa" dir="rtl">
            <body>
                <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="container text-center px-4 max-w-xl mx-auto">
                        <div className="inline-block p-6 bg-red-100 text-red-500 rounded-3xl mb-8">
                            <ServerCrash className="w-16 h-16" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-iransans mb-4">
                            مشکلی در بارگذاری سایت پیش آمده!
                        </h1>
                        <p className="text-gray-500 text-lg mb-10">
                            یک خطای اساسی در برنامه رخ داده است. لطفاً صفحه را مجدداً بارگذاری کنید.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="flex cursor-pointer items-center gap-2 mx-auto bg-salona-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-salona-600 transition-all shadow-lg shadow-salona-200 hover:-translate-y-1"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>بارگذاری مجدد سایت</span>
                        </button>
                    </div>
                </main>
            </body>
        </html>
    );
}
