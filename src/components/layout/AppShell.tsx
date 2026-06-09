"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ChevronDown,
    LayoutDashboard,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings2,
    Store,
    Tags,
    UserCircle2,
    Users,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUserQuery, useLogoutMutation } from "@/hooks/api";
import { clearAuthTokens, getRefreshToken } from "@/lib/auth-storage";
import { canViewReferenceTools, getBusinessLabel, getDisplayName, getNormalizedUserRole } from "@/lib/user-role";
import LOGO from "@/../public/assets/images/logo.png";

type NavItem = {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
};

function isAuthRoute(pathname: string): boolean {
    return ["/login", "/register", "/pending"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isActivePath(pathname: string, href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
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
                "flex items-center gap-3 rounded-2xl border py-3 text-sm transition-all duration-200",
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
    const { data: currentUser } = useCurrentUserQuery();

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const hideShell = isAuthRoute(pathname ?? "");
    const hasSession = Boolean(currentUser);
    const role = useMemo(() => getNormalizedUserRole(currentUser), [currentUser]);
    const displayName = useMemo(() => getDisplayName(currentUser), [currentUser]);
    const businessLabel = useMemo(() => getBusinessLabel(currentUser), [currentUser]);
    const showReferenceTools = useMemo(() => canViewReferenceTools(currentUser), [currentUser]);

    const navItems: NavItem[] = [{ href: "/", label: "داشبورد", icon: LayoutDashboard }];

    if (showReferenceTools) {
        navItems.push(
            { href: "/stores", label: "لیست فروشگاه‌ها", icon: Store },
            { href: "/pricing", label: "قیمت‌گذاری‌ها", icon: Tags },
        );
    }

    useEffect(() => {
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
    }, [pathname]);

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

    const sidebarWidth = sidebarCollapsed ? "lg:w-20" : "lg:w-72";
    const headerOffset = sidebarCollapsed ? "lg:right-20" : "lg:right-72";
    const mainOffset = sidebarCollapsed ? "lg:pr-20" : "lg:pr-72";

    return (
        <div className="relative min-h-screen overflow-hidden border border-white/5 bg-brand-base text-brand-text-primary shadow-[0_25px_90px_rgba(2,6,23,0.28)]">
            {mobileMenuOpen ? (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            ) : null}

            <aside
                className={[
                    "fixed right-0 top-0 z-50 h-screen w-72 border-l border-white/5 bg-brand-surface/90 backdrop-blur-xl transition-[width,transform] duration-300",
                    sidebarWidth,
                    mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
                    "shadow-2xl shadow-black/25",
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
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-silver-dark/20 text-brand-text-primary lg:hidden"
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
                                        <p className="text-sm font-semibold text-brand-text-primary">
                                            {hasSession ? businessLabel : "کاربر مهمان"}
                                        </p>
                                        <p className="mt-1 text-xs text-brand-text-secondary">
                                            {hasSession ? "دسترسی شما بر اساس نقش فعال می‌شود" : "برای دسترسی کامل وارد شوید"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <nav className="flex flex-1 flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    {...item}
                                    pathname={pathname}
                                    collapsed={sidebarCollapsed}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                            ))}

                            {!showReferenceTools ? (
                                <div className="mt-2 rounded-3xl border border-dashed border-silver-dark/20 bg-brand-base/35 p-4 text-sm leading-7 text-brand-text-secondary">
                                    {!sidebarCollapsed && (hasSession ? "رول فعلی شما فقط به داشبورد دسترسی دارد." : "کاربر مهمان فقط داشبورد عمومی را مشاهده می‌کند.")}
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
                                                مرجع
                                            </div>
                                            <p className="mt-2 text-xs leading-6 text-brand-text-secondary">
                                                لیست فروشگاه‌ها و قیمت‌گذاری‌ها فقط برای این نقش نمایش داده می‌شود.
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

                    <div className="border-t border-white/5 p-4 text-xs text-slate-500">
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
                    "fixed top-0 left-0 right-0 z-40 h-20 border-b border-white/5 bg-brand-surface/85 backdrop-blur-xl transition-[right] duration-300",
                    headerOffset,
                ].join(" ")}
            >
                <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((value) => !value)}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-silver-dark/20 bg-brand-base/50 text-brand-text-primary transition-all hover:bg-white/5 lg:hidden"
                            aria-label="باز کردن منو"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="min-w-0">
                            <div className="truncate text-base font-bold text-white">داشبورد مدیریت</div>
                            <div className="truncate text-xs text-brand-text-secondary">{hasSession ? businessLabel : "GOLDIMA"}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* <button
                            type="button"
                            onClick={() => setSidebarCollapsed((value) => !value)}
                            className="hidden h-11 cursor-pointer w-11 items-center justify-center rounded-xl border border-silver-dark/20 bg-brand-base/50 text-brand-text-primary transition-all hover:bg-white/5 lg:inline-flex"
                            aria-label={sidebarCollapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"}
                        >
                            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                        </button> */}

                        {hasSession ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setProfileMenuOpen((value) => !value)}
                                    className="inline-flex items-center gap-3 rounded-2xl border border-silver-dark/20 bg-brand-base/50 px-4 py-2.5 text-right transition-all hover:border-silver-light/20 hover:bg-white/5"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-silver-dark/20 bg-silver-light/10 text-sm font-semibold text-silver-light">
                                        {displayName.slice(0, 1).toUpperCase()}
                                    </div>

                                    <div className="hidden flex-col items-start sm:flex">
                                        <span className="text-sm font-semibold text-brand-text-primary">{businessLabel}</span>
                                        <span className="text-[11px] text-brand-text-secondary">
                                            {role === "reference" ? "مرجع" : "حساب کاربری"}
                                        </span>
                                    </div>

                                    <ChevronDown
                                        className={`h-4 w-4 text-brand-text-secondary transition-transform ${
                                            profileMenuOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {profileMenuOpen ? (
                                    <div className="absolute left-0 mt-3 w-64 overflow-hidden rounded-2xl border border-silver-dark/20 bg-brand-surface/95 shadow-2xl backdrop-blur-xl">
                                        <div className="border-b border-white/5 px-4 py-4">
                                            <p className="text-sm font-semibold text-brand-text-primary">{displayName}</p>
                                            <p className="mt-1 text-xs text-brand-text-secondary">{businessLabel}</p>
                                        </div>

                                        <div className="p-2">
                                            <Link
                                                href="/"
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-brand-text-primary transition-colors hover:bg-white/5"
                                            >
                                                <UserCircle2 className="h-4 w-4 text-silver-light" />
                                                پروفایل
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                disabled={logoutMutation.isPending}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-brand-text-primary transition-colors hover:bg-white/5 disabled:opacity-60"
                                            >
                                                <LogOut className="h-4 w-4 text-silver-light" />
                                                خروج از حساب
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/register"
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white shadow-gold-glow transition-all hover:bg-gold-light"
                                >
                                    ثبت‌نام
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-silver-dark/20 px-4 text-sm font-medium text-brand-text-primary transition-all hover:bg-white/5"
                                >
                                    ورود
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={["pt-20 transition-[padding-right] duration-300", mainOffset].join(" ")}>
                <div className="min-h-[calc(100vh-5rem)] w-full bg-brand-surface/35 p-0">{children}</div>
            </main>
        </div>
    );
}