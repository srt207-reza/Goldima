import type { UserStatus } from "@/types/api/user";
import type { NormalizedUserRole } from "@/lib/user-role";

export type AccountStatusView = "APPROVED" | "PENDING" | "SUSPENDED";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatusView, string> = {
    APPROVED: "فعال",
    PENDING: "در انتظار بررسی",
    SUSPENDED: "مسدود شده",
};

export const STORE_ROLE_LABELS: Record<NormalizedUserRole, string> = {
    reference: "مرجع",
    wholesale: "عمده‌فروش",
    retail: "خرده‌فروش",
    unknown: "نامشخص",
};

export const USER_ROLE_LABELS: Record<"MASTER" | "WHOLESALER" | "RETAIL", string> = {
    MASTER: "مرجع",
    WHOLESALER: "عمده‌فروش",
    RETAIL: "خرده‌فروش",
};

export const EMPLOYEE_POSITION_LABELS = ["مدیریت", "معاملات", "حوالجات", "حسابداری", "صندوق"] as const;

export type EmployeePositionLabel = (typeof EMPLOYEE_POSITION_LABELS)[number];

export function getAccountStatusView(status: unknown, isActive = true): AccountStatusView {
    if (!isActive) return "SUSPENDED";

    const normalizedStatus = String(status ?? "PENDING").toUpperCase();

    if (normalizedStatus === "APPROVED") return "APPROVED";
    if (normalizedStatus === "PENDING") return "PENDING";

    return "SUSPENDED";
}

export function getAccountStatusLabel(status: unknown, isActive = true): string {
    return ACCOUNT_STATUS_LABELS[getAccountStatusView(status, isActive)];
}

export function getStoreRoleLabel(role: NormalizedUserRole): string {
    return STORE_ROLE_LABELS[role] ?? STORE_ROLE_LABELS.unknown;
}

export function getApiUserRoleLabel(role: "MASTER" | "WHOLESALER" | "RETAIL" | string): string {
    if (role === "MASTER" || role === "WHOLESALER" || role === "RETAIL") {
        return USER_ROLE_LABELS[role];
    }

    return STORE_ROLE_LABELS.unknown;
}

export const ACCOUNT_STATUS_OPTIONS: Array<{ value: UserStatus; label: string; caption: string }> = [
    { value: "PENDING", label: ACCOUNT_STATUS_LABELS.PENDING, caption: "حساب در انتظار بررسی می‌ماند" },
    { value: "APPROVED", label: ACCOUNT_STATUS_LABELS.APPROVED, caption: "دسترسی حساب فعال می‌شود" },
    { value: "SUSPENDED", label: ACCOUNT_STATUS_LABELS.SUSPENDED, caption: "دسترسی حساب مسدود می‌شود" },
];
