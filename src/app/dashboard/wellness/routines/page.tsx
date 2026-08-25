"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Apple,
  CheckCircle2,
  Circle,
  Clock,
  Footprints,
  Leaf,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Wind,
} from "lucide-react";

type RoutineSlot = "morning" | "afternoon" | "evening" | "sleep";
type RoutineCategory = "movement" | "nutrition" | "breathing" | "mindfulness" | "sleep" | "hygiene";

interface PresetBlock {
  id: string;
  title: string;
  description: string;
  category: RoutineCategory;
  durationMinutes: number;
  slots: RoutineSlot[];
}

interface RoutineEntry {
  id: string;
  blockId: string;
  title: string;
  description: string;
  category: RoutineCategory;
  durationMinutes: number;
  slot: RoutineSlot;
  source: "preset" | "custom";
  addedAt: string;
  completedDates: string[];
}

interface CustomHabitForm {
  title: string;
  description: string;
  durationMinutes: string;
  category: RoutineCategory;
}

const STORAGE_KEY = "arovia_daily_routine_v2";

const SLOT_LABELS: Record<RoutineSlot, { label: string; helper: string; icon: ReactNode }> = {
  morning: { label: "Morning", helper: "Start grounded", icon: <Sun className="h-4 w-4 text-amber-500" /> },
  afternoon: { label: "Afternoon", helper: "Reset energy", icon: <Leaf className="h-4 w-4 text-emerald-500" /> },
  evening: { label: "Evening", helper: "Digest and unwind", icon: <Moon className="h-4 w-4 text-indigo-500" /> },
  sleep: { label: "Sleep", helper: "Prepare for rest", icon: <Sparkles className="h-4 w-4 text-purple-500" /> },
};

const CATEGORY_STYLES: Record<RoutineCategory, string> = {
  movement: "bg-emerald-50 text-emerald-700 border-emerald-100",
  nutrition: "bg-amber-50 text-amber-700 border-amber-100",
  breathing: "bg-sky-50 text-sky-700 border-sky-100",
  mindfulness: "bg-purple-50 text-purple-700 border-purple-100",
  sleep: "bg-indigo-50 text-indigo-700 border-indigo-100",
  hygiene: "bg-slate-50 text-slate-700 border-slate-100",
};

const PRESET_BLOCKS: PresetBlock[] = [
  { id: "warm-water", title: "Warm water on waking", description: "Drink one glass of warm water before tea or coffee.", category: "nutrition", durationMinutes: 2, slots: ["morning"] },
  { id: "morning-walk", title: "Morning walk", description: "A gentle 15–30 minute walk before breakfast.", category: "movement", durationMinutes: 20, slots: ["morning"] },
  { id: "anulom-vilom", title: "Anulom Vilom", description: "Alternate-nostril breathing for calm, steady focus.", category: "breathing", durationMinutes: 7, slots: ["morning", "evening"] },
  { id: "sunlight", title: "Morning sunlight", description: "Get natural outdoor light to anchor your body clock.", category: "hygiene", durationMinutes: 10, slots: ["morning"] },
  { id: "lunch-walk", title: "Post-lunch stroll", description: "A short walk after lunch to support digestion and glucose control.", category: "movement", durationMinutes: 10, slots: ["afternoon"] },
  { id: "screen-break", title: "20-20-20 eye break", description: "Look 20 feet away for 20 seconds after screen blocks.", category: "hygiene", durationMinutes: 1, slots: ["afternoon", "evening"] },
  { id: "hydration-check", title: "Hydration check", description: "Pause and drink water before the next caffeine or snack.", category: "nutrition", durationMinutes: 1, slots: ["afternoon"] },
  { id: "box-breathing", title: "Box breathing", description: "Inhale 4, hold 4, exhale 4, hold 4 for five cycles.", category: "breathing", durationMinutes: 5, slots: ["afternoon", "evening"] },
  { id: "light-dinner", title: "Light dinner", description: "Eat a lighter meal at least two hours before sleep.", category: "nutrition", durationMinutes: 30, slots: ["evening"] },
  { id: "shatapavali", title: "100 steps after dinner", description: "Walk slowly after dinner to support digestion.", category: "movement", durationMinutes: 8, slots: ["evening"] },
  { id: "journal", title: "Three-line journal", description: "Write what went well, what felt hard, and tomorrow&apos;s next step.", category: "mindfulness", durationMinutes: 5, slots: ["evening", "sleep"] },
  { id: "no-screens", title: "No screens before bed", description: "Keep the last 45–60 minutes screen-light free.", category: "sleep", durationMinutes: 45, slots: ["sleep"] },
  { id: "yoga-nidra", title: "Yoga Nidra", description: "A guided body-scan relaxation before sleep.", category: "mindfulness", durationMinutes: 20, slots: ["sleep"] },
  { id: "fixed-bedtime", title: "Fixed bedtime", description: "Aim for the same sleep window tonight.", category: "sleep", durationMinutes: 1, slots: ["sleep"] },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadEntries(): RoutineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RoutineEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: RoutineEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function calculateStreak(entries: RoutineEntry[], dateKey: string) {
  const completed = new Set(entries.flatMap(entry => entry.completedDates));
  let streak = 0;
  const cursor = new Date(`${dateKey}T00:00:00`);

  for (let i = 0; i < 365; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!completed.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function RoutineBuilderPage() {
  const [entries, setEntries] = useState<RoutineEntry[]>(loadEntries);
  const [activeSlot, setActiveSlot] = useState<RoutineSlot>("morning");
  const [query, setQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState<CustomHabitForm>({
    title: "",
    description: "",
    durationMinutes: "5",
    category: "mindfulness",
  });

  const dateKey = todayKey();

  const persist = useCallback((next: RoutineEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  const visibleEntries = useMemo(
    () => entries.filter(entry => entry.slot === activeSlot),
    [entries, activeSlot]
  );

  const completedCount = visibleEntries.filter(entry => entry.completedDates.includes(dateKey)).length;
  const totalMinutes = visibleEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const completionPercent = visibleEntries.length ? Math.round((completedCount / visibleEntries.length) * 100) : 0;
  const streak = calculateStreak(entries, dateKey);

  const availablePresets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return PRESET_BLOCKS.filter(block => {
      const alreadyAdded = entries.some(entry => entry.blockId === block.id && entry.slot === activeSlot);
      const matchesSlot = block.slots.includes(activeSlot);
      const matchesQuery = !normalizedQuery || `${block.title} ${block.description} ${block.category}`.toLowerCase().includes(normalizedQuery);
      return !alreadyAdded && matchesSlot && matchesQuery;
    });
  }, [activeSlot, entries, query]);

  const addPreset = (block: PresetBlock) => {
    const next: RoutineEntry = {
      id: createId(),
      blockId: block.id,
      title: block.title,
      description: block.description,
      category: block.category,
      durationMinutes: block.durationMinutes,
      slot: activeSlot,
      source: "preset",
      addedAt: new Date().toISOString(),
      completedDates: [],
    };
    persist([...entries, next]);
  };

  const addCustomHabit = () => {
    const title = customForm.title.trim();
    if (!title) return;

    const duration = Math.max(1, Math.min(180, Number(customForm.durationMinutes) || 5));
    const next: RoutineEntry = {
      id: createId(),
      blockId: `custom-${createId()}`,
      title,
      description: customForm.description.trim() || "Personal wellness habit.",
      category: customForm.category,
      durationMinutes: duration,
      slot: activeSlot,
      source: "custom",
      addedAt: new Date().toISOString(),
      completedDates: [],
    };

    persist([...entries, next]);
    setCustomForm({ title: "", description: "", durationMinutes: "5", category: "mindfulness" });
    setShowCustomForm(false);
  };

  const toggleComplete = (entryId: string) => {
    persist(entries.map(entry => {
      if (entry.id !== entryId) return entry;
      const done = entry.completedDates.includes(dateKey);
      return {
        ...entry,
        completedDates: done
          ? entry.completedDates.filter(date => date !== dateKey)
          : [...entry.completedDates, dateKey],
      };
    }));
  };

  const removeEntry = (entryId: string) => {
    persist(entries.filter(entry => entry.id !== entryId));
  };

  const clearToday = () => {
    persist(entries.map(entry => ({
      ...entry,
      completedDates: entry.completedDates.filter(date => date !== dateKey),
    })));
  };

  const resetRoutine = () => {
    if (!confirm("Reset your entire routine? This removes all routine blocks and completion history.")) return;
    persist([]);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/wellness" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Wellness
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-800">Daily Routine</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Routine Builder</h1>
          <p className="text-gray-500 mt-1">Build a practical daily rhythm across movement, food, breath, and sleep.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearToday} disabled={entries.length === 0}>Clear today</Button>
          <Button variant="outline" size="sm" onClick={resetRoutine} disabled={entries.length === 0} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Today</p><p className="text-2xl font-bold text-gray-900">{completionPercent}%</p></CardContent></Card>
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-gray-900">{completedCount}/{visibleEntries.length}</p></CardContent></Card>
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Time planned</p><p className="text-2xl font-bold text-gray-900">{totalMinutes}m</p></CardContent></Card>
        <Card className="border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Streak</p><p className="text-2xl font-bold text-gray-900">{streak} day{streak === 1 ? "" : "s"}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 rounded-2xl bg-gray-50 p-2 border border-gray-100">
        {(Object.keys(SLOT_LABELS) as RoutineSlot[]).map(slot => (
          <button
            key={slot}
            onClick={() => setActiveSlot(slot)}
            className={`rounded-xl px-3 py-3 text-left transition-all ${activeSlot === slot ? "bg-white shadow-sm ring-1 ring-gray-100" : "hover:bg-white/60"}`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">{SLOT_LABELS[slot].icon}{SLOT_LABELS[slot].label}</div>
            <p className="text-xs text-gray-400 mt-0.5">{SLOT_LABELS[slot].helper}</p>
          </button>
        ))}
      </div>

      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">{SLOT_LABELS[activeSlot].label} plan</CardTitle>
            <Badge variant="outline" className="gap-1.5"><Clock className="h-3 w-3" />{totalMinutes} min</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleEntries.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
              <Footprints className="h-9 w-9 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No routine blocks yet</p>
              <p className="text-sm text-gray-400 mt-1">Add suggested habits or create your own.</p>
            </div>
          ) : (
            visibleEntries.map(entry => {
              const isDone = entry.completedDates.includes(dateKey);
              return (
                <div key={entry.id} className={`rounded-2xl border p-4 flex items-start gap-3 transition-all ${isDone ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
                  <button onClick={() => toggleComplete(entry.id)} className="mt-0.5 text-gray-300 hover:text-emerald-500 transition-colors" aria-label={isDone ? "Mark incomplete" : "Mark complete"}>
                    {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-sm ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>{entry.title}</h3>
                      <span className={`text-[10px] border rounded-full px-2 py-0.5 ${CATEGORY_STYLES[entry.category]}`}>{entry.category}</span>
                      {entry.source === "custom" && <span className="text-[10px] rounded-full px-2 py-0.5 bg-gray-100 text-gray-500">custom</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{entry.durationMinutes} min</p>
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove routine block">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Suggested habits</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search habits" className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {availablePresets.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No more suggestions for this slot.</p>
            ) : availablePresets.map(block => (
              <button key={block.id} onClick={() => addPreset(block)} className="w-full text-left rounded-xl border border-gray-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{block.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{block.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-gray-400">{block.durationMinutes}m</span>
                    <Plus className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-100 h-fit">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Custom habit</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!showCustomForm ? (
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowCustomForm(true)}>
                <Plus className="h-4 w-4" />
                Create your own
              </Button>
            ) : (
              <div className="space-y-3">
                <input value={customForm.title} onChange={e => setCustomForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Habit name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <textarea value={customForm.description} onChange={e => setCustomForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Why this habit matters" className="w-full min-h-20 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="1" max="180" value={customForm.durationMinutes} onChange={e => setCustomForm(prev => ({ ...prev, durationMinutes: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <select value={customForm.category} onChange={e => setCustomForm(prev => ({ ...prev, category: e.target.value as RoutineCategory }))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    {(Object.keys(CATEGORY_STYLES) as RoutineCategory[]).map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addCustomHabit} disabled={!customForm.title.trim()} className="flex-1">Add habit</Button>
                  <Button variant="outline" onClick={() => setShowCustomForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link href="/dashboard/wellness/library" className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 hover:border-emerald-200 hover:text-emerald-700 transition-colors flex items-center gap-2"><Apple className="h-4 w-4" />Remedies Library</Link>
        <Link href="/dashboard/consult" className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 hover:border-emerald-200 hover:text-emerald-700 transition-colors flex items-center gap-2"><Wind className="h-4 w-4" />Ask Arovia</Link>
        <Link href="/dashboard/wellness" className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 hover:border-emerald-200 hover:text-emerald-700 transition-colors flex items-center gap-2"><Leaf className="h-4 w-4" />Wellness Home</Link>
      </div>
    </div>
  );
}
