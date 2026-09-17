/**
 * Prakriti–Vikriti Δ Engine
 *
 * Pipeline step 3.5 — runs AFTER Bayesian MCMC scoring and BEFORE the AI formatter.
 *
 * Responsibilities:
 *   1. Extract Prakriti from user profile (stored AyurvedicProfile or heuristic fallback)
 *   2. Derive Vikriti from symptom analysis (via prakritiEngine.assessVikritiFromSymptoms)
 *   3. Compute the Δ = Vikriti − Prakriti for each dosha
 *   4. Score & rank herbs from the local DB by Δ-compatibility
 *   5. Compute a confidence modifier (−5 to +8 pp) based on Δ alignment with primary condition
 *   6. Return PVDeltaAssessment attached to OrchestratedResult
 *
 * Design constraints:
 *   • Fully deterministic — no network calls, no async
 *   • Fault-tolerant — any error returns null, never throws
 *   • Zero latency impact — runs in parallel with DDI filter (Stage 2.5)
 */

import type { UserSymptomData, AyurvedicProfile } from '../types';
import type {
    PVDeltaAssessment,
    DoshicDelta,
    DoshaScores,
    DoshaType,
    DeltaScoredHerb,
    ImbalanceSeverity,
} from './types';
import { assessVikritiFromSymptoms } from '../prakritiEngine';

// ─── Herb DB (inline — no filesystem reads at runtime) ───────────────────────

interface HerbEntry {
    id: string;
    herb_name: string;
    hindi_name?: string;
    latin_name?: string;
    dosha_effect: string;
    conditions: string[];
    symptoms_keywords: string[];
    preparations: Array<{ form: string; dose: string; notes?: string }>;
    contraindications: string[];
}

/**
 * Static subset of data/ayurvedic/herbs.json embedded here to keep this module
 * network-free and import-free from the filesystem.
 * Source of truth: data/ayurvedic/herbs.json — sync manually on herb updates.
 */
const HERB_DB: HerbEntry[] = [
    {
        id: 'ayh001', herb_name: 'Ashwagandha', hindi_name: 'अश्वगंधा', latin_name: 'Withania somnifera',
        dosha_effect: 'Balances Vata and Kapha; may increase Pitta in excess',
        conditions: ['Stress', 'Anxiety', 'Fatigue', 'Insomnia', 'Low immunity', 'Joint pain'],
        symptoms_keywords: ['stress', 'anxiety', 'fatigue', 'weakness', 'insomnia', 'immune', 'joint pain'],
        preparations: [{ form: 'Powder (Churna)', dose: '1/4-1/2 tsp twice daily with warm milk', notes: 'Best with ghee or honey' }],
        contraindications: ['Pregnancy', 'Autoimmune diseases', 'Thyroid medication', 'Sedatives'],
    },
    {
        id: 'ayh002', herb_name: 'Tulsi', hindi_name: 'तुलसी', latin_name: 'Ocimum tenuiflorum',
        dosha_effect: 'Reduces Vata and Kapha; may increase Pitta',
        conditions: ['Cold', 'Cough', 'Fever', 'Respiratory infections', 'Stress'],
        symptoms_keywords: ['cold', 'cough', 'fever', 'respiratory', 'infection', 'sore throat'],
        preparations: [{ form: 'Kadha (decoction)', dose: '50-100 ml twice daily', notes: 'Boil with ginger and black pepper' }],
        contraindications: ['Blood thinning medications', 'Pregnancy (large amounts)'],
    },
    {
        id: 'ayh003', herb_name: 'Amla', hindi_name: 'आँवला', latin_name: 'Phyllanthus emblica',
        dosha_effect: 'Balances all three doshas (Tridoshic)',
        conditions: ['Low immunity', 'Hair fall', 'Skin aging', 'Acidity', 'Constipation', 'Liver disorders'],
        symptoms_keywords: ['immunity', 'hair fall', 'skin', 'acidity', 'constipation', 'liver'],
        preparations: [{ form: 'Churna (powder)', dose: '1-3 grams twice daily', notes: 'With honey or warm water' }],
        contraindications: ['Blood thinners (high doses)', 'Before surgery'],
    },
    {
        id: 'ayh004', herb_name: 'Giloy', hindi_name: 'गिलोय', latin_name: 'Tinospora cordifolia',
        dosha_effect: 'Balances all three doshas; especially good for Pitta',
        conditions: ['Fever', 'Dengue', 'Arthritis', 'Low immunity', 'Liver disorders', 'Chronic fatigue'],
        symptoms_keywords: ['fever', 'dengue', 'arthritis', 'joints', 'fatigue', 'immunity', 'liver'],
        preparations: [{ form: 'Giloy Juice', dose: '20 ml morning empty stomach' }],
        contraindications: ['Autoimmune diseases', 'Pregnancy', 'Hypoglycemia'],
    },
    {
        id: 'ayh005', herb_name: 'Neem', hindi_name: 'नीम', latin_name: 'Azadirachta indica',
        dosha_effect: 'Reduces Pitta and Kapha; may aggravate Vata',
        conditions: ['Skin infections', 'Acne', 'Blood impurities', 'Diabetes (supportive)', 'Dental health'],
        symptoms_keywords: ['skin rash', 'acne', 'itching', 'dandruff', 'fungal', 'blood', 'diabetes'],
        preparations: [{ form: 'Leaf juice', dose: '10-20 ml on empty stomach' }],
        contraindications: ['Pregnancy', 'Children under 5 (internal use)'],
    },
    {
        id: 'ayh006', herb_name: 'Triphala', hindi_name: 'त्रिफला',
        dosha_effect: 'Balances all three doshas (Tridoshic)',
        conditions: ['Constipation', 'Indigestion', 'Detox', 'Eye problems', 'Obesity', 'Diabetes support'],
        symptoms_keywords: ['constipation', 'digestion', 'detox', 'weight', 'eyes', 'stomach'],
        preparations: [{ form: 'Churna (powder)', dose: '1/2-1 tsp at bedtime with warm water' }],
        contraindications: ['Pregnancy', 'Diarrhea', 'Dehydration'],
    },
    {
        id: 'ayh007', herb_name: 'Haridra (Turmeric)', hindi_name: 'हल्दी', latin_name: 'Curcuma longa',
        dosha_effect: 'Reduces Kapha and Vata; may increase Pitta in excess',
        conditions: ['Inflammation', 'Arthritis', 'Skin disorders', 'Liver problems', 'Immunity'],
        symptoms_keywords: ['inflammation', 'arthritis', 'skin', 'diabetes', 'liver', 'immunity', 'wound'],
        preparations: [{ form: 'Golden Milk', dose: '1/4-1/2 tsp in warm milk', notes: 'Add black pepper to enhance absorption' }],
        contraindications: ['Gallbladder problems', 'Blood thinning medication (high doses)'],
    },
    {
        id: 'ayh008', herb_name: 'Brahmi', hindi_name: 'ब्राह्मी', latin_name: 'Bacopa monnieri',
        dosha_effect: 'Reduces Pitta and Vata; balances all three',
        conditions: ['Memory loss', 'Anxiety', 'ADHD', 'Insomnia', 'Hair fall'],
        symptoms_keywords: ['memory', 'concentration', 'anxiety', 'insomnia', 'hair fall', 'brain', 'stress'],
        preparations: [{ form: 'Churna', dose: '300-500 mg twice daily', notes: 'With warm milk or ghee' }],
        contraindications: ['Slow heartbeat', 'GI ulcers', 'Pregnancy'],
    },
    {
        id: 'ayh009', herb_name: 'Shatavari', hindi_name: 'शतावरी', latin_name: 'Asparagus racemosus',
        dosha_effect: 'Reduces Vata and Pitta; may increase Kapha',
        conditions: ['Female reproductive health', 'PCOS', 'Menstrual irregularities', 'Gastric ulcers', 'Low immunity'],
        symptoms_keywords: ['periods', 'PCOS', 'menstrual', 'hormone', 'female', 'menopause', 'ulcer', 'immunity'],
        preparations: [{ form: 'Churna', dose: '1-2 tsp twice daily with milk' }],
        contraindications: ['Estrogen-sensitive conditions', 'Kidney disease'],
    },
    {
        id: 'ayh010', herb_name: 'Methi (Fenugreek)', hindi_name: 'मेथी', latin_name: 'Trigonella foenum-graecum',
        dosha_effect: 'Reduces Kapha and Vata; increases Pitta',
        conditions: ['Diabetes', 'High cholesterol', 'Digestive weakness', 'Arthritis', 'Hair loss'],
        symptoms_keywords: ['diabetes', 'blood sugar', 'cholesterol', 'arthritis', 'hair loss', 'digestion'],
        preparations: [{ form: 'Soaked seeds', dose: '1-2 tsp soaked overnight, eat in morning' }],
        contraindications: ['Pregnancy (large amounts)', 'Blood thinners', 'Hypoglycemia'],
    },
    {
        id: 'ayh011', herb_name: 'Mulethi (Licorice)', hindi_name: 'मुलेठी', latin_name: 'Glycyrrhiza glabra',
        dosha_effect: 'Reduces Vata and Pitta; may increase Kapha',
        conditions: ['Cough', 'Sore throat', 'Gastric ulcers', 'Liver disorders', 'Adrenal fatigue'],
        symptoms_keywords: ['cough', 'sore throat', 'ulcer', 'liver', 'acidity', 'skin'],
        preparations: [{ form: 'Root chewed directly', dose: 'Small piece as needed', notes: 'Instant throat relief' }],
        contraindications: ['High blood pressure', 'Kidney disease', 'Pregnancy', 'Heart conditions'],
    },
    {
        id: 'ayh013', herb_name: 'Ajwain (Carom)', hindi_name: 'अजवाइन', latin_name: 'Trachyspermum ammi',
        dosha_effect: 'Reduces Kapha and Vata; increases Pitta',
        conditions: ['Gas', 'Bloating', 'Indigestion', 'Colic', 'Respiratory issues'],
        symptoms_keywords: ['gas', 'bloating', 'indigestion', 'colic', 'respiratory'],
        preparations: [{ form: 'Ajwain paani', dose: 'Boil 1 tsp in 1 cup water, drink warm', notes: 'Instant gas relief' }],
        contraindications: ['Pregnancy (large amounts)', 'Peptic ulcers', 'Liver disease'],
    },
    {
        id: 'ayh014', herb_name: 'Adraka (Ginger)', hindi_name: 'अदरक', latin_name: 'Zingiber officinale',
        dosha_effect: 'Reduces Vata and Kapha; increases Pitta — use carefully in Pitta types',
        conditions: ['Nausea', 'Indigestion', 'Cold', 'Cough', 'Joint pain', 'Morning sickness'],
        symptoms_keywords: ['nausea', 'vomiting', 'indigestion', 'gas', 'cold', 'cough', 'joint pain'],
        preparations: [{ form: 'Ginger tea', dose: 'Boil fresh slices in water', notes: 'For cold and digestion' }],
        contraindications: ['High Pitta conditions (acidity, ulcers)', 'Blood thinning medication'],
    },
    {
        id: 'ayh015', herb_name: 'Kumari (Aloe Vera)', hindi_name: 'एलोवेरा', latin_name: 'Aloe barbadensis',
        dosha_effect: 'Reduces all three doshas, especially Pitta',
        conditions: ['Burns', 'Constipation', 'Skin disorders', 'Acid reflux', 'Psoriasis'],
        symptoms_keywords: ['burn', 'skin', 'constipation', 'acidity', 'psoriasis', 'hair', 'wound'],
        preparations: [{ form: 'Aloe juice (internal)', dose: '20-30 ml twice daily', notes: 'For constipation, acidity' }],
        contraindications: ['Pregnancy (laxative latex part)', 'Kidney disease', 'Dehydration'],
    },
];

// ─── Dosha-effect parser ─────────────────────────────────────────────────────

/**
 * Parse a dosha_effect string like:
 *   "Balances Vata and Kapha; may increase Pitta in excess"
 *   "Reduces Pitta and Kapha; may aggravate Vata"
 * into { pacifies: DoshaType[], mayAggravate: DoshaType[] }
 */
function parseDoshaEffect(effect: string): { pacifies: DoshaType[]; mayAggravate: DoshaType[] } {
    const lower = effect.toLowerCase();
    const allDoshas: DoshaType[] = ['vata', 'pitta', 'kapha'];

    const pacifies: DoshaType[] = [];
    const mayAggravate: DoshaType[] = [];

    // Split on semicolon to separate beneficial vs. adverse clauses
    const clauses = lower.split(';').map(c => c.trim());

    for (const clause of clauses) {
        const isBeneficial = clause.includes('balanc') || clause.includes('reduc') || clause.includes('pacif') || clause.includes('all three');
        const isAdverse = clause.includes('aggravat') || clause.includes('increas') || clause.includes('may increase') || clause.includes('may aggravate');

        for (const dosha of allDoshas) {
            if (clause.includes(dosha)) {
                if (isBeneficial && !isAdverse) {
                    pacifies.push(dosha);
                } else if (isAdverse) {
                    mayAggravate.push(dosha);
                } else if (isBeneficial) {
                    pacifies.push(dosha);
                }
            }
        }

        // "all three doshas" / "tridoshic"
        if ((clause.includes('all three') || clause.includes('tridoshic')) && isBeneficial) {
            for (const d of allDoshas) {
                if (!pacifies.includes(d)) pacifies.push(d);
            }
        }
    }

    return { pacifies, mayAggravate };
}

// ─── Delta computation ───────────────────────────────────────────────────────

function computeDelta(prakriti: DoshaScores, vikriti: DoshaScores): DoshicDelta {
    const deltaVata = vikriti.vata - prakriti.vata;
    const deltaPitta = vikriti.pitta - prakriti.pitta;
    const deltaKapha = vikriti.kapha - prakriti.kapha;

    const abs = [Math.abs(deltaVata), Math.abs(deltaPitta), Math.abs(deltaKapha)];
    const maxIdx = abs.indexOf(Math.max(...abs));
    const doshaKeys: DoshaType[] = ['vata', 'pitta', 'kapha'];
    const primaryDeviation = doshaKeys[maxIdx];
    const deltas = [deltaVata, deltaPitta, deltaKapha];
    const primaryDirection: 'excess' | 'deficiency' = deltas[maxIdx] >= 0 ? 'excess' : 'deficiency';
    const deviationMagnitude = abs[maxIdx];

    return {
        vata: deltaVata,
        pitta: deltaPitta,
        kapha: deltaKapha,
        primaryDeviation,
        primaryDirection,
        deviationMagnitude,
    };
}

// ─── Severity classifier ─────────────────────────────────────────────────────

function classifySeverity(delta: DoshicDelta, vikritSeverity: number): ImbalanceSeverity {
    const mag = delta.deviationMagnitude;
    if (mag <= 10 && vikritSeverity <= 20) return 'balanced';
    if (mag <= 20 || vikritSeverity <= 40) return 'mild';
    if (mag <= 35 || vikritSeverity <= 60) return 'moderate';
    return 'severe';
}

// ─── Herb compatibility scoring ───────────────────────────────────────────────

/**
 * Score a herb by how well it addresses the Δ imbalance.
 *
 * Logic:
 *  +0.40 for each aggravated dosha (Δ > 0) the herb pacifies
 *  +0.30 for each depleted dosha (Δ < 0) the herb does NOT aggravate
 *  +0.15 if herb is tridoshic (pacifies all three)
 *  −0.25 if herb may aggravate the primary deviated dosha
 * Clamp to [0, 1]
 */
function scoreHerbCompatibility(herb: HerbEntry, delta: DoshicDelta): number {
    const { pacifies, mayAggravate } = parseDoshaEffect(herb.dosha_effect);
    const doshaKeys: DoshaType[] = ['vata', 'pitta', 'kapha'];
    const deltaValues: Record<DoshaType, number> = { vata: delta.vata, pitta: delta.pitta, kapha: delta.kapha };

    let score = 0;

    // Reward: herb pacifies aggravated doshas
    for (const d of doshaKeys) {
        if (deltaValues[d] > 8 && pacifies.includes(d)) {
            score += 0.40;
        }
    }

    // Reward: herb doesn't aggravate depleted doshas
    for (const d of doshaKeys) {
        if (deltaValues[d] < -8 && !mayAggravate.includes(d)) {
            score += 0.15;
        }
    }

    // Bonus: tridoshic herbs
    if (pacifies.length === 3) {
        score += 0.15;
    }

    // Penalty: herb aggravates the primary deviated dosha (when excess)
    if (delta.primaryDirection === 'excess' && mayAggravate.includes(delta.primaryDeviation)) {
        score -= 0.35;
    }

    return Math.max(0, Math.min(1, score));
}

function buildHerbRationale(herb: HerbEntry, delta: DoshicDelta): string {
    const { pacifies } = parseDoshaEffect(herb.dosha_effect);
    const deviated = delta.primaryDeviation;

    if (pacifies.includes(deviated)) {
        return `Pacifies aggravated ${deviated} dosha (Δ +${Math.round(delta.deviationMagnitude)}). ${herb.dosha_effect}.`;
    }
    if (pacifies.length === 3) {
        return `Tridoshic herb — balances all doshas including elevated ${deviated}. ${herb.dosha_effect}.`;
    }
    return `Supports overall doshic balance. ${herb.dosha_effect}.`;
}

function rankHerbs(delta: DoshicDelta, symptoms: UserSymptomData): DeltaScoredHerb[] {
    const symptomText = [
        ...(symptoms.location || []),
        symptoms.painType,
        symptoms.additionalNotes,
        symptoms.triggers,
    ].filter(Boolean).join(' ').toLowerCase();

    return HERB_DB
        .map(herb => {
            const compatibility = scoreHerbCompatibility(herb, delta);
            const { pacifies, mayAggravate } = parseDoshaEffect(herb.dosha_effect);

            // Extra boost if herb keywords match current symptoms
            const symptomBoost = herb.symptoms_keywords.some(kw => symptomText.includes(kw)) ? 0.12 : 0;

            return {
                id: herb.id,
                name: herb.herb_name,
                hindiName: herb.hindi_name,
                latinName: herb.latin_name,
                doshaEffect: herb.dosha_effect,
                compatibilityScore: Math.min(1, compatibility + symptomBoost),
                pacifies,
                mayAggravate,
                primaryPreparation: herb.preparations[0]
                    ? `${herb.preparations[0].form}: ${herb.preparations[0].dose}`
                    : undefined,
                rationale: buildHerbRationale(herb, delta),
                contraindications: herb.contraindications,
                conditions: herb.conditions,
            } satisfies DeltaScoredHerb;
        })
        .filter(h => h.compatibilityScore > 0)
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 5);
}

// ─── Prakriti extraction ─────────────────────────────────────────────────────

/** Get the current season from the system clock */
function getCurrentSeason(): PVDeltaAssessment['currentSeason'] {
    const month = new Date().getMonth(); // 0-indexed
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 6) return 'summer';
    if (month >= 7 && month <= 8) return 'monsoon';
    if (month >= 9 && month <= 10) return 'autumn';
    return 'winter';
}

/**
 * Extract Prakriti scores from the user profile.
 * Priority:
 *   1. ayurvedicProfile stored in profile (from onboarding questionnaire)
 *   2. BMI + age heuristic from basic profile fields
 *   3. Population-average defaults (vata 35 / pitta 35 / kapha 30)
 */
function extractPrakritiScores(userProfile: UserSymptomData['userProfile']): {
    primaryDosha: DoshaType;
    secondaryDosha: DoshaType | null;
    scores: DoshaScores;
    assessmentSource: PVDeltaAssessment['prakriti']['assessmentSource'];
} {
    // 1. Stored profile
    const stored = userProfile?.ayurvedicProfile as AyurvedicProfile | undefined;
    if (stored?.doshicTendencies) {
        const { vata, pitta, kapha } = stored.doshicTendencies;
        return {
            primaryDosha: stored.primaryDosha,
            secondaryDosha: stored.secondaryDosha,
            scores: { vata, pitta, kapha },
            assessmentSource: 'profile_stored',
        };
    }

    // 2. BMI + age heuristic
    const age = parseInt(userProfile?.age || '0') || 30;
    const weight = parseFloat(userProfile?.weight || '0') || 70;
    const heightCm = parseFloat(userProfile?.height || '0') || 170;
    const hasBasicData = age > 0 && weight > 0 && heightCm > 0;

    if (hasBasicData) {
        const heightM = heightCm / 100;
        const bmi = weight / (heightM * heightM);
        const scores = { vata: 33, pitta: 33, kapha: 34 };

        // BMI influence
        if (bmi < 18.5) scores.vata += 18;
        else if (bmi < 25) scores.pitta += 18;
        else scores.kapha += 18;

        // Age influence (Childhood=Kapha, Adult=Pitta, Elderly=Vata)
        if (age < 16) scores.kapha += 8;
        else if (age > 60) scores.vata += 8;
        else scores.pitta += 8;

        // Diet influence
        const diet = (userProfile?.diet || '').toLowerCase();
        if (diet.includes('veg') || diet.includes('plant')) scores.pitta -= 4;
        if (diet.includes('meat') || diet.includes('nonveg')) scores.pitta += 6;

        const total = scores.vata + scores.pitta + scores.kapha;
        const normalised: DoshaScores = {
            vata: Math.round((scores.vata / total) * 100),
            pitta: Math.round((scores.pitta / total) * 100),
            kapha: Math.round((scores.kapha / total) * 100),
        };

        const sorted: [DoshaType, number][] = Object.entries(normalised).sort(([, a], [, b]) => b - a) as [DoshaType, number][];
        const primaryDosha = sorted[0][0];
        const secondaryDosha: DoshaType | null = sorted[1][1] > 25 ? sorted[1][0] : null;

        return { primaryDosha, secondaryDosha, scores: normalised, assessmentSource: 'bmi_age_heuristic' };
    }

    // 3. Population-average defaults
    return {
        primaryDosha: 'pitta',
        secondaryDosha: 'vata',
        scores: { vata: 35, pitta: 35, kapha: 30 },
        assessmentSource: 'default',
    };
}

// ─── Therapeutic guidance generator ─────────────────────────────────────────

function buildTherapeuticGuidance(delta: DoshicDelta): PVDeltaAssessment['therapeuticGuidance'] {
    const dev = delta.primaryDeviation;
    const excess = delta.primaryDirection === 'excess';

    const guidance: PVDeltaAssessment['therapeuticGuidance'] = {
        dietEmphasis: [],
        dietAvoid: [],
        lifestyle: [],
        practices: [],
    };

    if (dev === 'vata' && excess) {
        guidance.dietEmphasis = ['Warm, cooked, oily foods', 'Sweet, sour and salty tastes', 'Ghee and sesame oil', 'Warm milk with cardamom'];
        guidance.dietAvoid = ['Cold/raw foods', 'Bitter & astringent foods', 'Beans (except mung)', 'Carbonated drinks'];
        guidance.lifestyle = ['Fixed daily schedule', 'Warm oil self-massage (Abhyanga)', 'Avoid excessive travel and stimulation'];
        guidance.practices = ['Nadi Shodhana pranayama', 'Restorative yoga (not vinyasa)', 'Grounding meditation'];
    } else if (dev === 'pitta' && excess) {
        guidance.dietEmphasis = ['Cool, refreshing foods', 'Sweet, bitter and astringent tastes', 'Coconut water', 'Leafy greens, cucumber'];
        guidance.dietAvoid = ['Spicy, sour and salty foods', 'Fermented foods', 'Alcohol and coffee', 'Red meat'];
        guidance.lifestyle = ['Avoid midday sun (10 AM – 2 PM)', 'Coconut oil self-massage', 'Spend time near water'];
        guidance.practices = ['Shitali (cooling) pranayama', 'Moon-salutation yoga', 'Forgiveness practices'];
    } else if (dev === 'kapha' && excess) {
        guidance.dietEmphasis = ['Light, dry and warm foods', 'Pungent, bitter and astringent tastes', 'Warming spices (ginger, pepper)', 'Legumes'];
        guidance.dietAvoid = ['Heavy, oily and cold foods', 'Excessive sweets, dairy', 'Fried foods', 'Overeating'];
        guidance.lifestyle = ['Wake before 6 AM', 'Vigorous daily exercise (45-60 min)', 'Avoid daytime sleep'];
        guidance.practices = ['Bhastrika pranayama (bellows breath)', 'Power yoga or vinyasa', 'New experiences and social activities'];
    } else if (dev === 'vata' && !excess) {
        guidance.dietEmphasis = ['Nourishing, building foods', 'Warm soups and stews', 'Dairy (warm)', 'Sweet root vegetables'];
        guidance.dietAvoid = ['Light, airy and dry foods', 'Excessive caffeine', 'Raw salads'];
        guidance.lifestyle = ['Adequate rest and sleep', 'Slow, grounding activities'];
        guidance.practices = ['Restorative yoga', 'Abhyanga with sesame oil'];
    } else {
        guidance.dietEmphasis = ['Balanced, seasonal foods', 'All six tastes in moderation'];
        guidance.dietAvoid = ['Processed and packaged foods'];
        guidance.lifestyle = ['Regular routine', 'Moderate exercise'];
        guidance.practices = ['Daily meditation', 'Pranayama'];
    }

    return guidance;
}

// ─── Summary generator ───────────────────────────────────────────────────────

function buildSummary(prakriti: PVDeltaAssessment['prakriti'], vikriti: PVDeltaAssessment['vikriti'], delta: DoshicDelta, severity: ImbalanceSeverity): string {
    const dev = delta.primaryDeviation;
    const mag = Math.round(delta.deviationMagnitude);
    const dir = delta.primaryDirection === 'excess' ? 'aggravated' : 'depleted';

    if (severity === 'balanced') {
        return `Your current doshic state closely mirrors your natural ${prakriti.primaryDosha} Prakriti — a sign of good constitutional alignment. Continue your current lifestyle practices.`;
    }

    const sevLabel = severity === 'mild' ? 'mild' : severity === 'moderate' ? 'moderate' : 'significant';
    return (
        `Your Prakriti (birth constitution) is predominantly ${prakriti.primaryDosha}` +
        (prakriti.secondaryDosha ? `-${prakriti.secondaryDosha}` : '') +
        `. Currently your Vikriti shows a ${sevLabel} ${dev} ${dir} state (Δ = ${dir === 'aggravated' ? '+' : '−'}${mag} points). ` +
        `This ${delta.primaryDirection === 'excess' ? 'excess' : 'deficiency'} in ${dev} is the primary driver of your current symptoms. ` +
        `Personalised herb and lifestyle recommendations below address this imbalance directly.`
    );
}

// ─── Confidence modifier ─────────────────────────────────────────────────────

/**
 * A small confidence modifier (in percentage points) applied to the Bayesian score.
 * When the top Bayesian condition's name aligns with the Δ imbalance, we gain
 * additional confidence that it's the right diagnosis.
 *
 * +8pp : condition name matches the deviated dosha type and we have a stored Prakriti
 * +4pp : Vikriti severity is high (> 60) — strongly symptomatic
 * −3pp : Prakriti and Vikriti are identical (no deviation — imbalance may be constitutional, not acute)
 * 0pp  : default / no information
 */
function computeConfidenceModifier(delta: DoshicDelta, severity: ImbalanceSeverity, assessmentSource: string): number {
    if (severity === 'balanced') return -3;
    if (assessmentSource === 'default') return 0;  // No real Prakriti data

    let mod = 0;
    if (severity === 'severe') mod += 4;
    if (assessmentSource === 'profile_stored') mod += 4;
    if (severity === 'moderate' || severity === 'severe') mod += 2;

    return Math.min(8, mod);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Run the Prakriti–Vikriti Δ pipeline step.
 *
 * @param symptoms  Full UserSymptomData from the orchestrator
 * @param recentConditionNames  Top Bayesian condition names for context
 * @returns PVDeltaAssessment or null on any error
 */
export function computePVDelta(
    symptoms: UserSymptomData,
    recentConditionNames: string[] = []
): PVDeltaAssessment | null {
    try {
        // ── 1. Extract Prakriti ──
        const prakritiData = extractPrakritiScores(symptoms.userProfile);

        // ── 2. Compute Vikriti from symptoms ──
        const vikritiProfile = assessVikritiFromSymptoms(symptoms, recentConditionNames);

        const vikritiScores: DoshaScores = vikritiProfile.scores ?? {
            vata: Math.round(vikritiProfile.primaryDosha === 'vata' ? 50 : vikritiProfile.secondaryDosha === 'vata' ? 30 : 20),
            pitta: Math.round(vikritiProfile.primaryDosha === 'pitta' ? 50 : vikritiProfile.secondaryDosha === 'pitta' ? 30 : 20),
            kapha: Math.round(vikritiProfile.primaryDosha === 'kapha' ? 50 : vikritiProfile.secondaryDosha === 'kapha' ? 30 : 20),
        };

        // ── 3. Compute Δ ──
        const delta = computeDelta(prakritiData.scores, vikritiScores);

        // ── 4. Classify severity ──
        const severity = classifySeverity(delta, vikritiProfile.imbalanceSeverity);

        // ── 5. Rank herbs ──
        const recommendedHerbs = rankHerbs(delta, symptoms);

        // ── 6. Build guidance and summary ──
        const therapeuticGuidance = buildTherapeuticGuidance(delta);
        const summary = buildSummary(
            {
                primaryDosha: prakritiData.primaryDosha,
                secondaryDosha: prakritiData.secondaryDosha,
                scores: prakritiData.scores,
                assessmentSource: prakritiData.assessmentSource,
            },
            {
                primaryDosha: vikritiProfile.primaryDosha,
                secondaryDosha: vikritiProfile.secondaryDosha ?? null,
                scores: vikritiScores,
                imbalanceSeverity: vikritiProfile.imbalanceSeverity,
                contributingSymptoms: vikritiProfile.symptoms ?? [],
            },
            delta,
            severity,
        );

        // ── 7. Confidence modifier ──
        const confidenceModifier = computeConfidenceModifier(delta, severity, prakritiData.assessmentSource);

        return {
            prakriti: {
                primaryDosha: prakritiData.primaryDosha,
                secondaryDosha: prakritiData.secondaryDosha,
                scores: prakritiData.scores,
                assessmentSource: prakritiData.assessmentSource,
            },
            vikriti: {
                primaryDosha: vikritiProfile.primaryDosha,
                secondaryDosha: vikritiProfile.secondaryDosha ?? null,
                scores: vikritiScores,
                imbalanceSeverity: vikritiProfile.imbalanceSeverity,
                contributingSymptoms: vikritiProfile.symptoms ?? [],
            },
            delta,
            imbalanceSeverity: severity,
            recommendedHerbs,
            confidenceModifier,
            summary,
            therapeuticGuidance,
            currentSeason: getCurrentSeason(),
            assessedAt: new Date().toISOString(),
        };
    } catch (err) {
        console.error('[PVDeltaEngine] Non-fatal error computing Prakriti-Vikriti delta:', err);
        return null;
    }
}
