import type { AuthBusinessProfile } from "@/types/api/auth";

export function getPendingUrl(profile: AuthBusinessProfile): string {
    const params = new URLSearchParams({
        business_handler: profile.business_handler ?? "",
        business_name: profile.business_name ?? "",
    });

    return `/pending?${params.toString()}`;
}

export function getPostAuthUrl(profile: AuthBusinessProfile): string {
    const role = String(profile.user?.role ?? "").toUpperCase();
    const status = String(profile.user?.status ?? "").toUpperCase();

    if (role === "MASTER" || status === "APPROVED") {
        return "/";
    }

    return getPendingUrl(profile);
}
