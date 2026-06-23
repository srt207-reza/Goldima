export const DEFAULT_PARENT_BUSINESS_HANDLER = "noros";

function decodeHexUtf8(value: string): string | null {
    const compact = value.trim();

    if (!/^(?:[a-f0-9]{2})+$/i.test(compact) || compact.length < 4) {
        return null;
    }

    try {
        const bytes = compact.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];
        const decoded = new TextDecoder().decode(new Uint8Array(bytes)).trim();

        if (!decoded || decoded.includes("\uFFFD") || /[\u0000-\u001F\u007F]/.test(decoded) || !/[\u0600-\u06FF]/.test(decoded)) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

export function getReadableBusinessHandler(value: string | undefined | null): string {
    const raw = (value ?? "").trim();

    if (!raw) {
        return "";
    }

    let decoded = raw;

    try {
        decoded = decodeURIComponent(raw);
    } catch {
        decoded = raw;
    }

    return decodeHexUtf8(decoded) ?? decoded;
}

export function normalizeBusinessPathSegment(value: string | undefined | null): string {
    const raw = getReadableBusinessHandler(value).trim().toLowerCase();

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
    const baseUrl = (location.origin).replace(/\/$/, "");
    const segment = normalizeBusinessPathSegment(getReadableBusinessHandler(value));
    return segment ? `${baseUrl}/${segment}` : baseUrl;
}
