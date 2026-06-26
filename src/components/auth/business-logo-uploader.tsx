"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateLogoFile(file: File): string | null {
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
        return "فرمت لوگو باید PNG، JPG، WEBP یا SVG باشد.";
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
        return "حجم لوگو نباید بیشتر از ۲ مگابایت باشد.";
    }

    return null;
}

export function BusinessLogoUploader({
    value,
    onChange,
}: {
    value: File | null;
    onChange: (file: File | null) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        let objectUrl = "";

        const frameId = requestAnimationFrame(() => {
            objectUrl = value ? URL.createObjectURL(value) : "";
            setPreviewUrl(objectUrl);
        });

        return () => {
            cancelAnimationFrame(frameId);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [value]);

    const selectFile = (file?: File | null) => {
        if (!file) return;

        const error = validateLogoFile(file);
        if (error) {
            toast.error(error);
            return;
        }

        onChange(file);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        selectFile(event.dataTransfer.files?.[0]);
    };

    return (
        <div className="group/input md:col-span-2">
            <Label className="mb-2 block text-right text-brand-text-primary">لوگوی فروشگاه</Label>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(event) => {
                    selectFile(event.target.files?.[0]);
                    event.target.value = "";
                }}
            />

            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={[
                    "relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-4 text-right transition-all duration-300",
                    isDragging
                        ? "border-silver-light bg-silver-light/10 shadow-silver-glow"
                        : "border-silver-dark/30 bg-brand-base/40 hover:border-silver-light/40 hover:bg-brand-hover/40",
                ].join(" ")}
            >
                <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-silver-light/20 bg-silver-light/10 text-silver-light">
                        {previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewUrl} alt="پیش‌نمایش لوگوی فروشگاه" className="h-full w-full object-cover" />
                        ) : (
                            <ImagePlus className="h-6 w-6" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-brand-text-primary">
                            {value ? value.name : "انتخاب یا رها کردن لوگو"}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-brand-text-secondary">
                            PNG، JPG، WEBP یا SVG تا ۲ مگابایت
                            {value ? ` - ${formatFileSize(value.size)}` : ""}
                        </p>
                    </div>

                    {value ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onChange(null);
                            }}
                            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-100 transition hover:bg-rose-400/15"
                            aria-label="حذف لوگوی فروشگاه"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    ) : (
                        <UploadCloud className="h-5 w-5 shrink-0 text-silver-light" />
                    )}
                </div>
            </div>
        </div>
    );
}
