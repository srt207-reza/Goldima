"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Ban,
    Building2,
    Check,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Mail,
    MapPin,
    Phone,
    Save,
    Search,
    ShieldCheck,
    UserCheck,
    UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuspendUserDialog } from "@/components/users/SuspendUserDialog";
import {
    useCurrentUserQuery,
    useUpdateBusinessProfileMutation,
    useUpdateUserMutation,
    useUsersQuery,
    useUserQuery,
} from "@/hooks/api";
import { canViewUserManagement, getNormalizedUserRole } from "@/lib/user-role";
import { toApiDate, toDisplayDate } from "@/lib/date-format";
import { ACCOUNT_STATUS_OPTIONS, getAccountStatusLabel, getAccountStatusView, getStoreRoleLabel, USER_ROLE_LABELS } from "@/constants/user-taxonomy";
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

type DropdownOption<T extends string> = {
    value: T;
    label: string;
    caption?: string;
};

const STATUS_OPTIONS: DropdownOption<UserStatus>[] = ACCOUNT_STATUS_OPTIONS;

const ROLE_OPTIONS: DropdownOption<UserRole>[] = [
    { value: "RETAIL", label: USER_ROLE_LABELS.RETAIL, caption: "زیرمجموعه عمده‌فروش" },
    { value: "WHOLESALER", label: USER_ROLE_LABELS.WHOLESALER, caption: "زیرمجموعه مرجع" },
    { value: "MASTER", label: USER_ROLE_LABELS.MASTER, caption: "دسترسی مرجع" },
];

function getDisplayName(user: ManagedUser): string {
    return user.business_name || [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "بدون نام";
}

function getInitialFormState(user: ManagedUser): DetailFormState {
    return {
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        email: user.email ?? "",
        birth_date: toDisplayDate(user.birth_date),
        status: getAccountStatusView(user.status, user.is_active !== false && user.business_profile_is_active !== false),
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

function DetailDropdown<T extends string>({
    id,
    value,
    options,
    placeholder,
    searchable = false,
    searchPlaceholder = "جستجو...",
    onChange,
}: {
    id: string;
    value: T;
    options: DropdownOption<T>[];
    placeholder: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    onChange: (value: T) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const selectedOption = options.find((option) => option.value === value);
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const visibleOptions = normalizedSearchQuery
        ? options.filter((option) => {
            const haystack = `${option.label} ${option.caption ?? ""}`.toLowerCase();
            return haystack.includes(normalizedSearchQuery);
        })
        : options;

    return (
        <div
            className={`relative ${isOpen ? "z-[90]" : "z-0"}`}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsOpen(false);
                    setSearchQuery("");
                }
            }}
        >
            <button
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => {
                    setIsOpen((current) => {
                        if (current) {
                            setSearchQuery("");
                        }

                        return !current;
                    });
                }}
                className={[
                    "group flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 text-right text-sm font-bold outline-none transition-all duration-300",
                    "border-brand-border/80 bg-brand-base/50 text-brand-text-primary shadow-inner shadow-black/10",
                    "hover:border-silver-dark/70 hover:bg-brand-base/70 focus:border-silver-light/70 focus:ring-2 focus:ring-silver-light/25",
                    isOpen ? "border-silver-light/60 bg-brand-surface/80 shadow-silver-glow" : "",
                ].join(" ")}
            >
                <span className="min-w-0 flex-1 truncate">
                    {selectedOption?.label ?? placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-silver-light transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen ? (
                <div
                    role="listbox"
                    aria-labelledby={id}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] flex max-h-[min(22rem,calc(100dvh-8rem))] w-full flex-col overflow-hidden rounded-2xl border border-silver-light/20 bg-brand-surface/95 p-1.5 text-right shadow-2xl shadow-black/40 backdrop-blur-2xl"
                >
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-silver-light/70 to-transparent" />
                    {searchable ? (
                        <div className="relative mb-1.5 shrink-0">
                            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-light/70" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="h-10 w-full rounded-xl border border-white/10 bg-brand-base/55 pr-9 pl-3 text-right text-sm text-brand-text-primary outline-none transition placeholder:text-brand-text-secondary/70 focus:border-silver-light/45 focus:bg-brand-base/75"
                            />
                        </div>
                    ) : null}
                    <div
                        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
                        onWheel={(event) => event.stopPropagation()}
                    >
                        {visibleOptions.length ? visibleOptions.map((option) => {
                            const selected = option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={[
                                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-right transition-all duration-200",
                                        selected
                                            ? "bg-silver-light/12 text-brand-text-primary shadow-inner shadow-silver-light/5"
                                            : "text-brand-text-secondary hover:bg-white/[0.06] hover:text-brand-text-primary",
                                    ].join(" ")}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold">{option.label}</span>
                                        {option.caption ? (
                                            <span className="mt-1 block truncate text-xs text-brand-text-secondary">
                                                {option.caption}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition ${selected ? "border-silver-light/45 bg-silver-light/15 text-silver-light" : "border-transparent text-transparent"}`}>
                                        <Check className="h-4 w-4" />
                                    </span>
                                </button>
                            );
                        }) : (
                            <div className="px-3 py-5 text-center text-xs text-brand-text-secondary">
                                نتیجه‌ای پیدا نشد.
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
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
    const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

    const isSaving = updateUserMutation.isPending || updateProfileMutation.isPending;
    const role = getNormalizedUserRole(user);
    const currentRole = getNormalizedUserRole(currentUser);
    const canEditHierarchy = (currentRole === "reference" || currentRole === "wholesale") && user.is_employee !== true;
    const approvedParentCandidates = useMemo(() => {
        const usersById = new Map<string, ManagedUser>();

        [...manageableUsers, currentUser].forEach((item) => {
            if (item.status !== "APPROVED") return;
            if (item.is_employee) return;

            usersById.set(String(item.id), item);
        });

        return [...usersById.values()]
            .filter((item) => String(item.id) !== String(user.id))
            .sort((a, b) => {
                if (String(a.id) === String(currentUser.id)) return -1;
                if (String(b.id) === String(currentUser.id)) return 1;

                return getDisplayName(a).localeCompare(getDisplayName(b), "fa");
            });
    }, [currentUser, manageableUsers, user.id]);
    const referenceParentOptions = useMemo(
        () => approvedParentCandidates.filter((item) => getNormalizedUserRole(item) === "reference"),
        [approvedParentCandidates]
    );
    const wholesaleParentOptions = useMemo(
        () => approvedParentCandidates.filter((item) => getNormalizedUserRole(item) === "wholesale"),
        [approvedParentCandidates]
    );
    const parentOptions =
        formData.role === "WHOLESALER"
            ? referenceParentOptions
            : formData.role === "RETAIL"
                ? wholesaleParentOptions
                : [];
    const parentDropdownOptions: DropdownOption<string>[] = [
        ...(formData.role === "MASTER"
            ? [{ value: "", label: "بدون والد", caption: "برای نقش مرجع استفاده می‌شود" }]
            : []),
        ...parentOptions.map((option) => ({
            value: String(option.id),
            label: getDisplayName(option),
            caption: [
                option.business_handler,
            ].filter(Boolean).join(" · ").replaceAll('-'," ") || undefined,
        })),
    ];

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (nextRole: UserRole) => {
        setFormData((prev) => ({
            ...prev,
            role: nextRole,
            parent:
                nextRole === "MASTER"
                    ? ""
                    : nextRole === "WHOLESALER"
                        ? referenceParentOptions.some((option) => String(option.id) === prev.parent)
                            ? prev.parent
                            : String(referenceParentOptions[0]?.id ?? "")
                        : nextRole === "RETAIL"
                            ? wholesaleParentOptions.some((option) => String(option.id) === prev.parent)
                                ? prev.parent
                                : String(wholesaleParentOptions[0]?.id ?? "")
                            : prev.parent,
        }));
    };

    const refreshQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["api", "users"] }),
            queryClient.invalidateQueries({ queryKey: ["api", "users", user.id] }),
        ]);
    };

    const handleStatusChange = async (status: UserStatus, suspendReason?: string): Promise<boolean> => {
        try {
            await updateUserMutation.mutateAsync({
                userId: user.id,
                payload: status === "SUSPENDED"
                    ? { status, suspend_reason: suspendReason?.trim() || null }
                    : { status },
            });
            setFormData((prev) => ({ ...prev, status }));
            await refreshQueries();
            toast.success(`وضعیت کاربر به ${getAccountStatusLabel(status)} تغییر کرد`);
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "تغییر وضعیت کاربر با خطا مواجه شد";
            toast.error(message);
            return false;
        }
    };

    const handleStatusSelect = (status: UserStatus) => {
        if (status === "SUSPENDED" && formData.status !== "SUSPENDED") {
            setIsSuspendDialogOpen(true);
            return;
        }

        setFormData((prev) => ({ ...prev, status }));
    };

    const handleConfirmSuspend = async (reason: string) => {
        const succeeded = await handleStatusChange("SUSPENDED", reason);
        if (succeeded) {
            setIsSuspendDialogOpen(false);
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
                        <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">{getDisplayName(user)}</h1>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-brand-text-secondary">
                            <span className="inline-flex items-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 py-2">
                                <UserRound className="h-4 w-4 text-silver-light" />
                                {getStoreRoleLabel(role)}
                            </span>
                            {user.is_employee ? (
                                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 font-bold text-emerald-100">
                                    <UserCheck className="h-4 w-4" />
                                    کارمند فروشگاه
                                </span>
                            ) : null}
                            <span className="inline-flex items-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 py-2">
                                <ShieldCheck className="h-4 w-4 text-silver-light" />
                                {getAccountStatusLabel(user.status, user.is_active !== false && user.business_profile_is_active !== false)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-lg border border-silver-dark/25 bg-white/5 px-3 py-2">
                                <ClipboardList className="h-4 w-4 text-silver-light" />
                                {String(user.id)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                        {user.status !== "SUSPENDED" ? (
                            <button
                                type="button"
                                onClick={() => setIsSuspendDialogOpen(true)}
                                disabled={isSaving}
                                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300/25 bg-slate-400/10 px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Ban className="h-4 w-4" />
                                مسدود کردن
                            </button>
                        ) : null}
                        <Link href="/stores" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-brand-text-secondary transition hover:text-brand-text-primary">
                            بازگشت
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 overflow-visible xl:grid-cols-[1fr_0.8fr]">
                <Card className="relative z-20 overflow-visible border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
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
                            <DetailDropdown
                                id="status"
                                value={formData.status}
                                options={STATUS_OPTIONS}
                                placeholder="انتخاب وضعیت"
                                onChange={handleStatusSelect}
                            />
                        </div>
                        {canEditHierarchy ? (
                            <>
                                <div>
                                    <Label htmlFor="role" className="mb-2 block">
                                        نقش کاربر
                                    </Label>
                                    <DetailDropdown
                                        id="role"
                                        value={formData.role}
                                        options={ROLE_OPTIONS}
                                        placeholder="انتخاب نقش"
                                        onChange={handleRoleChange}
                                    />
                                </div>

                                {formData.role !== "MASTER" ? (
                                    <div>
                                        <Label htmlFor="parent" className="mb-2 block">
                                            {formData.role === "WHOLESALER" ? "مرجع این عمده‌فروش" : "والد / عمده‌فروش"}
                                        </Label>
                                        <DetailDropdown
                                            id="parent"
                                            value={formData.parent}
                                            options={parentDropdownOptions}
                                            placeholder="انتخاب والد"
                                            searchable
                                            searchPlaceholder={
                                                formData.role === "WHOLESALER"
                                                    ? "جستجوی مرجع..."
                                                    : "جستجوی عمده‌فروش..."
                                            }
                                            onChange={(parent) => setFormData((prev) => ({ ...prev, parent }))}
                                        />
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
                        <div>
                            <Label className="mb-2 block">نوع عضویت</Label>
                            <div className="flex h-11 items-center gap-2 rounded-lg border border-silver-dark/20 bg-brand-base/45 px-4 text-sm text-brand-text-secondary">
                                {user.is_employee ? (
                                    <>
                                        <UserCheck className="h-4 w-4 text-emerald-200" />
                                        کارمند فروشگاه
                                    </>
                                ) : (
                                    "مالک کسب‌وکار"
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="relative z-0 border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
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
                            <Label htmlFor="telephone" className="mb-2 block">
                                تلفن ثابت
                            </Label>
                            <Input id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} dir="ltr" />
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

            <SuspendUserDialog
                isOpen={isSuspendDialogOpen}
                userName={getDisplayName(user)}
                isSubmitting={isSaving}
                onClose={() => setIsSuspendDialogOpen(false)}
                onConfirm={handleConfirmSuspend}
            />
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
