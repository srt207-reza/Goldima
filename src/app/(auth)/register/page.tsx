"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import toast from "react-hot-toast";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";
import { useParentBusinessProfileQuery, usePhoneRegisterMutation } from "@/hooks/api";
import { getCitiesByProvince, IRAN_PROVINCES } from "@/constants/iran-locations";
import { EMAIL_REGEX, ISO_DATE_REGEX, MOBILE_USERNAME_REGEX } from "@/types/api/auth";
import { DEFAULT_PARENT_BUSINESS_HANDLER, getReadableBusinessHandler, normalizeBusinessPathSegment } from "@/lib/business-path";
import { clearRegisterOtpSession, readRegisterOtpSession } from "@/lib/otp-session";
import { setAuthTokens } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/media-url";
import { toApiDate, toDisplayDate } from "@/lib/date-format";
import { normalizeDigits, normalizeMobileUsername } from "@/services/api/auth";
import type { AuthBusinessProfile } from "@/types/api/auth";
import LOGO from "@/../public/assets/images/logo.png";

type Step = 1 | 2;

type RegisterFormState = {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    business_name: string;
    address: string;
    province: string;
    city: string;
    telephone: string;
};

const initialFormState: RegisterFormState = {
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    birth_date: "",
    business_name: "",
    address: "",
    province: "",
    city: "",
    telephone: "",
};

function validateStepOne(formData: RegisterFormState): string | null {
    if (!formData.first_name.trim()) return "نام الزامی است.";
    if (!formData.last_name.trim()) return "نام خانوادگی الزامی است.";
    if (!MOBILE_USERNAME_REGEX.test(normalizeMobileUsername(formData.username))) return "شماره موبایل معتبر نیست.";
    if (!EMAIL_REGEX.test(formData.email.trim())) return "ایمیل معتبر نیست.";
    if (!ISO_DATE_REGEX.test(normalizeDigits(toApiDate(formData.birth_date.trim())))) return "تاریخ تولد را با تقویم شمسی انتخاب کنید.";

    return null;
}

function validateStepTwo(formData: RegisterFormState): string | null {
    if (!formData.business_name.trim()) return "نام کسب‌وکار الزامی است.";
    if (!formData.address.trim()) return "آدرس الزامی است.";
    if (!formData.province.trim()) return "استان الزامی است.";
    if (!formData.city.trim()) return "شهر الزامی است.";
    if (!formData.telephone.trim()) return "تلفن الزامی است.";

    return null;
}

function getPendingUrl(profile: AuthBusinessProfile, parentBusinessHandler?: string): string {
    const params = new URLSearchParams({
        business_handler: profile.business_handler ?? "",
        business_name: profile.business_name ?? "",
    });

    if (parentBusinessHandler) {
        params.set("parent_business_handler", parentBusinessHandler);
    }

    return `/pending?${params.toString()}`;
}

function getPostAuthUrl(profile: AuthBusinessProfile, parentBusinessHandler?: string): string {
    const role = String(profile.user?.role ?? "").toUpperCase();
    const status = String(profile.user.status ?? "").toUpperCase();

    if (role === "MASTER" || status === "APPROVED") return "/";
    return getPendingUrl(profile, parentBusinessHandler);
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

        const normalizedValue = normalizeDigits(toApiDate(value));

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
                format="YYYY/MM/DD"
                value={pickerValue}
                portal
                containerClassName="w-full"
                calendarPosition="bottom-center"
                onChange={(date) => {
                    if (!date) {
                        onChange("");
                        return;
                    }

                    onChange(toDisplayDate(normalizeDigits(date.format("YYYY-MM-DD"))));
                }}
                render={<Input type="text" readOnly dir="ltr" placeholder="1404/01/01" className="cursor-pointer" />}
            />
        </div>
    );
}

function SponsorIdentity({
    name,
    logoUrl,
    isLoading,
}: {
    name: string;
    logoUrl?: string;
    isLoading?: boolean;
}) {
    return (
        <div className="mb-8 flex flex-col items-center text-center">
            {logoUrl ? (
                <div className="relative mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-silver-light/20 bg-brand-base/60 shadow-silver-glow">
                    <img src={logoUrl} alt={name} className="h-full w-full object-contain p-3" />
                </div>
            ) : (
                <div className="relative mb-4 h-20 w-32">
                    <Image src={LOGO} alt="Goldima" fill className="object-contain drop-shadow-2xl" priority />
                </div>
            )}
            <h1 className="text-3xl font-bold tracking-wider sm:text-4xl">
                <span className="bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent animate-pulse">
                    {isLoading ? "در حال دریافت..." : name}
                </span>
            </h1>
            <p className="mt-3 text-sm leading-7 text-brand-text-secondary">ثبت‌نام زیرمجموعه</p>
        </div>
    );
}

function OrganizationNotFound({ businessHandler }: { businessHandler: string }) {
    const readableBusinessHandler = getReadableBusinessHandler(businessHandler);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-300/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl">
                <ShineBorder className="opacity-70" />
                <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-2xl font-black text-rose-100">
                    !
                </div>
                <h1 className="text-2xl font-black text-brand-text-primary">چنین سازمانی وجود ندارد</h1>
                <p className="mt-4 leading-8 text-brand-text-secondary">
                    لینک زیرمجموعه برای <span dir="auto" className="font-semibold text-rose-100">{readableBusinessHandler}</span> معتبر نیست.
                </p>
                <Link
                    href={`/login?business_handler=${encodeURIComponent(DEFAULT_PARENT_BUSINESS_HANDLER)}`}
                    className="mt-7 inline-flex h-11 items-center justify-center rounded-xl border border-silver-light/20 bg-silver-light/10 px-5 text-sm font-bold text-brand-text-primary transition hover:bg-silver-light/15"
                >
                    ثبت‌نام زیرمجموعه Goldima
                </Link>
            </Card>
        </div>
    );
}

function FancySelect({
    id,
    label,
    value,
    placeholder,
    options,
    disabled,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [isOpen]);

    return (
        <div ref={wrapperRef} className="relative">
            <Label htmlFor={id} className="mb-2 block text-right text-brand-text-primary">{label}</Label>
            <button
                id={id}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-right text-sm text-brand-text-primary shadow-inner shadow-black/10 outline-none transition-all duration-300 hover:border-silver-dark/70 focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <ChevronDown className={`h-4 w-4 shrink-0 text-silver-light transition-transform ${isOpen ? "rotate-180" : ""}`} />
                <span className={value ? "text-brand-text-primary" : "text-brand-text-secondary/80"}>{value || placeholder}</span>
            </button>

            {isOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-silver-light/20 bg-[#111318]/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="max-h-64 overflow-y-auto pr-1">
                        {options.map((option) => {
                            const selected = option === value;

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right text-sm transition ${
                                        selected ? "bg-silver-light/15 text-white" : "text-brand-text-secondary hover:bg-white/7 hover:text-brand-text-primary"
                                    }`}
                                >
                                    {selected ? <Check className="h-4 w-4 text-silver-light" /> : <span className="h-4 w-4" />}
                                    <span>{option}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function RegisterPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();
    const registerMutation = usePhoneRegisterMutation();
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<RegisterFormState>(initialFormState);
    const [parentBusinessHandler, setParentBusinessHandler] = useState(DEFAULT_PARENT_BUSINESS_HANDLER);
    const [verifiedOtpCode, setVerifiedOtpCode] = useState("");
    const submitLockRef = useRef(false);

    const parentProfileQuery = useParentBusinessProfileQuery(parentBusinessHandler);
    const isLinkedToParent = parentBusinessHandler !== DEFAULT_PARENT_BUSINESS_HANDLER;
    const sponsorName = parentProfileQuery.data?.business_name || (isLinkedToParent ? getReadableBusinessHandler(parentBusinessHandler) : "Goldima");
    const sponsorLogoUrl = useMemo(
        () => resolveMediaUrl(parentProfileQuery.data?.business_logo),
        [parentProfileQuery.data?.business_logo]
    );
    const cityOptions = useMemo(() => getCitiesByProvince(formData.province), [formData.province]);

    useEffect(() => {
        const params = new URLSearchParams(searchKey);
        const handlerFromQuery = normalizeBusinessPathSegment(params.get("business_handler") || DEFAULT_PARENT_BUSINESS_HANDLER);
        const usernameFromQuery = normalizeMobileUsername(params.get("username") || "");
        const otpReady = params.get("otp_ready") === "1";

        setParentBusinessHandler(handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);
        setFormData((prev) => ({
            ...prev,
            username: usernameFromQuery || prev.username,
        }));

        if (usernameFromQuery && otpReady) {
            const session = readRegisterOtpSession({
                username: usernameFromQuery,
                business_handler: handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER,
            });

            if (session) {
                setVerifiedOtpCode(session.code);
                return;
            }

            toast.error("کد تایید معتبر نیست");
            params.delete("username");
            params.delete("otp_ready");
            router.replace(`/register?${params.toString()}`, { scroll: false });
            return;
        }

        const shouldNormalizeHandler = handlerFromQuery && handlerFromQuery !== params.get("business_handler");
        const shouldAddDefaultHandler = !params.get("business_handler");

        if (shouldNormalizeHandler || shouldAddDefaultHandler) {
            params.set("business_handler", handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);
        }

        params.delete("otp_ready");
        params.set("business_handler", handlerFromQuery || DEFAULT_PARENT_BUSINESS_HANDLER);

        if (usernameFromQuery) {
            params.set("username", usernameFromQuery);
        } else {
            params.delete("username");
        }

        setVerifiedOtpCode("");
        setStep(1);
        router.replace(`/login?${params.toString()}`, { scroll: false });
    }, [router, searchKey]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "province" ? { city: "" } : {}),
        }));
    };

    const handleSelectChange = (name: "province" | "city", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "province" ? { city: "" } : {}),
        }));
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

        if (submitLockRef.current || registerMutation.isPending) return;

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
                code: verifiedOtpCode,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                birth_date: normalizeDigits(toApiDate(formData.birth_date)),
                business_name: formData.business_name.trim(),
                business_handler: formData.business_name.trim(),
                address: formData.address.trim(),
                province: formData.province.trim(),
                city: formData.city.trim(),
                telephone: normalizeDigits(formData.telephone.trim()),
                parent_business_handler: parentBusinessHandler || undefined,
            });

            clearRegisterOtpSession();
            setAuthTokens({ access: response.access, refresh: response.refresh });
            toast.success("ثبت‌نام با موفقیت انجام شد");
            router.replace(getPostAuthUrl(response.user_profile, parentBusinessHandler));
        } catch (error) {
            const message = error instanceof Error ? error.message : "ثبت‌نام با خطا مواجه شد";
            toast.error(message);
        } finally {
            submitLockRef.current = false;
        }
    };

    if (isLinkedToParent && parentProfileQuery.isError) {
        return <OrganizationNotFound businessHandler={parentBusinessHandler} />;
    }

    if (!verifiedOtpCode) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
                <AmbientBackground dense />
                <Card className="relative w-full max-w-md rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
                    <div className="animate-pulse text-silver-light">در حال انتقال...</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />
            <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-silver-light/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-silver-metallic/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

            <Card className="group relative w-full max-w-3xl overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow sm:p-8">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <div className="absolute left-0 right-0 top-0 h-1 bg-linear-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 hover:opacity-100" />

                <SponsorIdentity
                    name={sponsorName}
                    logoUrl={sponsorLogoUrl}
                    isLoading={isLinkedToParent && parentProfileQuery.isFetching}
                />

                <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-silver-dark/20 bg-brand-base/40 px-4 py-3">
                    <StepPill active={step === 1} label="اطلاعات فردی" index={1} onClick={step === 2 ? () => setStep(1) : undefined} />
                    <div className="h-px flex-1 bg-linear-to-l from-silver-dark/40 to-transparent" />
                    <StepPill active={step === 2} label="اطلاعات کسب‌وکار" index={2} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="group/input">
                                <Label htmlFor="username" className="mb-2 block text-right text-brand-text-primary">شماره موبایل</Label>
                                <Input id="username" name="username" type="tel" value={formData.username} disabled dir="ltr" className="transition-all duration-300 disabled:opacity-70" />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="first_name" className="mb-2 block text-right text-brand-text-primary">نام</Label>
                                <Input id="first_name" name="first_name" type="text" required value={formData.first_name} onChange={handleChange} placeholder="علی" className="text-right transition-all duration-300 focus:scale-[1.02]" />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="last_name" className="mb-2 block text-right text-brand-text-primary">نام خانوادگی</Label>
                                <Input id="last_name" name="last_name" type="text" required value={formData.last_name} onChange={handleChange} placeholder="احمدی" className="text-right transition-all duration-300 focus:scale-[1.02]" />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="birth_date" className="mb-2 block text-right text-brand-text-primary">تاریخ تولد</Label>
                                <JalaliBirthDatePicker value={formData.birth_date} onChange={(birth_date) => setFormData((prev) => ({ ...prev, birth_date }))} />
                            </div>

                            <div className="group/input md:col-span-2">
                                <Label htmlFor="email" className="mb-2 block text-right text-brand-text-primary">ایمیل</Label>
                                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@example.com" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="group/input">
                                    <Label htmlFor="business_name" className="mb-2 block text-right text-brand-text-primary">نام کسب‌وکار</Label>
                                    <Input id="business_name" name="business_name" type="text" required value={formData.business_name} onChange={handleChange} placeholder="فروشگاه نمونه" className="text-right transition-all duration-300 focus:scale-[1.02]" />
                                </div>

                                <div className="group/input">
                                    <Label htmlFor="telephone" className="mb-2 block text-right text-brand-text-primary">تلفن</Label>
                                    <Input id="telephone" name="telephone" type="tel" required value={formData.telephone} onChange={handleChange} placeholder="02112345678" dir="ltr" className="transition-all duration-300 focus:scale-[1.02]" />
                                </div>

                                <FancySelect
                                    id="province"
                                    label="استان"
                                    value={formData.province}
                                    placeholder="انتخاب استان"
                                    options={IRAN_PROVINCES}
                                    onChange={(value) => handleSelectChange("province", value)}
                                />

                                <FancySelect
                                    id="city"
                                    label="شهر"
                                    value={formData.city}
                                    placeholder={formData.province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
                                    options={cityOptions}
                                    disabled={!formData.province}
                                    onChange={(value) => handleSelectChange("city", value)}
                                />
                            </div>

                            <div className="group/input">
                                <Label htmlFor="address" className="mb-2 block text-right text-brand-text-primary">آدرس</Label>
                                <textarea
                                    id="address"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="تهران، ..."
                                    className="min-h-28 w-full resize-none rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-3 text-right text-sm text-brand-text-primary shadow-inner shadow-black/10 outline-none transition-all duration-300 placeholder:text-brand-text-secondary/70 hover:border-silver-dark/70 focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25"
                                />
                            </div>

                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-100">
                                مرجع ثبت‌نام: <span className="font-semibold">{sponsorName}</span>
                            </div>
                        </>
                    )}

                    <div className={step === 2 ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "mt-8!"}>
                        {step === 2 ? (
                            <Button type="button" variant="ghost" onClick={handleBack} className="w-full cursor-pointer">
                                بازگشت
                            </Button>
                        ) : null}

                        <Button type="submit" className="group/btn relative w-full cursor-pointer overflow-hidden text-white" disabled={registerMutation.isPending || submitLockRef.current}>
                            {registerMutation.isPending ? "در حال ثبت‌نام..." : step === 1 ? "مرحله بعد" : "ثبت‌نام"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
                    <AmbientBackground dense />
                    <Card className="relative w-full max-w-md rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
                        <div className="animate-pulse text-silver-light">در حال بارگذاری...</div>
                    </Card>
                </div>
            }
        >
            <RegisterPageContent />
        </Suspense>
    );
}
