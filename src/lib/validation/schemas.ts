/**
 * Input Validation Schemas
 * 
 * Zod schemas for validating and sanitizing all user inputs across the application.
 * Following OWASP best practices for input validation.
 */

import { z } from 'zod';

// ==========================
// Symptom Data Validation
// ==========================

/**
 * Schema for symptom intake form data
 * Validates all user inputs from IntakeCard component
 */
export const SymptomDataSchema = z.object({
    location: z.array(
        z.string()
            .min(1, "Location is required")
            .max(200, "Location description is too long")
            .regex(
                /^[a-zA-Z0-9\s\-,.'()]+$/,
                "Location contains invalid characters"
            )
    ).min(1, "At least one location is required"),

    intensity: z.number()
        .min(0, "Intensity must be at least 0")
        .max(10, "Intensity cannot exceed 10")
        .int("Intensity must be a whole number"),

    painType: z.enum([
        'aching', 'sharp', 'throbbing', 'burning',
        'stiff', 'shooting', 'cramping', 'numb'
    ]),

    duration: z.enum([
        'hours', '1-3days', '4-7days', '1-2weeks',
        '2weeks-1month', '1-3months', '3-6months',
        '6months+', 'chronic'
    ]),

    triggers: z.string()
        .max(1000, "Triggers description is too long")
        .optional()
        .transform(val => val?.trim()),

    frequency: z.string()
        .max(500, "Frequency description is too long")
        .optional()
        .transform(val => val?.trim()),

    additionalNotes: z.string()
        .max(2000, "Additional notes are too long")
        .optional()
        .transform(val => val?.trim())
});

export type ValidatedSymptomData = z.infer<typeof SymptomDataSchema>;

// ==========================
// Authentication Validation
// ==========================

/**
 * Email validation schema
 * RFC 5322 compliant with reasonable length limits
 */
export const EmailSchema = z.string()
    .min(1, "Email is required")
    .max(320, "Email is too long") // RFC 5321 maximum
    .email("Please enter a valid email address")
    .transform(val => val.toLowerCase().trim());

/**
 * Password validation schema
 * OWASP recommendations: minimum 8 chars, maximum to prevent DoS
 */
export const PasswordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );

/**
 * Login form validation
 */
export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, "Password is required") // Don't validate format on login
});

/**
 * Signup form validation
 */
export const SignupSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

// ==========================
// Chat & Messages Validation
// ==========================

/**
 * Chat message validation
 * Prevents XSS and excessively long messages
 */
export const ChatMessageSchema = z.string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long (max 2000 characters)")
    .transform(val => val.trim())
    .refine(
        val => !/<script|javascript:|onerror=|onclick=/i.test(val),
        "Message contains potentially unsafe content"
    );

// ==========================
// Profile Data Validation
// ==========================

/**
 * User profile update validation
 */
export const ProfileUpdateSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name is too long")
        .regex(
            /^[a-zA-Z\s\-'.]+$/,
            "Name contains invalid characters"
        )
        .optional(),

    age: z.number()
        .min(1, "Age must be at least 1")
        .max(120, "Please enter a valid age")
        .int("Age must be a whole number")
        .optional(),

    phone: z.string()
        .regex(
            /^[\d\s\-+()]*$/,
            "Phone number contains invalid characters"
        )
        .max(20, "Phone number is too long")
        .optional()
        .transform(val => val?.trim()),

    address: z.string()
        .max(500, "Address is too long")
        .optional()
        .transform(val => val?.trim())
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// ==========================
// Settings Validation
// ==========================

/**
 * Settings update validation
 */
export const SettingsSchema = z.object({
    ayurvedicMode: z.boolean().optional(),
    showUncertainty: z.boolean().optional(),
    detailedExplanations: z.boolean().optional(),
    notifications: z.boolean().optional()
});

export type SettingsInput = z.infer<typeof SettingsSchema>;

// ==========================
// Generic Text Input Validation
// ==========================

/**
 * Generic text field validation
 * Use for any user-provided text that doesn't have specific requirements
 */
export const SafeTextSchema = (maxLength: number = 1000) => z.string()
    .max(maxLength, `Text is too long (max ${maxLength} characters)`)
    .transform(val => val.trim())
    .refine(
        val => !/<script|javascript:|onerror=|onclick=/i.test(val),
        "Text contains potentially unsafe content"
    );

// ==========================
// File Upload Validation (Client-side)
// ==========================

/**
 * File validation schema for client-side checks
 * Note: Server-side validation is the primary defense
 */
export const FileUploadSchema = z.object({
    file: z.instanceof(File)
        .refine(file => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
        .refine(
            file => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
                return allowedTypes.includes(file.type);
            },
            "File type not allowed. Please upload JPG, PNG, GIF, or PDF"
        )
});
