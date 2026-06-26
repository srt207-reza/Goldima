"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Suspense,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
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
import { BusinessLogoUploader } from "@/components/auth/business-logo-uploader";

import {
    useParentBusinessProfileQuery,
    usePhoneRegisterMutation,
} from "@/hooks/api";

import {
    getCitiesByProvince,
    IRAN_PROVINCES,
} from "@/constants/iran-locations";

import {
    EMAIL_REGEX,
    MOBILE_USERNAME_REGEX,
} from "@/types/api/auth";

import {
    DEFAULT_PARENT_BUSINESS_HANDLER,
    getReadableBusinessHandler,
    normalizeBusinessPathSegment,
} from "@/lib/business-path";

import {
    clearRegisterOtpSession,
    readRegisterOtpSession,
} from "@/lib/otp-session";

import { setAuthTokens } from "@/lib/auth-storage";

import {
    normalizeDigits,
    normalizeMobileUsername,
} from "@/services/api/auth";

import type { AuthBusinessProfile } from "@/types/api/auth";

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
    business_logo: File | null;
};

type ValidatedField =
    | "first_name"
    | "last_name"
    | "email"
    | "birth_date"
    | "business_name";

type FieldErrors = Partial<Record<ValidatedField, string>>;

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
    business_logo: null,
};

/**
 * فقط حروف فارسی، فاصله و نیم‌فاصله.
 */
const PERSIAN_TEXT_REGEX =
    /^[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0]+(?:[ \u200C][\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0]+)*$/u;

/**
 * یکسان‌سازی حروف عربی با معادل فارسی.
 */
function normalizePersianCharacters(value: string): string {
    return value
        .normalize("NFC")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ة/g, "ه");
}

/**
 * حذف کامل اعداد، حروف انگلیسی و کاراکترهای غیرمجاز.
 */
function sanitizePersianText(
    value: string,
    maxLength = 60
): string {
    return normalizePersianCharacters(value)
        .replace(
            /[^\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06C0 \u200C]/gu,
            ""
        )
        .replace(/ {2,}/g, " ")
        .replace(/\u200C{2,}/g, "\u200C")
        .replace(/ \u200C|\u200C /g, " ")
        .slice(0, maxLength);
}

function isValidPersianText(value: string): boolean {
    const trimmedValue = value.trim();

    return (
        trimmedValue.length > 0 &&
        PERSIAN_TEXT_REGEX.test(trimmedValue)
    );
}

function getFirstNameError(value: string): string | undefined {
    if (!isValidPersianText(value)) {
        return "لطفاً نام را به فارسی وارد نمایید.";
    }

    return undefined;
}

function getLastNameError(value: string): string | undefined {
    if (!isValidPersianText(value)) {
        return "لطفاً نام‌خانوادگی را به فارسی وارد نمایید.";
    }

    return undefined;
}

function getEmailError(value: string): string | undefined {
    const trimmedValue = value.trim();

    if (!trimmedValue || !EMAIL_REGEX.test(trimmedValue)) {
        return "لطفاً آدرس ایمیل را در قالب صحیح، مطابق نمونه (example@mail.com) وارد نمایید.";
    }

    return undefined;
}

function getBusinessNameError(
    value: string
): string | undefined {
    if (!isValidPersianText(value)) {
        return "لطفاً نام فروشگاه را به فارسی وارد نمایید.";
    }

    return undefined;
}

/**
 * تبدیل تاریخ روز/ماه/سال به DateObject شمسی.
 *
 * مثال:
 * ۱۳۸۰/۰۵/۲۳ در رابط کاربری به صورت ۲۳/۰۵/۱۳۸۰ نمایش داده می‌شود.
 */
function parseJalaliBirthDate(
    value: string
): DateObject | null {
    const normalizedValue = normalizeDigits(value.trim());

    const match = normalizedValue.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year < 1200
    ) {
        return null;
    }

    try {
        const date = new DateObject({
            date: `${year}/${String(month).padStart(
                2,
                "0"
            )}/${String(day).padStart(2, "0")}`,
            format: "YYYY/MM/DD",
            calendar: persian,
            locale: persian_fa,
        });

        if (
            date.year !== year ||
            date.month.number !== month ||
            date.day !== day
        ) {
            return null;
        }

        return date;
    } catch {
        return null;
    }
}

function isAtLeastEighteenYearsOld(
    value: string
): boolean {
    const jalaliBirthDate = parseJalaliBirthDate(value);

    if (!jalaliBirthDate) {
        return false;
    }

    const birthDate = jalaliBirthDate.toDate();
    const today = new Date();

    let age =
        today.getFullYear() - birthDate.getFullYear();

    const birthdayHasNotOccurred =
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate());

    if (birthdayHasNotOccurred) {
        age -= 1;
    }

    return age >= 18;
}

function getBirthDateError(
    value: string
): string | undefined {
    if (!parseJalaliBirthDate(value)) {
        return "لطفاً تاریخ تولد را با فرمت روز/ماه/سال انتخاب نمایید.";
    }

    if (!isAtLeastEighteenYearsOld(value)) {
        return "سن کاربر باید حداقل ۱۸ سال تمام باشد.";
    }

    return undefined;
}

/**
 * تبدیل فرمت روز/ماه/سال به فرمت مورد انتظار API.
 *
 * 23/05/1380 => 1380-05-23
 */
function birthDateToApi(value: string): string {
    const normalizedValue = normalizeDigits(value.trim());

    const match = normalizedValue.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (!match) {
        return "";
    }

    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];

    return `${year}-${month}-${day}`;
}

function getStepOneErrors(
    formData: RegisterFormState
): FieldErrors {
    const errors: FieldErrors = {};

    const firstNameError = getFirstNameError(
        formData.first_name
    );

    const lastNameError = getLastNameError(
        formData.last_name
    );

    const emailError = getEmailError(formData.email);

    const birthDateError = getBirthDateError(
        formData.birth_date
    );

    if (firstNameError) {
        errors.first_name = firstNameError;
    }

    if (lastNameError) {
        errors.last_name = lastNameError;
    }

    if (emailError) {
        errors.email = emailError;
    }

    if (birthDateError) {
        errors.birth_date = birthDateError;
    }

    return errors;
}

function validateStepTwo(
    formData: RegisterFormState
): string | null {
    if (!formData.address.trim()) {
        return "آدرس الزامی است.";
    }

    if (!formData.province.trim()) {
        return "استان الزامی است.";
    }

    if (!formData.city.trim()) {
        return "شهر الزامی است.";
    }

    if (!formData.telephone.trim()) {
        return "تلفن الزامی است.";
    }

    return null;
}

function getPendingUrl(
    profile: AuthBusinessProfile,
    parentBusinessHandler?: string
): string {
    const params = new URLSearchParams({
        business_handler: profile.business_handler ?? "",
        business_name: profile.business_name ?? "",
    });

    if (parentBusinessHandler) {
        params.set(
            "parent_business_handler",
            parentBusinessHandler
        );
    }

    return `/pending?${params.toString()}`;
}

function getPostAuthUrl(
    profile: AuthBusinessProfile,
    parentBusinessHandler?: string
): string {
    const role = String(
        profile.user?.role ?? ""
    ).toUpperCase();

    const status = String(
        profile.user.status ?? ""
    ).toUpperCase();

    if (role === "MASTER" || status === "APPROVED") {
        return "/";
    }

    return getPendingUrl(
        profile,
        parentBusinessHandler
    );
}

function FieldError({
    id,
    message,
}: {
    id: string;
    message?: string;
}) {
    if (!message) {
        return null;
    }

    return (
        <p
            id={id}
            role="alert"
            className="mt-2 text-right text-xs font-medium leading-6 text-rose-400"
        >
            {message}
        </p>
    );
}

function StepPill({
    active,
    complete,
    label,
    index,
    onClick,
}: {
    active: boolean;
    complete?: boolean;
    label: string;
    index: number;
    onClick?: () => void;
}) {
    const isInteractive =
        typeof onClick === "function";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!isInteractive}
            className={`group flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-center transition-all duration-300 ${active
                ? "border border-silver-light/35 bg-silver-light/12 text-brand-text-primary shadow-silver-glow"
                : complete
                    ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                    : "border border-transparent bg-white/[0.03] text-brand-text-secondary"
                } ${isInteractive
                    ? "cursor-pointer hover:border-silver-light/25 hover:bg-white/[0.06] hover:text-white"
                    : "cursor-default"
                }`}
        >
            <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all ${active
                    ? "border-silver-light bg-silver-light/15 text-silver-light"
                    : complete
                        ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
                        : "border-silver-dark/30 text-brand-text-secondary"
                    }`}
            >
                {complete ? <Check className="h-3.5 w-3.5" /> : index}
            </div>

            <span
                className="truncate text-xs font-bold sm:text-sm"
            >
                {label}
            </span>
        </button>
    );
}

function JalaliBirthDatePicker({
    value,
    error,
    onChange,
}: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    const maximumBirthDate = useMemo(() => {
        const date = new Date();

        date.setHours(23, 59, 59, 999);
        date.setFullYear(date.getFullYear() - 18);

        return date;
    }, []);

    const pickerValue = useMemo(() => {
        const parsedDate = parseJalaliBirthDate(value);

        return parsedDate ?? undefined;
    }, [value]);

    return (
        <div className="relative overflow-visible">
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

                    const formattedDate = normalizeDigits(
                        date.format("DD/MM/YYYY")
                    );

                    onChange(formattedDate);
                }}
                render={
                    <Input
                        type="text"
                        readOnly
                        dir="ltr"
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                            error
                                ? "birth-date-error"
                                : undefined
                        }
                        placeholder="روز/ماه/سال"
                        className={`cursor-pointer text-center transition-all duration-300 focus:scale-[1.02] ${error
                            ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                            : ""
                            }`}
                    />
                }
            />

            <FieldError
                id="birth-date-error"
                message={error}
            />
        </div>
    );
}

function SponsorIdentity({
    name,
    isLoading,
}: {
    name: string;
    isLoading?: boolean;
}) {
    return (
        <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-wider sm:text-4xl">
                <span className="animate-pulse bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent">
                    {isLoading
                        ? "در حال دریافت..."
                        : name}
                </span>
            </h1>

            <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                ثبت‌نام زیرمجموعه
            </p>
        </div>
    );
}

function OrganizationNotFound({
    businessHandler,
}: {
    businessHandler: string;
}) {
    const readableBusinessHandler =
        getReadableBusinessHandler(businessHandler);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />

            <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-300/20 bg-brand-surface/85 p-8 text-center shadow-2xl backdrop-blur-xl">
                <ShineBorder className="opacity-70" />

                <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-2xl font-black text-rose-100">
                    !
                </div>

                <h1 className="text-2xl font-black text-brand-text-primary">
                    چنین سازمانی وجود ندارد
                </h1>

                <p className="mt-4 leading-8 text-brand-text-secondary">
                    لینک زیرمجموعه برای{" "}
                    <span
                        dir="auto"
                        className="font-semibold text-rose-100"
                    >
                        {readableBusinessHandler}
                    </span>{" "}
                    معتبر نیست.
                </p>

                <Link
                    href={`/login?business_handler=${encodeURIComponent(
                        DEFAULT_PARENT_BUSINESS_HANDLER
                    )}`}
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

    const wrapperRef =
        useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (
            event: PointerEvent
        ) => {
            if (
                !wrapperRef.current?.contains(
                    event.target as Node
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [isOpen]);

    return (
        <div
            ref={wrapperRef}
            className="relative"
        >
            <Label
                htmlFor={id}
                className="mb-2 block text-right text-brand-text-primary"
            >
                {label}
            </Label>

            <button
                id={id}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() =>
                    setIsOpen((previous) => !previous)
                }
                className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-2 text-right text-sm text-brand-text-primary shadow-inner shadow-black/10 outline-none transition-all duration-300 hover:border-silver-dark/70 focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-silver-light transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />

                <span
                    className={
                        value
                            ? "text-brand-text-primary"
                            : "text-brand-text-secondary/80"
                    }
                >
                    {value || placeholder}
                </span>
            </button>

            {isOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-silver-light/20 bg-[#111318]/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="max-h-64 overflow-y-auto pr-1">
                        {options.map((option) => {
                            const selected =
                                option === value;

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                        selected
                                    }
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right text-sm transition ${selected
                                        ? "bg-silver-light/15 text-white"
                                        : "text-brand-text-secondary hover:bg-white/7 hover:text-brand-text-primary"
                                        }`}
                                >
                                    {selected ? (
                                        <Check className="h-4 w-4 text-silver-light" />
                                    ) : (
                                        <span className="h-4 w-4" />
                                    )}

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

    const registerMutation =
        usePhoneRegisterMutation();

    const [step, setStep] = useState<Step>(1);

    const [formData, setFormData] =
        useState<RegisterFormState>(
            initialFormState
        );

    const [fieldErrors, setFieldErrors] =
        useState<FieldErrors>({});

    const [
        parentBusinessHandler,
        setParentBusinessHandler,
    ] = useState(
        DEFAULT_PARENT_BUSINESS_HANDLER
    );

    const [
        verifiedOtpCode,
        setVerifiedOtpCode,
    ] = useState("");

    const submitLockRef = useRef(false);

    const parentProfileQuery =
        useParentBusinessProfileQuery(
            parentBusinessHandler
        );

    const isLinkedToParent =
        parentBusinessHandler !==
        DEFAULT_PARENT_BUSINESS_HANDLER;

    const sponsorName =
        parentProfileQuery.data?.business_name ||
        (isLinkedToParent
            ? getReadableBusinessHandler(
                parentBusinessHandler
            )
            : "Goldima");

    const cityOptions = useMemo(
        () =>
            getCitiesByProvince(
                formData.province
            ),
        [formData.province]
    );

    useEffect(() => {
        const params = new URLSearchParams(
            searchKey
        );

        const handlerFromQuery =
            normalizeBusinessPathSegment(
                params.get(
                    "business_handler"
                ) ||
                DEFAULT_PARENT_BUSINESS_HANDLER
            );

        const usernameFromQuery =
            normalizeMobileUsername(
                params.get("username") || ""
            );

        const otpReady =
            params.get("otp_ready") === "1";

        setParentBusinessHandler(
            handlerFromQuery ||
            DEFAULT_PARENT_BUSINESS_HANDLER
        );

        setFormData((previous) => ({
            ...previous,
            username:
                usernameFromQuery ||
                previous.username,
        }));

        if (usernameFromQuery && otpReady) {
            const session =
                readRegisterOtpSession({
                    username:
                        usernameFromQuery,
                    business_handler:
                        handlerFromQuery ||
                        DEFAULT_PARENT_BUSINESS_HANDLER,
                });

            if (session) {
                setVerifiedOtpCode(
                    session.code
                );

                return;
            }

            toast.error(
                "کد تایید معتبر نیست"
            );

            params.delete("username");
            params.delete("otp_ready");

            router.replace(
                `/register?${params.toString()}`,
                { scroll: false }
            );

            return;
        }

        const shouldNormalizeHandler =
            handlerFromQuery &&
            handlerFromQuery !==
            params.get(
                "business_handler"
            );

        const shouldAddDefaultHandler =
            !params.get(
                "business_handler"
            );

        if (
            shouldNormalizeHandler ||
            shouldAddDefaultHandler
        ) {
            params.set(
                "business_handler",
                handlerFromQuery ||
                DEFAULT_PARENT_BUSINESS_HANDLER
            );
        }

        params.delete("otp_ready");

        params.set(
            "business_handler",
            handlerFromQuery ||
            DEFAULT_PARENT_BUSINESS_HANDLER
        );

        if (usernameFromQuery) {
            params.set(
                "username",
                usernameFromQuery
            );
        } else {
            params.delete("username");
        }

        setVerifiedOtpCode("");
        setStep(1);

        router.replace(
            `/login?${params.toString()}`,
            { scroll: false }
        );
    }, [router, searchKey]);

    const setFieldError = (
        field: ValidatedField,
        error?: string
    ) => {
        setFieldErrors((previous) => ({
            ...previous,
            [field]: error,
        }));
    };

    const handleChange = (
        event: ChangeEvent<
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
        >
    ) => {
        const { name, value } =
            event.target;

        if (
            name === "first_name" ||
            name === "last_name" ||
            name === "business_name"
        ) {
            const normalizedRawValue =
                normalizePersianCharacters(
                    value
                );

            const sanitizedValue =
                sanitizePersianText(
                    value,
                    name === "business_name"
                        ? 80
                        : 50
                );

            const containedInvalidCharacter =
                normalizedRawValue !==
                sanitizedValue;

            setFormData((previous) => ({
                ...previous,
                [name]: sanitizedValue,
            }));

            if (name === "first_name") {
                setFieldError(
                    "first_name",
                    containedInvalidCharacter
                        ? "لطفاً نام را به فارسی وارد نمایید."
                        : getFirstNameError(
                            sanitizedValue
                        )
                );
            }

            if (name === "last_name") {
                setFieldError(
                    "last_name",
                    containedInvalidCharacter
                        ? "لطفاً نام‌خانوادگی را به فارسی وارد نمایید."
                        : getLastNameError(
                            sanitizedValue
                        )
                );
            }

            if (name === "business_name") {
                setFieldError(
                    "business_name",
                    containedInvalidCharacter
                        ? "لطفاً نام فروشگاه را به فارسی وارد نمایید."
                        : getBusinessNameError(
                            sanitizedValue
                        )
                );
            }

            return;
        }

        if (name === "email") {
            setFormData((previous) => ({
                ...previous,
                email: value,
            }));

            setFieldError(
                "email",
                getEmailError(value)
            );

            return;
        }

        if (name === "telephone") {
            setFormData((previous) => ({
                ...previous,
                telephone: normalizeDigits(value)
                    .replace(/\D/g, "")
                    .slice(0, 20),
            }));

            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "province"
                ? { city: "" }
                : {}),
        }));
    };

    const handleValidatedFieldBlur = (
        field: ValidatedField
    ) => {
        if (field === "first_name") {
            setFieldError(
                field,
                getFirstNameError(
                    formData.first_name
                )
            );

            return;
        }

        if (field === "last_name") {
            setFieldError(
                field,
                getLastNameError(
                    formData.last_name
                )
            );

            return;
        }

        if (field === "email") {
            setFieldError(
                field,
                getEmailError(formData.email)
            );

            return;
        }

        if (field === "business_name") {
            setFieldError(
                field,
                getBusinessNameError(
                    formData.business_name
                )
            );
        }
    };

    const handleBirthDateChange = (
        birthDate: string
    ) => {
        setFormData((previous) => ({
            ...previous,
            birth_date: birthDate,
        }));

        setFieldError(
            "birth_date",
            getBirthDateError(birthDate)
        );
    };

    const handleSelectChange = (
        name: "province" | "city",
        value: string
    ) => {
        setFormData((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "province"
                ? { city: "" }
                : {}),
        }));
    };

    const handleBusinessLogoChange = (
        businessLogo: File | null
    ) => {
        setFormData((previous) => ({
            ...previous,
            business_logo: businessLogo,
        }));
    };

    const handleNext = () => {
        const errors =
            getStepOneErrors(formData);

        setFieldErrors((previous) => ({
            ...previous,
            first_name: errors.first_name,
            last_name: errors.last_name,
            email: errors.email,
            birth_date: errors.birth_date,
        }));

        const hasFieldError =
            Boolean(errors.first_name) ||
            Boolean(errors.last_name) ||
            Boolean(errors.email) ||
            Boolean(errors.birth_date);

        if (hasFieldError) {
            return;
        }

        if (
            !MOBILE_USERNAME_REGEX.test(
                normalizeMobileUsername(
                    formData.username
                )
            )
        ) {
            toast.error(
                "شماره موبایل معتبر نیست."
            );

            return;
        }

        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (step === 1) {
            handleNext();
            return;
        }

        if (
            submitLockRef.current ||
            registerMutation.isPending
        ) {
            return;
        }

        const stepOneErrors =
            getStepOneErrors(formData);

        const hasStepOneError =
            Boolean(
                stepOneErrors.first_name
            ) ||
            Boolean(
                stepOneErrors.last_name
            ) ||
            Boolean(stepOneErrors.email) ||
            Boolean(
                stepOneErrors.birth_date
            );

        if (hasStepOneError) {
            setFieldErrors((previous) => ({
                ...previous,
                ...stepOneErrors,
            }));

            setStep(1);
            return;
        }

        const businessNameError =
            getBusinessNameError(
                formData.business_name
            );

        setFieldError(
            "business_name",
            businessNameError
        );

        if (businessNameError) {
            return;
        }

        const stepTwoError =
            validateStepTwo(formData);

        if (stepTwoError) {
            toast.error(stepTwoError);
            return;
        }

        submitLockRef.current = true;

        try {
            const response =
                await registerMutation.mutateAsync(
                    {
                        username:
                            normalizeMobileUsername(
                                formData.username
                            ),
                        code: verifiedOtpCode,
                        first_name:
                            formData.first_name.trim(),
                        last_name:
                            formData.last_name.trim(),
                        email: formData.email
                            .trim()
                            .toLowerCase(),
                        birth_date:
                            birthDateToApi(
                                formData.birth_date
                            ),
                        business_name:
                            formData.business_name.trim(),
                        business_handler:
                            formData.business_name.trim(),
                        address:
                            formData.address.trim(),
                        province:
                            formData.province.trim(),
                        city: formData.city.trim(),
                        telephone:
                            normalizeDigits(
                                formData.telephone.trim()
                            ),
                        business_logo:
                            formData.business_logo,
                        parent_business_handler:
                            parentBusinessHandler ||
                            undefined,
                    }
                );

            clearRegisterOtpSession();

            setAuthTokens({
                access: response.access,
                refresh: response.refresh,
            });

            toast.success(
                "ثبت‌نام با موفقیت انجام شد"
            );

            router.replace(
                getPostAuthUrl(
                    response.user_profile,
                    parentBusinessHandler
                )
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "ثبت‌نام با خطا مواجه شد";

            toast.error(message);
        } finally {
            submitLockRef.current = false;
        }
    };

    if (
        isLinkedToParent &&
        parentProfileQuery.isError
    ) {
        return (
            <OrganizationNotFound
                businessHandler={
                    parentBusinessHandler
                }
            />
        );
    }

    if (!verifiedOtpCode) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
                <AmbientBackground dense />

                <Card className="relative w-full max-w-md rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
                    <div className="animate-pulse text-silver-light">
                        در حال انتقال...
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4 py-8">
            <AmbientBackground dense />

            <div className="absolute right-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-silver-light/5 blur-3xl" />

            <div
                className="absolute bottom-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-silver-metallic/5 blur-3xl"
                style={{
                    animationDelay: "1s",
                }}
            />

            <Card className="group relative w-full max-w-3xl overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-silver-glow sm:p-8">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                <div className="absolute left-0 right-0 top-0 h-1 bg-linear-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 hover:opacity-100" />

                <SponsorIdentity
                    name={sponsorName}
                    isLoading={
                        isLinkedToParent &&
                        parentProfileQuery.isFetching
                    }
                />

                <div className="mb-4 rounded-2xl border border-silver-dark/20 bg-brand-base/35 p-1.5 shadow-inner shadow-black/10">
                    <div className="flex items-center gap-1.5">
                        <StepPill
                            active={step === 1}
                            complete={step === 2}
                            label="مشخصات شخصی"
                            index={1}
                            onClick={
                                step === 2
                                    ? () => setStep(1)
                                    : undefined
                            }
                        />

                        <div className="h-px w-6 shrink-0 bg-linear-to-l from-silver-light/35 via-silver-dark/35 to-silver-light/10 sm:w-8" />

                        <StepPill
                            active={step === 2}
                            label="مشخصات فروشگاه"
                            index={2}
                        />
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    noValidate
                >
                    {step === 1 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* <div className="group/input">
                                <Label
                                    htmlFor="username"
                                    className="mb-2 block text-right text-brand-text-primary"
                                >
                                    شماره موبایل
                                </Label>

                                <Input
                                    id="username"
                                    name="username"
                                    type="tel"
                                    value={
                                        formData.username
                                    }
                                    disabled
                                    dir="ltr"
                                    className="transition-all duration-300 disabled:opacity-70"
                                />
                            </div> */}

                            <div className="group/input">
                                <Label
                                    htmlFor="first_name"
                                    className="mb-2 block text-right text-brand-text-primary"
                                >
                                    نام
                                </Label>

                                <Input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    required
                                    autoComplete="given-name"
                                    value={
                                        formData.first_name
                                    }
                                    onChange={handleChange}
                                    onBlur={() =>
                                        handleValidatedFieldBlur(
                                            "first_name"
                                        )
                                    }
                                    placeholder="مثال: محمدرضا"
                                    dir="rtl"
                                    maxLength={50}
                                    aria-invalid={Boolean(
                                        fieldErrors.first_name
                                    )}
                                    aria-describedby={
                                        fieldErrors.first_name
                                            ? "first-name-error"
                                            : undefined
                                    }
                                    className={`text-right transition-all duration-300 focus:scale-[1.02] ${fieldErrors.first_name
                                        ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                        : ""
                                        }`}
                                />

                                <FieldError
                                    id="first-name-error"
                                    message={
                                        fieldErrors.first_name
                                    }
                                />
                            </div>

                            <div className="group/input">
                                <Label
                                    htmlFor="last_name"
                                    className="mb-2 block text-right text-brand-text-primary"
                                >
                                    نام‌خانوادگی
                                </Label>

                                <Input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    autoComplete="family-name"
                                    value={
                                        formData.last_name
                                    }
                                    onChange={handleChange}
                                    onBlur={() =>
                                        handleValidatedFieldBlur(
                                            "last_name"
                                        )
                                    }
                                    placeholder="مثال: احمدزاده"
                                    dir="rtl"
                                    maxLength={50}
                                    aria-invalid={Boolean(
                                        fieldErrors.last_name
                                    )}
                                    aria-describedby={
                                        fieldErrors.last_name
                                            ? "last-name-error"
                                            : undefined
                                    }
                                    className={`text-right transition-all duration-300 focus:scale-[1.02] ${fieldErrors.last_name
                                        ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                        : ""
                                        }`}
                                />

                                <FieldError
                                    id="last-name-error"
                                    message={
                                        fieldErrors.last_name
                                    }
                                />
                            </div>

                            <div className="group/input">
                                <Label
                                    htmlFor="birth_date"
                                    className="mb-2 block text-right text-brand-text-primary"
                                >
                                    تاریخ تولد
                                </Label>

                                <JalaliBirthDatePicker
                                    value={
                                        formData.birth_date
                                    }
                                    error={
                                        fieldErrors.birth_date
                                    }
                                    onChange={
                                        handleBirthDateChange
                                    }
                                />
                            </div>

                            <div className="group/input">
                                <Label
                                    htmlFor="email"
                                    className="mb-2 block text-right text-brand-text-primary"
                                >
                                    آدرس ایمیل
                                </Label>

                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={() =>
                                        handleValidatedFieldBlur(
                                            "email"
                                        )
                                    }
                                    placeholder="example@mail.com"
                                    dir="ltr"
                                    aria-invalid={Boolean(
                                        fieldErrors.email
                                    )}
                                    aria-describedby={
                                        fieldErrors.email
                                            ? "email-error"
                                            : undefined
                                    }
                                    className={`transition-all duration-300 focus:scale-[1.02] ${fieldErrors.email
                                        ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                        : ""
                                        }`}
                                />

                                <FieldError
                                    id="email-error"
                                    message={
                                        fieldErrors.email
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="group/input">
                                    <Label
                                        htmlFor="business_name"
                                        className="mb-2 block text-right text-brand-text-primary"
                                    >
                                        نام فروشگاه
                                    </Label>

                                    <Input
                                        id="business_name"
                                        name="business_name"
                                        type="text"
                                        required
                                        value={
                                            formData.business_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        onBlur={() =>
                                            handleValidatedFieldBlur(
                                                "business_name"
                                            )
                                        }
                                        placeholder="مثال: فروشگاه نوروس"
                                        dir="rtl"
                                        maxLength={80}
                                        aria-invalid={Boolean(
                                            fieldErrors.business_name
                                        )}
                                        aria-describedby={
                                            fieldErrors.business_name
                                                ? "business-name-error"
                                                : undefined
                                        }
                                        className={`text-right transition-all duration-300 focus:scale-[1.02] ${fieldErrors.business_name
                                            ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                            : ""
                                            }`}
                                    />

                                    <FieldError
                                        id="business-name-error"
                                        message={
                                            fieldErrors.business_name
                                        }
                                    />
                                </div>

                                <div className="group/input">
                                    <Label
                                        htmlFor="telephone"
                                        className="mb-2 block text-right text-brand-text-primary"
                                    >
                                        تلفن ثابت فروشگاه
                                    </Label>

                                    <Input
                                        id="telephone"
                                        name="telephone"
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={20}
                                        required
                                        value={
                                            formData.telephone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="02112345678"
                                        dir="ltr"
                                        className="transition-all duration-300 focus:scale-[1.02]"
                                    />
                                </div>

                                <FancySelect
                                    id="province"
                                    label="استان"
                                    value={
                                        formData.province
                                    }
                                    placeholder="انتخاب استان"
                                    options={
                                        IRAN_PROVINCES
                                    }
                                    onChange={(value) =>
                                        handleSelectChange(
                                            "province",
                                            value
                                        )
                                    }
                                />

                                <FancySelect
                                    id="city"
                                    label="شهر"
                                    value={formData.city}
                                    placeholder={
                                        formData.province
                                            ? "انتخاب شهر"
                                            : "ابتدا استان را انتخاب کنید"
                                    }
                                    options={
                                        cityOptions
                                    }
                                    disabled={
                                        !formData.province
                                    }
                                    onChange={(value) =>
                                        handleSelectChange(
                                            "city",
                                            value
                                        )
                                    }
                                />
                            </div>

                            <div className="group/input">
                                <Label
                                    htmlFor="address"
                                    className="mb-2 block text-right text-brand-text-primary"
                                >
                                    آدرس
                                </Label>

                                <input
                                    id="address"
                                    name="address"
                                    required
                                    value={
                                        formData.address
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="تهران، ..."
                                    className="w-full mb-5 resize-none rounded-xl border border-brand-border/80 bg-brand-base/45 px-4 py-3 text-right text-sm text-brand-text-primary shadow-inner shadow-black/10 outline-none transition-all duration-300 placeholder:text-brand-text-secondary/70 hover:border-silver-dark/70 focus:border-silver-light/70 focus:bg-brand-surface/75 focus:ring-2 focus:ring-silver-light/25"
                                />

                                <BusinessLogoUploader
                                    value={
                                        formData.business_logo
                                    }
                                    onChange={
                                        handleBusinessLogoChange
                                    }
                                />
                            </div>

                            {/* <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-100">
                                مرجع ثبت‌نام:{" "}
                                <span className="font-semibold">
                                    {sponsorName}
                                </span>
                            </div> */}
                        </>
                    )}

                    <div
                        className={
                            step === 2
                                ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                                : "mt-8!"
                        }
                    >
                        {step === 2 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleBack}
                                className="w-full cursor-pointer"
                            >
                                بازگشت
                            </Button>
                        ) : null}

                        <Button
                            type="submit"
                            className="group/btn relative w-full cursor-pointer overflow-hidden text-white"
                            disabled={
                                registerMutation.isPending ||
                                submitLockRef.current
                            }
                        >
                            {registerMutation.isPending
                                ? "در حال ثبت‌نام..."
                                : step === 1
                                    ? "مرحله بعد"
                                    : "ثبت‌نام"}
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
                        <div className="animate-pulse text-silver-light">
                            در حال بارگذاری...
                        </div>
                    </Card>
                </div>
            }
        >
            <RegisterPageContent />
        </Suspense>
    );
}
