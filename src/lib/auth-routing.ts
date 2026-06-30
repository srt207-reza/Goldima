import type { AuthBusinessProfile } from "@/types/api/auth";

export const DEFAULT_SUSPENDED_REASON =
    "حساب کاربری شما تعلیق شده است. جهت بررسی علت و ادامه فعالیت با شماره پشتیبانی تماس بگیرید.";

type SuspendedUrlParams = {
    businessHandler?: string | null;
    businessName?: string | null;
    parentBusinessHandler?: string | null;
    reason?: string | null;
};

export function getSuspendedUrl({
    businessHandler,
    businessName,
    parentBusinessHandler,
    reason,
}: SuspendedUrlParams = {}): string {
    const params = new URLSearchParams();

    if (businessHandler) {
        params.set("business_handler", businessHandler);
    }

    if (businessName) {
        params.set("business_name", businessName);
    }

    if (parentBusinessHandler) {
        params.set("parent_business_handler", parentBusinessHandler);
    }

    if (reason?.trim()) {
        params.set("reason", reason.trim());
    }

    return `/suspended${params.size ? `?${params.toString()}` : ""}`;
}

export function getSuspendedUrlFromProfile(
    profile: AuthBusinessProfile,
    parentBusinessHandler?: string
): string {
    return getSuspendedUrl({
        businessHandler: profile.business_handler,
        businessName: profile.business_name,
        parentBusinessHandler,
        reason: profile.user?.suspend_reason ?? DEFAULT_SUSPENDED_REASON,
    });
}

export function getPendingUrl(profile: AuthBusinessProfile, parentBusinessHandler?: string): string {
    const isActive = profile.is_active !== false && profile.user?.is_active !== false;
    const status = isActive ? String(profile.user?.status ?? "PENDING").toUpperCase() : "SUSPENDED";

    if (status === "SUSPENDED") {
        return getSuspendedUrlFromProfile(profile, parentBusinessHandler);
    }

    const params = new URLSearchParams({
        business_handler: profile.business_handler ?? "",
        business_name: profile.business_name ?? "",
        status,
    });

    if (parentBusinessHandler) {
        params.set("parent_business_handler", parentBusinessHandler);
    }

    if (profile.user?.suspend_reason) {
        params.set("suspend_reason", profile.user.suspend_reason);
    }

    return `/pending?${params.toString()}`;
}

export function getPostAuthUrl(profile: AuthBusinessProfile, parentBusinessHandler?: string): string {
    const status = String(profile.user?.status ?? "").toUpperCase();
    const isActive = profile.is_active !== false && profile.user?.is_active !== false;

    if (status === "APPROVED" && isActive) {
        return "/";
    }

    if (status === "SUSPENDED" || !isActive) {
        return getSuspendedUrlFromProfile(profile, parentBusinessHandler);
    }

    return getPendingUrl(profile, parentBusinessHandler);
}
