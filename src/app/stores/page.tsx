"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle2,
    Clock3,
    Eye,
    Mail,
    MapPin,
    Phone,
    SearchX,
    ShieldCheck,
    Store,
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
                    <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-silver-dark/20 px-6 py-3 font-medium text-brand-text-primary transition-all hover:bg-white/5">
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

function UserCard({
    user,
    onStatusChange,
    isMutating,
}: {
    user: ManagedUser;
    onStatusChange: (user: ManagedUser, status: UserStatus) => void;
    isMutating: boolean;
}) {
    const role = getNormalizedUserRole(user);
    const displayName = getDisplayName(user);
    const canApprove = user.status !== "APPROVED";
    const canReject = user.status !== "REJECTED";

    return (
        <article className="rounded-lg border border-white/10 bg-brand-base/55 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition hover:border-silver-light/25 hover:bg-brand-base/75">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-brand-text-primary">{displayName}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md border border-silver-dark/25 bg-white/5 px-2 py-1 text-brand-text-secondary">
                            <UserRound className="h-3.5 w-3.5" />
                            {ROLE_LABELS[role]}
                        </span>
                        <span className="inline-flex rounded-md border border-silver-dark/25 bg-white/5 px-2 py-1 text-brand-text-secondary">
                            کد پروفایل: {user.business_profile_id ?? "ندارد"}
                        </span>
                    </div>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-silver-dark/20 bg-silver-light/10 text-silver-light">
                    <Store className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-brand-text-secondary">
                <p className="flex items-center gap-2 break-all" dir="ltr">
                    <Phone className="h-4 w-4 shrink-0 text-silver-light" />
                    {user.username || user.telephone || "شماره ثبت نشده"}
                </p>
                {user.email ? (
                    <p className="flex items-center gap-2 break-all" dir="ltr">
                        <Mail className="h-4 w-4 shrink-0 text-silver-light" />
                        {user.email}
                    </p>
                ) : null}
                {user.address ? (
                    <p className="line-clamp-2 flex items-start gap-2 leading-7">
                        <MapPin className="mt-1 h-4 w-4 shrink-0 text-silver-light" />
                        <span>{user.address}</span>
                    </p>
                ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                    href={`/stores/${encodeURIComponent(String(user.id))}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 text-sm font-medium text-brand-text-primary transition hover:bg-white/10"
                >
                    <Eye className="h-4 w-4" />
                    جزئیات
                </Link>

                {canApprove ? (
                    <button
                        type="button"
                        onClick={() => onStatusChange(user, "APPROVED")}
                        disabled={isMutating}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        تایید
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onStatusChange(user, "REJECTED")}
                        disabled={!canReject || isMutating}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-50"
                    >
                        <XCircle className="h-4 w-4" />
                        رد
                    </button>
                )}
            </div>

            {canApprove && canReject ? (
                <button
                    type="button"
                    onClick={() => onStatusChange(user, "REJECTED")}
                    disabled={isMutating}
                    className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-300/20 px-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" />
                    رد درخواست
                </button>
            ) : null}
        </article>
    );
}

function StatusColumn({
    config,
    users,
    onStatusChange,
    isMutating,
}: {
    config: StatusConfig;
    users: ManagedUser[];
    onStatusChange: (user: ManagedUser, status: UserStatus) => void;
    isMutating: boolean;
}) {
    const Icon = config.icon;

    return (
        <Card className={`min-h-[26rem] border bg-brand-surface/80 p-4 text-right backdrop-blur-xl ${config.accent}`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <h2 className="text-lg font-bold text-brand-text-primary">{config.title}</h2>
                    </div>
                    <p className="mt-1 text-xs text-brand-text-secondary">{config.caption}</p>
                </div>
                <span className="grid h-10 min-w-10 place-items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-bold text-brand-text-primary">
                    {users.length}
                </span>
            </div>

            <div className="mt-4 space-y-3">
                {users.length ? (
                    users.map((user) => (
                        <UserCard key={String(user.id)} user={user} onStatusChange={onStatusChange} isMutating={isMutating} />
                    ))
                ) : (
                    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-white/10 bg-brand-base/35 p-6 text-center text-brand-text-secondary">
                        <div>
                            <SearchX className="mx-auto mb-3 h-8 w-8 text-silver-light/70" />
                            <p className="text-sm">{config.emptyText}</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function StoresPage() {
    const queryClient = useQueryClient();
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUserQuery();
    const pendingUsersQuery = useUsersQuery({ status: "PENDING" });
    const approvedUsersQuery = useUsersQuery({ status: "APPROVED" });
    const rejectedUsersQuery = useUsersQuery({ status: "REJECTED" });
    const updateUserMutation = useUpdateUserMutation();

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
                <div className="overflow-hidden rounded-lg border border-silver-dark/20 bg-brand-surface/85 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
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
                    <div className="grid gap-4 xl:grid-cols-3">
                        {STATUS_CONFIGS.map((config) => (
                            <StatusColumn
                                key={config.status}
                                config={config}
                                users={usersByStatus[config.status]}
                                onStatusChange={handleStatusChange}
                                isMutating={updateUserMutation.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
