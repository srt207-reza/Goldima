"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useCurrentUserQuery, useUsersQuery } from "@/hooks/api";
import { canViewReferenceTools, getNormalizedUserRole } from "@/lib/user-role";
import type { ApiUser } from "@/types/api/user";

function LoadingState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto w-full max-w-4xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/10" />
            </Card>
        </div>
    );
}

function DeniedState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto w-full max-w-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
                    دسترسی محدود
                </div>
                <h1 className="mt-5 text-3xl font-bold text-brand-text-primary">فقط نقش مرجع می‌تواند این بخش را ببیند</h1>
                <p className="mt-4 leading-8 text-brand-text-secondary">
                    برای مشاهده لیست فروشگاه‌ها، باید با نقش مرجع وارد شوید. در حالت عمومی فقط داشبورد اصلی قابل مشاهده است.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-medium text-brand-base transition-all hover:bg-gold-light">
                        ورود به حساب
                    </Link>
                    <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-silver-dark/20 px-6 py-3 font-medium text-brand-text-primary transition-all hover:bg-white/5">
                        بازگشت به داشبورد
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default function StoresPage() {
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUserQuery();
    // Fetch all users when viewing the stores page. The query does not
    // specify any status filter so the backend returns the full hierarchy.
    const { data: usersData, isLoading: isLoadingUsers, isError: isUsersError } = useUsersQuery();

    if (isLoadingUser || isLoadingUsers) {
        return <LoadingState />;
    }

    if (!canViewReferenceTools(currentUser)) {
        return <DeniedState />;
    }

    // Determine the array of user records regardless of whether the
    // backend returned an array or a paginated object with `results`.
    let users: ApiUser[] = [];
    if (Array.isArray(usersData)) {
        users = usersData as ApiUser[];
    } else if (usersData && typeof usersData === "object" && Array.isArray((usersData as any).results)) {
        users = (usersData as any).results as ApiUser[];
    }

    return (
        <div className="px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <div className="rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                    <div className="inline-flex rounded-full border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                        بخش مرجع
                    </div>
                    <h1 className="mt-5 text-3xl font-bold text-brand-text-primary">لیست کاربران</h1>
                    <p className="mt-4 max-w-3xl leading-8 text-brand-text-secondary">
                        این صفحه کاربران ثبت شده (عمده فروش و تک فروش) را نمایش می‌دهد. ادمین می‌تواند وضعیت آن‌ها را تغییر دهد و جزئیات هر کاربر را مشاهده کند.
                    </p>
                </div>

                {isUsersError ? (
                    <Card className="border border-silver-dark/20 bg-brand-surface/70 p-5 text-center backdrop-blur-xl text-red-200">
                        خطا در بارگیری کاربران
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {users.map((user) => {
                            const displayName = user.business_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username;
                            const role = getNormalizedUserRole(user);
                            return (
                                <Card
                                    key={String(user.id)}
                                    className="border border-silver-dark/20 bg-brand-surface/70 p-5 text-right backdrop-blur-xl flex flex-col justify-between"
                                >
                                    <div>
                                        <p className="text-lg font-semibold text-brand-text-primary break-words">
                                            {displayName || "—"}
                                        </p>
                                        <p className="mt-1 text-sm text-brand-text-secondary">کد کاربر: {String(user.id)}</p>
                                        <p className="mt-1 text-sm text-brand-text-secondary">وضعیت: {user.status ?? "—"}</p>
                                        <p className="mt-1 text-sm text-brand-text-secondary">نقش: {role}</p>
                                    </div>
                                    <div className="mt-4">
                                        <Link
                                            href={`/stores/${user.id}`}
                                            className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-brand-base transition-all hover:bg-gold-light"
                                        >
                                            مشاهده جزئیات
                                        </Link>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
