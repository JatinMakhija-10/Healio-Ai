"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ONBOARDING_PRAKRITI_QUESTIONS } from "@/lib/ayurveda/prakriti/onboardingQuestions";
import { Loader2, ArrowLeft, Leaf, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PrakritiAssessmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, 'vata' | 'pitta' | 'kapha'>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Load existing answers? Maybe later. For now, fresh start.

    const handleOptionSelect = (questionId: string, value: 'vata' | 'pitta' | 'kapha') => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const calculatePrakritiLocal = (answers: Record<string, 'vata' | 'pitta' | 'kapha'>) => {
        let vata = 0, pitta = 0, kapha = 0;
        Object.values(answers).forEach(dosha => {
            if (dosha === 'vata') vata++;
            if (dosha === 'pitta') pitta++;
            if (dosha === 'kapha') kapha++;
        });
        const total = vata + pitta + kapha || 1;

        let primary = "Tridoshic";
        if (vata > pitta && vata > kapha) primary = "Vata";
        else if (pitta > vata && pitta > kapha) primary = "Pitta";
        else if (kapha > vata && kapha > pitta) primary = "Kapha";
        else if (vata === pitta && vata > kapha) primary = "Vata-Pitta";
        else if (pitta === kapha && pitta > vata) primary = "Pitta-Kapha";
        else if (vata === kapha && vata > pitta) primary = "Vata-Kapha";

        return {
            prakriti: primary,
            breakdown: {
                vata: Math.round((vata / total) * 100),
                pitta: Math.round((pitta / total) * 100),
                kapha: Math.round((kapha / total) * 100)
            }
        };
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < ONBOARDING_PRAKRITI_QUESTIONS.length) return;
        setIsSubmitting(true);

        const result = calculatePrakritiLocal(answers);

        // Update Local Storage
        const pendingProfile = localStorage.getItem('healio_pending_profile');
        if (pendingProfile) {
            const profile = JSON.parse(pendingProfile);
            profile.ayurvedic_profile = { ...profile.ayurvedic_profile, ...result };
            localStorage.setItem('healio_pending_profile', JSON.stringify(profile));
        }

        // Update Supabase
        if (user) {
            const { error } = await supabase.auth.updateUser({
                data: {
                    ayurvedic_profile: result
                }
            });
            if (error) console.error("Error updating profile:", error);
        }

        setIsSubmitting(false);
        setIsComplete(true);
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
    };

    if (isComplete) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-teal-100"
                >
                    <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Completed!</h2>
                    <p className="text-slate-500">Your Prakriti has been analyzed. Redirecting to dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-teal-600" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex p-3 bg-teal-100 text-teal-700 rounded-xl mb-4">
                        <Leaf className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Discover Your Prakriti</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Answer these questions based on your lifelong patterns, not just how you feel today.
                    </p>
                </div>

                <div className="space-y-6">
                    {ONBOARDING_PRAKRITI_QUESTIONS.map((q, idx) => (
                        <Card key={q.id} className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg font-medium text-slate-900 flex gap-3">
                                    <span className="text-teal-500 font-bold opacity-50">#{idx + 1}</span>
                                    {q.question}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <RadioGroup
                                    value={answers[q.id] || ""}
                                    onValueChange={(val: any) => handleOptionSelect(q.id, val)}
                                    className="space-y-3"
                                >
                                    {q.options.map((opt) => (
                                        <div key={opt.dosha} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${answers[q.id] === opt.dosha ? "bg-teal-50 border-teal-200" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                                            <RadioGroupItem value={opt.dosha} id={`${q.id}-${opt.dosha}`} className="text-teal-600" />
                                            <Label htmlFor={`${q.id}-${opt.dosha}`} className="flex-1 cursor-pointer font-normal text-slate-700">
                                                {opt.text}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="sticky bottom-4 bg-white/80 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-slate-200 mt-8 flex justify-between items-center">
                    <p className="text-sm text-slate-500 font-medium">
                        {Object.keys(answers).length} / {ONBOARDING_PRAKRITI_QUESTIONS.length} Answered
                    </p>
                    <Button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length < ONBOARDING_PRAKRITI_QUESTIONS.length || isSubmitting}
                        className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px] shadow-lg shadow-teal-600/20"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            "Save Profile"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
