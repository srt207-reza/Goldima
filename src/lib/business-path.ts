export function normalizeBusinessPathSegment(value: string | undefined | null): string {
    const raw = (value ?? "").trim().toLowerCase();

    if (!raw) {
        return "";
    }

    const slug = raw
        .replace(/\s+/g, "-")
        .replace(/[^\p{L}\p{N}_-]+/gu, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug || encodeURIComponent(raw);
}

export function buildBusinessUrl(value: string | undefined | null): string {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "https://goldima.liara.run").replace(/\/$/, "");
    const segment = normalizeBusinessPathSegment(value);
    return segment ? `${baseUrl}/${segment}` : baseUrl;
}
