export function toDisplayDate(value?: string | null): string {
    return value ? value.replace(/-/g, "/") : "";
}

export function toApiDate(value?: string | null): string {
    return value ? value.replace(/[/.]/g, "-") : "";
}
