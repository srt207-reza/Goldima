"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    BadgeCheck,
    Building2,
    CalendarDays,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    Sparkles,
    UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicCard } from "@/components/ui/magic-card";
import { useCurrentUserQuery, useUpdateBusinessProfileMutation, useUpdateUserMutation } from "@/hooks/api";
import { getBusinessLabel, getDisplayName, getNormalizedUserRole, type NormalizedUserRole } from "@/lib/user-role";
import type { CurrentUser } from "@/types/api/user";

type ProfileFormState = {
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    business_name: string;
    business_handler: string;
    address: string;
    telephone: string;
};

const ROLE_LABELS: Record<NormalizedUserRole, string> = {
    reference: "مرجع",
    wholesale: "عمده‌فروش",
    retail: "تک‌فروش",
    unknown: "حساب کاربری",
};

function getInitialFormState(user: CurrentUser): ProfileFormState {
    return {
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        email: user.email ?? "",
        birth_date: user.birth_date ?? "",
        business_name: user.business_name ?? "",
        business_handler: user.business_handler ?? "",
        address: user.address ?? "",
        telephone: user.telephone ?? "",
    };
}

function normalizeProfileFormState(state: ProfileFormState): ProfileFormState {
    return {
        first_name: state.first_name.trim(),
        last_name: state.last_name.trim(),
        email: state.email.trim(),
        birth_date: state.birth_date.trim(),
        business_name: state.business_name.trim(),
        business_handler: state.business_handler.trim(),
        address: state.address.trim(),
        telephone: state.telephone.trim(),
    };
}

function areProfileStatesEqual(left: ProfileFormState, right: ProfileFormState): boolean {
    return JSON.stringify(normalizeProfileFormState(left)) === JSON.stringify(normalizeProfileFormState(right));
}

function LoadingState() {
    return (
        <div className="px-4 py-8">
            <Card className="mx-auto max-w-5xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-right backdrop-blur-xl">
                <div className="h-7 w-44 animate-pulse rounded bg-white/10" />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="h-28 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-28 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-28 animate-pulse rounded-lg bg-white/10" />
                </div>
            </Card>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
    return (
        <MagicCard className="rounded-2xl bg-brand-base/45 p-4" withBorderBeam={false}>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-silver-dark/20 bg-silver-light/10 text-silver-light">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs text-brand-text-secondary">{label}</p>
            <p className="mt-2 truncate text-sm font-semibold text-brand-text-primary">{value || "ثبت نشده"}</p>
        </MagicCard>
    );
}

function ProfileEditor({ currentUser }: { currentUser: CurrentUser }) {
    const queryClient = useQueryClient();
    const updateUserMutation = useUpdateUserMutation();
    const updateBusinessProfileMutation = useUpdateBusinessProfileMutation();
    const [savedFormData, setSavedFormData] = useState<ProfileFormState>(() => getInitialFormState(currentUser));
    const [formData, setFormData] = useState<ProfileFormState>(() => getInitialFormState(currentUser));

    useEffect(() => {
        const nextState = getInitialFormState(currentUser);
        setSavedFormData(nextState);
        setFormData(nextState);
    }, [currentUser]);

    const role = getNormalizedUserRole(currentUser);
    const displayName = getDisplayName(currentUser);
    const businessLabel = getBusinessLabel(currentUser);
    const isSaving = updateUserMutation.isPending || updateBusinessProfileMutation.isPending;
    const hasFormChanges = useMemo(() => !areProfileStatesEqual(formData, savedFormData), [formData, savedFormData]);

    const completion = useMemo(() => {
        const fields = Object.values(formData);
        const filled = fields.filter((value) => String(value ?? "").trim()).length;
        return Math.round((filled / fields.length) * 100);
    }, [formData]);

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!hasFormChanges || isSaving) {
            return;
        }

        try {
            await updateUserMutation.mutateAsync({
                userId: currentUser.id,
                payload: {
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: formData.email.trim(),
                    birth_date: formData.birth_date.trim() || null,
                },
            });

            await updateBusinessProfileMutation.mutateAsync({
                profileId: currentUser.business_profile_id,
                payload: {
                    business_name: formData.business_name.trim(),
                    business_handler: formData.business_handler.trim() || null,
                    address: formData.address.trim(),
                    telephone: formData.telephone.trim(),
                    business_logo: currentUser.business_logo,
                    is_active: currentUser.business_profile_is_active ?? true,
                },
            });

            setSavedFormData(formData);
            await queryClient.invalidateQueries({ queryKey: ["api", "users", "me"] });
            toast.success("پروفایل با موفقیت ذخیره شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره پروفایل با خطا مواجه شد";
            toast.error(message);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 text-right shadow-2xl shadow-black/20 backdrop-blur-xl"
            >
                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                            <Sparkles className="h-4 w-4" />
                            پروفایل کاربری
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-brand-text-primary sm:text-3xl">{displayName}</h1>
                        <p className="mt-3 max-w-3xl leading-8 text-brand-text-secondary">{businessLabel}</p>
                    </div>

                    <div className="min-w-56 rounded-lg border border-white/10 bg-brand-base/45 p-4">
                        <div className="mb-3 flex items-center justify-between text-sm">
                            <span className="text-brand-text-secondary">تکمیل اطلاعات</span>
                            <span className="font-bold text-silver-light">{completion}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                                className="h-full rounded-full bg-silver-light"
                                initial={{ width: 0 }}
                                animate={{ width: `${completion}%` }}
                                transition={{ duration: 0.45 }}
                            />
                        </div>
                    </div>
                </div>
            </motion.section>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="grid gap-4 md:grid-cols-3"
            >
                <StatCard icon={ShieldCheck} label="نقش فعال" value={ROLE_LABELS[role]} />
                <StatCard icon={BadgeCheck} label="وضعیت حساب" value={currentUser.status} />
                <StatCard icon={Phone} label="شماره موبایل" value={currentUser.username} />
            </motion.div>

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.14 }}
                onSubmit={handleSubmit}
                className="grid gap-5 xl:grid-cols-[1fr_0.85fr]"
            >
                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right shadow-deep-card backdrop-blur-xl">
                    <div className="mb-5 flex items-center gap-2">
                        <UserRound className="h-5 w-5 text-silver-light" />
                        <h2 className="text-lg font-bold text-brand-text-primary">اطلاعات هویتی</h2>
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
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} dir="ltr" className="pl-10" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="birth_date" className="mb-2 block">
                                تاریخ تولد
                            </Label>
                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
                                <Input id="birth_date" name="birth_date" value={formData.birth_date} onChange={handleChange} dir="ltr" className="pl-10" />
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
                            <Label htmlFor="business_handler" className="mb-2 block">
                                لینک اختصاصی
                            </Label>
                            <Input id="business_handler" name="business_handler" value={formData.business_handler} onChange={handleChange} dir="ltr" />
                        </div>
                        <div>
                            <Label htmlFor="telephone" className="mb-2 block">
                                تلفن ثابت
                            </Label>
                            <Input id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} dir="ltr" />
                        </div>
                    </div>
                </Card>

                <Card className="border border-silver-dark/20 bg-brand-surface/80 p-5 text-right backdrop-blur-xl xl:col-span-2">
                    <div className="mb-5 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-silver-light" />
                        <h2 className="text-lg font-bold text-brand-text-primary">آدرس و دسترسی</h2>
                    </div>

                    <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-3 text-sm leading-8 text-brand-text-primary placeholder:text-brand-text-secondary focus:border-silver-light/70 focus:outline-none focus:ring-2 focus:ring-silver-light/25"
                    />

                    <div className="mt-5 flex flex-col items-end gap-2">
                        <Button type="submit" disabled={isSaving || !hasFormChanges} className="gap-2 cursor-pointer">
                            <Save className="h-4 w-4" />
                            {isSaving ? "در حال ذخیره..." : "ویرایش پروفایل"}
                        </Button>
                        {!hasFormChanges && (
                            <p className="text-xs text-brand-text-secondary">برای فعال شدن دکمه، حداقل یکی از فیلدها را تغییر بدهید.</p>
                        )}
                    </div>
                </Card>
            </motion.form>
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const { data: currentUser, isLoading } = useCurrentUserQuery();

    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.replace("/login");
        }
    }, [currentUser, isLoading, router]);

    if (isLoading || !currentUser) {
        return <LoadingState />;
    }

    return (
        <div className="px-4 py-8">
            <ProfileEditor key={String(currentUser.id)} currentUser={currentUser} />
        </div>
    );
}
