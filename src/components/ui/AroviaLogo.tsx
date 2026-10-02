import Image from "next/image";

/**
 * AroviaLogo — renders the V1 brand mark (icon only, horizontal, or icon + text wordmark).
 *
 * Variants:
 *  - "icon"       → square mark (the leaf/person/sun symbol)
 *  - "horizontal" → full horizontal lockup (icon + "arovia.ai" typography)
 *  - "wordmark"   → typography only ("arovia.ai" text)
 *
 * The `size` prop controls the height of the logo in pixels; width is auto-scaled.
 * For dark backgrounds pass `dark={true}` to invert the icon where needed.
 */
interface AroviaLogoProps {
    variant?: "icon" | "horizontal" | "wordmark";
    size?: number;
    className?: string;
    /** If true, renders the cream-background icon variant for dark backgrounds */
    dark?: boolean;
    priority?: boolean;
}

export function AroviaLogo({
    variant = "icon",
    size = 36,
    className = "",
    dark = false,
    priority = false,
}: AroviaLogoProps) {
    if (variant === "horizontal") {
        return (
            <Image
                src="/logo-horizontal.png"
                alt="Arovia.AI"
                height={size}
                width={size * 3.2}
                className={`object-contain ${className}`}
                priority={priority}
            />
        );
    }

    if (variant === "wordmark") {
        return (
            <Image
                src="/logo-typography.png"
                alt="Arovia.AI"
                height={size}
                width={size * 3}
                className={`object-contain ${className}`}
                priority={priority}
            />
        );
    }

    // "icon" variant — the square mark
    return (
        <Image
            src="/logo-icon.png"
            alt="Arovia.AI"
            height={size}
            width={size}
            className={`object-contain rounded-xl ${dark ? "bg-transparent" : ""} ${className}`}
            priority={priority}
        />
    );
}
