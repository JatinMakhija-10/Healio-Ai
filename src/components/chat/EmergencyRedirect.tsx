"use client";

import { AlertTriangle, Phone, ExternalLink } from "lucide-react";

interface EmergencyRedirectProps {
    /** Optional detected red-flag symptoms to display */
    detectedSymptoms?: string[];
}

export function EmergencyRedirect({ detectedSymptoms }: EmergencyRedirectProps) {
    return (
        <div className="w-full max-w-2xl mx-auto my-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-lg shadow-red-100/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Alert Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 bg-red-100 rounded-full shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-red-900">
                        Seek Emergency Medical Care
                    </h3>
                    <p className="text-sm text-red-800/80 mt-1">
                        Based on what you&apos;ve described, you should seek emergency medical care immediately.
                    </p>
                </div>
            </div>

            {/* Detected symptoms */}
            {detectedSymptoms && detectedSymptoms.length > 0 && (
                <div className="mb-4 p-3 bg-white/60 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1.5">Concerning Symptoms Detected</p>
                    <ul className="space-y-1">
                        {detectedSymptoms.map((symptom, i) => (
                            <li key={i} className="text-sm text-red-800 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                {symptom}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Emergency Numbers */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <a
                    href="tel:112"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors group"
                >
                    <Phone className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="text-sm font-bold text-red-900">112</p>
                        <p className="text-[10px] text-red-600">India Emergency</p>
                    </div>
                </a>
                <a
                    href="tel:911"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors group"
                >
                    <Phone className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="text-sm font-bold text-red-900">911</p>
                        <p className="text-[10px] text-red-600">US Emergency</p>
                    </div>
                </a>
            </div>

            {/* Warning text */}
            <div className="text-center">
                <p className="text-xs text-red-700 font-medium">
                    ⚠️ Healio.AI cannot assist with potential emergencies. Please do not delay seeking care.
                </p>
            </div>
        </div>
    );
}
