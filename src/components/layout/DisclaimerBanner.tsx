"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";

export function DisclaimerBanner() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="z-30 select-none border-b border-amber-200 bg-amber-50 text-xs text-amber-900">
            <div className="mx-auto flex h-7 max-w-6xl items-center justify-between px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className="truncate">
                        <strong>Beta</strong> · Arovia.AI is an AI tool, not a substitute for professional medical advice. Results may vary.
                    </span>
                </div>
                <button
                    onClick={() => setExpanded((open) => !open)}
                    className="ml-2 shrink-0 rounded p-1 transition-colors hover:bg-amber-100"
                    aria-label={expanded ? "Collapse disclaimer" : "Expand disclaimer"}
                >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
            </div>
            {expanded && (
                <div className="mx-auto max-w-6xl space-y-2 px-4 pb-3 pt-2 md:px-6">
                    <div className="flex items-start gap-2 rounded-md bg-amber-100/70 p-2.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                        <p className="text-[11px] font-semibold leading-relaxed text-amber-900">
                            This is a Beta product. AI-generated health suggestions are experimental, may be inaccurate, and are <em>not</em> a substitute for evaluation by a licensed medical professional. Do <strong>not</strong> use this app to self-diagnose or self-medicate.
                        </p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800/80">
                        Arovia.AI provides general health information and AI-assisted symptom analysis for educational purposes only.
                        It does not provide medical diagnoses, treatment recommendations, or professional medical advice.
                        Always seek the guidance of a qualified healthcare provider with any questions you have regarding a medical condition.
                        Never disregard professional medical advice or delay in seeking it because of information provided by this application.
                        Homeopathic and Ayurvedic suggestions shown are informational only. <strong>Please consult a registered practitioner before taking any medicine.</strong>
                        In case of a medical emergency, call your local emergency services immediately.
                    </p>
                </div>
            )}
        </div>
    );
}
