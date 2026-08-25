"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle, FlaskConical, Leaf, ShieldAlert, CloudRain, Sun, Wind, Droplets, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "myths" | "evidence" | "seasonal" | "safety";

interface MythCard {
  myth: string;
  reality: string;
  verdict: "false" | "nuanced" | "partial";
  note?: string;
}

const MYTH_CARDS: MythCard[] = [
  {
    myth: '"Herbal remedies are always safe because they are natural."',
    reality: "Many herbs have documented drug interactions and dose-dependent toxicity. Ashwagandha can raise thyroid levels; high-dose neem can cause liver stress; ginger and garlic thin blood. Natural does not mean side-effect free.",
    verdict: "false",
    note: "Always disclose herbal use to your doctor, especially if on prescription medications.",
  },
  {
    myth: '"Turmeric or neem can cure diabetes — I can reduce my medication."',
    reality: "Early lab studies show mild glucose-lowering effects in both. There is no clinical evidence supporting them as replacements for prescribed diabetes medication. Stopping medication without medical supervision is dangerous.",
    verdict: "false",
    note: "These may be useful as complementary lifestyle support — never as medication substitutes.",
  },
  {
    myth: '"Lemon water detoxes your liver and clears toxins."',
    reality: "The liver and kidneys filter waste continuously without external assistance. Staying well-hydrated does support kidney function. However, \"detox\" as a therapeutic outcome from any single food or drink is not supported by clinical evidence.",
    verdict: "false",
  },
  {
    myth: '"Homeopathic remedies have no side effects."',
    reality: "Most homeopathic preparations are highly diluted and have minimal direct pharmacological effects. The risk is primarily indirect — delaying evidence-based treatment for a serious condition can cause real harm.",
    verdict: "nuanced",
    note: "For minor, self-limiting symptoms, low-risk traditional remedies are generally fine. For persistent or worsening symptoms, see a doctor.",
  },
  {
    myth: '"Ghee should be avoided — it causes heart disease."',
    reality: "Moderate amounts of ghee in an otherwise balanced diet are unlikely to cause harm for most people. Excess saturated fat intake does raise LDL cholesterol. The evidence is nuanced — cultural context and overall dietary pattern matter more than single foods.",
    verdict: "nuanced",
  },
  {
    myth: '"Traditional Ayurvedic treatments have centuries of safety proof."',
    reality: "Long traditional use is meaningful context, but it does not equal clinical safety proof for every individual. Age, existing conditions, medications, and dose all affect safety. Traditional use informs — it does not replace — modern safety assessment.",
    verdict: "partial",
  },
];

interface EvidenceTier {
  key: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  example: string;
  trust: string;
}

const EVIDENCE_TIERS: EvidenceTier[] = [
  {
    key: "clinical_evidence",
    label: "Clinical Evidence",
    color: "#047857",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    description: "Multiple well-designed human clinical trials support this claim. Recommended in mainstream medical guidelines.",
    example: "Ginger for pregnancy nausea — supported by multiple randomised trials.",
    trust: "High confidence. Generally safe to follow.",
  },
  {
    key: "emerging_science",
    label: "Emerging Science",
    color: "#0369A1",
    bg: "#EFF6FF",
    border: "#BAE6FD",
    description: "Early human studies or strong lab/animal evidence. Promising but not yet confirmed in large clinical trials.",
    example: "Ashwagandha for stress — positive small-scale human studies, larger trials ongoing.",
    trust: "Moderate confidence. Follow usage guidelines carefully.",
  },
  {
    key: "traditional_practice",
    label: "Traditional Practice",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    description: "Long-established use in Ayurveda, Unani, Siddha, or Indian folk medicine — without formal clinical trials confirming it.",
    example: "Turmeric milk for recovery — generations of use, limited human trial data.",
    trust: "Use as culturally familiar comfort care. Not for serious conditions.",
  },
  {
    key: "common_self_care",
    label: "Common Self-Care",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    description: "Widely accepted practical self-care — supported by general medical consensus or clinical experience even without large trials.",
    example: "Steam inhalation for nasal congestion — standard recommendation in primary care.",
    trust: "Generally safe for healthy adults. Follow safety notes.",
  },
  {
    key: "seek_help_only",
    label: "See a Doctor",
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    description: "These symptoms or conditions need professional evaluation. Home care is not appropriate, or may delay critical treatment.",
    example: "Chest pain, difficulty breathing, blood in urine, neurological symptoms.",
    trust: "Do not attempt self-treatment. Seek qualified medical attention.",
  },
];

interface SeasonGuide {
  key: string;
  icon: React.ReactNode;
  label: string;
  months: string;
  color: string;
  bg: string;
  border: string;
  tips: string[];
  redFlags: string[];
}

const SEASON_GUIDES: SeasonGuide[] = [
  {
    key: "summer",
    icon: <Sun className="size-5" />,
    label: "Summer",
    months: "March – June",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    tips: [
      "Drink 10–12 glasses of water daily — dehydration is the most common summer health risk.",
      "Coconut water replenishes electrolytes naturally; ORS is effective for mild dehydration.",
      "Avoid vigorous outdoor activity between 11 AM – 4 PM on peak heat days.",
      "Light, easy-to-digest meals (dal, rice, curd) reduce digestive strain.",
      "Buttermilk (chaas) with a pinch of cumin supports gut health in heat.",
    ],
    redFlags: [
      "Dizziness, confusion, or rapid heartbeat in heat — possible heat stroke, seek help immediately.",
      "No urination for 8+ hours or very dark urine — severe dehydration.",
      "Nausea and vomiting that prevents fluid intake.",
    ],
  },
  {
    key: "monsoon",
    icon: <CloudRain className="size-5" />,
    label: "Monsoon",
    months: "July – September",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BAE6FD",
    tips: [
      "Eat freshly cooked food — stale food spoils faster in humidity and causes gastroenteritis.",
      "Boil or purify drinking water; waterborne infections spike during monsoon.",
      "Use mosquito repellent consistently — dengue and malaria transmission peaks Jul–Oct.",
      "Keep cuts and wounds dry and covered — infection risk is higher in humid weather.",
      "Wash hands before eating — typhoid and hepatitis A transmission rises with contaminated water.",
    ],
    redFlags: [
      "High fever with severe joint/muscle pain and rash — possible dengue, consult a doctor.",
      "Jaundice (yellow eyes/skin) — possible hepatitis; immediate medical attention needed.",
      "Bloody or watery diarrhoea with high fever — could be typhoid or cholera.",
    ],
  },
  {
    key: "winter",
    icon: <Wind className="size-5" />,
    label: "Winter",
    months: "October – February",
    color: "#1E3A5F",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    tips: [
      "Warm fluids (ginger tea, broth) keep throat and nasal passages moist and comfortable.",
      "Steam inhalation (plain water) is effective for nasal congestion.",
      "Increase vitamin D — sunlight exposure drops significantly in winter months.",
      "Gentle warm-up stretches before exercise reduce injury risk in cold muscles.",
      "Keep indoor spaces ventilated — closed rooms increase airborne virus concentration.",
    ],
    redFlags: [
      "Breathlessness or wheezing worsened by cold air — may indicate asthma or COPD; see a doctor.",
      "Chest pain in cold weather — increased cardiac risk in winter; do not ignore.",
      "Cough persisting beyond 3 weeks — rule out TB or other chronic lung conditions.",
    ],
  },
  {
    key: "festival",
    icon: <Droplets className="size-5" />,
    label: "Festival Season",
    months: "October – November",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    tips: [
      "Rich sweets and fried foods in large quantities cause acid reflux and bloating — eat mindfully.",
      "Short walks after festive meals help digestion and blood sugar regulation.",
      "Adequate sleep matters more than extra celebration hours for immune function.",
      "Hydrate well — diuretic effect of sweets combined with late nights increases dehydration.",
      "Alcohol increases dehydration and lowers next-day immunity.",
    ],
    redFlags: [
      "Severe abdominal pain or distension after eating — seek same-day medical attention.",
      "Vomiting that persists beyond 24 hours — risk of dehydration.",
      "Allergic reaction to unknown food ingredients — hives, lip swelling, or throat tightness.",
    ],
  },
];

interface SafetyNote {
  title: string;
  items: string[];
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const SAFETY_NOTES: SafetyNote[] = [
  {
    title: "Herbal supplements and prescription medications",
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    icon: <ShieldAlert className="size-4" />,
    items: [
      "Ginger, garlic, and turmeric can increase bleeding risk — tell your doctor if you take warfarin, aspirin, or other blood thinners.",
      "Ashwagandha can affect thyroid hormone levels — check with your doctor if on thyroid medication.",
      "St. John's Wort (common in herbal supplements) significantly reduces effectiveness of contraceptives and antiretrovirals.",
      "Liquorice root (mulethi) can raise blood pressure — avoid with hypertension or diuretics.",
    ],
  },
  {
    title: "Who should be more careful",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: <AlertTriangle className="size-4" />,
    items: [
      "Pregnancy: Avoid high-dose ginger, neem, papaya, fenugreek, and most herbal supplements without medical clearance.",
      "Children under 2 years: Never give honey (botulism risk). Avoid most herbal teas and supplements without paediatric guidance.",
      "Kidney or liver disease: Many herbs are metabolised by the liver or excreted by kidneys — dose adjustments required.",
      "Diabetes on medication: Several traditional remedies lower blood sugar — risk of hypoglycaemia if combined with medication.",
      "Autoimmune conditions: Immune-stimulating herbs (echinacea, ashwagandha) can worsen autoimmune flares.",
    ],
  },
  {
    title: "How to read home-care instructions safely",
    color: "#0369A1",
    bg: "#EFF6FF",
    border: "#BAE6FD",
    icon: <Info className="size-4" />,
    items: [
      "\"May help with\" means possible benefit based on limited evidence — not a guaranteed cure.",
      "\"Avoid if\" lists are minimum contraindications — if in doubt, check with a doctor.",
      "Duration limits exist for a reason — do not continue a home remedy beyond the recommended period.",
      "If symptoms worsen or new symptoms appear while using a home remedy, stop and consult a doctor.",
      "\"Traditional practice\" label means cultural history of use — not clinical trial proof. Treat it as comfort care, not treatment.",
    ],
  },
];

const VERDICT_CONFIG = {
  false: { label: "Myth", color: "#B91C1C", bg: "#FEF2F2", icon: <XCircle className="size-4" /> },
  nuanced: { label: "Nuanced", color: "#B45309", bg: "#FFFBEB", icon: <AlertTriangle className="size-4" /> },
  partial: { label: "Partially true", color: "#0369A1", bg: "#EFF6FF", icon: <Info className="size-4" /> },
};

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "myths", label: "Myth Checks", icon: <XCircle className="size-4" /> },
  { key: "evidence", label: "Evidence Guide", icon: <FlaskConical className="size-4" /> },
  { key: "seasonal", label: "Seasonal Care", icon: <Leaf className="size-4" /> },
  { key: "safety", label: "Safety Notes", icon: <ShieldAlert className="size-4" /> },
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("myths");

  return (
    <div className="max-w-4xl space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wellness &amp; Safety Guide</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Honest explainers, myth checks, and safety context for everyday Indian wellness.
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "myths" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-gray-500">
            Common wellness claims — checked against available evidence.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MYTH_CARDS.map((card, i) => {
              const verdict = VERDICT_CONFIG[card.verdict];
              return (
                <div
                  key={i}
                  className="rounded-2xl border p-4 space-y-3"
                  style={{ backgroundColor: verdict.bg, borderColor: "rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-start gap-2">
                    <span style={{ color: verdict.color }} className="shrink-0 mt-0.5">{verdict.icon}</span>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ color: verdict.color, backgroundColor: `${verdict.bg}`, border: `1px solid ${verdict.color}30` }}
                    >
                      {verdict.label}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug italic">{card.myth}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{card.reality}</p>
                  {card.note && (
                    <div className="rounded-lg bg-white/60 border border-gray-200 px-3 py-2 text-xs text-gray-500">
                      {card.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-teal-800">
              See how Arovia labels evidence across our full remedy library.
            </p>
            <Link href="/dashboard/wellness/library" className="text-xs font-semibold text-teal-700 underline underline-offset-2 whitespace-nowrap shrink-0">
              Browse Library <ArrowRight className="size-3 inline" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-gray-500">
            Every remedy and routine in Arovia carries one of these five evidence labels. Here is what each means.
          </p>
          <div className="space-y-3">
            {EVIDENCE_TIERS.map((tier) => (
              <div
                key={tier.key}
                className="rounded-2xl border p-4 space-y-2"
                style={{ backgroundColor: tier.bg, borderColor: tier.border }}
              >
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={{ color: tier.color, borderColor: tier.border, backgroundColor: tier.bg }}
                >
                  <CheckCircle2 className="size-3" />
                  {tier.label}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{tier.description}</p>
                <div className="rounded-lg bg-white/70 border border-gray-100 px-3 py-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">Example:</span> {tier.example}
                  </p>
                  <p className="text-xs" style={{ color: tier.color }}>
                    <span className="font-semibold">How to use:</span> {tier.trust}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 text-center">
            All Arovia library entries are reviewed before publishing and carry explicit evidence labels. Content marked &quot;Seek Help&quot; is never paired with self-care instructions.
          </div>
        </div>
      )}

      {activeTab === "seasonal" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-gray-500">
            Season-specific care tips and red-flag signs to watch for across the Indian climate calendar.
          </p>
          <div className="space-y-4">
            {SEASON_GUIDES.map((guide) => (
              <div
                key={guide.key}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: guide.border }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ backgroundColor: guide.bg }}
                >
                  <span
                    className="size-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${guide.bg}`, color: guide.color, border: `1px solid ${guide.border}` }}
                  >
                    {guide.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: guide.color }}>{guide.label}</p>
                    <p className="text-xs text-gray-500">{guide.months}</p>
                  </div>
                </div>
                <div className="px-4 py-4 bg-white space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Care Tips</p>
                    <ul className="space-y-1.5">
                      {guide.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-red-400 mb-2">Red Flags — See a Doctor</p>
                    <ul className="space-y-1.5">
                      {guide.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "safety" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-gray-500">
            Important safety context — who should be extra careful, and how to interpret home-care instructions.
          </p>
          <div className="space-y-4">
            {SAFETY_NOTES.map((note, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: note.border }}
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ backgroundColor: note.bg }}
                >
                  <span style={{ color: note.color }}>{note.icon}</span>
                  <p className="text-sm font-semibold" style={{ color: note.color }}>{note.title}</p>
                </div>
                <div className="px-4 py-4 bg-white">
                  <ul className="space-y-2">
                    {note.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="size-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
            <p className="text-sm text-teal-800 font-medium mb-0.5">When in doubt, ask Arovia</p>
            <p className="text-xs text-teal-700">
              Describe your symptoms and current medications. Arovia will flag potential concerns and tell you when to escalate to a practitioner.
            </p>
            <Link href="/dashboard/consult" className="mt-2 inline-block text-xs font-semibold text-teal-700 underline underline-offset-2">
              Open Ask Arovia <ArrowRight className="size-3 inline" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
