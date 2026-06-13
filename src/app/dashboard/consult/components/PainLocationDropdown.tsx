"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface PainLocationDropdownProps {
    onSubmit: (location: string) => void;
}

const BODY_REGIONS = [
    { label: "Head (Sar)", short: "HE", value: "Head" },
    { label: "Neck (Gardan)", short: "NE", value: "Neck" },
    { label: "Chest (Seena)", short: "CH", value: "Chest" },
    { label: "Upper Abdomen (Oopar Pet)", short: "UA", value: "Upper Abdomen" },
    { label: "Lower Abdomen (Neeche Pet)", short: "LA", value: "Lower Abdomen" },
    { label: "Back (Peeth)", short: "BA", value: "Back" },
    { label: "Lower Back (Kamar)", short: "LB", value: "Lower Back" },
    { label: "Shoulder (Kandha)", short: "SH", value: "Shoulder" },
    { label: "Arms (Baazu)", short: "AR", value: "Arms" },
    { label: "Hands (Haath)", short: "HA", value: "Hands" },
    { label: "Legs (Taang)", short: "LE", value: "Legs" },
    { label: "Knees (Ghutna)", short: "KN", value: "Knees" },
    { label: "Ankles (Takhna)", short: "AN", value: "Ankles" },
    { label: "Feet (Pair)", short: "FE", value: "Feet" },
    { label: "Joints (Jod)", short: "JO", value: "Joints" },
    { label: "Full Body (Pura Sharir)", short: "FB", value: "Full Body" },
];

export function PainLocationDropdown({ onSubmit }: PainLocationDropdownProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (region: typeof BODY_REGIONS[0]) => {
        setSelected(region.value);
    };

    const handleSubmit = () => {
        if (!selected) return;
        setSubmitted(true);
        onSubmit(selected);
    };

    if (submitted) {
        return (
            <div className="inline-flex items-center gap-2 rounded-[8px] rounded-br-[3px] bg-[#1A1A2E] px-4 py-3 text-[15px] text-white">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {selected}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md rounded-[8px] rounded-tl-[3px] border border-[#DAD7CF] bg-white p-4 shadow-sm"
        >
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1A1A2E]">
                <MapPin className="h-4 w-4 text-[#0F6E56]" aria-hidden="true" />
                Select location / area <span className="text-xs font-normal text-[#6B6B6B]">- Jagah chunein</span>
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {BODY_REGIONS.map((region) => (
                    <button
                        key={region.value}
                        onClick={() => handleSelect(region)}
                        className={`flex items-center gap-2 rounded-[8px] px-3 py-2.5 text-left text-sm transition-all active:scale-[0.98] ${selected === region.value
                                ? "border-2 border-[#0F6E56] bg-[#E1F5EE] font-semibold text-[#0F6E56] shadow-sm"
                                : "border border-[#DAD7CF] bg-[#FDFBF7] text-[#1C1C1E] hover:border-[#9FE1CB] hover:bg-[#E1F5EE]"
                            }`}
                    >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-white text-[10px] font-bold text-[#0F6E56]">
                            {region.short}
                        </span>
                        <span className="truncate">{region.label}</span>
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!selected}
                className={`mt-3 w-full rounded-full py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${selected
                        ? "bg-[#1A1A2E] text-white shadow-sm hover:bg-[#0F6E56]"
                        : "cursor-not-allowed bg-[#F1F1F1] text-[#9A9A9A]"
                    }`}
            >
                {selected ? `Confirm - ${selected}` : "Select a location"}
            </button>
        </motion.div>
    );
}
