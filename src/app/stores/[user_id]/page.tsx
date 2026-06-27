"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardList,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    UserRound,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useCurrentUserQuery,
    useUpdateBusinessProfileMutation,
    useUpdateUserMutation,
    useUsersQuery,
    useUserQuery,
} from "@/hooks/api";
import { canViewUserManagement, getNormalizedUserRole, type NormalizedUserRole } from "@/lib/user-role";
import { toApiDate, toDisplayDate } from "@/lib/date-format";
import type { ManagedUser, UserRole, UserStatus } from "@/types/api/user";

type DetailFormState = {
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    status: UserStatus;
    role: UserRole;
    parent: string;
    business_name: string;
    address: string;
    province: string;
    city: string;
    telephone: string;
};

const ROLE_LABELS: Record<NormalizedUserRole, string> = {
    reference: "مرجع",
    wholesale: "عمده‌فروش",
    retail: "تک‌فروش",
    unknown: "نامشخص",
};

const STATUS_LABELS: Record<UserStatus, string> = {
    PENDING: "در انتظار بررسی",
    APPROVED: "تایید شده",
    REJECTED: "رد شده",
};

const USER_ROLE_LABELS: Record<"MASTER" | "WHOLESALER" | "RETAIL", string> = {
    MASTER: "مرجع",
    WHOLESALER: "عمده‌فروش",
    RETAIL: "تک‌فروش",
};

function getDisplayName(user: ManagedUser): string {
    return user.business_name || [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "بدون نام";
}

function getInitialFormState(user: ManagedUser): DetailFormState {
    return {
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        email: user.email ?? "",
        birth_date: toDisplayDate(user.birth_date),
        status: user.status,
        role: user.role,
        parent: user.parent ?? "",
        business_name: user.business_name ?? "",
        address: user.address ?? "",
        province: user.province ?? "",
        city: user.city ?? "",
        telephone: user.telephone ?? "",
    };
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

function LoadingState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto max-w-4xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="h-32 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-32 animate-pulse rounded-lg bg-white/10" />
                </div>
            </Card>
        </div>
    );
}

function MissingState() {
    return (
        <div className="px-4 py-10">
            <Card className="mx-auto max-w-xl border border-rose-300/20 bg-brand-surface/80 p-8 text-center text-rose-100 backdrop-blur-xl">
                کاربر پیدا نشد
            </Card>
        </div>
    );
}

function UserEditor({
    user,
    currentUser,
    manageableUsers,
}: {
    user: ManagedUser;
    currentUser: ManagedUser;
    manageableUsers: ManagedUser[];
}) {
    const queryClient = useQueryClient();
    const updateUserMutation = useUpdateUserMutation();
    const updateProfileMutation = useUpdateBusinessProfileMutation();
    const [formData, setFormData] = useState<DetailFormState>(() => getInitialFormState(user));

    const isSaving = updateUserMutation.isPending || updateProfileMutation.isPending;
    const role = getNormalizedUserRole(user);
    const currentRole = getNormalizedUserRole(currentUser);
    const canEditHierarchy = currentRole === "reference";
    const wholesaleParentOptions = manageableUsers.filter(
        (item) => String(item.id) !== String(user.id) && getNormalizedUserRole(item) === "wholesale" && item.status === "APPROVED"
    );
    const parentOptions =
        formData.role === "WHOLESALER"
            ? [currentUser]
            : formData.role === "RETAIL"
              ? [currentUser, ...wholesaleParentOptions]
              : [];

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const nextRole = event.target.value as UserRole;

        setFormData((prev) => ({
            ...prev,
            role: nextRole,
            parent: nextRole === "MASTER" ? "" : nextRole === "WHOLESALER" ? String(currentUser.id) : prev.parent,
        }));
    };

    const refreshQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["api", "users"] }),
            queryClient.invalidateQueries({ queryKey: ["api", "users", user.id] }),
        ]);
    };

    const handleStatusChange = async (status: UserStatus) => {
        try {
            await updateUserMutation.mutateAsync({
                userId: user.id,
                payload: { status },
            });
            setFormData((prev) => ({ ...prev, status }));
            await refreshQueries();
            toast.success(`وضعیت کاربر به ${STATUS_LABELS[status]} تغییر کرد`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "تغییر وضعیت کاربر با خطا مواجه شد";
            toast.error(message);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            await updateUserMutation.mutateAsync({
                userId: user.id,
                payload: {
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: formData.email.trim(),
                    birth_date: toApiDate(formData.birth_date.trim()) || null,
                    status: formData.status,
                    ...(canEditHierarchy
                        ? {
                              role: formData.role,
                              parent: formData.role === "MASTER" ? null : formData.parent || null,
                          }
                        : {}),
                },
            });

            if (user.business_profile_id) {
                await updateProfileMutation.mutateAsync({
                    profileId: user.business_profile_id,
                    payload: {
                        business_name: formData.business_name.trim(),
                        business_handler: formData.business_name.trim(),
                        address: formData.address.trim(),
                        province: formData.province.trim(),
                        city: formData.city.trim(),
                        telephone: formData.telephone.trim(),
                        is_active: user.business_profile_is_active ?? true,
                    },
                });
            }

            await refreshQueries();
            toast.success("اطلاعات کاربر ذخیره شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره اطلاعات کاربر با خطا مواجه شد";
            toast.error(message);
        }
    };

    return (
        <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 text-right shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <Link href="/stores" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-brand-text-secondary transition hover:text-brand-text-primary">
                            <ArrowRight className="h-4 w-4" />
                            بازگشت
                        </Link>
                        <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">{getDisplayName(user)}</h1>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-brand-text-secondary">
                            <span className="inline-flex items-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 py-2">
                                <UserRound className="h-4 w-4 text-silver-light" />
                                {ROLE_LABELS[role]}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 py-2">
                                <ShieldCheck className="h-4 w-4 text-silver-light" />
                                {STATUS_LABELS[user.status]}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 py-2">
                                <ClipboardList className="h-4 w-4 text-silver-light" />
                                {String(user.id)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {user.status !== "APPROVED" ? (
                            <button
                                type="button"
                                onClick={() => handleStatusChange("APPROVED")}
                                disabled={isSaving}
                                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                تایید
                            </button>
                        ) : null}
                        {user.status !== "REJECTED" ? (
                            <button
                                type="button"
                                onClick={() => handleStatusChange("REJECTED")}
                                disabled={isSaving}
                                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" />
                                رد
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                    <div className="mb-5 flex items-center gap-2">
                        <UserRound className="h-5 w-5 text-silver-light" />
                        <h2 className="text-lg font-bold text-brand-text-primary">اطلاعات کاربری</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="first_name" className="mb-2 block">
                                نام
                            </Label>
                            <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="last_name" className="mb-2 block">
                                نام خانوادگی
                            </Label>
                            <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="email" className="mb-2 block">
                                ایمیل
                            </Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} dir="ltr" />
                        </div>
                        <div>
                            <Label htmlFor="birth_date" className="mb-2 block">
                                تاریخ تولد
                            </Label>
                            <Input id="birth_date" name="birth_date" value={formData.birth_date} onChange={handleChange} dir="ltr" placeholder="1403/01/01" />
                        </div>
                        <div>
                            <Label htmlFor="status" className="mb-2 block">
                                وضعیت
                            </Label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="flex h-11 w-full cursor-pointer rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-sm text-brand-text-primary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25"
                            >
                                <option value="PENDING">در انتظار بررسی</option>
                                <option value="APPROVED">تایید شده</option>
                                <option value="REJECTED">رد شده</option>
                            </select>
                        </div>
                        {canEditHierarchy ? (
                            <>
                                <div>
                                    <Label htmlFor="role" className="mb-2 block">
                                        نقش کاربر
                                    </Label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleRoleChange}
                                        className="flex h-11 w-full cursor-pointer rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-sm text-brand-text-primary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25"
                                    >
                                        <option value="RETAIL">{USER_ROLE_LABELS.RETAIL}</option>
                                        <option value="WHOLESALER">{USER_ROLE_LABELS.WHOLESALER}</option>
                                        <option value="MASTER">{USER_ROLE_LABELS.MASTER}</option>
                                    </select>
                                </div>

                                {formData.role !== "MASTER" ? (
                                    <div>
                                        <Label htmlFor="parent" className="mb-2 block">
                                            {formData.role === "WHOLESALER" ? "مرجع این عمده‌فروش" : "والد / عمده‌فروش"}
                                        </Label>
                                        <select
                                            id="parent"
                                            name="parent"
                                            value={formData.parent}
                                            onChange={handleChange}
                                            className="flex h-11 w-full cursor-pointer rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-sm text-brand-text-primary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25"
                                        >
                                            <option value="">بدون والد</option>
                                            {parentOptions.map((option) => (
                                                <option key={String(option.id)} value={String(option.id)}>
                                                    {getDisplayName(option)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                        <div>
                            <Label className="mb-2 block">شماره موبایل</Label>
                            <div className="flex h-11 items-center rounded-lg border border-silver-dark/20 bg-brand-base/45 px-4 text-sm text-brand-text-secondary" dir="ltr">
                                {user.username}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                    <div className="mb-5 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-silver-light" />
                        <h2 className="text-lg font-bold text-brand-text-primary">اطلاعات کسب‌وکار</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="business_name" className="mb-2 block">
                                نام شرکت
                            </Label>
                            <Input id="business_name" name="business_name" value={formData.business_name} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="province" className="mb-2 block">
                                استان
                            </Label>
                            <Input id="province" name="province" value={formData.province} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="city" className="mb-2 block">
                                شهر
                            </Label>
                            <Input id="city" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="telephone" className="mb-2 block">
                                تلفن
                            </Label>
                            <Input id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} dir="ltr" />
                        </div>
                        <div>
                            <Label htmlFor="address" className="mb-2 block">
                                آدرس
                            </Label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={4}
                                className="w-full resize-none rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-3 text-sm leading-7 text-brand-text-primary placeholder:text-brand-text-secondary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25"
                            />
                        </div>
                    </div>
                </Card>

                <div className="xl:col-span-2">
                    <Card className="grid gap-3 border border-silver-dark/20 bg-brand-surface/80 p-4 text-right backdrop-blur-xl md:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-brand-base/45 p-4">
                            <p className="mb-2 flex items-center gap-2 text-xs text-brand-text-secondary">
                                <Mail className="h-4 w-4 text-silver-light" />
                                ایمیل
                            </p>
                            <p className="break-all text-sm text-brand-text-primary" dir="ltr">{user.email || "ثبت نشده"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-brand-base/45 p-4">
                            <p className="mb-2 flex items-center gap-2 text-xs text-brand-text-secondary">
                                <Phone className="h-4 w-4 text-silver-light" />
                                تماس
                            </p>
                            <p className="break-all text-sm text-brand-text-primary" dir="ltr">{user.telephone || user.username || "ثبت نشده"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-brand-base/45 p-4">
                            <p className="mb-2 flex items-center gap-2 text-xs text-brand-text-secondary">
                                <MapPin className="h-4 w-4 text-silver-light" />
                                والد
                            </p>
                            <p className="break-all text-sm text-brand-text-primary" dir="ltr">{user.parent || "بدون والد"}</p>
                        </div>
                    </Card>

                    <div className="mt-5 flex justify-end">
                        <Button type="submit" disabled={isSaving} className="gap-2 cursor-pointer">
                            <Save className="h-4 w-4" />
                            {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function StoreUserDetailPage() {
    const params = useParams<{ user_id: string }>();
    const router = useRouter();
    const { data: currentUser, isLoading: isLoadingCurrent } = useCurrentUserQuery();
    const { data: user, isLoading: isLoadingUser, isError } = useUserQuery(params.user_id);
    const approvedUsersQuery = useUsersQuery({ status: "APPROVED" });

    useEffect(() => {
        if (isLoadingCurrent || isLoadingUser) return;

        if (!currentUser || !canViewUserManagement(currentUser)) {
            router.replace("/");
            return;
        }

        if (user && !canManageUser(currentUser, user)) {
            router.replace("/stores");
        }
    }, [currentUser, isLoadingCurrent, isLoadingUser, router, user]);

    if (isLoadingCurrent || isLoadingUser) {
        return <LoadingState />;
    }

    if (isError || !user || !currentUser || !canManageUser(currentUser, user)) {
        return <MissingState />;
    }

    return (
        <div className="px-4 py-8">
            <div className="mx-auto w-full max-w-7xl">
                <UserEditor
                    key={String(user.id)}
                    user={user}
                    currentUser={currentUser}
                    manageableUsers={approvedUsersQuery.data ?? []}
                />
            </div>
        </div>
    );
}
