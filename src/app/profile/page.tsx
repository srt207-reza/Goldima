"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { isValidJalaaliDate, toGregorian } from "jalaali-js";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
    BadgeCheck,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronDown,
    ImagePlus,
    Mail,
    Phone,
    RotateCcw,
    Save,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicCard } from "@/components/ui/magic-card";
import { useCurrentUserQuery, useSendPhoneOtpMutation, useUpdateBusinessProfileMutation, useUpdateUserMutation, useVerifyPhoneOtpMutation } from "@/hooks/api";
import { toDisplayDate } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { getBusinessLabel, getDisplayName, getNormalizedUserRole } from "@/lib/user-role";
import { EMPLOYEE_POSITION_LABELS, getAccountStatusLabel, getStoreRoleLabel } from "@/constants/user-taxonomy";
import { getCitiesByProvince, IRAN_PROVINCES } from "@/constants/iran-locations";
import type { CurrentUser } from "@/types/api/user";

type ProfileFormState = {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    birth_date: string;
    business_name: string;
    address: string;
    province: string;
    city: string;
    telephone: string;
};

type FieldName = keyof ProfileFormState;
type FieldErrors = Partial<Record<FieldName, string>>;
type ActiveTab = "identity" | "business" | "location";

type TabConfig = {
    id: ActiveTab;
    title: string;
    caption: string;
    icon: typeof UserRound;
    fields: FieldName[];
};

const PROFILE_TABS: TabConfig[] = [
    {
        id: "identity",
        title: "مشخصات شخصی",
        caption: "نام، موبایل، ایمیل و سمت",
        icon: UserRound,
        fields: ["first_name", "last_name", "username", "email", "birth_date"],
    },
    {
        id: "business",
        title: "مشخصات فروشگاه",
        caption: "نام، تلفن و آدرس فروشگاه",
        icon: Building2,
        fields: ["business_name", "telephone", "province", "city", "address"],
    },
    {
        id: "location",
        title: "لوگو فروشگاه",
        caption: "نشان تصویری فروشگاه",
        icon: ImagePlus,
        fields: [],
    },
];

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSIAN_NAME_REGEX = /^[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0]+(?:[ \u200C][\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0]+)*$/u;
const CITY_REGEX = /^[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0]+(?:[ \u200C-][\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0]+)*$/u;

function normalizeDigits(value: string): string {
    return value.replace(/[۰-۹٠-٩]/g, (digit) => {
        const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
        const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
        const persianIndex = persianDigits.indexOf(digit);
        if (persianIndex >= 0) return String(persianIndex);
        return String(arabicDigits.indexOf(digit));
    });
}

function normalizePersianCharacters(value: string): string {
    return value.normalize("NFC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/ة/g, "ه");
}

function sanitizePersianText(value: string, maxLength = 60): string {
    return normalizePersianCharacters(value)
        .replace(/[^\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0 \u200C-]/gu, "")
        .replace(/ {2,}/g, " ")
        .replace(/\u200C{2,}/g, "\u200C")
        .slice(0, maxLength);
}

function sanitizeTelephone(value: string): string {
    return normalizeDigits(value).replace(/\D/g, "").slice(0, 20);
}

function sanitizeMobile(value: string): string {
    return normalizeDigits(value).replace(/\D/g, "").slice(0, 11);
}

function sanitizeEmail(value: string): string {
    return value.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "").slice(0, 120);
}

function toPersianDigits(value: string | number): string {
    return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function sanitizeBirthDate(value: string): string {
    return normalizeDigits(value).replace(/[^\d/-]/g, "").slice(0, 10);
}

function resolveMediaUrl(src?: string | null): string {
    if (!src) return "";
    if (/^(blob:|data:|https?:\/\/)/i.test(src)) return src;

    const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    if (src.startsWith("/")) return apiOrigin ? `${apiOrigin}${src}` : src;

    return src;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLogoValidationError(file: File): string | null {
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
        return "فرمت لوگو باید PNG، JPG، WEBP یا SVG باشد.";
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
        return "حجم لوگو نباید بیشتر از ۲ مگابایت باشد.";
    }

    return null;
}

function getInitialFormState(user: CurrentUser): ProfileFormState {
    return {
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        username: user.username ?? "",
        email: user.email ?? "",
        birth_date: toDisplayDate(user.birth_date),
        business_name: user.business_name ?? "",
        address: user.address ?? "",
        province: user.province ?? "",
        city: user.city ?? "",
        telephone: user.telephone ?? "",
    };
}

function normalizeProfileFormState(state: ProfileFormState): ProfileFormState {
    return {
        first_name: normalizePersianCharacters(state.first_name).trim(),
        last_name: normalizePersianCharacters(state.last_name).trim(),
        username: sanitizeMobile(state.username),
        email: sanitizeEmail(state.email.trim()),
        birth_date: sanitizeBirthDate(state.birth_date.trim()).replace(/-/g, "/"),
        business_name: normalizePersianCharacters(state.business_name).trim(),
        address: normalizePersianCharacters(state.address).trim(),
        province: normalizePersianCharacters(state.province).trim(),
        city: normalizePersianCharacters(state.city).trim(),
        telephone: sanitizeTelephone(state.telephone),
    };
}

function areProfileStatesEqual(left: ProfileFormState, right: ProfileFormState): boolean {
    return JSON.stringify(normalizeProfileFormState(left)) === JSON.stringify(normalizeProfileFormState(right));
}

function birthDateToApi(value: string): string {
    const normalizedValue = sanitizeBirthDate(value).replace(/\//g, "-");
    const match = normalizedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (!match) return "";

    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function isAtLeastEighteenYearsOld(value: string): boolean {
    const apiDate = birthDateToApi(value);
    const [year, month, day] = apiDate.split("-").map(Number);

    if (!isValidJalaaliDate(year, month, day)) {
        return false;
    }

    const gregorian = toGregorian(year, month, day);
    const birthDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasNotOccurred = today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

    if (birthdayHasNotOccurred) {
        age -= 1;
    }

    return age >= 18;
}

function validateProfileForm(state: ProfileFormState): FieldErrors {
    const normalized = normalizeProfileFormState(state);
    const errors: FieldErrors = {};

    if (!PERSIAN_NAME_REGEX.test(normalized.first_name)) {
        errors.first_name = "لطفاً نام را به فارسی وارد بفرمایید.";
    }

    if (!PERSIAN_NAME_REGEX.test(normalized.last_name)) {
        errors.last_name = "لطفاً نام‌خانوادگی را به فارسی وارد بفرمایید.";
    }

    if (!/^09\d{9}$/.test(normalized.username)) {
        errors.username = "لطفاً شماره موبایل را در قالب صحیح وارد بفرمایید.";
    }

    if (!EMAIL_REGEX.test(normalized.email)) {
        errors.email = "لطفاً آدرس ایمیل را در قالب صحیح، مطابق نمونه (example@mail.com) وارد نمایید.";
    }

    const apiBirthDate = birthDateToApi(normalized.birth_date);
    const [year, month, day] = apiBirthDate.split("-").map(Number);
    if (!apiBirthDate || !isValidJalaaliDate(year, month, day)) {
        errors.birth_date = "لطفاً تاریخ تولد را از روی تقویم انتخاب بفرمایید.";
    } else if (!isAtLeastEighteenYearsOld(normalized.birth_date)) {
        errors.birth_date = "سن کاربر باید حداقل ۱۸ سال تمام باشد.";
    }

    if (!PERSIAN_NAME_REGEX.test(normalized.business_name) || normalized.business_name.length < 2 || normalized.business_name.length > 80) {
        errors.business_name = "لطفاً نام فروشگاه را به فارسی وارد بفرمایید.";
    }

    if (!CITY_REGEX.test(normalized.province)) {
        errors.province = "استان را به فارسی وارد کنید.";
    }

    if (!CITY_REGEX.test(normalized.city)) {
        errors.city = "شهر را به فارسی وارد کنید.";
    }

    if (!/^0\d{7,19}$/.test(normalized.telephone)) {
        errors.telephone = "لطفاً شماره تلفن ثابت را در قالب صحیح مطابق نمونه ( 02123456789 ) وارد نمایید.";
    }

    if (normalized.address.length < 5) {
        errors.address = "آدرس فروشگاه الزامی است.";
    }

    return errors;
}

function getFirstErrorTab(errors: FieldErrors): ActiveTab {
    return PROFILE_TABS.find((tab) => tab.fields.some((field) => errors[field]))?.id ?? "identity";
}

function LoadingState() {
    return (
        <div className="px-4 py-8">
            <Card className="mx-auto max-w-6xl border border-silver-dark/20 bg-brand-surface/80 p-6 text-right backdrop-blur-xl">
                <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="h-72 animate-pulse rounded-2xl bg-white/10" />
                    <div className="space-y-4">
                        <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                            <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                            <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                            <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
    return (
        <MagicCard className="rounded-2xl bg-brand-base/45 p-4" withBorderBeam={false}>
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-silver-dark/20 bg-silver-light/10 text-silver-light">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-brand-text-secondary">{label}</p>
                    <p className="mt-2 truncate text-sm font-semibold text-brand-text-primary">{value || "ثبت نشده"}</p>
                </div>
            </div>
        </MagicCard>
    );
}

function LogoPreview({ src, alt, fallbackIcon: FallbackIcon, className }: { src: string; alt: string; fallbackIcon: typeof Building2; className?: string }) {
    return (
        <div className={cn("grid place-items-center overflow-hidden rounded-2xl border border-silver-dark/20 bg-brand-base/60 text-silver-light", className)}>
            {src ? (
                <span
                    role="img"
                    aria-label={alt}
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${src.replace(/"/g, "%22")}")` }}
                />
            ) : (
                <FallbackIcon className="h-7 w-7" />
            )}
        </div>
    );
}

function FieldBlock({
    name,
    label,
    error,
    required = false,
    children,
}: {
    name: string;
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div>
            <Label htmlFor={name} className="mb-2 block text-sm text-brand-text-secondary">
                {label}
                {required ? <span className="mr-1 text-rose-200">*</span> : null}
            </Label>
            {children}
            <div className="mt-2 min-h-5 text-xs leading-5 text-rose-200">{error ?? ""}</div>
        </div>
    );
}

function parseProfileBirthDate(value: string): DateObject | null {
    const normalizedValue = normalizeDigits(value.trim()).replace(/-/g, "/");
    const match = normalizedValue.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!isValidJalaaliDate(year, month, day)) return null;

    return new DateObject({
        date: `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`,
        format: "YYYY/MM/DD",
        calendar: persian,
        locale: persian_fa,
    });
}

function JalaliBirthDatePicker({
    value,
    error,
    onChange,
    onBlur,
}: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}) {
    const maximumBirthDate = useMemo(() => {
        const date = new Date();

        date.setHours(23, 59, 59, 999);
        date.setFullYear(date.getFullYear() - 18);

        return date;
    }, []);

    const pickerValue = useMemo(() => parseProfileBirthDate(value) ?? undefined, [value]);

    return (
        <DatePicker
            calendar={persian}
            locale={persian_fa}
            format="YYYY/MM/DD"
            value={pickerValue}
            maxDate={maximumBirthDate}
            portal
            containerClassName="w-full"
            calendarPosition="bottom-center"
            onChange={(date) => {
                if (!date) {
                    onChange("");
                    return;
                }

                onChange(toPersianDigits(date.format("YYYY/MM/DD")));
            }}
            render={
                <Input
                    readOnly
                    dir="ltr"
                    placeholder="۱۳۸۰/۰۵/۲۳"
                    onBlur={onBlur}
                    className={cn(
                        "cursor-pointer pl-10 text-center",
                        error && "border-rose-300/60 focus:border-rose-300/80 focus:ring-rose-300/20"
                    )}
                />
            }
        />
    );
}

function ProfileSelect({
    id,
    value,
    options,
    placeholder,
    disabled,
    error,
    onChange,
}: {
    id: string;
    value: string;
    options: string[];
    placeholder: string;
    disabled?: boolean;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="relative">
            <select
                id={id}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className={cn(
                    "h-11 w-full appearance-none rounded-2xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 pl-10 text-right text-sm text-brand-text-primary outline-none transition-all duration-300 focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-rose-300/60 focus:border-rose-300/80 focus:ring-rose-300/20"
                )}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
        </div>
    );
}

function ProfileEditor({ currentUser }: { currentUser: CurrentUser }) {
    const queryClient = useQueryClient();
    const updateUserMutation = useUpdateUserMutation();
    const updateBusinessProfileMutation = useUpdateBusinessProfileMutation();
    const sendPhoneOtpMutation = useSendPhoneOtpMutation();
    const verifyPhoneOtpMutation = useVerifyPhoneOtpMutation();
    const [activeTab, setActiveTab] = useState<ActiveTab>("identity");
    const [savedFormData, setSavedFormData] = useState<ProfileFormState>(() => getInitialFormState(currentUser));
    const [formData, setFormData] = useState<ProfileFormState>(() => getInitialFormState(currentUser));
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [touchedFields, setTouchedFields] = useState<Partial<Record<FieldName, boolean>>>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoRemoved, setLogoRemoved] = useState(false);
    const [isDraggingLogo, setIsDraggingLogo] = useState(false);
    const [phoneOtpCode, setPhoneOtpCode] = useState("");
    const [verifiedPhone, setVerifiedPhone] = useState(currentUser.username ?? "");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const role = getNormalizedUserRole(currentUser);
    const displayName = getDisplayName(currentUser);
    const businessLabel = getBusinessLabel(currentUser);
    const isEmployee = currentUser.is_employee === true;
    const userPosition = isEmployee ? EMPLOYEE_POSITION_LABELS[1] : EMPLOYEE_POSITION_LABELS[0];
    const isSaving = updateUserMutation.isPending || updateBusinessProfileMutation.isPending;
    const normalizedUsername = sanitizeMobile(formData.username);
    const phoneChanged = normalizedUsername !== sanitizeMobile(currentUser.username ?? "");
    const isPhoneVerified = !phoneChanged || verifiedPhone === normalizedUsername;
    const cityOptions = useMemo(() => getCitiesByProvince(formData.province), [formData.province]);
    const normalizedFormData = useMemo(() => normalizeProfileFormState(formData), [formData]);
    const hasFormChanges = useMemo(() => !areProfileStatesEqual(formData, savedFormData) || Boolean(logoFile) || logoRemoved, [formData, savedFormData, logoFile, logoRemoved]);
    const existingLogoUrl = useMemo(() => resolveMediaUrl(currentUser.business_logo), [currentUser.business_logo]);
    const selectedLogoPreviewUrl = useMemo(() => {
        if (!logoFile) return "";
        return URL.createObjectURL(logoFile);
    }, [logoFile]);
    const logoPreviewUrl = selectedLogoPreviewUrl || (logoRemoved ? "" : existingLogoUrl);

    useEffect(() => {
        return () => {
            if (selectedLogoPreviewUrl) URL.revokeObjectURL(selectedLogoPreviewUrl);
        };
    }, [selectedLogoPreviewUrl]);

    const completion = useMemo(() => {
        const fields = Object.values(normalizedFormData);
        const filled = fields.filter((value) => String(value ?? "").trim()).length;
        return Math.round((filled / fields.length) * 100);
    }, [normalizedFormData]);

    const visibleErrors = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(fieldErrors).filter(([field]) => touchedFields[field as FieldName])
            ) as FieldErrors,
        [fieldErrors, touchedFields]
    );

    const validateAndStore = (nextFormData = formData): FieldErrors => {
        const errors = validateProfileForm(nextFormData);
        setFieldErrors(errors);
        return errors;
    };

    const setFieldValue = (name: FieldName, value: string) => {
        const nextValue =
            name === "telephone"
                ? sanitizeTelephone(value)
                : name === "username"
                    ? sanitizeMobile(value)
                : name === "birth_date"
                    ? sanitizeBirthDate(value)
                    : name === "email"
                        ? sanitizeEmail(value)
                    : name === "first_name" || name === "last_name" || name === "province" || name === "city"
                        ? sanitizePersianText(value, 60)
                    : name === "business_name"
                            ? sanitizePersianText(value, 80)
                            : normalizePersianCharacters(value);

        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: nextValue,
                ...(name === "province" ? { city: "" } : null),
            };
            setFieldErrors(validateProfileForm(next));
            return next;
        });
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFieldValue(name as FieldName, value);
    };

    const handleBlur = (field: FieldName) => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
        validateAndStore();
    };

    const acceptLogoFile = (file: File | null) => {
        if (!file) return;

        const validationError = getLogoValidationError(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setLogoFile(file);
        setLogoRemoved(false);
    };

    const handleLogoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = "";
        acceptLogoFile(file);
    };

    const handleLogoDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingLogo(false);
        acceptLogoFile(event.dataTransfer.files?.[0] ?? null);
    };

    const handleSendPhoneOtp = async () => {
        const phone = sanitizeMobile(formData.username);

        setTouchedFields((prev) => ({ ...prev, username: true }));

        if (!/^09\d{9}$/.test(phone)) {
            setFieldErrors((prev) => ({
                ...prev,
                username: "لطفاً شماره موبایل را در قالب صحیح وارد بفرمایید.",
            }));
            return;
        }

        try {
            await sendPhoneOtpMutation.mutateAsync({ phone_number: phone });
            setPhoneOtpCode("");
            toast.success("کد تایید برای شماره موبایل جدید ارسال شد.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ارسال کد تایید با خطا مواجه شد.";
            toast.error(message);
        }
    };

    const handleVerifyPhoneOtp = async () => {
        const phone = sanitizeMobile(formData.username);
        const code = sanitizeTelephone(phoneOtpCode).slice(0, 6);

        if (code.length !== 6) {
            toast.error("کد تایید باید ۶ رقم باشد.");
            return;
        }

        try {
            await verifyPhoneOtpMutation.mutateAsync({ username: phone, code });
            setVerifiedPhone(phone);
            toast.success("شماره موبایل جدید تایید شد.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "کد تایید معتبر نیست.";
            toast.error(message);
        }
    };

    const markAllTouched = () => {
        setTouchedFields(
            Object.keys(formData).reduce(
                (acc, field) => ({
                    ...acc,
                    [field]: true,
                }),
                {} as Record<FieldName, boolean>
            )
        );
    };

    const resetForm = () => {
        setFormData(savedFormData);
        setLogoFile(null);
        setLogoRemoved(false);
        setPhoneOtpCode("");
        setVerifiedPhone(currentUser.username ?? "");
        setFieldErrors({});
        setTouchedFields({});
        setActiveTab("identity");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!hasFormChanges || isSaving) {
            return;
        }

        const errors = validateAndStore();

        if (Object.keys(errors).length) {
            markAllTouched();
            setActiveTab(getFirstErrorTab(errors));
            toast.error("لطفاً موارد وارد شده را مجدداً بررسی نموده و نسبت به ویرایش خطاها اقدام بفرمایید.");
            return;
        }

        if (!isPhoneVerified) {
            setTouchedFields((prev) => ({ ...prev, username: true }));
            setActiveTab("identity");
            toast.error("برای تغییر شماره موبایل، ابتدا کد تایید ارسال‌شده را وارد و تایید بفرمایید.");
            return;
        }

        if (typeof currentUser.business_profile_id !== "number") {
            toast.error("پروفایل کسب‌وکار برای این حساب پیدا نشد.");
            return;
        }

        try {
            await updateUserMutation.mutateAsync({
                userId: currentUser.id,
                payload: {
                    first_name: normalizedFormData.first_name,
                    last_name: normalizedFormData.last_name,
                    username: normalizedFormData.username,
                    email: normalizedFormData.email,
                    birth_date: birthDateToApi(normalizedFormData.birth_date) || null,
                },
            });

            await updateBusinessProfileMutation.mutateAsync({
                profileId: currentUser.business_profile_id,
                payload: {
                    business_name: normalizedFormData.business_name,
                    business_handler: normalizedFormData.business_name,
                    address: normalizedFormData.address,
                    province: normalizedFormData.province,
                    city: normalizedFormData.city,
                    telephone: normalizedFormData.telephone,
                    ...(logoRemoved ? { business_logo: null } : logoFile ? { business_logo: logoFile } : {}),
                    is_active: currentUser.business_profile_is_active ?? true,
                },
            });

            setSavedFormData(normalizedFormData);
            setFormData(normalizedFormData);
            setLogoFile(null);
            setLogoRemoved(false);
            setFieldErrors({});
            setTouchedFields({});
            await queryClient.invalidateQueries({ queryKey: ["api", "users", "me"] });
            toast.success("پروفایل با موفقیت ذخیره شد");
        } catch (error) {
            const message = error instanceof Error ? error.message : "ذخیره پروفایل با خطا مواجه شد";
            toast.error(message);
        }
    };

    const inputClassName = (field: FieldName) =>
        cn(
            "text-right",
            visibleErrors[field] && "border-rose-300/60 focus:border-rose-300/80 focus:ring-rose-300/20"
        );

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/85 text-right shadow-2xl shadow-black/20 backdrop-blur-xl"
            >
                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_18rem] lg:items-center">
                    <div>
                        {/* <div className="inline-flex items-center gap-2 rounded-lg border border-silver-light/20 bg-silver-light/10 px-4 py-2 text-sm text-silver-light">
                            <Sparkles className="h-4 w-4" />
                            مدیریت پروفایل
                        </div> */}
                        <div className="flex items-center gap-4">
                            <LogoPreview src={logoPreviewUrl} alt={businessLabel} fallbackIcon={Building2} className="h-20 w-20 shrink-0" />
                            <div className="min-w-0">
                                <h1 className="truncate text-2xl font-black text-brand-text-primary sm:text-3xl">{displayName}</h1>
                                <p className="mt-2 max-w-3xl truncate text-sm text-brand-text-secondary">{businessLabel}</p>
                                {isEmployee ? (
                                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                                        <UserCheck className="h-4 w-4" />
                                        کارمند فروشگاه
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-brand-base/45 p-4">
                        <div className="mb-3 flex items-center justify-between text-sm">
                            <span className="text-brand-text-secondary">تکمیل اطلاعات</span>
                            <span className="font-bold text-silver-light">{completion.toLocaleString("fa-IR")}٪</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div className="h-full rounded-full bg-silver-light" initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 0.45 }} />
                        </div>
                        <p className="mt-3 text-xs text-justify leading-6 text-brand-text-secondary">
                            تکمیل اطلاعات حساب کاربری باعث افزایش جذابیت ظاهری و حرفه‌ای‌تر شدن لینک معرفی شما برای مخاطبان فروشگاه خواهد شد.
                        </p>
                    </div>
                </div>
            </motion.section>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="grid gap-4 md:grid-cols-3">
                <StatCard icon={BadgeCheck} label="وضعیت حساب کاربری" value={getAccountStatusLabel(currentUser.status, currentUser.is_active !== false && currentUser.business_profile_is_active !== false)} />
                <StatCard icon={UserCheck} label="سمت کاربر" value={userPosition} />
                <StatCard icon={ShieldCheck} label="نقش فروشگاه" value={getStoreRoleLabel(role)} />
            </motion.div>

            <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }} onSubmit={handleSubmit} noValidate>
                <Card className="overflow-hidden border border-silver-dark/20 bg-brand-surface/80 text-right shadow-deep-card backdrop-blur-xl">
                    <div className="grid gap-2 border-b border-white/10 bg-brand-base/25 p-2 md:grid-cols-3">
                        {PROFILE_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const hasError = tab.fields.some((field) => fieldErrors[field]);

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "relative flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-right transition-all duration-300",
                                        isActive ? "bg-white/[0.07] text-brand-text-primary shadow-inner shadow-white/5" : "text-brand-text-secondary hover:bg-white/[0.04] hover:text-brand-text-primary"
                                    )}
                                >
                                    {isActive ? <motion.span layoutId="profile-tab-active" className="absolute inset-0 rounded-2xl border border-silver-light/20" transition={{ duration: 0.25 }} /> : null}
                                    <span className={cn("relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border", isActive ? "border-silver-light/30 bg-silver-light/10 text-silver-light" : "border-white/10 bg-white/[0.03]")}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="relative min-w-0 flex-1">
                                        <span className="flex items-center gap-2 font-bold">
                                            {tab.title}
                                            {hasError ? <span className="h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_12px_rgba(253,164,175,0.8)]" /> : null}
                                        </span>
                                        <span className="mt-1 block truncate text-xs opacity-75">{tab.caption}</span>
                                    </span>
                                    <ChevronLeft className={cn("relative h-4 w-4 transition", isActive && "-translate-x-1 text-silver-light")} />
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-5">
                        <AnimatePresence mode="wait">
                            {activeTab === "identity" ? (
                                <motion.div
                                    key="identity"
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -18 }}
                                    transition={{ duration: 0.22 }}
                                    className="grid gap-4 md:grid-cols-2"
                                >
                                    <FieldBlock name="first_name" label="نام" error={visibleErrors.first_name} required>
                                        <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} onBlur={() => handleBlur("first_name")} className={inputClassName("first_name")} />
                                    </FieldBlock>
                                    <FieldBlock name="last_name" label="نام‌خانوادگی" error={visibleErrors.last_name} required>
                                        <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} onBlur={() => handleBlur("last_name")} className={inputClassName("last_name")} />
                                    </FieldBlock>
                                    <FieldBlock name="username" label="شماره موبایل" error={visibleErrors.username} required>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
                                                <Input id="username" name="username" value={toPersianDigits(formData.username)} onChange={handleChange} onBlur={() => handleBlur("username")} inputMode="numeric" dir="ltr" className={cn("pl-10 text-left", inputClassName("username"))} />
                                            </div>
                                            {phoneChanged ? (
                                                <div className="rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-3">
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <Button type="button" size="sm" variant="ghost" onClick={handleSendPhoneOtp} disabled={sendPhoneOtpMutation.isPending || !/^09\d{9}$/.test(normalizedUsername)}>
                                                            {sendPhoneOtpMutation.isPending ? "در حال ارسال..." : "دریافت کد تایید"}
                                                        </Button>
                                                        <Input
                                                            value={toPersianDigits(phoneOtpCode)}
                                                            onChange={(event) => setPhoneOtpCode(sanitizeTelephone(event.target.value).slice(0, 6))}
                                                            placeholder="کد ۶ رقمی"
                                                            inputMode="numeric"
                                                            dir="ltr"
                                                            className="text-center"
                                                        />
                                                        <Button type="button" size="sm" onClick={handleVerifyPhoneOtp} disabled={verifyPhoneOtpMutation.isPending || phoneOtpCode.length !== 6}>
                                                            {verifyPhoneOtpMutation.isPending ? "در حال تایید..." : "تایید شماره"}
                                                        </Button>
                                                    </div>
                                                    {isPhoneVerified ? <p className="mt-2 text-xs font-bold text-emerald-200">شماره موبایل جدید تایید شده است.</p> : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </FieldBlock>
                                    <FieldBlock name="email" label="آدرس ایمیل" error={visibleErrors.email} required>
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
                                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={() => handleBlur("email")} dir="ltr" placeholder="example@mail.com" className={cn("pl-10 text-left", inputClassName("email"))} />
                                        </div>
                                    </FieldBlock>
                                    <FieldBlock name="birth_date" label="تاریخ تولد" error={visibleErrors.birth_date} required>
                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
                                            <JalaliBirthDatePicker value={formData.birth_date} error={visibleErrors.birth_date} onChange={(value) => setFieldValue("birth_date", value)} onBlur={() => handleBlur("birth_date")} />
                                        </div>
                                    </FieldBlock>
                                    <div>
                                        <Label className="mb-2 block text-sm text-brand-text-secondary">سمت</Label>
                                        <div className="flex h-11 items-center rounded-2xl border border-silver-dark/20 bg-brand-base/45 px-4 text-sm font-bold text-brand-text-primary">
                                            {userPosition}
                                        </div>
                                        <div className="mt-2 min-h-5" />
                                    </div>
                                </motion.div>
                            ) : null}

                            {activeTab === "business" ? (
                                <motion.div
                                    key="business"
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -18 }}
                                    transition={{ duration: 0.22 }}
                                    className="grid gap-4 md:grid-cols-2"
                                >
                                    <FieldBlock name="business_name" label="نام فروشگاه" error={visibleErrors.business_name} required>
                                        <Input id="business_name" name="business_name" value={formData.business_name} onChange={handleChange} onBlur={() => handleBlur("business_name")} className={inputClassName("business_name")} />
                                    </FieldBlock>
                                    <FieldBlock name="telephone" label="تلفن ثابت فروشگاه" error={visibleErrors.telephone} required>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
                                            <Input id="telephone" name="telephone" value={toPersianDigits(formData.telephone)} onChange={handleChange} onBlur={() => handleBlur("telephone")} inputMode="numeric" dir="ltr" className={cn("pl-10 text-left", inputClassName("telephone"))} />
                                        </div>
                                    </FieldBlock>
                                    <FieldBlock name="province" label="استان" error={visibleErrors.province} required>
                                        <ProfileSelect id="province" value={formData.province} options={IRAN_PROVINCES} placeholder="انتخاب استان" error={visibleErrors.province} onChange={(value) => {
                                            setTouchedFields((prev) => ({ ...prev, province: true }));
                                            setFieldValue("province", value);
                                        }} />
                                    </FieldBlock>
                                    <FieldBlock name="city" label="شهر" error={visibleErrors.city} required>
                                        <ProfileSelect id="city" value={formData.city} options={cityOptions} placeholder={formData.province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"} disabled={!formData.province} error={visibleErrors.city} onChange={(value) => {
                                            setTouchedFields((prev) => ({ ...prev, city: true }));
                                            setFieldValue("city", value);
                                        }} />
                                    </FieldBlock>
                                    <FieldBlock name="address" label="آدرس فروشگاه" error={visibleErrors.address} required>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur("address")}
                                            rows={3}
                                            className={cn(
                                                "w-full resize-none rounded-2xl border border-brand-border/80 bg-brand-base/45 px-4 py-3 text-sm leading-8 text-brand-text-primary outline-none transition-all duration-300 placeholder:text-brand-text-secondary focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25 md:col-span-2",
                                                visibleErrors.address && "border-rose-300/60 focus:border-rose-300/80 focus:ring-rose-300/20"
                                            )}
                                        />
                                    </FieldBlock>
                                </motion.div>
                            ) : null}

                            {activeTab === "location" ? (
                                <motion.div
                                    key="location"
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -18 }}
                                    transition={{ duration: 0.22 }}
                                    className="grid gap-5"
                                >
                                    <div>
                                        <Label className="mb-2 block text-sm text-brand-text-secondary">لوگوی فروشگاه</Label>
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
                                            onDrop={handleLogoDrop}
                                            className={cn(
                                                "cursor-pointer rounded-3xl border border-dashed bg-brand-base/40 p-5 transition-all duration-300",
                                                isDraggingLogo ? "border-silver-light/70 bg-silver-light/10" : "border-silver-dark/30 hover:border-silver-light/45 hover:bg-white/[0.04]"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <LogoPreview src={logoPreviewUrl} alt={businessLabel} fallbackIcon={ImagePlus} className="h-20 w-20 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-brand-text-primary">
                                                        {logoFile ? logoFile.name : currentUser.business_logo && !logoRemoved ? "لوگوی فعلی فروشگاه" : "لوگوی فروشگاه ثبت نشده است."}
                                                    </p>
                                                    <p className="mt-2 text-xs leading-6 text-brand-text-secondary">
                                                        {currentUser.business_logo && !logoRemoved
                                                            ? "لوگوی فعلی فروشگاه شما در این بخش نمایش داده می‌شود. در صورت تمایل، می‌توانید لوگوی فروشگاه را تغییر داده یا حذف نمایید. فایل لوگو در فرمت‌های WEBP، JPG، PNG یا SVG و با حجم کمتر از ۲ مگابایت مورد تأیید می‌باشد. لطفاً فایل لوگوی جدید را در این قسمت رها کنید یا برای انتخاب آن از میان فایل‌های دستگاه، کلیک بفرمایید."
                                                            : "درج لوگو باعث افزایش جذابیت ظاهری و حرفه‌ای‌تر شدن داشبورد قیمت گذاری شما برای مخاطبان فروشگاه خواهد شد. فایل لوگو در فرمت‌های WEBP، JPG، PNG یا SVG و با حجم کمتر از ۲ مگابایت مورد تأیید می‌باشد. لطفاً فایل لوگو را در این قسمت رها کنید یا برای انتخاب آن از میان فایل‌های دستگاه، کلیک بفرمایید."}
                                                    </p>
                                                    {logoFile ? <p className="mt-2 text-xs text-silver-light">{formatFileSize(logoFile.size)}</p> : null}
                                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                                        <Button type="button" variant="ghost" size="sm" onClick={(event) => {
                                                            event.stopPropagation();
                                                            fileInputRef.current?.click();
                                                        }} className="cursor-pointer">
                                                            <ImagePlus className="h-4 w-4" />
                                                            انتخاب لوگو فروشگاه از فایل های دستگاه
                                                        </Button>
                                                        <Button type="button" variant="ghost" size="sm" onClick={(event) => {
                                                            event.stopPropagation();
                                                            setLogoFile(null);
                                                            setLogoRemoved(true);
                                                        }} disabled={!logoFile && (!currentUser.business_logo || logoRemoved)} className="cursor-pointer border-rose-300/20 text-rose-100 hover:bg-rose-400/10">
                                                            <Trash2 className="h-4 w-4" />
                                                            حذف لوگو فروشگاه
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/10 bg-brand-base/25 p-4 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button type="button" variant="ghost" onClick={resetForm} disabled={isSaving || !hasFormChanges} className="cursor-pointer">
                                <RotateCcw className="h-4 w-4" />
                                بازگردانی تغییرات
                            </Button>
                            <Button type="submit" disabled={isSaving || !hasFormChanges} className="cursor-pointer">
                                <Save className="h-4 w-4" />
                                {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                        </div>
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
