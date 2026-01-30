"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserSymptomData } from "@/lib/diagnosis/types";
import { Info, AlertCircle } from "lucide-react";
import { SymptomDataSchema } from "@/lib/validation/schemas";
import { sanitizeInput } from "@/lib/validation/sanitize";
import { debounce } from "@/lib/utils/rateLimiter";
import { z } from "zod";

interface IntakeCardProps {
    onSubmit: (data: UserSymptomData) => void;
}

export function IntakeCard({ onSubmit }: IntakeCardProps) {
    const [location, setLocation] = useState("");
    const [intensity, setIntensity] = useState([0]);
    const [painType, setPainType] = useState("");
    const [duration, setDuration] = useState("");
    const [whenStarted, setWhenStarted] = useState("");
    const [frequency, setFrequency] = useState("");
    const [triggers, setTriggers] = useState("");
    const [relievers, setRelievers] = useState("");
    const [radiation, setRadiation] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = debounce(() => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            // Build comprehensive symptom data with sanitization
            const notes = [
                whenStarted && `Started: ${sanitizeInput(whenStarted, { stripHtml: true, maxLength: 100 })}`,
                triggers && `Worse with: ${sanitizeInput(triggers, { stripHtml: true, maxLength: 200 })}`,
                relievers && `Better with: ${sanitizeInput(relievers, { stripHtml: true, maxLength: 200 })}`,
                radiation && `Radiates to: ${sanitizeInput(radiation, { stripHtml: true, maxLength: 200 })}`,
                additionalNotes && sanitizeInput(additionalNotes, { stripHtml: true, maxLength: 500 })
            ].filter(Boolean).join(". ");

            const rawData = {
                location: [sanitizeInput(location, { stripHtml: true, normalizeWhitespace: true, maxLength: 200 })],
                intensity: intensity[0],
                painType: painType,
                duration: duration,
                triggers: sanitizeInput(triggers, { stripHtml: true, maxLength: 1000 }),
                frequency: sanitizeInput(frequency, { stripHtml: true, maxLength: 500 }),
                additionalNotes: notes
            };

            // Validate with Zod schema
            const validatedData = SymptomDataSchema.parse(rawData);

            // Submit validated and sanitized data
            onSubmit(validatedData as UserSymptomData);
        } catch (error) {
            // Handle validation errors
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.issues.forEach((err: z.ZodIssue) => {
                    const path = err.path.join('.');
                    fieldErrors[path] = err.message;
                });
                setErrors(fieldErrors);
            } else {
                console.error('Submission error:', error);
                setErrors({ general: 'An error occurred. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    }, 500); // Debounce to prevent double-clicks

    const getPainLabel = (value: number) => {
        if (value === 0) return "No pain";
        if (value <= 3) return "Mild";
        if (value <= 6) return "Moderate";
        if (value <= 8) return "Severe";
        return "Worst possible";
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-slate-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-xl text-slate-800">New Consultation</CardTitle>
                <CardDescription>
                    Please answer the following questions to help us understand your symptoms better.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="location" className="text-base font-medium">
                        Where is your pain or discomfort? *
                    </Label>
                    <Input
                        id="location"
                        placeholder="e.g. Lower Back, Head, Right Knee, Stomach"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="text-base"
                    />
                </div>

                {/* Pain Intensity */}
                <div className="space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <Label className="text-base font-medium">Current Pain Intensity *</Label>
                            <p className="text-xs text-slate-500">
                                How would you rate the intensity of your pain on a scale from 0 to 10, where 0 is no pain and 10 is the worst pain you can imagine?
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-2xl text-teal-600">{intensity[0]}</div>
                            <div className="text-xs text-slate-500">{getPainLabel(intensity[0])}</div>
                        </div>
                    </div>
                    <Slider
                        value={intensity}
                        onValueChange={setIntensity}
                        min={0}
                        max={10}
                        step={1}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                        <span>0 - No pain</span>
                        <span>5 - Moderate</span>
                        <span>10 - Worst Possible</span>
                    </div>
                </div>

                {/* Pain Type */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">What does it feel like? *</Label>
                    <Select value={painType} onValueChange={setPainType}>
                        <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select the type of sensation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aching">Aching / Dull</SelectItem>
                            <SelectItem value="sharp">Sharp / Stabbing</SelectItem>
                            <SelectItem value="throbbing">Throbbing / Pulsating</SelectItem>
                            <SelectItem value="burning">Burning</SelectItem>
                            <SelectItem value="stiff">Stiff / Tight</SelectItem>
                            <SelectItem value="shooting">Shooting / Electric</SelectItem>
                            <SelectItem value="cramping">Cramping</SelectItem>
                            <SelectItem value="numb">Numb / Tingling</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Duration - Enhanced */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">How long have you had this? *</Label>
                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hours">Just started (Few hours)</SelectItem>
                            <SelectItem value="1-3days">1-3 days</SelectItem>
                            <SelectItem value="4-7days">4-7 days</SelectItem>
                            <SelectItem value="1-2weeks">1-2 weeks</SelectItem>
                            <SelectItem value="2weeks-1month">2 weeks - 1 month</SelectItem>
                            <SelectItem value="1-3months">1-3 months</SelectItem>
                            <SelectItem value="3-6months">3-6 months</SelectItem>
                            <SelectItem value="6months+">More than 6 months</SelectItem>
                            <SelectItem value="chronic">Chronic (years)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* When it started */}
                <div className="space-y-2">
                    <Label htmlFor="when" className="text-base font-medium">
                        How did it start?
                    </Label>
                    <Select value={whenStarted} onValueChange={setWhenStarted}>
                        <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select onset type (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="suddenly">Suddenly / Acute onset</SelectItem>
                            <SelectItem value="gradually">Gradually over time</SelectItem>
                            <SelectItem value="after-injury">After an injury</SelectItem>
                            <SelectItem value="after-activity">After physical activity</SelectItem>
                            <SelectItem value="woke-up">Woke up with it</SelectItem>
                            <SelectItem value="unknown">Don&apos;t remember</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">How often does it occur?</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select frequency (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="constant">Constant (Always there)</SelectItem>
                            <SelectItem value="intermittent">Comes and goes</SelectItem>
                            <SelectItem value="morning">Mainly in the morning</SelectItem>
                            <SelectItem value="evening">Mainly in the evening</SelectItem>
                            <SelectItem value="night">Mainly at night</SelectItem>
                            <SelectItem value="activity">Only with certain activities</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* What makes it worse */}
                <div className="space-y-2">
                    <Label htmlFor="triggers" className="text-base font-medium">
                        What makes it worse?
                    </Label>
                    <Input
                        id="triggers"
                        placeholder="e.g. Movement, sitting, bending, coughing"
                        value={triggers}
                        onChange={(e) => setTriggers(e.target.value)}
                    />
                </div>

                {/* What makes it better */}
                <div className="space-y-2">
                    <Label htmlFor="relievers" className="text-base font-medium">
                        What makes it better?
                    </Label>
                    <Input
                        id="relievers"
                        placeholder="e.g. Rest, heat, medication"
                        value={relievers}
                        onChange={(e) => setRelievers(e.target.value)}
                    />
                </div>

                {/* Does it radiate */}
                <div className="space-y-2">
                    <Label htmlFor="radiation" className="text-base font-medium">
                        Does it spread anywhere else?
                    </Label>
                    <Input
                        id="radiation"
                        placeholder="e.g. Down my leg, to my shoulder"
                        value={radiation}
                        onChange={(e) => setRadiation(e.target.value)}
                    />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes" className="text-base font-medium">
                        Any other symptoms or details?
                    </Label>
                    <Textarea
                        id="notes"
                        placeholder="e.g. Fever, nausea, recent changes..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm text-blue-800">
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>
                        The more details you provide, the better we can understand your condition and provide accurate recommendations.
                    </p>
                </div>

                {/* Error messages */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm text-red-800">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium mb-1">Please correct the following errors:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.entries(errors).map(([field, message]) => (
                                    <li key={field}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={!location || !painType || !duration || isSubmitting}
                >
                    {isSubmitting ? 'Validating...' : 'Start Diagnosis'}
                </Button>
            </CardContent>
        </Card>
    );
}
