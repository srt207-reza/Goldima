export function resolveMediaUrl(src?: string | null): string {
    if (!src) return "";
    if (/^(https?:|data:|blob:)/i.test(src)) return src;

    const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    if (!apiOrigin) return src;

    return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}
