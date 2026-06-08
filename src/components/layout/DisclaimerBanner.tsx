"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs select-none z-30">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-1.5 md:px-6">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className="truncate">
                        <strong>Beta</strong> · Healio.AI is an AI tool — not a substitute for professional medical advice. Results may vary.
                    </span>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0 ml-2 p-1 rounded hover:bg-amber-100 transition-colors"
                    aria-label={expanded ? "Collapse disclaimer" : "Expand disclaimer"}
                >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
            </div>
            {expanded && (
                <div className="px-4 pb-3 md:px-6 max-w-6xl mx-auto space-y-2">
                    <div className="flex items-start gap-2 bg-amber-100/70 rounded-md p-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-amber-900 font-semibold">
                            ⚠️ This is a Beta product. AI-generated health suggestions are experimental, may be inaccurate, and are <em>not</em> a substitute for evaluation by a licensed medical professional. Do <strong>not</strong> use this app to self-diagnose or self-medicate.
                        </p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800/80">
                        Healio.AI provides general health information and AI-assisted symptom analysis for educational purposes only.
                        It does not provide medical diagnoses, treatment recommendations, or professional medical advice.
                        Always seek the guidance of a qualified healthcare provider with any questions you have regarding a medical condition.
                        Never disregard professional medical advice or delay in seeking it because of information provided by this application.
                        Homeopathic and Ayurvedic suggestions shown are informational only — <strong>please consult a registered practitioner before taking any medicine.</strong>
                        In case of a medical emergency, call your local emergency services immediately.
                    </p>
                </div>
            )}
        </div>
    );
}
