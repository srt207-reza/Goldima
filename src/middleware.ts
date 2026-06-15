import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = new Set(["/login", "/register"]);
const PUBLIC_PAGES = new Set(["/login", "/register", "/pending"]);
const APP_SINGLE_SEGMENT_ROUTES = new Set(["profile", "share-link", "stores", "pricing"]);

function isSingleSegmentPath(pathname: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length === 1;
}

function isBusinessRegistrationLink(pathname: string): boolean {
    if (!isSingleSegmentPath(pathname)) {
        return false;
    }

    const [segment] = pathname.split("/").filter(Boolean);
    return Boolean(segment) && !APP_SINGLE_SEGMENT_ROUTES.has(segment);
}

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PAGES.has(pathname) || isBusinessRegistrationLink(pathname);
}

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    if (authToken && AUTH_PAGES.has(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    if (!authToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
