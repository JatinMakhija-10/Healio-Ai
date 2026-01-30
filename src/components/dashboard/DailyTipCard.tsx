"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Tip {
    title: string;
    content: string;
    action?: string;
    actionLink?: string;
}

const TIPS: Tip[] = [
    {
        title: "Posture Check",
        content: "Are you hunching? Sit back, relax your shoulders, and keep your screen at eye level to reduce neck strain.",
        action: "View Ergonomics",
        actionLink: "/dashboard/tips/ergonomics"
    },
    {
        title: "Hydration Reminder",
        content: "Dehydration can cause fatigue and headaches. Aim for 8 glasses of water a day. Have you had one recently?",
    },
    {
        title: "20-20-20 Rule",
        content: "To reduce eye strain: Every 20 minutes, look at something 20 feet away for at least 20 seconds.",
    },
    {
        title: "Stress Relief",
        content: "Feeling overwhelmed? Try the 4-7-8 breathing technique: Inhale for 4s, hold for 7s, exhale for 8s.",
        action: "Start Breathing Guide",
        actionLink: "/dashboard/tips/breathing"
    },
    {
        title: "Better Sleep",
        content: "Avoid blue light from screens at least one hour before bed to improve your sleep quality.",
    },
    {
        title: "Stretch It Out",
        content: "Gentle stretching can help alleviate stiffness. Try a simple neck roll or shoulder shrug right now.",
    },
    {
        title: "Vitamin D",
        content: "Sunlight is a natural mood booster. Try to get 10-15 minutes of morning sun exposure today.",
    },
    {
        title: "Mindfulness",
        content: "Take a moment to ground yourself. Name 5 things you can see, 4 you can touch, and 3 you can hear.",
    },
    {
        title: "Morning Warm Water",
        content: "Drinking a glass of warm water after waking up helps kickstart digestion and flush out toxins."
    },
    {
        title: "Abhyanga (Oil Massage)",
        content: "A gentle self-massage with warm oil improves circulation, nourishes the skin, and calms the nervous system."
    },
    {
        title: "Tongue Cleaning",
        content: "Cleaning your tongue each morning removes toxins (ama) and improves oral hygiene and digestion."
    },
    {
        title: "Mindful Eating",
        content: "Eat without distractions. Chew slowly and notice flavors to improve digestion and prevent overeating."
    },
    {
        title: "Balanced Meals",
        content: "Include all six tastes—sweet, sour, salty, bitter, pungent, and astringent—for better nutritional balance."
    },
    {
        title: "Avoid Late-Night Eating",
        content: "Eating heavy meals late at night can disturb digestion and sleep. Try to finish dinner 2–3 hours before bed."
    },
    {
        title: "Daily Walking",
        content: "A 20–30 minute walk improves circulation, digestion, mood, and overall cardiovascular health."
    },
    {
        title: "Deep Breathing",
        content: "Slow, deep breathing helps calm the mind, reduce stress, and improve oxygen flow."
    },
    {
        title: "Stay Hydrated",
        content: "Sip water throughout the day instead of drinking large amounts at once to support digestion."
    },
    {
        title: "Consistent Sleep Time",
        content: "Going to bed and waking up at the same time daily helps regulate your body’s internal clock."
    },
    {
        title: "Limit Cold Drinks",
        content: "Very cold beverages can weaken digestion. Prefer room temperature or warm drinks when possible."
    },
    {
        title: "Sunrise Exposure",
        content: "Exposure to early morning sunlight supports vitamin D levels and improves circadian rhythm."
    },
    {
        title: "Eye Relaxation",
        content: "Rub your palms together and gently cup your eyes for a few seconds to reduce eye fatigue."
    },
    {
        title: "Good Posture",
        content: "Maintaining an upright posture reduces strain on your spine and improves breathing."
    },
    {
        title: "Seasonal Eating",
        content: "Eating seasonal fruits and vegetables helps the body stay balanced with changing weather."
    },
    {
        title: "Reduce Screen Time",
        content: "Excessive screen use can cause eye strain and mental fatigue. Take regular breaks."
    },
    {
        title: "Gratitude Practice",
        content: "Reflecting on one positive thing daily improves mental well-being and reduces stress."
    },
    {
        title: "Avoid Suppressing Urges",
        content: "Ignoring natural urges like hunger, thirst, or sleep can disturb bodily balance over time."
    },
    {
        title: "Light Stretching",
        content: "Simple stretches improve flexibility, reduce stiffness, and support joint health."
    },
    {
        title: "Calm Evenings",
        content: "Reducing noise, bright lights, and stimulation in the evening prepares your body for restful sleep."
    },
    {
        title: "Eat According to Hunger",
        content: "Eat only when you feel true hunger. This supports proper digestion and prevents toxin buildup."
    },
    {
        title: "Spice Support",
        content: "Mild spices like ginger, cumin, and turmeric help stimulate digestion and reduce bloating."
    },
    {
        title: "Avoid Overeating",
        content: "Fill half your stomach with food, one-quarter with water, and leave the rest empty for digestion."
    },
    {
        title: "Warm Breakfast",
        content: "A warm, nourishing breakfast is easier to digest than cold or processed foods."
    },
    {
        title: "Proper Sitting While Eating",
        content: "Sit calmly while eating. Eating on the move can disturb digestion."
    },
    {
        title: "Short Post-Meal Walk",
        content: "A slow 5–10 minute walk after meals helps digestion and prevents heaviness."
    },
    {
        title: "Reduce Sugar Intake",
        content: "Excess sugar can cause energy crashes, inflammation, and weakened immunity."
    },
    {
        title: "Healthy Gut",
        content: "A well-functioning gut supports immunity, mood, and energy levels."
    },
    {
        title: "Nasal Breathing",
        content: "Breathing through the nose filters air better and improves oxygen utilization."
    },
    {
        title: "Oil the Nostrils",
        content: "A drop of warm oil in each nostril can help keep nasal passages moist and clear."
    },
    {
        title: "Avoid Daytime Sleeping",
        content: "Long daytime naps can slow digestion and disturb nighttime sleep patterns."
    },
    {
        title: "Listen to Body Signals",
        content: "Fatigue, irritation, or pain are signals—acknowledge them early rather than ignoring them."
    },
    {
        title: "Limit Processed Foods",
        content: "Fresh, whole foods are easier for the body to process than packaged items."
    },
    {
        title: "Grounding Practice",
        content: "Spending time barefoot on natural surfaces can help calm the nervous system."
    },
    {
        title: "Balanced Work Breaks",
        content: "Taking short breaks during work improves focus and prevents burnout."
    },
    {
        title: "Gentle Evening Activity",
        content: "Light stretching or calm movement in the evening relaxes muscles before sleep."
    },
    {
        title: "Self-Awareness",
        content: "Regularly check in with your emotions and thoughts to maintain mental balance."
    },
    {
        title: "Avoid Cold Showers at Night",
        content: "Cold water at night can stimulate the body and disrupt sleep quality."
    },
    {
        title: "Natural Appetite Rhythm",
        content: "Your digestive strength is strongest at midday—make lunch your largest meal."
    },
    {
        title: "Consistent Routine",
        content: "A regular daily routine helps stabilize energy, digestion, and mental clarity."
    },
    {
        title: "Joint Care",
        content: "Gentle daily movement keeps joints lubricated and reduces stiffness over time."
    },
    {
        title: "Warmth for Pain",
        content: "Applying warmth can relax muscles and help relieve mild aches and tension."
    },
    {
        title: "Avoid Sudden Movements",
        content: "Move slowly and mindfully to prevent muscle strain and joint injuries."
    },
    {
        title: "Immunity Through Rest",
        content: "Adequate sleep is one of the strongest natural immunity boosters."
    },
    {
        title: "Seasonal Balance",
        content: "Adjust your diet and lifestyle as seasons change to stay balanced and healthy."
    },
    {
        title: "Manage Vata",
        content: "Irregular routines and cold foods can aggravate restlessness and dryness."
    },
    {
        title: "Manage Pitta",
        content: "Excess heat, stress, or spicy food may increase irritability and inflammation."
    },
    {
        title: "Manage Kapha",
        content: "Too much heaviness or inactivity can lead to sluggishness and low energy."
    },
    {
        title: "Early Pain Awareness",
        content: "Address minor discomfort early to prevent it from becoming chronic pain."
    },
    {
        title: "Natural Anti-Inflammation",
        content: "Foods like turmeric and ginger support the body’s natural inflammation response."
    },
    {
        title: "Breathing for Pain Relief",
        content: "Slow breathing can reduce pain perception by calming the nervous system."
    },
    {
        title: "Mental Rest",
        content: "Mental fatigue can worsen physical pain—allow your mind time to relax."
    },
    {
        title: "Hydration for Joints",
        content: "Proper hydration helps maintain joint cushioning and flexibility."
    },
    {
        title: "Avoid Holding Tension",
        content: "Notice where you hold stress in your body and consciously relax those areas."
    },
    {
        title: "Light Evening Meals",
        content: "Heavy dinners can disturb sleep and worsen morning stiffness."
    },
    {
        title: "Daily Sun Exposure",
        content: "Sunlight supports bone health, immunity, and mood regulation."
    },
    {
        title: "Mind–Body Connection",
        content: "Emotional stress can manifest as physical pain if ignored for long periods."
    },
    {
        title: "Consistent Physical Activity",
        content: "Regular, moderate exercise is better than occasional intense workouts."
    },
    {
        title: "Warm Foods for Calm",
        content: "Warm, cooked foods help soothe digestion and calm the nervous system."
    },
    {
        title: "Recovery Days Matter",
        content: "Rest days allow tissues to heal and prevent overuse injuries."
    },
    {
        title: "Morning Silence",
        content: "Spending a few minutes in silence after waking helps stabilize the mind for the day."
    },
    {
        title: "Single-Task Focus",
        content: "Doing one task at a time improves efficiency and reduces mental stress."
    },
    {
        title: "Avoid Overstimulation",
        content: "Constant notifications and noise can exhaust the nervous system."
    },
    {
        title: "Digest Emotions",
        content: "Unprocessed emotions can affect digestion and overall well-being."
    },
    {
        title: "Regular Meal Timing",
        content: "Eating at consistent times supports digestive rhythm and hormone balance."
    },
    {
        title: "Chew Thoroughly",
        content: "Proper chewing reduces digestive load and improves nutrient absorption."
    },
    {
        title: "Avoid Ice-Cold Foods",
        content: "Very cold foods can weaken digestive fire and slow metabolism."
    },
    {
        title: "Mindful Caffeine Use",
        content: "Excess caffeine may increase anxiety and disturb sleep patterns."
    },
    {
        title: "Hormone-Friendly Sleep",
        content: "Sleeping before midnight supports natural hormone repair cycles."
    },
    {
        title: "Balanced Morning Energy",
        content: "Rushing in the morning can create stress that lasts all day."
    },
    {
        title: "Calm Transitions",
        content: "Pause briefly between activities to prevent mental overload."
    },
    {
        title: "Digestive Pause",
        content: "Avoid snacking continuously; allow time for digestion between meals."
    },
    {
        title: "Mental Decluttering",
        content: "Writing down thoughts can help clear mental clutter and anxiety."
    },
    {
        title: "Avoid Late Screen Exposure",
        content: "Bright screens at night can interfere with sleep hormones."
    },
    {
        title: "Natural Energy Cycles",
        content: "Energy rises and falls naturally—work with it instead of fighting it."
    },
    {
        title: "Gentle Night Routine",
        content: "A predictable nighttime routine signals the body to unwind."
    },
    {
        title: "Stay Grounded Under Stress",
        content: "When stressed, slow down movements and breathing to regain control."
    },
    {
        title: "Digestive Comfort",
        content: "Lying on your left side after meals may improve digestion."
    },
    {
        title: "Reduce Mental Comparison",
        content: "Comparing yourself to others increases stress and dissatisfaction."
    },
    {
        title: "End Day with Gratitude",
        content: "Reflecting on positives before sleep improves emotional balance."
    },
    {
        title: "Longevity Through Routine",
        content: "A simple, consistent daily routine supports long-term health and stability."
    },
    {
        title: "Respect Digestive Strength",
        content: "Eating beyond your digestive capacity can lead to fatigue and discomfort."
    },
    {
        title: "Early Rising",
        content: "Waking up early aligns the body with natural energy cycles and mental clarity."
    },
    {
        title: "Moderate Exercise",
        content: "Exercise until lightly energized, not exhausted, to support longevity."
    },
    {
        title: "Natural Detox Support",
        content: "The body detoxifies best when digestion and sleep are well balanced."
    },
    {
        title: "Pain Is a Message",
        content: "Pain often signals imbalance—observe patterns instead of ignoring symptoms."
    },
    {
        title: "Avoid Long Sitting",
        content: "Prolonged sitting can cause stiffness and poor circulation."
    },
    {
        title: "Conscious Relaxation",
        content: "Intentional relaxation helps reset the nervous system."
    },
    {
        title: "Strengthen Core Gently",
        content: "A strong core supports posture and reduces back pain risk."
    },
    {
        title: "Seasonal Immunity Care",
        content: "Supporting immunity proactively is better than reacting to illness."
    },
    {
        title: "Hydration on Waking",
        content: "Drinking water after waking helps rehydrate tissues after sleep."
    },
    {
        title: "Avoid Excess Heat",
        content: "Too much heat or spice can increase inflammation in sensitive individuals."
    },
    {
        title: "Protect Mental Energy",
        content: "Not every thought needs engagement—choose where to focus."
    },
    {
        title: "Mindful Technology Use",
        content: "Regular tech breaks reduce mental fatigue and eye strain."
    },
    {
        title: "Pain-Free Movement",
        content: "Move within comfort limits to prevent injury and chronic pain."
    },
    {
        title: "Natural Sleep Signals",
        content: "Yawning and heaviness are signs to rest—don’t override them."
    },
    {
        title: "Digestive Calm",
        content: "Strong emotions during meals can disturb digestion."
    },
    {
        title: "Balanced Social Energy",
        content: "Too much or too little social interaction can affect mental balance."
    },
    {
        title: "Consistency Over Perfection",
        content: "Small daily habits matter more than occasional intense efforts."
    },
    {
        title: "Listen Before Fixing",
        content: "Understanding your body’s signals often brings clarity before action."
    }

];

export function DailyTipCard() {
    const [tip, setTip] = useState<Tip | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Randomize on mount
        const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setTip(randomTip);
    }, []);

    const refreshTip = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            setTip(randomTip);
            setIsRefreshing(false);
        }, 300);
    };

    if (!tip) return null; // Hydration safe

    return (
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-teal-50 to-white overflow-hidden relative">
            <CardContent className="pt-6">
                <div className="flex flex-col h-full justify-between space-y-4">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-teal-700">
                                <Lightbulb size={18} className="text-amber-500" fill="currentColor" />
                                <h3 className="font-semibold">Daily Tip</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-teal-600/50 hover:text-teal-700 hover:bg-teal-100/50"
                                onClick={refreshTip}
                            >
                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                            </Button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tip.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h4 className="font-medium text-slate-800 text-sm mb-1">{tip.title}</h4>
                                <p className="text-sm text-teal-800/80 leading-relaxed">
                                    {tip.content}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {tip.action && (
                        <Button variant="link" className="text-teal-700 p-0 h-auto justify-start font-semibold group w-fit">
                            {tip.action} <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Button>
                    )}
                </div>

                {/* Background Decor */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-100 rounded-full opacity-50 blur-xl pointer-events-none" />
            </CardContent>
        </Card>
    );
}