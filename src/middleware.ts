import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PAGES = new Set(["/", "/pending", ...AUTH_PAGES]);
const REFERENCE_ONLY_PAGES = new Set(["/stores", "/pricing"]);

function isSingleSegmentPath(pathname: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length === 1;
}

function isBusinessLandingPath(pathname: string): boolean {
    if (!isSingleSegmentPath(pathname)) {
        return false;
    }

    return !PUBLIC_PAGES.has(pathname) && !REFERENCE_ONLY_PAGES.has(pathname);
}

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    // 1) Public routes
    if (PUBLIC_PAGES.has(pathname) || isBusinessLandingPath(pathname)) {
        if (authToken && AUTH_PAGES.includes(pathname)) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        return NextResponse.next();
    }

    // 2) Reference-only tools: public users should be sent to login
    if (!authToken && REFERENCE_ONLY_PAGES.has(pathname)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 3) Auth pages: authenticated users should go home
    if (authToken && AUTH_PAGES.includes(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
