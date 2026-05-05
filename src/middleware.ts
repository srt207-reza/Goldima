import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    // مسیرهای عمومی
    const publicPaths = ["/login", "/register"];

    // ۱. اگر توکن ندارد و می‌خواهد به مسیر محافظت‌شده برود -> هدایت به لاگین
    if (!authToken && !publicPaths.includes(pathname)) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // ۲. اگر توکن دارد و می‌خواهد به صفحه لاگین برود -> هدایت به داشبورد
    if (authToken && publicPaths.includes(pathname)) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
