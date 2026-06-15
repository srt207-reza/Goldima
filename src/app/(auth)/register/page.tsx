"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { usePhoneRegisterMutation, useSendPhoneOtpMutation } from "@/hooks/api";
import { EMAIL_REGEX, ISO_DATE_REGEX, MOBILE_USERNAME_REGEX } from "@/types/api/auth";
import { DEFAULT_PARENT_BUSINESS_HANDLER, normalizeBusinessPathSegment } from "@/lib/business-path";
import { setAuthTokens } from "@/lib/auth-storage";
import { normalizeDigits, normalizeMobileUsername } from "@/services/api/auth";
import type { AuthBusinessProfile } from "@/types/api/auth";

type Step = 1 | 2;

type RegisterFormState = {
    username: string;
    code: string;
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    business_name: string;
    business_handler: string;
    address: string;
    telephone: string;
    business_logo: File | null;
};

const initialFormState: RegisterFormState = {
    username: "",
    code: "",
    first_name: "",
    last_name: "",
    email: "",
    birth_date: "",
    business_name: "",
    business_handler: "",
    address: "",
    telephone: "",
    business_logo: null,
};

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

function validateStepOne(formData: RegisterFormState): string | null {
    if (!formData.first_name.trim()) return "نام الزامی است.";
    if (!formData.last_name.trim()) return "نام خانوادگی الزامی است.";
    if (!MOBILE_USERNAME_REGEX.test(normalizeMobileUsername(formData.username))) return "شماره موبایل معتبر نیست.";
    if (!/^\d{4,8}$/.test(normalizeDigits(formData.code.trim()))) return "کد تایید را به صورت عددی وارد کنید.";
    if (!EMAIL_REGEX.test(formData.email.trim())) return "ایمیل معتبر نیست.";
    if (!ISO_DATE_REGEX.test(normalizeDigits(formData.birth_date.trim()))) return "تاریخ تولد را با تقویم شمسی انتخاب کنید.";

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

    if (formData.business_logo) {
        if (!ALLOWED_LOGO_TYPES.has(formData.business_logo.type)) {
            return "فرمت لوگو باید PNG، JPG، WEBP یا SVG باشد.";
        }

        if (formData.business_logo.size > MAX_LOGO_SIZE_BYTES) {
            return "حجم لوگو نباید بیشتر از ۲ مگابایت باشد.";
        }
    }

    return null;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPendingUrl(profile: AuthBusinessProfile): string {
    const params = new URLSearchParams({
        business_handler: profile.business_handler ?? "",
        business_name: profile.business_name ?? "",
    });

    return `/pending?${params.toString()}`;
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
            className={`flex items-center gap-3 rounded-xl px-2 py-1 text-right transition-all ${isInteractive ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
        >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-all ${active ? "border-silver-light bg-silver-light/10 text-silver-light" : "border-silver-dark/30 text-brand-text-secondary"}`}>
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
    const registerMutation = usePhoneRegisterMutation();
    const sendOtpMutation = useSendPhoneOtpMutation();
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<RegisterFormState>(initialFormState);
    const [parentBusinessHandler, setParentBusinessHandler] = useState(DEFAULT_PARENT_BUSINESS_HANDLER);
    const [otpSent, setOtpSent] = useState(false);
    const [isDraggingLogo, setIsDraggingLogo] = useState(false);
    const submitLockRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const logoPreviewUrl = useMemo(() => {
        if (!formData.business_logo) return "";
        return URL.createObjectURL(formData.business_logo);
    }, [formData.business_logo]);

    useEffect(() => {
        return () => {
            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        };
    }, [logoPreviewUrl]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const handlerFromQuery = normalizeBusinessPathSegment(params.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER);
        const usernameFromQuery = normalizeMobileUsername(params.get("username") || "");
        const otpHasBeenSent = params.get("otp_sent") === "1";

        setParentBusinessHandler(handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);
        setOtpSent(otpHasBeenSent);
        setFormData((prev) => ({
            ...prev,
            username: usernameFromQuery || prev.username,
        }));

        const shouldNormalizeHandler = handlerFromQuery && handlerFromQuery !== params.get("business_handler");
        const shouldAddDefaultHandler = !params.get("business_handler");

        if (shouldNormalizeHandler || shouldAddDefaultHandler) {
            params.set("business_handler", handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);
            router.replace(`/register?${params.toString()}`, { scroll: false });
        }
    }, [router]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSendOtp = async () => {
        try {
            const response = await sendOtpMutation.mutateAsync({ phone_number: formData.username });
            setOtpSent(true);

            if (response.is_registered) {
                toast.success("این شماره قبلاً ثبت‌نام شده است. کد تایید برای ورود ارسال شد.");
                const params = new URLSearchParams({
                    username: normalizeMobileUsername(formData.username),
                    otp_sent: "1",
                    business_handler: parentBusinessHandler,
                });
                router.replace(`/login?${params.toString()}`);
                return;
            }

            toast.success("کد تایید ارسال شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ارسال کد تایید با خطا مواجه شد";
            toast.error(message);
        }
    };

    const setLogoFile = (file: File | null) => {
        if (!file) {
            setFormData((prev) => ({ ...prev, business_logo: null }));
            return;
        }

        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            toast.error("فرمت لوگو باید PNG، JPG، WEBP یا SVG باشد.");
            return;
        }

        if (file.size > MAX_LOGO_SIZE_BYTES) {
            toast.error("حجم لوگو نباید بیشتر از ۲ مگابایت باشد.");
            return;
        }

        setFormData((prev) => ({ ...prev, business_logo: file }));
    };

    const handleLogoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLogoFile(event.target.files?.[0] ?? null);
        event.target.value = "";
    };

    const handleDropLogo = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingLogo(false);
        setLogoFile(event.dataTransfer.files?.[0] ?? null);
    };

    const handleNext = () => {
        const error = validateStepOne(formData);
        if (error) {
            toast.error(error);
            return;
        }

        if (!otpSent) {
            toast.error("قبل از ثبت‌نام، کد تایید را برای شماره موبایل دریافت کنید.");
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
            const response = await registerMutation.mutateAsync({
                username: formData.username.trim(),
                code: normalizeDigits(formData.code.trim()),
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                birth_date: normalizeDigits(formData.birth_date),
                business_name: formData.business_name.trim(),
                business_handler: normalizeBusinessPathSegment(formData.business_handler.trim()),
                address: formData.address.trim(),
                telephone: normalizeDigits(formData.telephone.trim()),
                business_logo: formData.business_logo,
                parent_business_handler: parentBusinessHandler || undefined,
            });

            setAuthTokens({ access: response.access, refresh: response.refresh });
            toast.success("ثبت‌نام با موفقیت انجام شد");
            router.replace(getPendingUrl(response.user_profile));
        } catch (error) {
            const message = error instanceof Error ? error.message : "ثبت‌نام با خطا مواجه شد";
            toast.error(message);
        } finally {
            submitLockRef.current = false;
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-silver-light/5 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

            <Card className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow sm:p-8 group">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 hover:opacity-100"></div>

                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold tracking-wider text-center sm:text-4xl">
                        <span className="bg-linear-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">GOLDIMA</span>
                    </h1>
                    <p className="text-center leading-relaxed text-brand-text-secondary">ثبت‌نام با شماره موبایل و کد تایید</p>
                </div>

                <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-silver-dark/20 bg-brand-base/40 px-4 py-3">
                    <StepPill active={step === 1} label="اطلاعات فردی و تایید موبایل" index={1} onClick={step === 2 ? () => setStep(1) : undefined} />
                    <div className="h-px flex-1 bg-linear-to-l from-silver-dark/40 to-transparent" />
                    <StepPill active={step === 2} label="اطلاعات کسب‌وکار" index={2} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {step === 1 ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="group/input">
                                    <Label htmlFor="first_name" className="mb-2 block text-right text-brand-text-primary">نام</Label>
                                    <Input id="first_name" name="first_name" type="text" required value={formData.first_name} onChange={handleChange} placeholder="علی" className="text-right transition-all duration-300 focus:scale-[1.02]" />
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="last_name" className="mb-2 block text-right text-brand-text-primary">نام خانوادگی</Label>
                                    <Input id="last_name" name="last_name" type="text" required value={formData.last_name} onChange={handleChange} placeholder="احمدی" className="text-right transition-all duration-300 focus:scale-[1.02]" />
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="username" className="mb-2 block text-right text-brand-text-primary">شماره موبایل</Label>
                                    <Input id="username" name="username" type="tel" inputMode="numeric" autoComplete="tel" required value={formData.username} onChange={handleChange} placeholder="09123456789" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                                </div>

                                <div className="group/input">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={sendOtpMutation.isPending}
                                            className="cursor-pointer text-xs font-semibold text-silver-light transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {sendOtpMutation.isPending ? "در حال ارسال..." : otpSent ? "ارسال مجدد کد" : "ارسال کد تایید"}
                                        </button>
                                        <Label htmlFor="code" className="block text-right text-brand-text-primary">کد تایید</Label>
                                    </div>
                                    <Input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required value={formData.code} onChange={handleChange} placeholder="4829" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                                    <p className="mt-2 text-right text-xs leading-6 text-brand-text-secondary">
                                        اگر از صفحه ورود آمده‌اید، کد قبلاً برای همین شماره ارسال شده است.
                                    </p>
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="birth_date" className="mb-2 block text-right text-brand-text-primary">تاریخ تولد</Label>
                                    <JalaliBirthDatePicker value={formData.birth_date} onChange={(birth_date) => setFormData((prev) => ({ ...prev, birth_date }))} />
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="email" className="mb-2 block text-right text-brand-text-primary">ایمیل</Label>
                                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@example.com" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="group/input">
                                <Label htmlFor="business_name" className="mb-2 block text-right text-brand-text-primary">نام کسب‌وکار</Label>
                                <Input id="business_name" name="business_name" type="text" required value={formData.business_name} onChange={handleChange} placeholder="dornica" className="text-right transition-all duration-300 focus:scale-[1.02]" />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="business_handler" className="mb-2 block text-right text-brand-text-primary">شناسه لینک اختصاصی</Label>
                                <Input id="business_handler" name="business_handler" type="text" required value={formData.business_handler} onChange={handleChange} placeholder="dornica" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                                <p className="mt-2 text-right text-xs leading-6 text-brand-text-secondary">فقط حروف انگلیسی، عدد، خط تیره و آندرلاین مجاز است.</p>
                            </div>

                            <div className="group/input">
                                <Label htmlFor="address" className="mb-2 block text-right text-brand-text-primary">آدرس</Label>
                                <Input id="address" name="address" type="text" required value={formData.address} onChange={handleChange} placeholder="تهران، ..." className="text-right transition-all duration-300 focus:scale-[1.02]" />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="telephone" className="mb-2 block text-right text-brand-text-primary">تلفن</Label>
                                <Input id="telephone" name="telephone" type="tel" required value={formData.telephone} onChange={handleChange} placeholder="02112345678" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                            </div>

                            <div className="group/input">
                                <Label className="mb-2 block text-right text-brand-text-primary">لوگوی کسب‌وکار (اختیاری)</Label>
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoInputChange} />
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setIsDraggingLogo(true);
                                    }}
                                    onDragLeave={() => setIsDraggingLogo(false)}
                                    onDrop={handleDropLogo}
                                    className={`relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-5 text-center transition-all ${isDraggingLogo ? "border-silver-light bg-silver-light/10" : "border-silver-dark/30 bg-brand-base/40 hover:border-silver-light/40 hover:bg-brand-hover/40"}`}
                                >
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-silver-light/20 bg-silver-light/10 text-silver-light">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 16.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-brand-text-primary">فایل لوگو را انتخاب کنید یا اینجا رها کنید</p>
                                    <p className="mt-2 text-xs leading-6 text-brand-text-secondary">PNG، JPG، WEBP یا SVG تا حداکثر ۲ مگابایت. این فیلد لینک نمی‌گیرد و با multipart/form-data ارسال می‌شود.</p>

                                    {formData.business_logo ? (
                                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-silver-dark/20 bg-black/20 p-3 text-right">
                                            {logoPreviewUrl ? (
                                                <img src={logoPreviewUrl} alt="پیش‌نمایش لوگو" className="h-12 w-12 rounded-xl object-cover" />
                                            ) : null}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-brand-text-primary">{formData.business_logo.name}</p>
                                                <p className="mt-1 text-xs text-brand-text-secondary">{formatFileSize(formData.business_logo.size)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setLogoFile(null);
                                                }}
                                                className="cursor-pointer rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/10"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {parentBusinessHandler ? (
                                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-100">
                                    ثبت‌نام شما از طریق لینک معرف <span dir="ltr" className="font-semibold">{parentBusinessHandler}</span> انجام می‌شود.
                                </div>
                            ) : null}
                        </>
                    )}

                    <div className={step === 2 ? "grid grid-cols-1 gap-3 mt-8! sm:grid-cols-2" : "mt-8!"}>
                        {step === 2 ? (
                            <Button type="button" variant="ghost" onClick={handleBack} className="w-full cursor-pointer">
                                بازگشت
                            </Button>
                        ) : null}

                        <Button type="submit" className="w-full cursor-pointer relative overflow-hidden group/btn text-white" disabled={registerMutation.isPending || submitLockRef.current}>
                            {registerMutation.isPending ? "در حال ثبت‌نام..." : step === 1 ? "مرحله بعد" : "ثبت‌نام"}
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm text-brand-text-secondary">
                    <p className="text-right leading-relaxed">
                        قبلاً ثبت‌نام کرده‌اید؟{" "}
                        <Link href={`/login?business_handler=${encodeURIComponent(parentBusinessHandler)}`} className="cursor-pointer font-semibold text-white transition-colors hover:text-silver-light">
                            ورود به حساب
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
