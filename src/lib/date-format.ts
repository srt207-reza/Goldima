export function toDisplayDate(value?: string | null): string {
    return value ? value.replace(/-/g, "/") : "";
}

export function toApiDate(value?: string | null): string {
    return value ? value.replace(/[/.]/g, "-") : "";
}

export function toPersianDisplayDate(value?: string | null): string {
    if (!value) {
        return "";
    }

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnlyMatch
        ? new Date(Date.UTC(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])))
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.replace(/-/g, "/");
    }

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Tehran",
    }).format(date);
}
