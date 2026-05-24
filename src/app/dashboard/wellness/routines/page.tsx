"use client";

/**
 * Routine Builder Page
 *
 * Plan ref: Enhanced Plan §8.4 + Traditional Plan §7.3 + §11.3
 *
 * Replaces remedy-only thinking with sustainable lifestyle behaviour.
 * Users can build morning / evening routines from modular wellness blocks
 * across sleep, food, stress, movement, and seasonal care.
 *
 * Phase 2 stub — routine persistence via Supabase will be added in Phase 5.
 * Currently uses localStorage for persistence.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Sun, Moon, Apple, Wind, Footprints,
  Plus, Trash2, CheckCircle2, Circle, Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoutineSlot = "morning" | "evening";

interface RoutineBlock {
  id: string;
  label: string;
  description: string;
  duration: string;
  category: "movement" | "food" | "breathing" | "rest" | "hygiene" | "mindfulness";
  slot: RoutineSlot[];
}

interface UserRoutine {
  blockId: string;
  slot: RoutineSlot;
  completed: boolean;
  addedAt: string;
}

// ─── Preset blocks (plan §11.3 — Routine Builder elements) ───────────────────

const PRESET_BLOCKS: RoutineBlock[] = [
  {
    id: "rb-morning-walk",
    label: "Morning walk",
    description: "15–30 min brisk walk before breakfast.",
    duration: "15–30 min",
    category: "movement",
    slot: ["morning"],
  },
  {
    id: "rb-anulom-vilom",
    label: "Anulom-Vilom breathing",
    description: "Alternate nostril breathing for calm focus.",
    duration: "5–10 min",
    category: "breathing",
    slot: ["morning", "evening"],
  },
  {
    id: "rb-warm-water",
    label: "Warm water on waking",
    description: "One glass of warm or room-temperature water to start digestion.",
    duration: "1 min",
    category: "food",
    slot: ["morning"],
  },
  {
    id: "rb-tulsi-tea",
    label: "Tulsi or ginger tea",
    description: "A warm cup to ease into the day — no milk, no sugar.",
    duration: "5 min",
    category: "food",
    slot: ["morning"],
  },
  {
    id: "rb-screen-break",
    label: "20-20-20 screen break",
    description: "Every 20 minutes, look 20 ft away for 20 seconds.",
    duration: "20 sec",
    category: "hygiene",
    slot: ["morning", "evening"],
  },
  {
    id: "rb-deep-breathing",
    label: "5-minute diaphragmatic breathing",
    description: "Slow belly breathing to reduce work-day stress.",
    duration: "5 min",
    category: "breathing",
    slot: ["morning", "evening"],
  },
  {
    id: "rb-light-dinner",
    label: "Light dinner by 7:30 pm",
    description: "Eat a light, easily digestible meal at least 2 hours before sleep.",
    duration: "—",
    category: "food",
    slot: ["evening"],
  },
  {
    id: "rb-no-screens",
    label: "No screens 60 min before bed",
    description: "Turn off all screens 1 hour before sleep for better sleep onset.",
    duration: "60 min before bed",
    category: "hygiene",
    slot: ["evening"],
  },
  {
    id: "rb-yoga-nidra",
    label: "Yoga Nidra (guided)",
    description: "20–30 min guided body-scan relaxation before sleep.",
    duration: "20–30 min",
    category: "mindfulness",
    slot: ["evening"],
  },
  {
    id: "rb-journal",
    label: "3-line evening journal",
    description: "Write 3 things: what went well, what was hard, what to do tomorrow.",
    duration: "5 min",
    category: "mindfulness",
    slot: ["evening"],
  },
  {
    id: "rb-stretching",
    label: "Gentle stretching",
    description: "5 min of neck, shoulder, and lower-back stretches.",
    duration: "5 min",
    category: "movement",
    slot: ["morning", "evening"],
  },
  {
    id: "rb-hydration-check",
    label: "Hydration check",
    description: "Track whether you've had 8 glasses of water today.",
    duration: "1 min",
    category: "food",
    slot: ["evening"],
  },
];

const CATEGORY_COLORS: Record<RoutineBlock["category"], { bg: string; text: string }> = {
  movement:    { bg: "bg-emerald-50",  text: "text-emerald-700" },
  food:        { bg: "bg-amber-50",    text: "text-amber-700"   },
  breathing:   { bg: "bg-sky-50",      text: "text-sky-700"     },
  rest:        { bg: "bg-indigo-50",   text: "text-indigo-700"  },
  hygiene:     { bg: "bg-gray-50",     text: "text-gray-700"    },
  mindfulness: { bg: "bg-purple-50",   text: "text-purple-700"  },
};

const STORAGE_KEY = "healio_routine_v1";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoutineBuilderPage() {
  const [activeSlot, setActiveSlot] = useState<RoutineSlot>("morning");
  const [userRoutine, setUserRoutine] = useState<UserRoutine[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [todayDate] = useState(new Date().toDateString());

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUserRoutine(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((next: UserRoutine[]) => {
    setUserRoutine(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addBlock = (block: RoutineBlock) => {
    const already = userRoutine.some(
      r => r.blockId === block.id && r.slot === activeSlot
    );
    if (already) return;
    save([...userRoutine, {
      blockId: block.id,
      slot: activeSlot,
      completed: false,
      addedAt: new Date().toISOString(),
    }]);
    setShowPicker(false);
  };

  const removeBlock = (blockId: string, slot: RoutineSlot) => {
    save(userRoutine.filter(r => !(r.blockId === blockId && r.slot === slot)));
  };

  const toggleComplete = (blockId: string, slot: RoutineSlot) => {
    save(userRoutine.map(r =>
      r.blockId === blockId && r.slot === slot
        ? { ...r, completed: !r.completed }
        : r
    ));
  };

  const slotRoutine = userRoutine.filter(r => r.slot === activeSlot);
  const completedCount = slotRoutine.filter(r => r.completed).length;
  const addableBlocks = PRESET_BLOCKS.filter(
    b =>
      b.slot.includes(activeSlot) &&
      !userRoutine.some(r => r.blockId === b.id && r.slot === activeSlot)
  );

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wellness"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Wellness
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-800">Daily Routines</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Daily Routine</h1>
        <p className="mt-1 text-sm text-gray-500">
          Build sustainable habits around sleep, food, stress, and movement.
        </p>
      </div>

      {/* Slot tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
        {(["morning", "evening"] as RoutineSlot[]).map(slot => (
          <button
            key={slot}
            onClick={() => setActiveSlot(slot)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeSlot === slot
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {slot === "morning"
              ? <Sun className="size-4 text-amber-500" />
              : <Moon className="size-4 text-indigo-400" />}
            {slot === "morning" ? "Morning" : "Evening"}
          </button>
        ))}
      </div>

      {/* Progress */}
      {slotRoutine.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / slotRoutine.length) * 100}%`,
                backgroundColor: "var(--healio-wellness-primary)",
              }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 shrink-0">
            {completedCount} / {slotRoutine.length} done
          </span>
          {completedCount === slotRoutine.length && slotRoutine.length > 0 && (
            <Sparkles className="size-4 text-amber-500 shrink-0" />
          )}
        </div>
      )}

      {/* Routine items */}
      <div className="space-y-2">
        {slotRoutine.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200">
            {activeSlot === "morning"
              ? <Sun className="size-8 mx-auto mb-3 text-gray-300" />
              : <Moon className="size-8 mx-auto mb-3 text-gray-300" />}
            <p className="text-sm font-medium text-gray-400">No {activeSlot} blocks yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add blocks from the list below</p>
          </div>
        ) : (
          slotRoutine.map(entry => {
            const block = PRESET_BLOCKS.find(b => b.id === entry.blockId);
            if (!block) return null;
            const color = CATEGORY_COLORS[block.category];
            return (
              <div
                key={`${entry.blockId}-${entry.slot}`}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                  entry.completed
                    ? "border-green-100 bg-green-50/50 opacity-70"
                    : "border-gray-100 bg-white"
                }`}
              >
                {/* Check */}
                <button
                  onClick={() => toggleComplete(block.id, activeSlot)}
                  className="mt-0.5 shrink-0 text-gray-300 hover:text-emerald-500 transition-colors"
                >
                  {entry.completed
                    ? <CheckCircle2 className="size-5 text-emerald-500" />
                    : <Circle className="size-5" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${entry.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {block.label}
                    </p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                      {block.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{block.description}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{block.duration}</p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeBlock(block.id, activeSlot)}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add block button */}
      <button
        onClick={() => setShowPicker(v => !v)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-all"
      >
        <Plus className="size-4" />
        Add to {activeSlot} routine
      </button>

      {/* Block picker */}
      {showPicker && addableBlocks.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Suggested blocks
          </p>
          {addableBlocks.map(block => {
            const color = CATEGORY_COLORS[block.category];
            return (
              <button
                key={block.id}
                onClick={() => addBlock(block)}
                className="w-full text-left flex items-start gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{block.label}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                      {block.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{block.description}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-0.5">{block.duration}</span>
              </button>
            );
          })}
        </div>
      )}

      {showPicker && addableBlocks.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          All available blocks have been added to your {activeSlot} routine.
        </p>
      )}

      {/* Footer note */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-400 text-center">
        Today: {todayDate} · Progress resets daily · Sync to cloud coming soon
      </div>

      {/* Safe navigation helper icons */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <Link href="/dashboard/wellness/library"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white py-3 text-xs text-gray-500 hover:border-emerald-200 hover:text-emerald-700 transition-all">
          <Apple className="size-5" />
          Remedies
        </Link>
        <Link href="/dashboard/consult"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white py-3 text-xs text-gray-500 hover:border-emerald-200 hover:text-emerald-700 transition-all">
          <Wind className="size-5" />
          Ask Healio
        </Link>
        <Link href="/dashboard/wellness"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white py-3 text-xs text-gray-500 hover:border-emerald-200 hover:text-emerald-700 transition-all">
          <Footprints className="size-5" />
          Wellness Home
        </Link>
      </div>
    </div>
  );
}
