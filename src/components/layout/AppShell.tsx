"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    LayoutDashboard,
    LogOut,
    Maximize2,
    Menu,
    Minimize2,
    PanelLeftClose,
    PanelLeftOpen,
    Share2,
    Store,
    UserCheck,
    Tags,
    UserCircle2,
    Users,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUserQuery, useLogoutMutation } from "@/hooks/api";
import { clearAuthTokens, getAccessToken, getRefreshToken } from "@/lib/auth-storage";
import { getSuspendedUrl } from "@/lib/auth-routing";
import { canViewPricingTools, canViewUserManagement, getBusinessLabel, getNormalizedUserRole } from "@/lib/user-role";
import { normalizeBusinessPathSegment } from "@/lib/business-path";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { FullPageLoader } from "@/components/ui/Loader";
import LOGO from "@/../public/assets/images/logo.png";

type NavItem = {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
};

function getErrorStatus(error: unknown): number | undefined {
    const maybeError = error as { response?: { status?: number } } | null;
    return maybeError?.response?.status;
}

const APP_SINGLE_SEGMENT_ROUTES = new Set(["profile", "share-link", "stores", "pricing"]);

function isAuthRoute(pathname: string): boolean {
    return ["/login", "/register", "/otp", "/pending", "/suspended"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isBusinessRegistrationRoute(pathname: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length === 1 && !APP_SINGLE_SEGMENT_ROUTES.has(segments[0]) && pathname !== "/";
}

function isShellHidden(pathname: string): boolean {
    return isAuthRoute(pathname) || isBusinessRegistrationRoute(pathname);
}

function isActivePath(pathname: string, href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

function getRoleLabel(role: ReturnType<typeof getNormalizedUserRole>): string {
    if (role === "reference") return "مرجع";
    if (role === "wholesale") return "عمده‌فروش";
    if (role === "retail") return "تک‌فروش";
    return "حساب کاربری";
}

function resolveMediaUrl(src?: string | null): string {
    if (!src) return "";
    if (/^(blob:|data:|https?:\/\/)/i.test(src)) return src;

    const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    if (src.startsWith("/")) return apiOrigin ? `${apiOrigin}${src}` : src;

    return src;
}

function BusinessLogoMark({
    src,
    alt,
    className = "h-11 w-11 rounded-2xl",
}: {
    src?: string | null;
    alt: string;
    className?: string;
}) {
    const logoSrc = resolveMediaUrl(src);

    return (
        <div className={`relative shrink-0 overflow-hidden ${logoSrc ? "border border-silver-dark/20 bg-brand-base/60" : ""} ${className}`}>
            {logoSrc ? (
                <span
                    role="img"
                    aria-label={alt}
                    className="block h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${logoSrc.replace(/"/g, "%22")}")` }}
                />
            ) : (
                <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain" priority />
            )}
        </div>
    );
}

function LoadingGate() {
    return <FullPageLoader />;
}

function NavLink({
    href,
    label,
    icon: Icon,
    pathname,
    onClick,
    collapsed = false,
}: NavItem & {
    pathname: string;
    onClick?: () => void;
    collapsed?: boolean;
}) {
    const active = isActivePath(pathname, href);

    return (
        <Link
            href={href}
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={[
                "flex cursor-pointer items-center gap-3 rounded-2xl border py-3 text-sm transition-all duration-200",
                collapsed ? "justify-center px-3" : "px-4",
                active
                    ? "border-silver-light/20 bg-silver-light/10 text-silver-light shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                    : "border-transparent text-brand-text-secondary hover:border-white/5 hover:bg-white/5 hover:text-brand-text-primary",
            ].join(" ")}
        >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-silver-light" : "text-brand-text-secondary"}`} />
            {!collapsed && <span className="font-medium">{label}</span>}
        </Link>
    );
}

export default function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const logoutMutation = useLogoutMutation();
    const { data: currentUser, isLoading: isLoadingCurrentUser, isError: isCurrentUserError, error: currentUserError } = useCurrentUserQuery();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dashboardFullscreen, setDashboardFullscreen] = useState(false);

    const currentPathname = pathname ?? "/";
    const hideShell = isShellHidden(currentPathname);
    const role = useMemo(() => getNormalizedUserRole(currentUser), [currentUser]);
    const roleLabel = useMemo(() => getRoleLabel(role), [role]);
    const businessLabel = useMemo(() => getBusinessLabel(currentUser), [currentUser]);
    const isEmployee = currentUser?.is_employee === true;
    const businessLogo = currentUser?.business_logo ?? null;
    const showUserManagementTools = useMemo(() => canViewUserManagement(currentUser), [currentUser]);
    const showPricingTools = useMemo(() => canViewPricingTools(currentUser), [currentUser]);
    const hasRoleTools = showUserManagementTools || showPricingTools;
    const isCurrentUserApproved = String(currentUser?.status ?? "").toUpperCase() === "APPROVED";
    const isCurrentUserActive = currentUser?.is_active !== false && currentUser?.business_profile_is_active !== false;
    const isAllowedDashboardUser = Boolean(currentUser && isCurrentUserApproved && isCurrentUserActive);

    const navItems: NavItem[] = [
        { href: "/", label: "داشبورد", icon: LayoutDashboard },
        { href: "/profile", label: "پروفایل", icon: UserCircle2 },
        { href: "/share-link", label: "اشتراک‌گذاری لینک", icon: Share2 },
    ];

    if (showUserManagementTools) {
        navItems.push({ href: "/stores", label: "لیست کاربران", icon: Store });
    }

    if (showPricingTools) {
        navItems.push({ href: "/pricing", label: "قیمت‌گذاری‌ها", icon: Tags });
    }

    useEffect(() => {
        if (hideShell || isLoadingCurrentUser) return;

        if (isCurrentUserError && !getAccessToken() && !getRefreshToken()) {
            clearAuthTokens();
            router.replace("/login");
            return;
        }

        if (isCurrentUserError && getErrorStatus(currentUserError) === 403) {
            router.replace(getSuspendedUrl({
                reason: currentUserError instanceof Error ? currentUserError.message : undefined,
            }));
            return;
        }

        if (isCurrentUserError || !currentUser) {
            return;
        }

        if (!isAllowedDashboardUser) {
            const params = new URLSearchParams();
            const businessHandler = normalizeBusinessPathSegment(currentUser.business_handler ?? "");
            const status = String(currentUser.status ?? "").toUpperCase();

            if (status === "SUSPENDED" || !isCurrentUserActive) {
                router.replace(getSuspendedUrl({
                    businessHandler,
                    businessName: currentUser.business_name,
                    reason: currentUser.suspend_reason,
                }));
                return;
            }

            if (businessHandler) {
                params.set("business_handler", businessHandler);
            }

            if (currentUser.business_name) {
                params.set("business_name", currentUser.business_name);
            }

            if (currentUser.status) {
                params.set("status", status);
            }

            router.replace(`/pending${params.size ? `?${params.toString()}` : ""}`);
        }
    }, [currentUser, currentUserError, hideShell, isAllowedDashboardUser, isCurrentUserActive, isCurrentUserError, isLoadingCurrentUser, router]);

    useEffect(() => {
        if (!dashboardFullscreen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setDashboardFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dashboardFullscreen]);

    const handleLogout = async () => {
        const refresh = getRefreshToken();

        try {
            if (refresh) {
                await logoutMutation.mutateAsync({ refresh });
            }

            clearAuthTokens();
            toast.success("با موفقیت خارج شدید");
            router.replace("/login");
        } catch (error) {
            clearAuthTokens();
            const message = error instanceof Error ? error.message : "خروج با خطا مواجه شد";
            toast.error(message);
            router.replace("/login");
        }
    };

    const handleEnterFullscreen = () => {
        setMobileMenuOpen(false);
        setDashboardFullscreen(true);
    };

    if (hideShell) {
        return <>{children}</>;
    }

    if (isLoadingCurrentUser || !currentUser || !isAllowedDashboardUser) {
        return <LoadingGate />;
    }

    const sidebarWidth = sidebarCollapsed ? "lg:w-20" : "lg:w-72";
    const headerOffset = sidebarCollapsed ? "lg:right-20" : "lg:right-72";
    const mainOffset = sidebarCollapsed ? "lg:pr-20" : "lg:pr-72";

    return (
        <div
            className={[
                "relative overflow-hidden bg-brand-base text-brand-text-primary shadow-[0_25px_90px_rgba(2,6,23,0.28)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                dashboardFullscreen ? "h-dvh min-h-dvh border-transparent" : "min-h-screen border border-white/5",
            ].join(" ")}
        >
            <AmbientBackground className="opacity-70" dense />
            <div
                className={[
                    "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-500 ease-out lg:hidden",
                    dashboardFullscreen || !mobileMenuOpen ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100",
                ].join(" ")}
                onClick={() => setMobileMenuOpen(false)}
            />

            <aside
                className={[
                    "fixed right-0 top-0 z-50 h-dvh w-72 transform-gpu border-l border-white/5 bg-brand-surface/95 shadow-2xl shadow-black/25 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                    dashboardFullscreen ? "pointer-events-none translate-x-full opacity-0 blur-sm" : "",
                    sidebarWidth,
                    mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
                ].join(" ")}
                aria-hidden={dashboardFullscreen}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-20 items-center justify-between border-b border-white/5 px-4">
                        <div className={`flex items-center gap-3 ${sidebarCollapsed ? "mx-auto lg:mx-0" : ""}`}>
                            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-silver-dark/20 bg-gradient-to-br from-brand-card to-brand-base shadow-[0_0_18px_rgba(255,255,255,0.04)]">
                                <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain p-1.5" priority />
                            </div>

                            {!sidebarCollapsed && (
                                <div className="flex flex-col leading-tight">
                                    <span className="text-lg font-bold tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-l from-silver-light via-silver to-silver-dark">
                                        GOLDIMA
                                    </span>
                                    <span className="text-[11px] tracking-[0.2em] text-brand-text-secondary">
                                        پلتفرم تخصصی شمش نقره
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-silver-dark/20 text-brand-text-primary lg:hidden"
                            aria-label="بستن منو"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                        <div className={`rounded-3xl border border-silver-dark/15 bg-brand-base/45 p-4 ${sidebarCollapsed ? "lg:p-0 rounded-none border-0 bg-transparent" : ""}`}>
                            <div className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
                                <BusinessLogoMark src={businessLogo} alt={businessLabel} className="h-12 w-12 rounded-2xl" />

                                {!sidebarCollapsed && (
                                    <div>
                                        <p className="text-sm font-semibold text-brand-text-primary">{businessLabel}</p>
                                        <p className="mt-1 text-xs text-brand-text-secondary">نقش فعال: {roleLabel}</p>
                                        {isEmployee ? (
                                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
                                                <UserCheck className="h-3.5 w-3.5" />
                                                کارمند فروشگاه
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        <nav className="flex flex-1 flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    {...item}
                                    pathname={currentPathname}
                                    collapsed={sidebarCollapsed}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                            ))}

                            {!hasRoleTools ? (
                                <div className="mt-2 rounded-3xl border border-dashed border-silver-dark/20 bg-brand-base/35 p-4 text-sm leading-7 text-brand-text-secondary">
                                    {!sidebarCollapsed && "با نقش فعلی فقط به بخش‌های مجاز حساب خود دسترسی دارید."}
                                </div>
                            ) : (
                                <div className="mt-2 rounded-3xl border border-silver-dark/20 bg-brand-base/35 p-4">
                                    {!sidebarCollapsed && (
                                        <>
                                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-secondary">
                                                نقش فعال
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-brand-text-primary">
                                                {isEmployee ? <UserCheck className="h-4 w-4 text-emerald-200" /> : <Users className="h-4 w-4 text-silver-light" />}
                                                {roleLabel}
                                            </div>
                                            {isEmployee ? (
                                                <p className="mt-2 inline-flex items-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-100">
                                                    کارمند این کسب‌وکار
                                                </p>
                                            ) : null}
                                            <p className="mt-2 text-xs leading-6 text-brand-text-secondary">
                                                {showUserManagementTools && showPricingTools
                                                    ? "لیست کاربران و قیمت‌گذاری‌ها برای نقش شما فعال است."
                                                    : showPricingTools
                                                      ? "قیمت‌گذاری‌ها برای نقش شما فعال است."
                                                      : "لیست کاربران برای نقش شما فعال است."}
                                            </p>
                                        </>
                                    )}
                                    {sidebarCollapsed && (
                                        <div className="grid place-items-center py-2 text-silver-light">
                                            <Users className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>
                    </div>

                    <div className="space-y-3 border-t border-white/5 p-4 text-xs text-slate-500">
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                            title={sidebarCollapsed ? "خروج از حساب" : undefined}
                            className={[
                                "flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-red-400/10 bg-red-500/5 py-3 text-sm font-medium text-red-100 transition-all hover:border-red-300/25 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60",
                                sidebarCollapsed ? "justify-center px-3" : "px-4",
                            ].join(" ")}
                        >
                            <LogOut className="h-4 w-4 shrink-0 text-red-200" />
                            {!sidebarCollapsed && <span>{logoutMutation.isPending ? "در حال خروج..." : "خروج از حساب"}</span>}
                        </button>

                        <div className={sidebarCollapsed ? "flex justify-center" : "flex items-center justify-between gap-3"}>
                            {!sidebarCollapsed && <span>نسخه 1.2</span>}

                            <button
                                type="button"
                                onClick={() => setSidebarCollapsed((value) => !value)}
                                className={[
                                    "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-silver-dark/20 bg-brand-base/50 px-3 py-2 text-[11px] font-semibold text-brand-text-primary transition hover:bg-white/5",
                                    sidebarCollapsed ? "h-10 w-10 justify-center px-0" : "",
                                ].join(" ")}
                                aria-label={sidebarCollapsed ? "باز کردن منو" : "پنهان کردن منو"}
                            >
                                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                                {!sidebarCollapsed && <span>پنهان کردن</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <header
                className={[
                    "fixed top-0 left-0 right-0 z-40 h-20 transform-gpu border-b border-white/5 bg-brand-surface/85 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                    dashboardFullscreen ? "pointer-events-none -translate-y-full opacity-0 blur-sm" : "translate-y-0 opacity-100 blur-0",
                    headerOffset,
                ].join(" ")}
                aria-hidden={dashboardFullscreen}
            >
                <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((value) => !value)}
                            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-silver-dark/20 bg-brand-base/50 text-brand-text-primary transition-all hover:bg-white/5 lg:hidden"
                            aria-label="باز کردن منو"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* <div className="flex min-w-0 items-center gap-3">
                            <BusinessLogoMark src={businessLogo} alt={businessLabel} />

                            <div className="min-w-0 text-right">
                                <div className="truncate text-base font-bold text-white">{displayName}</div>
                                <div className="truncate text-xs text-brand-text-secondary">{roleLabel}</div>
                            </div>
                        </div> */}
                    </div>

                    <button
                        type="button"
                        onClick={handleEnterFullscreen}
                        className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-silver-dark/20 bg-brand-base/50 text-sm font-semibold text-brand-text-primary transition-all hover:border-silver-light/30 hover:bg-white/5 sm:w-auto sm:px-4"
                        aria-label="نمایش داشبورد به صورت تمام‌صفحه"
                        title="تمام‌صفحه"
                    >
                        <Maximize2 className="h-4 w-4 text-silver-light" />
                        <span className="hidden sm:inline">تمام‌صفحه</span>
                    </button>
                </div>
            </header>

            {dashboardFullscreen && (
                <button
                    type="button"
                    onClick={() => setDashboardFullscreen(false)}
                    className="fixed left-4 top-4 z-50 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-silver-dark/20 bg-brand-surface/90 px-4 text-sm font-semibold text-brand-text-primary shadow-2xl shadow-black/25 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300 hover:border-silver-light/30 hover:bg-brand-card/90"
                    aria-label="خروج از حالت تمام‌صفحه"
                    title="خروج از تمام‌صفحه"
                >
                    <Minimize2 className="h-4 w-4 text-silver-light" />
                    <span className="hidden sm:inline">خروج از تمام‌صفحه</span>
                </button>
            )}

            <main className={dashboardFullscreen ? "relative z-10 h-dvh min-h-dvh overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" : ["relative z-10 pt-20 transition-[padding-right] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", mainOffset].join(" ")}>
                <div className={dashboardFullscreen ? "h-dvh min-h-dvh w-full overflow-hidden bg-brand-surface/25 p-0 backdrop-blur-[1px] [&>main]:h-dvh [&>main]:min-h-dvh" : "min-h-[calc(100dvh-5rem)] w-full bg-brand-surface/25 p-0 backdrop-blur-[1px] [&>main]:min-h-[calc(100dvh-5rem)]"}>
                    {children}
                </div>
            </main>
        </div>
    );
}
