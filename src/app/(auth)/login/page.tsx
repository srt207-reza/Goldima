"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Suspense,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
} from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ShineBorder } from "@/components/ui/shine-border";

import {
    useParentBusinessProfileQuery,
    useSendPhoneOtpMutation,
} from "@/hooks/api";

import {
    DEFAULT_PARENT_BUSINESS_HANDLER,
    getReadableBusinessHandler,
    normalizeBusinessPathSegment,
} from "@/lib/business-path";

import { resolveMediaUrl } from "@/lib/media-url";
import { normalizeMobileUsername } from "@/services/api/auth";

import LOGO from "@/../public/assets/images/logo.png";

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
const toEnglishDigits = (value: string): string => {
    return value
        .replace(/[۰-۹]/g, (digit) =>
            String(digit.charCodeAt(0) - "۰".charCodeAt(0))
        )
        .replace(/[٠-٩]/g, (digit) =>
            String(digit.charCodeAt(0) - "٠".charCodeAt(0))
        );
};

/**
 * تبدیل ارقام انگلیسی به فارسی
 */
const toPersianDigits = (value: string): string => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

    return value.replace(/[0-9]/g, (digit) => {
        return persianDigits[Number(digit)];
    });
};

/**
 * حذف تمام کاراکترهای غیرعددی و نمایش ارقام به‌صورت فارسی
 */
const sanitizeMobileInput = (value: string): string => {
    const englishValue = toEnglishDigits(value);

    const digitsOnly = englishValue
        .replace(/\D/g, "")
        .slice(0, 11);

    return toPersianDigits(digitsOnly);
};

/**
 * کلیدهای کنترلی مجاز در Input
 */
const ALLOWED_PHONE_KEYS = new Set([
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Tab",
    "Enter",
]);

const LogoIcon = ({
    logoUrl,
    name,
}: {
    logoUrl?: string;
    name: string;
}) => (
    <div className="group relative h-32 w-32">
        {logoUrl ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-3xl border border-silver-light/20 bg-brand-base/60 shadow-silver-glow transition-transform duration-700 group-hover:scale-105">
                <img
                    src={logoUrl}
                    alt={name}
                    className="h-full w-full object-contain p-4"
                />
            </div>
        ) : (
            <div className="relative h-32 w-32 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                <Image
                    src={LOGO}
                    alt="GOLDIMA Logo"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                />
            </div>
        )}
    </div>
);

const FloatingParticles = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
            className="absolute left-10 top-20 h-2 w-2 animate-float rounded-full bg-silver-light/30"
            style={{ animationDelay: "0s" }}
        />

        <div
            className="absolute right-20 top-40 h-3 w-3 animate-float rounded-full bg-silver-metallic/20"
            style={{ animationDelay: "2s" }}
        />

        <div
            className="absolute bottom-32 left-1/4 h-2 w-2 animate-float rounded-full bg-silver-light/40"
            style={{ animationDelay: "4s" }}
        />

        <div
            className="absolute right-1/3 top-1/3 h-1 w-1 animate-float rounded-full bg-silver-dark/30"
            style={{ animationDelay: "1s" }}
        />

        <div
            className="absolute bottom-20 right-10 h-2 w-2 animate-float rounded-full bg-silver-light/25"
            style={{ animationDelay: "3s" }}
        />
    </div>
);

function OrganizationNotFound({
    businessHandler,
}: {
    businessHandler: string;
}) {
    const readableBusinessHandler =
        getReadableBusinessHandler(businessHandler);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4">
            <AmbientBackground dense />

            <FloatingParticles />

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
                    ورود با Goldima
                </Link>
            </Card>
        </div>
    );
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();

    const sendOtpMutation = useSendPhoneOtpMutation();

    const parentBusinessHandler = useMemo(() => {
        const params = new URLSearchParams(searchKey);

        return (
            normalizeBusinessPathSegment(
                params.get("business_handler") ||
                    DEFAULT_PARENT_BUSINESS_HANDLER
            ) || DEFAULT_PARENT_BUSINESS_HANDLER
        );
    }, [searchKey]);

    const usernameFromQuery = useMemo(() => {
        const params = new URLSearchParams(searchKey);

        const normalizedValue = normalizeMobileUsername(
            params.get("username") || ""
        );

        return sanitizeMobileInput(normalizedValue);
    }, [searchKey]);

    /*
     * مقدار state با ارقام فارسی نگهداری می‌شود
     * تا در Input همیشه فارسی نمایش داده شود.
     */
    const [username, setUsername] = useState(usernameFromQuery);

    const parentProfileQuery =
        useParentBusinessProfileQuery(parentBusinessHandler);

    const isLinkedToParent =
        parentBusinessHandler !== DEFAULT_PARENT_BUSINESS_HANDLER;

    const sponsorName =
        parentProfileQuery.data?.business_name ||
        (isLinkedToParent
            ? getReadableBusinessHandler(parentBusinessHandler)
            : "GOLDIMA");

    const sponsorLogoUrl = useMemo(
        () =>
            resolveMediaUrl(
                parentProfileQuery.data?.business_logo
            ),
        [parentProfileQuery.data?.business_logo]
    );

    /*
     * مقدار ارسالی به API به ارقام انگلیسی تبدیل می‌شود.
     */
    const normalizedUsername = useMemo(() => {
        return normalizeMobileUsername(
            toEnglishDigits(username)
        );
    }, [username]);

    useEffect(() => {
        setUsername(usernameFromQuery);
    }, [usernameFromQuery]);

    if (
        isLinkedToParent &&
        parentProfileQuery.isError
    ) {
        return (
            <OrganizationNotFound
                businessHandler={parentBusinessHandler}
            />
        );
    }

    const handleUsernameChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const sanitizedValue = sanitizeMobileInput(
            event.target.value
        );

        setUsername(sanitizedValue);
    };

    const handleUsernameKeyDown = (
        event: KeyboardEvent<HTMLInputElement>
    ) => {
        /*
         * عملیات‌هایی مثل Paste، Copy، Cut و Select All مجاز هستند.
         */
        if (
            event.ctrlKey ||
            event.metaKey
        ) {
            return;
        }

        if (ALLOWED_PHONE_KEYS.has(event.key)) {
            return;
        }

        /*
         * رقم انگلیسی، فارسی یا عربی مجاز است.
         */
        const isDigit = /^[0-9۰-۹٠-٩]$/.test(
            event.key
        );

        if (!isDigit) {
            event.preventDefault();
        }
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
            const response =
                await sendOtpMutation.mutateAsync({
                    phone_number: normalizedUsername,
                });

            const params = new URLSearchParams({
                username: normalizedUsername,
                business_handler:
                    parentBusinessHandler,
                flow: response.is_registered
                    ? "login"
                    : "register",
            });

            toast.success("کد تایید ارسال شد");

            router.replace(
                `/otp?${params.toString()}`
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "ارسال کد تایید با خطا مواجه شد";

            toast.error(message);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4">
            <AmbientBackground dense />

            <FloatingParticles />

            <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-silver-light/5 blur-3xl" />

            <div
                className="absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-silver-metallic/5 blur-3xl"
                style={{ animationDelay: "1s" }}
            />

            <Card className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-silver-glow">
                <ShineBorder className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-silver-light to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                <div className="mb-10 text-center">
                    <div className="flex justify-center">
                        <LogoIcon
                            logoUrl={sponsorLogoUrl}
                            name={sponsorName}
                        />
                    </div>

                    <h1 className="mb-2 text-4xl font-bold tracking-wider">
                        <span className="animate-pulse bg-gradient-to-l from-silver-light via-silver-metallic to-silver-light bg-clip-text text-transparent">
                            {parentProfileQuery.isFetching &&
                            isLinkedToParent
                                ? "در حال دریافت..."
                                : sponsorName}
                        </span>
                    </h1>

                    <p className="leading-relaxed text-brand-text-secondary">
                        ورود با شماره موبایل
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <div className="group/input">
                        <Label
                            htmlFor="username"
                            className="mb-2 block text-right text-brand-text-primary"
                        >
                            لطفاً شماره تلفن همراه را وارد
                            نمایید
                        </Label>

                        <Input
                            id="username"
                            name="username"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            required
                            value={username}
                            onChange={handleUsernameChange}
                            onKeyDown={handleUsernameKeyDown}
                            maxLength={11}
                            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                            dir="ltr"
                            className="transition-all duration-300 focus:scale-[1.02]"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="!mt-8 w-full cursor-pointer"
                        disabled={
                            sendOtpMutation.isPending
                        }
                    >
                        {sendOtpMutation.isPending
                            ? "در حال ارسال..."
                            : "دریافت کد تایید"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-base px-4">
                    <AmbientBackground dense />

                    <Card className="relative w-full max-w-md rounded-3xl border border-silver-dark/20 bg-brand-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
                        <div className="animate-pulse text-silver-light">
                            در حال بارگذاری...
                        </div>
                    </Card>
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}