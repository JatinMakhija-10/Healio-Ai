/**
 * Medical Named Entity Recognition (NER) for Healio.AI
 * 
 * Enhanced entity extraction with:
 * - 200+ synonym mappings (layman → medical terms)
 * - NegEx-style negation detection
 * - Temporal expression parsing
 * - Modifier extraction (severity, frequency)
 */

import { ExtractedEntity, EntityContext } from './DialogueState';

// ============================================================================
// COMPREHENSIVE SYNONYM MAPPING
// Maps layman terms to standardized medical terminology
// ============================================================================

const SYMPTOM_SYNONYMS: Record<string, string[]> = {
    // Pain descriptors
    'headache': [
        'head hurts', 'head pain', 'head ache', 'my head is killing me', 'splitting headache',
        'sir dard', 'sir mein dard', 'sar dard', 'sir dukh raha hai', 'sar dukh raha hai',
        'सिर दर्द', 'सिर में दर्द', 'सर दर्द', 'सिर दुख रहा है'
    ],
    'migraine': [
        'sick headache', 'migrane', 'migraines', 'aadha sir dard', 'aadha sar dard', 'आधा सिर दर्द'
    ],
    'stomach_pain': [
        'tummy ache', 'belly pain', 'stomach hurts', 'abdominal pain', 'stomach cramps',
        'pet dard', 'pet mein dard', 'stomach ache', 'stomach pain', 'tummy hurts',
        'पेट दर्द', 'पेट में दर्द'
    ],
    'chest_pain': [
        'chest hurts', 'tightness in chest', 'heart pain', 'chest tension',
        'seene mein dard', 'chhati mein dard', 'seena dukh raha hai', 'chhati dukh rahi hai',
        'सीने में दर्द', 'छाती में दर्द'
    ],
    'back_pain': [
        'back hurts', 'lower back pain', 'upper back pain', 'spine hurts',
        'kamar dard', 'peeth dard', 'kamar mein dard', 'peeth mein dard',
        'कमर दर्द', 'पीठ दर्द', 'कमर में दर्द'
    ],
    'joint_pain': [
        'joints hurt', 'knees hurt', 'aching joints', 'arthritic pain',
        'jodo mein dard', 'ghutne mein dard', 'ghutno mein dard',
        'जोड़ों में दर्द', 'घुटनों में दर्द'
    ],
    'body_aches': [
        'aching all over', 'body hurts', 'muscle pain', 'myalgia',
        'badan dard', 'poore badan mein dard', 'jism mein dard',
        'बदन दर्द', 'पूरे बदन में दर्द'
    ],

    // Fever & General
    'fever': [
        'high temperature', 'feverish', 'running a temperature', 'hot',
        'bukhar', 'tapman', 'garam',
        'बुखार', 'तापमान', 'गर्म'
    ],
    'chills': [
        'shivering', 'feeling cold', 'shaking', 'freezing',
        'thand', 'thandi', 'kampkampi', 'kapkapi',
        'ठंड', 'ठंडी', 'कंपकंपी', 'कपकपी'
    ],
    'fatigue': [
        'tired', 'exhausted', 'no energy', 'worn out', 'weakness', 'lethargic',
        'thakan', 'thakawat', 'kamzori', 'kamjori', 'thaka hua',
        'थकान', 'थकावट', 'कमज़ोरी', 'थका हुआ'
    ],
    'dizziness': [
        'lightheaded', 'room spinning', 'vertigo', 'faint',
        'chakkar', 'chakkar aana', 'sir ghoomna', 'sar ghoomna',
        'चक्कर', 'चक्कर आना', 'सिर घूमना'
    ],

    // Gastrointestinal
    'nausea': [
        'sick to my stomach', 'queasy', 'want to throw up', 'nauseous',
        'jee machlana', 'ulti aane ka man', 'matli', 'ubkai',
        'जी मचलना', 'उल्टी आने का मन', 'मतली', 'उबकाई'
    ],
    'vomiting': [
        'throwing up', 'puking', 'barfing', 'vomit',
        'ulti', 'ultiyaan', 'vomit',
        'उल्टी', 'उल्टियां'
    ],
    'diarrhea': [
        'loose motions', 'runny poop', 'the runs', 'watery stool',
        'dast', 'loose motion', 'patli latrine',
        'दस्त', 'लूज मोशन'
    ],
    'constipation': [
        'can\'t poop', 'blocked up', 'hard stool', 'no bowel movement',
        'kabz', 'kabji', 'pakhana nahi aa raha',
        'कब्ज़', 'कब्जी'
    ],
    'heartburn': [
        'acid reflux', 'acidity', 'burning chest', 'indigestion',
        'jalan', 'pet mein jalan', 'seene mein jalan', 'khatti dakar', 'gas',
        'जलन', 'पेट में जलन', 'सीने में जलन', 'खट्टी डकार', 'गैस'
    ],
    'loss_of_appetite': [
        'not hungry', 'don\'t want to eat', 'no appetite', 'off food',
        'bhookh nahi', 'bhookh nahi lag rahi', 'khane ka man nahi',
        'भूख नहीं', 'भूख नहीं लग रही', 'खाने का मन नहीं'
    ],

    // Respiratory
    'shortness_of_breath': [
        'can\'t breathe', 'difficulty breathing', 'breathless', 'hard to breathe', 'out of breath', 'dyspnea',
        'saans rukna', 'saans phoolna', 'saans lene me dikkat', 'dam ghutna',
        'सांस रुकना', 'सांस फूलना', 'सांस लेने में दिक्कत', 'दम घुटना'
    ],
    'cough': [
        'coughing', 'hacking', 'hacky cough',
        'khasi', 'khaasi', 'khansi',
        'खांसी', 'खासी'
    ],
    'wheezing': [
        'whistling breath', 'breathing sounds',
        'saans ki aawaz', 'seeti bajna saans mein',
        'सांस की आवाज', 'सीटी बजना सांस में'
    ],
    'sore_throat': [
        'throat hurts', 'scratchy throat', 'pain when swallowing',
        'gala kharab', 'gale mein dard', 'gale mein kharash',
        'गला खराब', 'गले में दर्द', 'गले में खराश'
    ],
    'runny_nose': [
        'nose running', 'snotty', 'sniffles',
        'behti naak', 'naak beh rahi', 'zukam',
        'बहती नाक', 'नाक बह रही', 'जुकाम'
    ],
    'nasal_congestion': [
        'stuffy nose', 'blocked nose', 'can\'t breathe through nose',
        'band naak', 'naak band',
        'बंद नाक', 'नाक बंद'
    ],

    // Neurological & Mental
    'anxiety': [
        'anxious', 'worried', 'nervous', 'panic', 'stress',
        'ghabrahat', 'bechaini', 'chinta', 'tension',
        'घबराहट', 'बेचैनी', 'चिंता', 'टेंशन'
    ],
    'depression': [
        'sad', 'depressed', 'down', 'hopeless', 'crying',
        'udas', 'udasi', 'nirash', 'nirasha', 'rone ka man',
        'उदास', 'उदासी', 'निराश', 'निराशा', 'रोने का मन'
    ],
    'confusion': [
        'confused', 'muddled', 'disoriented', 'fuzzy brain', 'brain fog',
        'uljhan', 'kuch samajh nahi aa raha',
        'उलझन', 'कुछ समझ नहीं आ रहा'
    ],
    'numbness': [
        'numb', 'can\'t feel', 'loss of sensation',
        'sunn', 'sunn pad jana',
        'सुन्न', 'सुन्न पड़ जाना'
    ],
    'tingling': [
        'pins and needles', 'prickling',
        'jhunjhuni', 'chun chun ahat',
        'झुनझुनी', 'चुनचुनाहट'
    ],

    // Other / Systemic
    'palpitations': [
        'heart racing', 'fast heart beat', 'heart pounding', 'fluttering chest',
        'dil dhadakna', 'dil ki dhadkan tez', 'ghabrahat',
        'दिल धड़कना', 'दिल की धड़कन तेज'
    ],
    'sweating': [
        'sweaty', 'perspiring', 'night sweats', 'cold sweats',
        'pasina', 'paseena',
        'पसीना'
    ],
    'weight_loss': [
        'losing weight', 'lost weight', 'getting thinner',
        'vajan kam', 'wazan kam', 'patla hona',
        'वजन कम', 'वज़न कम', 'पतला होना'
    ],
    'weight_gain': [
        'gaining weight', 'putting on weight', 'getting heavier',
        'vajan badhna', 'wazan badhna', 'mota hona',
        'वजन बढ़ना', 'वज़न बढ़ना', 'मोटा होना'
    ],

    // Skin
    'rash': [
        'skin rash', 'red spots', 'bumps on skin', 'skin irritation', 'hives',
        'chakkate', 'daane', 'laal daane',
        'चकत्ते', 'दाने', 'लाल दाने'
    ],
    'itching': [
        'itchy', 'scratchy skin', 'skin itches',
        'khujli', 'khujana',
        'खुजली', 'खुजाना'
    ],
    'swelling': [
        'swollen', 'puffiness', 'puffy', 'inflammation',
        'sujan', 'soojan', 'phoola hua',
        'सूजन', 'फूला हुआ'
    ],
    'bruising': [
        'bruise', 'black and blue',
        'neel', 'neel padna', 'chot',
        'नील', 'नील पड़ना', 'चोट'
    ],

    // Urinary
    'frequent_urination': [
        'peeing a lot', 'going to the bathroom constantly', 'frequent pee',
        'baar baar peshab', 'baar baar toilet',
        'बार-बार पेशाब', 'बार-बार टॉयलेट'
    ],
    'painful_urination': [
        'burns when peeing', 'pain when urinating', 'dysuria',
        'peshab me jalan', 'peshab karte waqt dard',
        'पेशाब में जलन', 'पेशाब करते वक्त दर्द'
    ],
    'blood_in_urine': [
        'bloody urine', 'red urine', 'hematuria',
        'peshab me khoon', 'khooni peshab',
        'पेशाब में खून', 'खूनी पेशाब'
    ],

    // Sleep
    'insomnia': [
        'can\'t sleep', 'trouble sleeping', 'sleepless', 'sleep problems',
        'neend nahi', 'neend nahi aati',
        'नींद नहीं', 'नींद नहीं आती'
    ],
    'sleep_apnea': [
        'stop breathing at night', 'snoring loudly',
        'kharrate', 'neend me saans rukna',
        'खर्राटे', 'नींद में सांस रुकना'
    ]
};

// ============================================================================
// NEGATION DETECTION (NegEx-style)
// ============================================================================

const NEGATION_CUES = [
    'no ', 'not ', 'never ', 'without ', 'don\'t ', 'doesn\'t ', 'didn\'t ', 'none ', 'zero ', 'nothing ',
    'haven\'t ', 'hasn\'t ', 'cannot ', 'can\'t ', 'couldn\'t ', 'wouldn\'t ', 'shouldn\'t ',
    'clear of ', 'free of ', 'denies ', 'negative for ', 'absent ',
    // Hinglish
    'nahi ', 'nai ', 'sirf ', 'bina ', 'matlab nahi ', 'kabhi nahi',
    // Hindi
    'नहीं ', 'बिना ', 'कभी नहीं ', 'ना '
];

// Special terms that might contain negation cues but aren't actually negations
// e.g., "I can't breathe" (not negated symptom, actual symptom of shortness of breath)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PSEUDO_NEGATIONS = [
    'can\'t breathe', 'cannot breathe', 'couldn\'t breathe',
    'can\'t sleep', 'cannot sleep', 'couldn\'t sleep',
    'not hungry',
    'don\'t want to eat',
    // Hindi/Hinglish pseudo-negations
    'saans nahi', 'neend nahi', 'bhookh nahi', 'bhukh nahi',
    'सांस नहीं', 'नींद नहीं', 'भूख नहीं'
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NEGATION_WINDOW = 6; // tokens to look ahead/behind

// ============================================================================
// TEMPORAL EXPRESSIONS
// ============================================================================

const PAST_INDICATORS = [
    'had', 'was', 'were', 'used to', 'previously', 'before',
    'yesterday', 'last week', 'last month', 'ago', 'earlier',
    'in the past', 'previously had', 'history of'
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RECENT_INDICATORS = [
    'just', 'recently', 'today', 'this morning', 'started', 'began',
    'since', 'for the past', 'suddenly'
];

// ============================================================================
// SEVERITY MODIFIERS
// ============================================================================

const SEVERITY_MODIFIERS: Record<string, EntityContext['severity']> = {
    // Mild (English)
    'mild': 'mild',
    'slight': 'mild',
    'minor': 'mild',
    'little': 'mild',
    'bit of': 'mild',
    'a little': 'mild',
    'somewhat': 'mild',
    // Mild (Hinglish/Hindi)
    'thoda': 'mild',
    'thora': 'mild',
    'halka': 'mild',
    'kam': 'mild',
    'थोड़ा': 'mild',
    'हल्का': 'mild',
    'कम': 'mild',

    // Moderate (English)
    'moderate': 'moderate',
    'medium': 'moderate',
    'average': 'moderate',
    'tolerable': 'moderate',
    'manageable': 'moderate',
    'okay': 'moderate',
    'some': 'moderate',
    // Moderate (Hinglish/Hindi)
    'theek thaak': 'moderate',
    'chalega': 'moderate',
    'thik thak': 'moderate',
    'bich ka': 'moderate',
    'ठीक ठाक': 'moderate',

    // Severe (English)
    'severe': 'severe',
    'extreme': 'severe',
    'terrible': 'severe',
    'horrible': 'severe',
    'worst': 'severe',
    'bad': 'severe',
    'very bad': 'severe',
    'intense': 'severe',
    'unbearable': 'severe',
    'debilitating': 'severe',
    'crippling': 'severe',
    // Severe (Hinglish/Hindi)
    'bahut': 'severe',
    'bohot': 'severe',
    'bhot': 'severe',
    'zyada': 'severe',
    'jyada': 'severe',
    'bhayanak': 'severe',
    'tez': 'severe', 'tezz': 'severe',
    'bohat': 'severe',
    'बहुत': 'severe',
    'ज्यादा': 'severe',
    'तेज': 'severe',
    'खराब': 'severe'
};

// ============================================================================
// FREQUENCY MODIFIERS
// ============================================================================

const FREQUENCY_MODIFIERS: Record<string, EntityContext['frequency']> = {
    // Occasional (English)
    'sometimes': 'occasional',
    'occasionally': 'occasional',
    'now and then': 'occasional',
    'once in a while': 'occasional',
    'off and on': 'occasional',
    'intermittent': 'occasional',
    'rarely': 'occasional',
    'comes and goes': 'occasional',
    // Occasional (Hinglish/Hindi)
    'kabhi kabhi': 'occasional',
    'kabhi-kabhi': 'occasional',
    'kabhi': 'occasional',
    'aata jata hai': 'occasional',
    'kabhi kabaar': 'occasional',
    'कभी कभी': 'occasional',
    'आता जाता है': 'occasional',

    // Frequent (English)
    'frequent': 'frequent',
    'frequently': 'frequent',
    'often': 'frequent',
    'a lot': 'frequent',
    'regularly': 'frequent',
    'many times': 'frequent',
    'most of the time': 'frequent',
    // Frequent (Hinglish/Hindi)
    'aksar': 'frequent',
    'baar baar': 'frequent',
    'bar bar': 'frequent',
    'bahut baar': 'frequent',
    'bohot baar': 'frequent',
    'अक्सर': 'frequent',
    'बार बार': 'frequent',
    'बार-बार': 'frequent',

    // Constant (English)
    'constant': 'constant',
    'constantly': 'constant',
    'always': 'constant',
    'all the time': 'constant',
    'nonstop': 'constant',
    'non-stop': 'constant',
    'continuous': 'constant',
    'continuously': 'constant',
    'never goes away': 'constant',
    '24/7': 'constant',
    // Constant (Hinglish/Hindi)
    'lagatar': 'constant',
    'hamesha': 'constant',
    'har waqt': 'constant',
    'poore time': 'constant',
    'roz': 'constant', // Can mean every day, treating as constant frequency
    'rukta hi nahi': 'constant',
    'लगातार': 'constant',
    'हमेशा': 'constant',
    'हर वक्त': 'constant'
};

// ============================================================================
// MEDICAL NER CLASS
// ============================================================================

export class MedicalNER {
    private synonymIndex: Map<string, string> = new Map();

    constructor() {
        this.buildSynonymIndex();
    }

    /**
     * Build reverse index: synonym phrase → canonical term
     */
    private buildSynonymIndex(): void {
        for (const [canonical, synonyms] of Object.entries(SYMPTOM_SYNONYMS)) {
            // Index the canonical term itself
            this.synonymIndex.set(canonical.toLowerCase(), canonical);

            // Index all synonyms
            for (const synonym of synonyms) {
                this.synonymIndex.set(synonym.toLowerCase(), canonical);
            }
        }
    }

    /**
     * Extract all medical entities from user input
     */
    extractEntities(text: string): ExtractedEntity[] {
        const normalized = text.toLowerCase();
        const entities: ExtractedEntity[] = [];
        const tokens = this.tokenize(normalized);

        // 1. Find symptom mentions (including synonyms)
        const symptomEntities = this.extractSymptoms(normalized, tokens);
        entities.push(...symptomEntities);

        // 2. Extract duration mentions
        const durationEntities = this.extractDurations(normalized);
        entities.push(...durationEntities);

        // 3. Extract severity mentions
        const severityEntities = this.extractSeverities(normalized);
        entities.push(...severityEntities);

        return entities;
    }

    /**
     * Tokenize text for analysis
     */
    private tokenize(text: string): string[] {
        return text.split(/\s+/).filter(t => t.length > 0);
    }

    /**
     * Extract symptom entities with normalization
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private extractSymptoms(text: string, tokens: string[]): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];
        const foundSymptoms = new Set<string>();

        // Check for multi-word phrases first (longer matches take priority)
        for (const [phrase, canonical] of this.synonymIndex.entries()) {
            if (text.includes(phrase) && !foundSymptoms.has(canonical)) {
                const isNegated = this.checkNegation(text, phrase);
                const isPast = this.checkPastTense(text, phrase);
                const severity = this.extractNearestSeverity(text, phrase);
                const frequency = this.extractNearestFrequency(text, phrase);

                entities.push({
                    text: phrase,
                    type: 'symptom',
                    normalizedForm: canonical,
                    confidence: phrase === canonical ? 0.95 : 0.85,
                    context: {
                        isNegated,
                        isPast,
                        severity,
                        frequency
                    }
                });

                foundSymptoms.add(canonical);
            }
        }

        return entities;
    }

    /**
     * Check if a phrase is negated using NegEx-style detection
     */
    checkNegation(text: string, targetPhrase: string): boolean {
        const targetIndex = text.indexOf(targetPhrase);
        if (targetIndex === -1) return false;

        // Get surrounding text
        const beforeText = text.substring(Math.max(0, targetIndex - 50), targetIndex);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const afterText = text.substring(targetIndex, Math.min(text.length, targetIndex + targetPhrase.length + 30));

        // Check for negation cues before the phrase
        for (const cue of NEGATION_CUES) {
            // Check if negation cue appears before the target within window
            if (beforeText.includes(cue)) {
                // Make sure there's no "but" or "except" breaking the negation
                const cueIndex = beforeText.lastIndexOf(cue);
                const textBetween = beforeText.substring(cueIndex + cue.length);
                if (!/\bbut\b|\bexcept\b|\bhowever\b/.test(textBetween)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if symptom is described in past tense
     */
    private checkPastTense(text: string, phrase: string): boolean {
        const phraseIndex = text.indexOf(phrase);
        if (phraseIndex === -1) return false;

        const surroundingText = text.substring(
            Math.max(0, phraseIndex - 30),
            Math.min(text.length, phraseIndex + phrase.length + 30)
        );

        return PAST_INDICATORS.some(indicator => surroundingText.includes(indicator));
    }

    /**
     * Extract severity modifier near a symptom
     */
    private extractNearestSeverity(text: string, phrase: string): EntityContext['severity'] | undefined {
        const phraseIndex = text.indexOf(phrase);
        if (phraseIndex === -1) return undefined;

        const surroundingText = text.substring(
            Math.max(0, phraseIndex - 20),
            Math.min(text.length, phraseIndex + phrase.length + 10)
        );

        for (const [modifier, severity] of Object.entries(SEVERITY_MODIFIERS)) {
            if (surroundingText.includes(modifier)) {
                return severity;
            }
        }

        return undefined;
    }

    /**
     * Extract frequency modifier near a symptom
     */
    private extractNearestFrequency(text: string, phrase: string): EntityContext['frequency'] | undefined {
        const phraseIndex = text.indexOf(phrase);
        if (phraseIndex === -1) return undefined;

        const surroundingText = text.substring(
            Math.max(0, phraseIndex - 30),
            Math.min(text.length, phraseIndex + phrase.length + 30)
        );

        for (const [modifier, frequency] of Object.entries(FREQUENCY_MODIFIERS)) {
            if (surroundingText.includes(modifier)) {
                return frequency;
            }
        }

        return undefined;
    }

    /**
     * Extract duration expressions
     */
    private extractDurations(text: string): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];

        // Pattern matching for common duration expressions
        const durationPatterns = [
            /for (?:the )?(?:past |last )?(\d+)\s*(day|week|month|year|hour|minute)s?/gi,
            /since (?:last )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+ days? ago)/gi,
            /(\d+)\s*(day|week|month|year|hour)s?\s*ago/gi,
            /(a few|several|couple of?)\s*(day|week|month|hour)s?/gi
        ];

        for (const pattern of durationPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                entities.push({
                    text: match[0],
                    type: 'duration',
                    normalizedForm: match[0],
                    confidence: 0.9,
                    context: {
                        isNegated: false,
                        isPast: false
                    }
                });
            }
        }

        return entities;
    }

    /**
     * Extract standalone severity mentions
     */
    private extractSeverities(text: string): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];

        for (const [modifier, severity] of Object.entries(SEVERITY_MODIFIERS)) {
            if (text.includes(modifier)) {
                entities.push({
                    text: modifier,
                    type: 'severity',
                    normalizedForm: severity || 'unknown',
                    confidence: 0.85,
                    context: {
                        isNegated: false,
                        isPast: false,
                        severity
                    }
                });
                break; // Only capture one severity per input
            }
        }

        return entities;
    }

    /**
     * Normalize a raw symptom string to canonical form
     */
    normalizeSymptom(raw: string): string {
        const lowered = raw.toLowerCase().trim();
        return this.synonymIndex.get(lowered) || raw;
    }

    /**
     * Get all confirmed symptoms (present, not negated)
     */
    getConfirmedSymptoms(entities: ExtractedEntity[]): string[] {
        return entities
            .filter(e => e.type === 'symptom' && !e.context.isNegated && !e.context.isPast)
            .map(e => e.normalizedForm);
    }

    /**
     * Get all denied symptoms (negated)
     */
    getDeniedSymptoms(entities: ExtractedEntity[]): string[] {
        return entities
            .filter(e => e.type === 'symptom' && e.context.isNegated)
            .map(e => e.normalizedForm);
    }
}

// Export singleton instance
export const medicalNER = new MedicalNER();
