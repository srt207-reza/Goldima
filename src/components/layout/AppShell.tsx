"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings2,
    Share2,
    Store,
    Tags,
    UserCircle2,
    Users,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUserQuery, useLogoutMutation } from "@/hooks/api";
import { clearAuthTokens, getRefreshToken } from "@/lib/auth-storage";
import { canViewPricingTools, canViewUserManagement, getBusinessLabel, getDisplayName, getNormalizedUserRole } from "@/lib/user-role";
import { normalizeBusinessPathSegment } from "@/lib/business-path";
import { AmbientBackground } from "@/components/ui/ambient-background";
import LOGO from "@/../public/assets/images/logo.png";

type NavItem = {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
};

const APP_SINGLE_SEGMENT_ROUTES = new Set(["profile", "share-link", "stores", "pricing"]);

function isAuthRoute(pathname: string): boolean {
    return ["/login", "/register", "/pending"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
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

function LoadingGate() {
    return (
        <div className="grid min-h-screen place-items-center bg-brand-base px-4 text-right">
            <div className="w-full max-w-md rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="mb-2 h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
        </div>
    );
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
    const { data: currentUser, isLoading: isLoadingCurrentUser, isError: isCurrentUserError } = useCurrentUserQuery();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const currentPathname = pathname ?? "/";
    const hideShell = isShellHidden(currentPathname);
    const role = useMemo(() => getNormalizedUserRole(currentUser), [currentUser]);
    const roleLabel = useMemo(() => getRoleLabel(role), [role]);
    const displayName = useMemo(() => getDisplayName(currentUser), [currentUser]);
    const businessLabel = useMemo(() => getBusinessLabel(currentUser), [currentUser]);
    const showUserManagementTools = useMemo(() => canViewUserManagement(currentUser), [currentUser]);
    const showPricingTools = useMemo(() => canViewPricingTools(currentUser), [currentUser]);
    const hasRoleTools = showUserManagementTools || showPricingTools;
    const isAllowedDashboardUser = Boolean(currentUser && (role === "reference" || currentUser.status === "APPROVED"));

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

        if (isCurrentUserError || !currentUser) {
            clearAuthTokens();
            router.replace("/login");
            return;
        }

        if (!isAllowedDashboardUser) {
            const params = new URLSearchParams();
            const businessHandler = normalizeBusinessPathSegment(currentUser.business_handler ?? "");

            if (businessHandler) {
                params.set("business_handler", businessHandler);
            }

            if (currentUser.business_name) {
                params.set("business_name", currentUser.business_name);
            }

            router.replace(`/pending${params.size ? `?${params.toString()}` : ""}`);
        }
    }, [currentUser, hideShell, isAllowedDashboardUser, isCurrentUserError, isLoadingCurrentUser, router]);

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
        <div className="relative min-h-screen overflow-hidden border border-white/5 bg-brand-base text-brand-text-primary shadow-[0_25px_90px_rgba(2,6,23,0.28)]">
            <AmbientBackground className="opacity-70" dense />
            <div
                className={[
                    "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-500 ease-out lg:hidden",
                    mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                ].join(" ")}
                onClick={() => setMobileMenuOpen(false)}
            />

            <aside
                className={[
                    "fixed right-0 top-0 z-50 h-screen w-72 transform-gpu border-l border-white/5 bg-brand-surface/95 shadow-2xl shadow-black/25 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform lg:duration-300",
                    sidebarWidth,
                    mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
                ].join(" ")}
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-silver-dark/20 bg-silver-light/10 text-silver-light">
                                    <Settings2 className="h-5 w-5" />
                                </div>

                                {!sidebarCollapsed && (
                                    <div>
                                        <p className="text-sm font-semibold text-brand-text-primary">{businessLabel}</p>
                                        <p className="mt-1 text-xs text-brand-text-secondary">نقش فعال: {roleLabel}</p>
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
                                                <Users className="h-4 w-4 text-silver-light" />
                                                {roleLabel}
                                            </div>
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
                                aria-label={sidebarCollapsed ? "باز کردن منو" : "جمع‌کردن منو"}
                            >
                                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                                {!sidebarCollapsed && <span>جمع‌کردن</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <header
                className={[
                    "fixed top-0 left-0 right-0 z-40 h-20 border-b border-white/5 bg-brand-surface/85 backdrop-blur-xl transition-all duration-300",
                    headerOffset,
                ].join(" ")}
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

                        <div className="flex min-w-0 items-center gap-3">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-silver-dark/20 bg-brand-base/60">
                                <Image src={LOGO} alt="GOLDIMA Logo" fill className="object-contain p-1.5" priority />
                            </div>

                            <div className="min-w-0 text-right">
                                <div className="truncate text-base font-bold text-white">{displayName}</div>
                                <div className="truncate text-xs text-brand-text-secondary">{roleLabel}</div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden min-w-0 items-center rounded-2xl border border-silver-dark/20 bg-brand-base/45 px-4 py-2.5 text-right sm:flex">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-brand-text-primary">{businessLabel}</p>
                            <p className="mt-1 truncate text-[11px] text-brand-text-secondary">حساب فعال</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className={["relative z-10 pt-20 transition-[padding-right] duration-300", mainOffset].join(" ")}>
                <div className="min-h-[calc(100vh-5rem)] w-full bg-brand-surface/25 p-0 backdrop-blur-[1px]">{children}</div>
            </main>
        </div>
    );
}
