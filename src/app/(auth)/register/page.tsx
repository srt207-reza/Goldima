"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterMutation } from "@/hooks/api";
import {
    EMAIL_REGEX,
    ISO_DATE_REGEX,
    MOBILE_USERNAME_REGEX,
    PASSWORD_REGEX,
} from "@/types/api/auth";
import { normalizeBusinessPathSegment } from "@/lib/business-path";

type Step = 1 | 2;

type RegisterFormState = {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    business_name: string;
    business_handler: string;
    address: string;
    telephone: string;
    business_logo: string;
};

const initialFormState: RegisterFormState = {
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    birth_date: "",
    business_name: "",
    business_handler: "",
    address: "",
    telephone: "",
    business_logo: "",
};

const PERSIAN_DIGIT_MAP: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
};

function normalizeDigits(value: string): string {
    return value.replace(/[۰-۹٠-٩]/g, (digit) => PERSIAN_DIGIT_MAP[digit] ?? digit);
}

function validateStepOne(formData: RegisterFormState): string | null {
    if (!formData.first_name.trim()) return "نام الزامی است.";
    if (!formData.last_name.trim()) return "نام خانوادگی الزامی است.";
    if (!MOBILE_USERNAME_REGEX.test(formData.username.trim())) return "شماره موبایل معتبر نیست.";
    if (!EMAIL_REGEX.test(formData.email.trim())) return "ایمیل معتبر نیست.";
    if (!ISO_DATE_REGEX.test(normalizeDigits(formData.birth_date.trim()))) return "تاریخ تولد را با تقویم شمسی انتخاب کنید.";
    if (!PASSWORD_REGEX.test(formData.password)) {
        return "رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ، کوچک، عدد و کاراکتر ویژه باشد.";
    }

    return null;
}

function validateStepTwo(formData: RegisterFormState): string | null {
    if (!formData.business_name.trim()) return "نام کسب‌وکار الزامی است.";
    if (!formData.business_handler.trim()) return "شناسه لینک اختصاصی الزامی است.";
    if (!/^[-a-zA-Z0-9_]+$/.test(formData.business_handler.trim())) {
        return "شناسه لینک اختصاصی فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و آندرلاین باشد.";
    }
    if (!formData.address.trim()) return "آدرس الزامی است.";
    if (!formData.telephone.trim()) return "تلفن الزامی است.";

    return null;
}

function StepPill({
    active,
    label,
    index,
    onClick,
}: {
    active: boolean;
    label: string;
    index: number;
    onClick?: () => void;
}) {
    const isInteractive = typeof onClick === "function";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!isInteractive}
            className={`flex items-center gap-3 rounded-xl px-2 py-1 text-right transition-all ${
                isInteractive ? "cursor-pointer hover:bg-white/5" : "cursor-default"
            }`}
        >
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                    active ? "border-silver-light bg-silver-light/10 text-silver-light" : "border-silver-dark/30 text-brand-text-secondary"
                }`}
            >
                {index}
            </div>
            <span className={`text-xs sm:text-sm ${active ? "text-brand-text-primary" : "text-brand-text-secondary"}`}>{label}</span>
        </button>
    );
}

function JalaliBirthDatePicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const pickerValue = useMemo(() => {
        if (!value) return undefined;

        const normalizedValue = normalizeDigits(value);

        return new DateObject({
            date: normalizedValue,
            calendar: persian,
            locale: persian_fa,
        });
    }, [value]);

    return (
        <div className="relative overflow-visible">
            <DatePicker
                calendar={persian}
                locale={persian_fa}
                format="YYYY-MM-DD"
                value={pickerValue}
                portal
                containerClassName="w-full"
                calendarPosition="bottom-center"
                onChange={(date) => {
                    if (!date) {
                        onChange("");
                        return;
                    }

                    onChange(normalizeDigits(date.format("YYYY-MM-DD")));
                }}
                render={<Input type="text" readOnly dir="ltr" placeholder="1404-01-01" className="cursor-pointer" />}
            />
        </div>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const registerMutation = useRegisterMutation();
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<RegisterFormState>(initialFormState);
    const submitLockRef = useRef(false);
    const [parentBusinessHandler] = useState(() =>
        normalizeBusinessPathSegment(
            typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("business_handler") ?? "" : "",
        ),
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleNext = () => {
        const error = validateStepOne(formData);
        if (error) {
            toast.error(error);
            return;
        }

        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            handleNext();
            return;
        }

        if (submitLockRef.current || registerMutation.isPending) {
            return;
        }

        const stepOneError = validateStepOne(formData);
        if (stepOneError) {
            toast.error(stepOneError);
            setStep(1);
            return;
        }

        const stepTwoError = validateStepTwo(formData);
        if (stepTwoError) {
            toast.error(stepTwoError);
            return;
        }

        submitLockRef.current = true;

        try {
            await registerMutation.mutateAsync({
                username: formData.username.trim(),
                password: formData.password,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                birth_date: normalizeDigits(formData.birth_date),
                business_name: formData.business_name.trim(),
                business_handler: normalizeBusinessPathSegment(formData.business_handler.trim()),
                address: formData.address.trim(),
                telephone: formData.telephone.trim(),
                business_logo: formData.business_logo.trim() || undefined,
                parent_business_handler: parentBusinessHandler || undefined,
            });

            const businessName = normalizeBusinessPathSegment(formData.business_handler || formData.business_name);
            toast.success("ثبت‌نام با موفقیت انجام شد");
            router.replace(`/pending?business_name=${encodeURIComponent(businessName || formData.business_name.trim())}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "ثبت‌نام با خطا مواجه شد";
            toast.error(message);
        } finally {
            submitLockRef.current = false;
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-brand-base via-brand-surface to-brand-card">
            <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-silver-light/5 blur-3xl animate-pulse"></div>
            <div
                className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
            ></div>

            <Card className="relative w-full max-w-3xl overflow-hidden border border-silver-dark/20 bg-brand-surface/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow sm:p-8">
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 hover:opacity-100"></div>

                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold tracking-wider text-center sm:text-4xl">
                        <span className="bg-linear-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                            GOLDIMA
                        </span>
                    </h1>
                    <p className="text-center leading-relaxed text-brand-text-secondary">ثبت‌نام و ایجاد حساب کاربری جدید</p>
                </div>

                <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-silver-dark/20 bg-brand-base/40 px-4 py-3">
                    <StepPill active={step === 1} label="اطلاعات فردی" index={1} onClick={step === 2 ? () => setStep(1) : undefined} />
                    <div className="h-px flex-1 bg-linear-to-l from-silver-dark/40 to-transparent" />
                    <StepPill active={step === 2} label="اطلاعات سازمانی" index={2} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {step === 1 ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="group/input">
                                    <Label htmlFor="first_name" className="mb-2 block text-right text-brand-text-primary">
                                        نام
                                    </Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="علی"
                                        className="text-right transition-all duration-300 focus:scale-[1.02]"
                                    />
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="last_name" className="mb-2 block text-right text-brand-text-primary">
                                        نام خانوادگی
                                    </Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="رضایی"
                                        className="text-right transition-all duration-300 focus:scale-[1.02]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="group/input">
                                    <Label htmlFor="username" className="mb-2 block text-right text-brand-text-primary">
                                        شماره موبایل
                                    </Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="tel"
                                        inputMode="numeric"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="09123456789"
                                        dir="ltr"
                                        className="transition-all duration-300 focus:scale-[1.02]"
                                    />
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="birth_date" className="mb-2 block text-right text-brand-text-primary">
                                        تاریخ تولد
                                    </Label>
                                    <JalaliBirthDatePicker value={formData.birth_date} onChange={(birth_date) => setFormData((prev) => ({ ...prev, birth_date }))} />
                                    {/* <p className="mt-2 text-xs text-brand-text-secondary">
                                        تاریخ را با تقویم شمسی انتخاب کنید.
                                    </p> */}
                                </div>
                            </div>

                            <div className="group/input">
                                <Label htmlFor="email" className="mb-2 block text-right text-brand-text-primary">
                                    ایمیل
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    dir="ltr"
                                    className="transition-all duration-300 focus:scale-[1.02]"
                                />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="password" className="mb-2 block text-right text-brand-text-primary">
                                    رمز عبور
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    dir="ltr"
                                    className="transition-all duration-300 focus:scale-[1.02]"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="group/input">
                                <Label htmlFor="business_name" className="mb-2 block text-right text-brand-text-primary">
                                    نام کسب‌وکار
                                </Label>
                                <Input
                                    id="business_name"
                                    name="business_name"
                                    type="text"
                                    required
                                    value={formData.business_name}
                                    onChange={handleChange}
                                    placeholder="dornica"
                                    className="text-right transition-all duration-300 focus:scale-[1.02]"
                                />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="business_handler" className="mb-2 block text-right text-brand-text-primary">
                                    شناسه لینک اختصاصی
                                </Label>
                                <Input
                                    id="business_handler"
                                    name="business_handler"
                                    type="text"
                                    required
                                    value={formData.business_handler}
                                    onChange={handleChange}
                                    placeholder="dornica"
                                    dir="ltr"
                                    className="transition-all duration-300 focus:scale-[1.02]"
                                />
                                <p className="mt-2 text-right text-xs leading-6 text-brand-text-secondary">
                                    فقط حروف انگلیسی، عدد، خط تیره و آندرلاین مجاز است.
                                </p>
                            </div>

                            <div className="group/input">
                                <Label htmlFor="address" className="mb-2 block text-right text-brand-text-primary">
                                    آدرس
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="تهران، ..."
                                    className="text-right transition-all duration-300 focus:scale-[1.02]"
                                />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="telephone" className="mb-2 block text-right text-brand-text-primary">
                                    تلفن
                                </Label>
                                <Input
                                    id="telephone"
                                    name="telephone"
                                    type="tel"
                                    required
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    placeholder="02112345678"
                                    dir="ltr"
                                    className="transition-all duration-300 focus:scale-[1.02]"
                                />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="business_logo" className="mb-2 block text-right text-brand-text-primary">
                                    لینک لوگو یا عکس سازمانی (اختیاری)
                                </Label>
                                <Input
                                    id="business_logo"
                                    name="business_logo"
                                    type="url"
                                    value={formData.business_logo}
                                    onChange={handleChange}
                                    placeholder="https://example.com/logo.png"
                                    dir="ltr"
                                    className="transition-all duration-300 focus:scale-[1.02]"
                                />
                            </div>

                            {parentBusinessHandler ? (
                                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-100">
                                    ثبت‌نام شما از طریق لینک معرف <span dir="ltr" className="font-semibold">{parentBusinessHandler}</span> انجام می‌شود.
                                </div>
                            ) : null}

                            <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 px-4 py-3 text-sm leading-7 text-brand-text-secondary">
                                پس از ثبت اطلاعات، تا زمان تایید مرجع دسترسی به داشبورد فعال نمی‌شود.
                            </div>
                        </>
                    )}

                    <div className={step === 2 ? "grid grid-cols-1 gap-3 mt-8! sm:grid-cols-2" : "mt-8!"}>
                        {step === 2 ? (
                            <Button type="button" variant="ghost" onClick={handleBack} className="w-full cursor-pointer">
                                بازگشت
                            </Button>
                        ) : null}

                        <Button type="submit" className="w-full cursor-pointer relative overflow-hidden group/btn text-white" disabled={registerMutation.isPending || submitLockRef.current}>
                            <span className="relative z-10">
                                {registerMutation.isPending ? "در حال ثبت‌نام..." : step === 1 ? "مرحله بعد" : "ثبت‌نام"}
                            </span>
                            <div className="absolute inset-0 translate-x-[-100%] bg-linear-to-r from-silver-light/0 via-silver-light/20 to-silver-light/0 transition-transform duration-1000 group-hover/btn:translate-x-[100%]"></div>
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm text-brand-text-secondary">
                    <p className="text-right leading-relaxed">
                        قبلاً ثبت‌نام کرده‌اید؟{" "}
                        <Link href="/login" className="font-semibold text-white transition-colors hover:text-silver-light">
                            ورود به حساب
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
