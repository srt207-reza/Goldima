"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUserQuery, useUserQuery, useUpdateUserMutation } from "@/hooks/api";
import { canViewReferenceTools, getNormalizedUserRole } from "@/lib/user-role";
import type { ApiUser } from "@/types/api/user";

/**
 * Dynamic page for viewing and managing a single user. Accessible only to
 * the reference user. Provides the ability to approve or reject the user.
 */
export default function StoreUserDetailPage() {
    const params = useParams<{ user_id: string }>();
    const router = useRouter();
    const { data: currentUser, isLoading: isLoadingCurrent } = useCurrentUserQuery();
    const { data: user, isLoading: isLoadingUser, isError } = useUserQuery(params.user_id);
    const updateUserMutation = useUpdateUserMutation();

    // Redirect non‑reference users away from this page. We wait until
    // current user data is loaded to avoid flicker.
    useEffect(() => {
        if (!isLoadingCurrent && !canViewReferenceTools(currentUser)) {
            router.replace("/stores");
        }
    }, [currentUser, isLoadingCurrent, router]);

    const handleUpdateStatus = async (status: ApiUser["status"]) => {
        if (!user || !user.id) return;
        try {
            await updateUserMutation.mutateAsync({ userId: user.id, payload: { status } });
            toast.success(`وضعیت کاربر به ${status} تغییر یافت`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "به‌روزرسانی با خطا مواجه شد";
            toast.error(message);
        }
    };

    if (isLoadingCurrent || isLoadingUser) {
        return (
            <div className="px-4 py-10">
                <Card className="mx-auto max-w-xl p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 text-right">
                    <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
                    <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/10" />
                </Card>
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className="px-4 py-10">
                <Card className="mx-auto max-w-xl p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 text-center text-red-200">
                    کاربر پیدا نشد
                </Card>
            </div>
        );
    }

    const displayName = user.business_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username;
    const role = getNormalizedUserRole(user);

    return (
        <div className="px-4 py-10">
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <div className="rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                    <h1 className="text-2xl font-bold text-brand-text-primary mb-4">جزئیات کاربر</h1>
                    <p className="text-brand-text-secondary leading-7 mb-6">در این صفحه می‌توانید اطلاعات کاربر را مشاهده و در صورت لزوم وضعیت او را تغییر دهید.</p>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                            <p className="text-xs text-brand-text-secondary mb-1">نام یا نام کسب‌وکار</p>
                            <p className="text-brand-text-primary font-medium break-words">{displayName || "—"}</p>
                        </div>
                        <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                            <p className="text-xs text-brand-text-secondary mb-1">کد کاربر</p>
                            <p className="text-brand-text-primary font-medium break-words">{String(user.id)}</p>
                        </div>
                        <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                            <p className="text-xs text-brand-text-secondary mb-1">نقش</p>
                            <p className="text-brand-text-primary font-medium break-words">{role}</p>
                        </div>
                        <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                            <p className="text-xs text-brand-text-secondary mb-1">وضعیت</p>
                            <p className="text-brand-text-primary font-medium break-words">{user.status ?? "—"}</p>
                        </div>
                        {user.email ? (
                            <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                                <p className="text-xs text-brand-text-secondary mb-1">ایمیل</p>
                                <p className="text-brand-text-primary font-medium break-words">{user.email}</p>
                            </div>
                        ) : null}
                        {user.telephone ? (
                            <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                                <p className="text-xs text-brand-text-secondary mb-1">تلفن</p>
                                <p className="text-brand-text-primary font-medium break-words">{user.telephone}</p>
                            </div>
                        ) : null}
                        {user.address ? (
                            <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-4">
                                <p className="text-xs text-brand-text-secondary mb-1">آدرس</p>
                                <p className="text-brand-text-primary font-medium break-words">{user.address}</p>
                            </div>
                        ) : null}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {user.status !== "APPROVED" && (
                            <Button
                                type="button"
                                onClick={() => handleUpdateStatus("APPROVED")}
                                disabled={updateUserMutation.isPending}
                                className="bg-emerald-500 text-brand-base hover:bg-emerald-600"
                            >
                                تایید کاربر
                            </Button>
                        )}
                        {user.status !== "REJECTED" && (
                            <Button
                                type="button"
                                onClick={() => handleUpdateStatus("REJECTED")}
                                disabled={updateUserMutation.isPending}
                                className="bg-red-500 text-brand-base hover:bg-red-600"
                            >
                                رد کاربر
                            </Button>
                        )}
                        <Link
                            href="/stores"
                            className="inline-flex items-center justify-center rounded-lg border border-silver-dark/20 px-4 py-2 text-sm font-medium text-brand-text-primary transition-all hover:bg-white/5"
                        >
                            بازگشت به لیست
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}