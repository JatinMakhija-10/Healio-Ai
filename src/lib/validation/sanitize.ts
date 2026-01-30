/**
 * Input Sanitization Utilities
 * 
 * Functions for sanitizing and normalizing user input to prevent XSS, injection attacks,
 * and other security vulnerabilities. Following OWASP best practices.
 */

/**
 * Sanitize text by removing/escaping potentially dangerous content
 * Prevents XSS attacks by neutralizing HTML and script tags
 * 
 * @param text - Raw user input text
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // Trim whitespace
    let sanitized = text.trim();

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Escape HTML special characters for safe display
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    return sanitized;
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes directory navigation attempts and dangerous characters
 * 
 * @param filename - User-provided filename
 * @returns Safe filename
 */
export function sanitizeFileName(filename: string): string {
    if (!filename) return 'unnamed_file';

    // Remove path separators (both Unix and Windows)
    let sanitized = filename.replace(/[\/\\]/g, '_');

    // Remove path traversal attempts
    sanitized = sanitized.replace(/\.\./g, '_');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');

    // Remove or replace dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

    // Prevent hidden files
    if (sanitized.startsWith('.')) {
        sanitized = '_' + sanitized.substring(1);
    }

    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized === '_') {
        sanitized = 'unnamed_file';
    }

    // Limit length to prevent DoS
    const maxLength = 255;
    if (sanitized.length > maxLength) {
        const lastDot = sanitized.lastIndexOf('.');
        if (lastDot > 0) {
            const ext = sanitized.substring(lastDot);
            const name = sanitized.substring(0, lastDot);
            sanitized = name.substring(0, maxLength - ext.length) + ext;
        } else {
            sanitized = sanitized.substring(0, maxLength);
        }
    }

    return sanitized;
}

/**
 * Normalize whitespace in user input
 * Replaces multiple spaces, tabs, newlines with single spaces
 * 
 * @param text - Input text
 * @returns Normalized text
 */
export function normalizeWhitespace(text: string): string {
    if (!text) return '';

    return text
        .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
        .trim();
}

/**
 * Strip HTML tags from text
 * For plain text fields that should not contain any HTML
 * 
 * @param html - Text that may contain HTML
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
    if (!html) return '';

    return html
        .replace(/<[^>]*>/g, '')  // Remove all HTML tags
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
        .replace(/&[a-z]+;/gi, '')  // Remove other HTML entities
        .trim();
}

/**
 * Sanitize URL to prevent XSS through javascript: or data: protocols
 * 
 * @param url - User-provided URL
 * @returns Safe URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    const trimmed = url.trim().toLowerCase();

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
        if (trimmed.startsWith(protocol)) {
            return '';
        }
    }

    // Only allow http, https, mailto protocols
    if (!trimmed.startsWith('http://') &&
        !trimmed.startsWith('https://') &&
        !trimmed.startsWith('mailto:') &&
        !trimmed.startsWith('/') &&
        !trimmed.startsWith('#')) {
        return '';
    }

    return url.trim();
}

/**
 * Truncate text to a maximum length safely
 * Adds ellipsis if truncated
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;

    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Remove non-printable characters
 * 
 * @param text - Input text
 * @returns Text with only printable characters
 */
export function removeNonPrintable(text: string): string {
    if (!text) return '';

    // Keep only printable ASCII and common Unicode characters
    return text.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');
}

/**
 * Comprehensive sanitization for general user input
 * Combines multiple sanitization techniques
 * 
 * @param input - Raw user input
 * @param options - Sanitization options
 * @returns Fully sanitized input
 */
export function sanitizeInput(
    input: string,
    options: {
        stripHtml?: boolean;
        normalizeWhitespace?: boolean;
        maxLength?: number;
        removeNonPrintable?: boolean;
    } = {}
): string {
    if (!input) return '';

    let result = input;

    if (options.removeNonPrintable) {
        result = removeNonPrintable(result);
    }

    if (options.stripHtml) {
        result = stripHtml(result);
    } else {
        result = sanitizeText(result);
    }

    if (options.normalizeWhitespace) {
        result = normalizeWhitespace(result);
    }

    if (options.maxLength && result.length > options.maxLength) {
        result = truncateText(result, options.maxLength);
    }

    return result.trim();
}
