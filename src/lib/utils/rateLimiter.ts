/**
 * Client-Side Rate Limiting Utilities
 * 
 * Implements client-side request throttling and debouncing to prevent
 * abuse and reduce unnecessary server load. This is a UX enhancement
 * and NOT a replacement for server-side rate limiting.
 */

/**
 * Simple in-memory rate limiter using timestamps
 * Tracks request counts within time windows
 */
class ClientRateLimiter {
    private requests: Map<string, number[]> = new Map();

    /**
     * Check if an action is allowed within the rate limit
     * 
     * @param key - Unique identifier for the action (e.g., 'submit-form', 'api-call')
     * @param maxRequests - Maximum number of requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns true if allowed, false if rate limit exceeded
     */
    isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];

        // Remove timestamps outside the current window
        const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

        // Check if limit is exceeded
        if (validTimestamps.length >= maxRequests) {
            return false;
        }

        // Add current timestamp
        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);

        return true;
    }

    /**
     * Get remaining requests in current window
     */
    getRemaining(key: string, maxRequests: number, windowMs: number): number {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

        return Math.max(0, maxRequests - validTimestamps.length);
    }

    /**
     * Reset rate limit for a specific key
     */
    reset(key: string): void {
        this.requests.delete(key);
    }

    /**
     * Clear all rate limit data
     */
    clearAll(): void {
        this.requests.clear();
    }
}

// Global rate limiter instance
const rateLimiter = new ClientRateLimiter();

/**
 * Throttle function execution
 * Ensures function is called at most once per specified interval
 * 
 * @param func - Function to throttle
 * @param limitMs - Minimum milliseconds between calls
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limitMs: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    return function (this: any, ...args: Parameters<T>) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        if (timeSinceLastCall >= limitMs) {
            lastCall = now;
            func.apply(this, args);
        } else {
            // Schedule for later if not already scheduled
            if (!timeoutId) {
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    func.apply(this, args);
                    timeoutId = null;
                }, limitMs - timeSinceLastCall);
            }
        }
    };
}

/**
 * Debounce function execution
 * Delays execution until after specified time has elapsed since last call
 * 
 * @param func - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delayMs: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return function (this: any, ...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delayMs);
    };
}

/**
 * Check if a request is allowed within rate limits
 * Use this before making API calls or submitting forms
 * 
 * @param actionKey - Unique key for the action type
 * @param maxRequests - Maximum requests allowed (default: 10)
 * @param windowMs - Time window in ms (default: 60000 = 1 minute)
 * @returns Object with allowed status and remaining count
 */
export function checkRateLimit(
    actionKey: string,
    maxRequests: number = 10,
    windowMs: number = 60000
): { allowed: boolean; remaining: number } {
    const allowed = rateLimiter.isAllowed(actionKey, maxRequests, windowMs);
    const remaining = rateLimiter.getRemaining(actionKey, maxRequests, windowMs);

    return { allowed, remaining };
}

/**
 * Reset rate limit for a specific action
 * Useful when user logs out or clears session
 */
export function resetRateLimit(actionKey: string): void {
    rateLimiter.reset(actionKey);
}

/**
 * Wrapper for rate-limited async functions
 * Automatically checks rate limit before executing
 * 
 * @param func - Async function to rate limit
 * @param options - Rate limit configuration
 * @returns Rate-limited function
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
    func: T,
    options: {
        key: string;
        maxRequests?: number;
        windowMs?: number;
        onLimitExceeded?: () => void;
    }
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
    const { key, maxRequests = 10, windowMs = 60000, onLimitExceeded } = options;

    return async function (this: any, ...args: Parameters<T>): Promise<ReturnType<T> | null> {
        const { allowed } = checkRateLimit(key, maxRequests, windowMs);

        if (!allowed) {
            console.warn(`Rate limit exceeded for action: ${key}`);
            if (onLimitExceeded) {
                onLimitExceeded();
            }
            return null;
        }

        return func.apply(this, args);
    };
}

/**
 * Create a rate-limited version of a function with localStorage persistence
 * Survives page refreshes (use sparingly for security-critical actions)
 * 
 * @param key - Unique storage key
 * @param maxRequests - Maximum requests
 * @param windowMs - Time window
 * @returns Check function
 */
export function createPersistentRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): () => boolean {
    const storageKey = `rate_limit_${key}`;

    return function (): boolean {
        try {
            const now = Date.now();
            const stored = localStorage.getItem(storageKey);
            const timestamps: number[] = stored ? JSON.parse(stored) : [];

            // Remove old timestamps
            const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

            // Check limit
            if (validTimestamps.length >= maxRequests) {
                return false;
            }

            // Add current timestamp
            validTimestamps.push(now);
            localStorage.setItem(storageKey, JSON.stringify(validTimestamps));

            return true;
        } catch (error) {
            // If localStorage fails, allow the action
            console.error('Rate limit storage error:', error);
            return true;
        }
    };
}

// Export the rate limiter instance for advanced usage
export { rateLimiter };
