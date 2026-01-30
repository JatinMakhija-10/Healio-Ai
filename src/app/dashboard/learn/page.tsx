"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sun, Moon, Utensils, Leaf, Heart, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LearnPage() {
    const [activeTab, setActiveTab] = useState("basics");

    return (
        <div className="space-y-6 max-w-4xl pb-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Ayurvedic Knowledge Base</h1>
                <p className="text-slate-500">Explore the ancient wisdom of holistic healing and balanced living.</p>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                    onClick={() => setActiveTab("basics")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all",
                        activeTab === "basics"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                    )}
                >
                    <BookOpen className="h-4 w-4" />
                    Understanding Doshas
                </button>
                <button
                    onClick={() => setActiveTab("routine")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all",
                        activeTab === "routine"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                    )}
                >
                    <Sun className="h-4 w-4" />
                    Daily Routine
                </button>
                <button
                    onClick={() => setActiveTab("diet")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all",
                        activeTab === "diet"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                    )}
                >
                    <Utensils className="h-4 w-4" />
                    Food as Medicine
                </button>
            </div>

            {/* --- BASICS TAB --- */}
            {activeTab === "basics" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-teal-700">The Tridosha Theory</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-slate max-w-none">
                            <p>
                                Ayurveda views the universe and the human body as being made up of five elements:
                                <strong>Ether (Space), Air, Fire, Water, and Earth</strong>. These elements combine to form
                                three biological energies called <strong>Doshas</strong>: Vata, Pitta, and Kapha.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6 mt-6 not-prose">
                                {/* VATA */}
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-700 font-semibold">
                                        <Leaf className="h-5 w-5" />
                                        <h3>Vata (Air + Ether)</h3>
                                    </div>
                                    <p className="text-sm text-slate-600">The energy of movement and creativity.</p>
                                    <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                                        <li><strong> Qualities:</strong> Light, cold, dry, rough, mobile.</li>
                                        <li><strong> Function:</strong> Breathing, circulation, nerve impulses.</li>
                                        <li><strong> In Balance:</strong> Creative, energetic, flexible.</li>
                                        <li><strong> Out of Balance:</strong> Anxious, fearful, constipated.</li>
                                    </ul>
                                </div>

                                {/* PITTA */}
                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 space-y-3">
                                    <div className="flex items-center gap-2 text-orange-700 font-semibold">
                                        <Sun className="h-5 w-5" />
                                        <h3>Pitta (Fire + Water)</h3>
                                    </div>
                                    <p className="text-sm text-slate-600">The energy of digestion and metabolism.</p>
                                    <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                                        <li><strong> Qualities:</strong> Hot, sharp, light, oily.</li>
                                        <li><strong> Function:</strong> Digestion, temperature, intelligence.</li>
                                        <li><strong> In Balance:</strong> Intelligent, decisive, warm.</li>
                                        <li><strong> Out of Balance:</strong> Angry, inflamed, critical.</li>
                                    </ul>
                                </div>

                                {/* KAPHA */}
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100 space-y-3">
                                    <div className="flex items-center gap-2 text-green-700 font-semibold">
                                        <Heart className="h-5 w-5" />
                                        <h3>Kapha (Earth + Water)</h3>
                                    </div>
                                    <p className="text-sm text-slate-600">The energy of structure and lubrication.</p>
                                    <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                                        <li><strong> Qualities:</strong> Heavy, cold, slow, stable, smooth.</li>
                                        <li><strong> Function:</strong> Structure, immunity, hydration.</li>
                                        <li><strong> In Balance:</strong> Calm, loving, strong, stable.</li>
                                        <li><strong> Out of Balance:</strong> Lethargic, attached, congested.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-teal-700">Prakriti vs. Vikriti</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-600">
                                <strong>Prakriti</strong> is your unique constitution determined at conception—your &quot;nature.&quot; It typically doesn&apos;t change throughout your life.
                            </p>
                            <p className="text-slate-600">
                                <strong>Vikriti</strong> is your current state of balance or imbalance. Health is achieved when your Vikriti returns to match your Prakriti.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-teal-600 mt-0.5" />
                                <p className="text-sm text-slate-600">
                                    Healio.AI helps you understand both: your <strong>Onboarding</strong> determines your Prakriti, while your <strong>Diagnosis</strong> sessions identify your current Vikriti symptoms.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- ROUTINE TAB --- */}
            {activeTab === "routine" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-teal-700">Dinacharya: The Daily Routine</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-slate-600">
                                In Ayurveda, a consistent daily routine aligns your biological clock with nature's rhythms, promoting optimal health and immunity.
                            </p>

                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-white border rounded-lg shadow-sm">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <Sun className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">Morning (Brahma Muhurta)</h3>
                                        <p className="text-sm text-slate-500 mb-2">Before 6:00 AM</p>
                                        <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                            <li>Wake up before sunrise for energy and clarity.</li>
                                            <li>Drink a glass of warm water to flush toxins.</li>
                                            <li>Scrape your tongue to remove overnight buildup (Ama).</li>
                                            <li>Gentle exercise or yoga followed by meditation.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-white border rounded-lg shadow-sm">
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <Utensils className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">Midday (Pitta Time)</h3>
                                        <p className="text-sm text-slate-500 mb-2">10:00 AM - 2:00 PM</p>
                                        <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                            <li>Eat your largest meal of the day around noon when digestion is strongest.</li>
                                            <li>Avoid strenuous exercise immediately after eating.</li>
                                            <li>Take a short restorative walk (100 steps) after lunch.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-white border rounded-lg shadow-sm">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Moon className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">Evening (Kapha Time)</h3>
                                        <p className="text-sm text-slate-500 mb-2">After 6:00 PM</p>
                                        <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                            <li>Eat a light dinner early (at least 3 hours before sleep).</li>
                                            <li>Avoid screens and stimulating activities after 9:00 PM.</li>
                                            <li>Be in bed by 10:00 PM (start of Pitta time) for cellular repair.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- DIET TAB --- */}
            {activeTab === "diet" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-teal-700">The Six Tastes (Shad Rasa)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-slate-600">
                                A balanced Ayurvedic meal includes all six tastes. Each taste has a specific effect on the Doshas and the body tissues.
                            </p>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium text-slate-900 mb-2">1. Sweet (Madhura)</h4>
                                    <p className="text-xs text-slate-500 mb-2">Earth + Water</p>
                                    <p className="text-sm text-slate-600">Grains, dairy, fruits. Builds tissue and calms longevity.</p>
                                    <div className="mt-2 text-xs font-semibold text-green-700">Best for: Vata, Pitta</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium text-slate-900 mb-2">2. Sour (Amla)</h4>
                                    <p className="text-xs text-slate-500 mb-2">Earth + Fire</p>
                                    <p className="text-sm text-slate-600">Citrus, yogurt, ferments. Stimulates digestion.</p>
                                    <div className="mt-2 text-xs font-semibold text-green-700">Best for: Vata</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium text-slate-900 mb-2">3. Salty (Lavana)</h4>
                                    <p className="text-xs text-slate-500 mb-2">Water + Fire</p>
                                    <p className="text-sm text-slate-600">Sea salt, seaweed. Improves taste and digestion.</p>
                                    <div className="mt-2 text-xs font-semibold text-green-700">Best for: Vata</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium text-slate-900 mb-2">4. Pungent (Katu)</h4>
                                    <p className="text-xs text-slate-500 mb-2">Fire + Air</p>
                                    <p className="text-sm text-slate-600">Peppers, garlic, ginger. Clears sinuses, burns fat.</p>
                                    <div className="mt-2 text-xs font-semibold text-green-700">Best for: Kapha</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium text-slate-900 mb-2">5. Bitter (Tikta)</h4>
                                    <p className="text-xs text-slate-500 mb-2">Air + Ether</p>
                                    <p className="text-sm text-slate-600">Leafy greens, turmeric. Detoxifying and cooling.</p>
                                    <div className="mt-2 text-xs font-semibold text-green-700">Best for: Pitta, Kapha</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-medium text-slate-900 mb-2">6. Astringent (Kashaya)</h4>
                                    <p className="text-xs text-slate-500 mb-2">Air + Earth</p>
                                    <p className="text-sm text-slate-600">Beans, unripe bananas. Drying and compacting.</p>
                                    <div className="mt-2 text-xs font-semibold text-green-700">Best for: Pitta, Kapha</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-teal-700">Mindful Eating Rules</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs shrink-0">1</span>
                                    <span>Eat only when you are hungry (previous meal is digested).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs shrink-0">2</span>
                                    <span>Eat in a calm, settled atmosphere without distractions (no TV/Phone).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs shrink-0">3</span>
                                    <span>Stop eating when you are 75% full.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs shrink-0">4</span>
                                    <span>Avoid ice-cold drinks with meals; sip warm water instead.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
