"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
    CheckCircle2,
    Clock3,
    Eye,
    Phone,
    Search,
    ShieldCheck,
    UserCheck,
    UserRound,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { useCurrentUserQuery, useUpdateUserMutation, useUsersQuery } from "@/hooks/api";
import { canViewUserManagement, getNormalizedUserRole, type NormalizedUserRole } from "@/lib/user-role";
import type { ManagedUser, UserStatus } from "@/types/api/user";

type StatusConfig = {
    status: UserStatus;
    title: string;
    caption: string;
    emptyText: string;
    icon: typeof Clock3;
    accent: string;
};

type StatusFilter = UserStatus | "ALL";

const PAGE_SIZE = 20;

const STATUS_CONFIGS: StatusConfig[] = [
    {
        status: "PENDING",
        title: "در انتظار بررسی",
        caption: "ثبت‌نام‌های تازه",
        emptyText: "کاربری منتظر بررسی نیست.",
        icon: Clock3,
        accent: "from-amber-400/20 via-amber-400/10 to-transparent text-amber-200 border-amber-300/20",
    },
    {
        status: "APPROVED",
        title: "تایید شده",
        caption: "دسترسی فعال",
        emptyText: "کاربر تایید شده‌ای وجود ندارد.",
        icon: CheckCircle2,
        accent: "from-emerald-400/20 via-emerald-400/10 to-transparent text-emerald-200 border-emerald-300/20",
    },
    {
        status: "REJECTED",
        title: "رد شده",
        caption: "نیازمند پیگیری",
        emptyText: "کاربر رد شده‌ای وجود ندارد.",
        icon: XCircle,
        accent: "from-rose-400/20 via-rose-400/10 to-transparent text-rose-200 border-rose-300/20",
    },
];

const ROLE_LABELS: Record<NormalizedUserRole, string> = {
    reference: "مرجع",
    wholesale: "عمده‌فروش",
    retail: "تک‌فروش",
    unknown: "نامشخص",
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
    { value: "ALL", label: "همه" },
    ...STATUS_CONFIGS.map((config) => ({
        value: config.status,
        label: config.title,
    })),
];

function LoadingState() {
    return (
        <div className="px-4 py-8">
            <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-3">
                {STATUS_CONFIGS.map((config) => (
                    <Card key={config.status} className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right backdrop-blur-xl">
                        <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
                        <div className="mt-5 space-y-3">
                            <div className="h-24 animate-pulse rounded-lg bg-white/10" />
                            <div className="h-24 animate-pulse rounded-lg bg-white/10" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DeniedState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto w-full max-w-3xl border border-rose-300/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="inline-flex items-center gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
                    <ShieldCheck className="h-4 w-4" />
                    دسترسی محدود
                </div>
                <h1 className="mt-5 text-2xl font-bold text-brand-text-primary">این بخش برای نقش فعلی فعال نیست</h1>
                <p className="mt-4 leading-8 text-brand-text-secondary">
                    لیست کاربران برای مرجع و عمده‌فروش فعال است. تک‌فروش فقط به داشبورد و بخش‌های مجاز حساب خودش دسترسی دارد.
                </p>
                <div className="mt-8">
                    <Link href="/" className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-silver-dark/20 px-6 py-3 font-medium text-brand-text-primary transition-all hover:bg-white/5">
                        بازگشت به داشبورد
                    </Link>
                </div>
            </Card>
        </div>
    );
}

function getDisplayName(user: ManagedUser): string {
    return user.business_name || [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "بدون نام";
}

function canManageUser(currentUser: ManagedUser, targetUser: ManagedUser): boolean {
    const currentRole = getNormalizedUserRole(currentUser);
    const targetRole = getNormalizedUserRole(targetUser);

    if (String(currentUser.id) === String(targetUser.id)) {
        return false;
    }

    if (currentRole === "reference") {
        return true;
    }

    if (currentRole === "wholesale") {
        const isChild = !targetUser.parent || String(targetUser.parent) === String(currentUser.id);
        return targetRole === "retail" && isChild;
    }

    return false;
}

function mergeUsersById(groups: Array<ManagedUser[] | undefined>): ManagedUser[] {
    const usersById = new Map<string, ManagedUser>();

    groups.flatMap((group) => group ?? []).forEach((user) => {
        usersById.set(String(user.id), user);
    });

    return Array.from(usersById.values());
}

function getStatusTone(status: UserStatus): string {
    if (status === "APPROVED") {
        return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
    }

    if (status === "REJECTED") {
        return "border-rose-300/25 bg-rose-400/10 text-rose-100";
    }

    return "border-amber-300/25 bg-amber-400/10 text-amber-100";
}

function getSearchText(user: ManagedUser): string {
    return [
        getDisplayName(user),
        user.username,
        user.telephone,
        user.email,
        user.business_handler,
        user.business_profile_id,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function UsersTable({
    users,
    onStatusChange,
    isMutating,
}: {
    users: ManagedUser[];
    onStatusChange: (user: ManagedUser, status: UserStatus) => void;
    isMutating: boolean;
}) {
    return (
        <div className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 text-right shadow-deep-card backdrop-blur-xl">
            <div className="max-h-[66dvh] overflow-auto">
                <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0 text-sm">
                    <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[18%]" />
                        <col className="w-[10%]" />
                        <col className="w-[16%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-brand-surface/95 backdrop-blur-xl">
                        <tr className="text-xs text-brand-text-secondary">
                            <th className="border-b border-white/10 px-4 py-3 text-right font-semibold">کاربر / فروشگاه</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center font-semibold">نقش</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center font-semibold">وضعیت</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center font-semibold">تماس</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center font-semibold">کد پروفایل</th>
                            <th className="border-b border-white/10 px-4 py-3 text-center font-semibold">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length ? (
                            users.map((user) => {
                                const role = getNormalizedUserRole(user);
                                const displayName = getDisplayName(user);
                                const canApprove = user.status !== "APPROVED";
                                const canReject = user.status !== "REJECTED";

                                return (
                                    <tr key={String(user.id)} className="group transition hover:bg-white/[0.035]">
                                        <td className="border-b border-white/5 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-silver-dark/20 bg-silver-light/10 text-silver-light">
                                                    <UserRound className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/stores/${encodeURIComponent(String(user.id))}`} className="block truncate font-bold text-brand-text-primary transition hover:text-silver-light">
                                                        {displayName}
                                                    </Link>
                                                    <p className="mt-1 truncate text-xs text-brand-text-secondary">{user.business_handler || user.email || "بدون شناسه"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border-b border-white/5 px-4 py-3 text-center">
                                            <div className="flex flex-wrap justify-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 rounded-lg border border-silver-dark/25 bg-white/5 px-2 py-1 text-xs text-brand-text-secondary">
                                                    {ROLE_LABELS[role]}
                                                </span>
                                                {user.is_employee ? (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-100">
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        کارمند
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="border-b border-white/5 px-4 py-3 text-center">
                                            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${getStatusTone(user.status)}`}>
                                                {STATUS_CONFIGS.find((config) => config.status === user.status)?.title ?? user.status}
                                            </span>
                                        </td>
                                        <td className="border-b border-white/5 px-4 py-3 text-center">
                                            <div className="inline-flex max-w-full items-center justify-center gap-2 text-brand-text-secondary" dir="ltr">
                                                <Phone className="h-4 w-4 shrink-0 text-silver-light" />
                                                <span className="truncate">{user.username || user.telephone || "ثبت نشده"}</span>
                                            </div>
                                        </td>
                                        <td className="border-b border-white/5 px-4 py-3 text-center font-medium text-brand-text-secondary">
                                            {user.business_profile_id ?? "ندارد"}
                                        </td>
                                        <td className="border-b border-white/5 px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <Link
                                                    href={`/stores/${encodeURIComponent(String(user.id))}`}
                                                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-silver-dark/25 bg-white/5 text-brand-text-primary transition hover:bg-white/10"
                                                    title="جزئیات"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                {canApprove ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onStatusChange(user, "APPROVED")}
                                                        disabled={isMutating}
                                                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="تایید"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </button>
                                                ) : null}
                                                {canReject ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onStatusChange(user, "REJECTED")}
                                                        disabled={isMutating}
                                                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-rose-300/25 bg-rose-400/10 text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="رد"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-brand-text-secondary">
                                    <Search className="mx-auto mb-3 h-8 w-8 text-silver-light/70" />
                                    کاربری با این فیلترها پیدا نشد.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function StoresPage() {
    const queryClient = useQueryClient();
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUserQuery();
    const pendingUsersQuery = useUsersQuery({ status: "PENDING" });
    const approvedUsersQuery = useUsersQuery({ status: "APPROVED" });
    const rejectedUsersQuery = useUsersQuery({ status: "REJECTED" });
    const updateUserMutation = useUpdateUserMutation();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);

    const isUsersLoading = pendingUsersQuery.isLoading || approvedUsersQuery.isLoading || rejectedUsersQuery.isLoading;
    const isUsersError = pendingUsersQuery.isError || approvedUsersQuery.isError || rejectedUsersQuery.isError;

    const visibleUsers = useMemo(() => {
        if (!currentUser) return [];

        return mergeUsersById([
            pendingUsersQuery.data,
            approvedUsersQuery.data,
            rejectedUsersQuery.data,
        ])
            .filter((user) => canManageUser(currentUser, user))
            .sort((a, b) => {
                const aDate = Date.parse(a.business_profile_created_at ?? a.date_joined ?? "");
                const bDate = Date.parse(b.business_profile_created_at ?? b.date_joined ?? "");
                return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate);
            });
    }, [approvedUsersQuery.data, currentUser, pendingUsersQuery.data, rejectedUsersQuery.data]);

    const usersByStatus = useMemo(
        () =>
            STATUS_CONFIGS.reduce<Record<UserStatus, ManagedUser[]>>(
                (acc, config) => {
                    acc[config.status] = visibleUsers.filter((user) => user.status === config.status);
                    return acc;
                },
                {
                    PENDING: [],
                    APPROVED: [],
                    REJECTED: [],
                },
            ),
        [visibleUsers],
    );

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return visibleUsers.filter((user) => {
            const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
            const matchesSearch = !normalizedSearch || getSearchText(user).includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [searchTerm, statusFilter, visibleUsers]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const firstVisibleRow = filteredUsers.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
    const lastVisibleRow = Math.min(safePage * PAGE_SIZE, filteredUsers.length);

    const currentRole = getNormalizedUserRole(currentUser);

    const handleStatusChange = async (user: ManagedUser, status: UserStatus) => {
        try {
            await updateUserMutation.mutateAsync({
                userId: user.id,
                payload: { status },
            });

            await queryClient.invalidateQueries({ queryKey: ["api", "users"] });
            toast.success(`وضعیت ${getDisplayName(user)} به ${status} تغییر کرد`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "تغییر وضعیت کاربر با خطا مواجه شد";
            toast.error(message);
        }
    };

    if (isLoadingUser || isUsersLoading) {
        return <LoadingState />;
    }

    if (!currentUser || !canViewUserManagement(currentUser)) {
        return <DeniedState />;
    }

    return (
        <div className="px-4 py-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <div className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                                <ShieldCheck className="h-4 w-4" />
                                {currentRole === "reference" ? "پنل مرجع" : "پنل عمده‌فروش"}
                            </div>
                            <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">مدیریت کاربران</h1>
                            <p className="mt-3 max-w-3xl leading-8 text-brand-text-secondary">
                                {currentRole === "reference"
                                    ? "زیرمجموعه‌های مستقیم و تک‌فروش‌های وابسته به عمده‌فروش‌ها از همین بخش قابل بررسی، تایید و ویرایش هستند."
                                    : "در این بخش فقط تک‌فروش‌های زیرمجموعه شما نمایش داده می‌شوند."}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-brand-base/45 p-2">
                            {STATUS_CONFIGS.map((config) => (
                                <div key={config.status} className="min-w-24 rounded-lg bg-white/[0.04] px-3 py-3 text-center">
                                    <p className="text-xl font-bold text-brand-text-primary">{usersByStatus[config.status].length}</p>
                                    <p className="mt-1 text-xs text-brand-text-secondary">{config.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {isUsersError ? (
                    <Card className="border border-rose-300/20 bg-rose-400/10 p-5 text-center text-rose-100 backdrop-blur-xl">
                        خطا در بارگذاری کاربران
                    </Card>
                ) : (
                    <>
                        <Card className="border border-silver-dark/20 bg-brand-surface/80 p-4 text-right backdrop-blur-xl">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                <label className="relative block">
                                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-light" />
                                    <input
                                        value={searchTerm}
                                        onChange={(event) => {
                                            setSearchTerm(event.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="جستجو بر اساس نام، شماره، ایمیل یا شناسه فروشگاه"
                                        className="h-11 w-full rounded-xl border border-brand-border/80 bg-brand-base/45 pr-10 pl-4 text-sm text-brand-text-primary outline-none transition focus:border-silver-light/70 focus:ring-2 focus:ring-silver-light/25"
                                    />
                                </label>

                                <div className="flex flex-wrap gap-2">
                                    {STATUS_FILTERS.map((filter) => {
                                        const active = statusFilter === filter.value;

                                        return (
                                            <button
                                                key={filter.value}
                                                type="button"
                                                onClick={() => {
                                                    setStatusFilter(filter.value);
                                                    setPage(1);
                                                }}
                                                className={[
                                                    "relative h-10 cursor-pointer overflow-hidden rounded-xl border px-4 text-sm font-bold transition",
                                                    active
                                                        ? "border-silver-light/35 text-brand-text-primary shadow-silver-glow"
                                                        : "border-silver-dark/20 bg-white/[0.04] text-brand-text-secondary hover:border-silver-light/25 hover:text-brand-text-primary",
                                                ].join(" ")}
                                            >
                                                {active ? (
                                                    <motion.span
                                                        layoutId="stores-status-active-pill"
                                                        className="absolute inset-0 rounded-xl bg-silver-light/12"
                                                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                                                    />
                                                ) : null}
                                                <span className="relative z-10">{filter.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={statusFilter}
                                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                            >
                                <UsersTable
                                    users={paginatedUsers}
                                    onStatusChange={handleStatusChange}
                                    isMutating={updateUserMutation.isPending}
                                />
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex flex-col gap-3 rounded-2xl border border-silver-dark/20 bg-brand-surface/70 px-4 py-3 text-sm text-brand-text-secondary backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                نمایش {firstVisibleRow.toLocaleString("fa-IR")} تا {lastVisibleRow.toLocaleString("fa-IR")} از {filteredUsers.length.toLocaleString("fa-IR")} کاربر
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={safePage <= 1}
                                    className="h-10 cursor-pointer rounded-xl border border-silver-dark/20 bg-white/[0.04] px-4 font-bold text-brand-text-primary transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    قبلی
                                </button>
                                <span className="min-w-20 text-center font-bold text-brand-text-primary">
                                    {safePage.toLocaleString("fa-IR")} / {totalPages.toLocaleString("fa-IR")}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    disabled={safePage >= totalPages}
                                    className="h-10 cursor-pointer rounded-xl border border-silver-dark/20 bg-white/[0.04] px-4 font-bold text-brand-text-primary transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    بعدی
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
