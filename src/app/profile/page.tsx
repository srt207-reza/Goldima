"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserQuery, useUpdateUserMutation } from "@/hooks/api";

/**
 * Profile page allows a logged in user to view and update their basic
 * account details. If no user is present (e.g. not logged in), the
 * component redirects to the login page.
 */
export default function ProfilePage() {
    const router = useRouter();
    const { data: currentUser, isLoading } = useCurrentUserQuery();
    const updateUserMutation = useUpdateUserMutation();

    // Local state mirrors the editable fields on the user record. We
    // initialize the state once the user data has loaded. Changing
    // state on every render would reset the form continuously.
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        birth_date: "",
        business_name: "",
        address: "",
        telephone: "",
    });

    useEffect(() => {
        if (currentUser) {
            setFormData((prev) => ({
                ...prev,
                first_name: currentUser.first_name ?? "",
                last_name: currentUser.last_name ?? "",
                email: currentUser.email ?? "",
                birth_date: currentUser.birth_date ?? "",
                business_name: currentUser.business_name ?? "",
                address: currentUser.address ?? "",
                telephone: currentUser.telephone ?? "",
            }));
        }
    }, [currentUser]);

    // Redirect unauthenticated users to login page. We intentionally
    // avoid redirecting during the loading phase to prevent flicker.
    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.replace("/login");
        }
    }, [currentUser, isLoading, router]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser || !currentUser.id) return;

        try {
            await updateUserMutation.mutateAsync({
                userId: currentUser.id,
                payload: formData,
            });
            toast.success("اطلاعات کاربری با موفقیت به‌روز شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "به‌روزرسانی با خطا مواجه شد";
            toast.error(message);
        }
    };

    if (isLoading || !currentUser) {
        return (
            <div className="px-4 py-10">
                <Card className="mx-auto max-w-lg p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 text-right">
                    <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
                    <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-white/10" />
                </Card>
            </div>
        );
    }

    return (
        <div className="px-4 py-10">
            <div className="mx-auto w-full max-w-3xl">
                <Card className="p-8 bg-brand-surface/80 backdrop-blur-xl border border-silver-dark/20 text-right">
                    <h1 className="text-2xl font-bold text-brand-text-primary mb-6">پروفایل کاربری</h1>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="first_name" className="mb-1 block text-brand-text-primary">
                                    نام
                                </Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="last_name" className="mb-1 block text-brand-text-primary">
                                    نام خانوادگی
                                </Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="email" className="mb-1 block text-brand-text-primary">
                                    ایمیل
                                </Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} dir="ltr" />
                            </div>
                            <div>
                                <Label htmlFor="birth_date" className="mb-1 block text-brand-text-primary">
                                    تاریخ تولد (YYYY-MM-DD)
                                </Label>
                                <Input id="birth_date" name="birth_date" type="text" value={formData.birth_date} onChange={handleChange} dir="ltr" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="business_name" className="mb-1 block text-brand-text-primary">
                                    نام کسب‌وکار
                                </Label>
                                <Input id="business_name" name="business_name" type="text" value={formData.business_name} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="telephone" className="mb-1 block text-brand-text-primary">
                                    تلفن
                                </Label>
                                <Input id="telephone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} dir="ltr" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="address" className="mb-1 block text-brand-text-primary">
                                آدرس
                            </Label>
                            <Input id="address" name="address" type="text" value={formData.address} onChange={handleChange} />
                        </div>
                        <div className="pt-4">
                            <Button type="submit" className="min-w-[8rem]" disabled={updateUserMutation.isPending}>
                                {updateUserMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}