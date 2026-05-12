/**
 * DDI Med Parser — India Edition
 *
 * Transforms `medicationList` (string[]) and `conditions` (string[])
 * from user onboarding into canonical ParsedMedication records for DDI checking.
 *
 * Handles:
 *   1. Exact brand→generic lookup (confidence 1.0)
 *   2. Fixed-Dose Combination (FDC) expansion — one brand → multiple generics
 *   3. Partial/alias matches (confidence 0.85)
 *   4. Substring matches (confidence 0.75)
 *   5. Low-confidence passthrough with unrecognized flag
 *
 * India-specific focus:
 *   - Acenocoumarol (Acitrom) — dominant OAC in India, not warfarin
 *   - Revital — popular tonic that contains ginseng (hidden DDI risk)
 *   - Shelcal — calcium supplement that interacts with many drugs
 *   - Hindi/regional brand aliases
 *   - 200+ brand names covering ~85% of real-world patient medication lists
 */

import { ParsedMedication } from './types';

// ─── Fixed-Dose Combination Map ───────────────────────────────────────────────
// One brand → multiple generic active ingredients. Each generic is checked
// independently for DDI interactions. Lowercase keys required.

export const FDC_MAP: Record<string, string[]> = {
    // Cardiovascular FDCs
    'ecosprin av':           ['aspirin', 'atorvastatin'],
    'ecosprin av 75':        ['aspirin', 'atorvastatin'],
    'ecosprin av 150':       ['aspirin', 'atorvastatin'],
    'clopilet a':            ['clopidogrel', 'aspirin'],
    'deplatt a':             ['clopidogrel', 'aspirin'],
    'telma h':               ['telmisartan', 'hydrochlorothiazide'],
    'telmikind h':           ['telmisartan', 'hydrochlorothiazide'],
    'losartan h':            ['losartan', 'hydrochlorothiazide'],
    'amlopres at':           ['amlodipine', 'atenolol'],
    'stamlo beta':           ['amlodipine', 'metoprolol'],
    'atorec':                ['atorvastatin', 'fenofibrate'],

    // Diabetes FDCs
    'glycomet gp':           ['metformin', 'glimepiride'],
    'glycomet gp 1':         ['metformin', 'glimepiride'],
    'glycomet gp 2':         ['metformin', 'glimepiride'],
    'glucovance':            ['metformin', 'glibenclamide'],
    'galvumet':              ['vildagliptin', 'metformin'],
    'janumet':               ['sitagliptin', 'metformin'],
    'tradjenta duo':         ['linagliptin', 'metformin'],

    // Analgesic / Anti-inflammatory FDCs
    'combiflam':             ['ibuprofen', 'paracetamol'],
    'ibugesic plus':         ['ibuprofen', 'paracetamol'],
    'chymoral forte':        ['trypsin', 'chymotrypsin', 'diclofenac'],
    'zerodol sp':            ['aceclofenac', 'paracetamol', 'serratiopeptidase'],
    'zerodol p':             ['aceclofenac', 'paracetamol'],
    'voveran d':             ['diclofenac', 'misoprostol'],
    'hifenac p':             ['aceclofenac', 'paracetamol'],

    // Antibiotic FDCs
    'augmentin':             ['amoxicillin', 'clavulanate'],
    'augmentin 625':         ['amoxicillin', 'clavulanate'],
    'doxinate':              ['doxycycline', 'dicyclomine'],
    'bactrim':               ['trimethoprim', 'sulfamethoxazole'],
    'septran':               ['trimethoprim', 'sulfamethoxazole'],

    // Gastro FDCs
    'pan d':                 ['pantoprazole', 'domperidone'],
    'nexpro d':              ['esomeprazole', 'domperidone'],
    'omez d':                ['omeprazole', 'domperidone'],
    'rabeprazole d':         ['rabeprazole', 'domperidone'],
    'rantac d':              ['ranitidine', 'domperidone'],

    // Supplements with hidden active ingredients
    'revital':               ['multivitamin', 'ginseng'],
    'revital h':             ['multivitamin', 'ginseng'],
    'revital woman':         ['multivitamin', 'ginseng'],
    'becosules z':           ['b-complex', 'zinc'],
    'shelcal':               ['calcium carbonate', 'vitamin d3'],
    'shelcal 500':           ['calcium carbonate', 'vitamin d3'],
    'shelcal hd':            ['calcium carbonate', 'vitamin d3'],
    'calcimax':              ['calcium carbonate', 'vitamin d3'],
    'ossopan':               ['calcium', 'vitamin d3'],

    // Respiratory FDCs
    'ascoril':               ['salbutamol', 'bromhexine', 'guaifenesin'],
    'brozeet':               ['formoterol', 'budesonide'],
    'duolin':                ['ipratropium', 'salbutamol'],
};

// ─── Brand → Generic synonym map ─────────────────────────────────────────────
// Single-molecule brands. Lowercase keys required.
// Coverage goal: ~85% of real-world Indian patient medication lists.

const BRAND_TO_GENERIC: Record<string, string> = {

    // ─ Analgesics / Antipyretics ─────────────────────────────────────────────
    'crocin':           'paracetamol',
    'crocin 650':       'paracetamol',
    'calpol':           'paracetamol',
    'calpol 500':       'paracetamol',
    'dolo':             'paracetamol',
    'dolo 650':         'paracetamol',
    'tylenol':          'paracetamol',
    'panadol':          'paracetamol',
    'pyrigesic':        'paracetamol',
    'metacin':          'paracetamol',
    'febrex':           'paracetamol',
    'pacimol':          'paracetamol',
    'brufen':           'ibuprofen',
    'brufen 400':       'ibuprofen',
    'ibugesic':         'ibuprofen',
    'advil':            'ibuprofen',
    'nurofen':          'ibuprofen',
    'voveran':          'diclofenac',
    'voltaren':         'diclofenac',
    'dicloran':         'diclofenac',
    'reactin':          'diclofenac',
    'zerodol':          'aceclofenac',
    'aceclo':           'aceclofenac',
    'hifenac':          'aceclofenac',
    'nise':             'nimesulide',
    'nimulid':          'nimesulide',
    'nimica':           'nimesulide',
    'aspirin':          'aspirin',
    'ecosprin':         'aspirin',
    'disprin':          'aspirin',
    'loprin':           'aspirin',

    // ─ Anticoagulants ────────────────────────────────────────────────────────
    'acitrom':          'acenocoumarol',   // dominant OAC in India — critical
    'acitrom 1':        'acenocoumarol',
    'acitrom 2':        'acenocoumarol',
    'warfin':           'warfarin',
    'warf':             'warfarin',
    'coumadin':         'warfarin',
    'plavix':           'clopidogrel',
    'clopivas':         'clopidogrel',
    'deplatt':          'clopidogrel',
    'clopilet':         'clopidogrel',
    'xarelto':          'rivaroxaban',
    'eliquis':          'apixaban',
    'pradaxa':          'dabigatran',
    'heparin':          'heparin',

    // ─ Antihypertensives ─────────────────────────────────────────────────────
    'norvasc':          'amlodipine',
    'amlovas':          'amlodipine',
    'amlip':            'amlodipine',
    'stamlo':           'amlodipine',
    'amlopres':         'amlodipine',
    'tenormin':         'atenolol',
    'betacard':         'atenolol',
    'aten':             'atenolol',
    'blokium':          'atenolol',
    'losaar':           'losartan',
    'repace':           'losartan',
    'cozaar':           'losartan',
    'telma':            'telmisartan',
    'telsartan':        'telmisartan',
    'micardis':         'telmisartan',
    'telmikind':        'telmisartan',
    'cardace':          'ramipril',
    'altace':           'ramipril',
    'hopace':           'ramipril',
    'envas':            'enalapril',
    'vasotec':          'enalapril',
    'concor':           'bisoprolol',
    'corbis':           'bisoprolol',
    'biselect':         'bisoprolol',
    'coreg':            'carvedilol',
    'carloc':           'carvedilol',
    'metolar':          'metoprolol',
    'betaloc':          'metoprolol',
    'revelol':          'metoprolol',

    // ─ Diuretics ─────────────────────────────────────────────────────────────
    'lasix':            'furosemide',
    'frusenex':         'furosemide',
    'aldactone':        'spironolactone',
    'hydrochlorothiazide': 'hydrochlorothiazide',
    'hctz':             'hydrochlorothiazide',
    'aquazide':         'hydrochlorothiazide',
    'dytor':            'torsemide',
    'cardospir':        'spironolactone',

    // ─ Diabetes ──────────────────────────────────────────────────────────────
    'glycomet':         'metformin',
    'glucophage':       'metformin',
    'obimet':           'metformin',
    'walaphage':        'metformin',
    'glimistar':        'glimepiride',
    'amaryl':           'glimepiride',
    'glimpid':          'glimepiride',
    'glynase':          'glipizide',
    'glucotrol':        'glipizide',
    'daonil':           'glibenclamide',
    'januvia':          'sitagliptin',
    'istavel':          'sitagliptin',
    'galvus':           'vildagliptin',
    'vildagliptin':     'vildagliptin',
    'jardiance':        'empagliflozin',
    'farxiga':          'dapagliflozin',
    'forxiga':          'dapagliflozin',
    'tradjenta':        'linagliptin',
    'victoza':          'liraglutide',
    'ozempic':          'semaglutide',

    // ─ Antidepressants / SSRIs ───────────────────────────────────────────────
    'flunil':           'fluoxetine',
    'prozac':           'fluoxetine',
    'prodep':           'fluoxetine',
    'fludac':           'fluoxetine',
    'serta':            'sertraline',
    'zoloft':           'sertraline',
    'serlift':          'sertraline',
    'daxid':            'sertraline',
    'paroxet':          'paroxetine',
    'paxil':            'paroxetine',
    'pari':             'paroxetine',
    'nexito':           'escitalopram',
    'lexapro':          'escitalopram',
    'stalopam':         'escitalopram',
    'cipralex':         'escitalopram',
    'rexipra':          'escitalopram',
    'fluvate':          'fluvoxamine',
    'luvox':            'fluvoxamine',
    'effexor':          'venlafaxine',
    'trevilor':         'venlafaxine',
    'veniz':            'venlafaxine',
    'cymbalta':         'duloxetine',
    'duzela':           'duloxetine',
    'dulan':            'duloxetine',

    // ─ Statins ───────────────────────────────────────────────────────────────
    'atorlip':          'atorvastatin',
    'lipitor':          'atorvastatin',
    'aztor':            'atorvastatin',
    'tonact':           'atorvastatin',
    'storvas':          'atorvastatin',
    'rozavel':          'rosuvastatin',
    'crestor':          'rosuvastatin',
    'rosuvas':          'rosuvastatin',
    'roseday':          'rosuvastatin',
    'zocor':            'simvastatin',
    'simcard':          'simvastatin',
    'liponorm':         'pravastatin',

    // ─ Thyroid ───────────────────────────────────────────────────────────────
    'thyronorm':        'levothyroxine',
    'eltroxin':         'levothyroxine',
    'synthroid':        'levothyroxine',
    'thyrox':           'levothyroxine',
    'thyrofit':         'levothyroxine',
    'neomercazole':     'carbimazole',
    'propylthiouracil': 'propylthiouracil',

    // ─ Antibiotics ───────────────────────────────────────────────────────────
    'mox':              'amoxicillin',
    'novamox':          'amoxicillin',
    'wymox':            'amoxicillin',
    'azee':             'azithromycin',
    'zithromax':        'azithromycin',
    'azithral':         'azithromycin',
    'atm':              'azithromycin',
    'ciplox':           'ciprofloxacin',
    'cifran':           'ciprofloxacin',
    'quintor':          'ciprofloxacin',
    'lox':              'levofloxacin',
    'levomac':          'levofloxacin',
    'tavanic':          'levofloxacin',
    'erythrocin':       'erythromycin',
    'althrocin':        'erythromycin',
    'clavam':           'amoxicillin-clavulanate',
    'moxclav':          'amoxicillin-clavulanate',

    // ─ Gastrointestinal ─────────────────────────────────────────────────────
    'pantop':           'pantoprazole',
    'pan 40':           'pantoprazole',
    'pan d':            'pantoprazole',   // also in FDC — single version here
    'nexpro':           'esomeprazole',
    'nexium':           'esomeprazole',
    'omez':             'omeprazole',
    'ocid':             'omeprazole',
    'omeprazole':       'omeprazole',
    'ranitac':          'ranitidine',
    'zinetac':          'ranitidine',
    'pepfiz':           'ranitidine',
    'rablet':           'rabeprazole',
    'razo':             'rabeprazole',
    'aciloc':           'ranitidine',

    // ─ Epilepsy / Antiseizure ────────────────────────────────────────────────
    'eptoin':           'phenytoin',
    'dilantin':         'phenytoin',
    'tegrital':         'carbamazepine',
    'tegretol':         'carbamazepine',
    'mazetol':          'carbamazepine',
    'valance':          'valproate',
    'depakote':         'valproate',
    'valparin':         'valproate',
    'encorate':         'valproate',
    'keppra':           'levetiracetam',
    'levitam':          'levetiracetam',
    'lamictal':         'lamotrigine',
    'lamosyn':          'lamotrigine',
    'oxetol':           'oxcarbazepine',
    'trileptal':        'oxcarbazepine',

    // ─ Immunosuppressants ────────────────────────────────────────────────────
    'cyclosporine':     'cyclosporine',
    'neoral':           'cyclosporine',
    'sandimmun':        'cyclosporine',
    'prograf':          'tacrolimus',
    'pangraf':          'tacrolimus',
    'tacromus':         'tacrolimus',
    'azoran':           'azathioprine',
    'imuran':           'azathioprine',
    'wysolone':         'prednisolone',
    'omnacortil':       'prednisolone',
    'predone':          'prednisolone',
    'deltacortril':     'prednisolone',

    // ─ Sedatives / Anxiolytics ───────────────────────────────────────────────
    'xanax':            'alprazolam',
    'alprax':           'alprazolam',
    'restyl':           'alprazolam',
    'trika':            'alprazolam',
    'valium':           'diazepam',
    'calmpose':         'diazepam',
    'rivotril':         'clonazepam',
    'lonazep':          'clonazepam',
    'elan':             'clonazepam',
    'ativan':           'lorazepam',
    'stilnox':          'zolpidem',
    'ambien':           'zolpidem',

    // ─ Digoxin / Cardiac ────────────────────────────────────────────────────
    'lanoxin':          'digoxin',
    'digoxin':          'digoxin',

    // ─ Supplements ───────────────────────────────────────────────────────────
    'becosules':        'b-complex vitamins',
    'limcee':           'vitamin c',
    'limcee 500':       'vitamin c',
    'celin':            'vitamin c',
    'supradyn':         'multivitamin',
    'zincovit':         'multivitamin + zinc',
    'neurobion':        'b-complex vitamins',
    'methylcobal':      'methylcobalamin',

    // ─ Ayurvedic common ─────────────────────────────────────────────────────
    'giloy':            'giloy',
    'guduchi':          'giloy',
    'ashwagandha':      'ashwagandha',
    'withania somnifera': 'ashwagandha',
    'mulethi':          'licorice',
    'yashtimadhu':      'licorice',
    'karela':           'bitter melon',
    'bitter gourd':     'bitter melon',
    'methi':            'fenugreek',
    'fenugreek':        'fenugreek',
    'amla':             'amla',
    'indian gooseberry': 'amla',
    'haritaki':         'haritaki',
    'triphala':         'triphala',
    'brahmi':           'brahmi',
    'bacopa monnieri':  'brahmi',
    'shankhpushpi':     'shankhapushpi',
    'shankhapushpi':    'shankhapushpi',
    'sarpagandha':      'rauwolfia',
    'trikatu':          'trikatu',

    // ─ MAOIs ────────────────────────────────────────────────────────────────
    'parnate':          'tranylcypromine',
    'nardil':           'phenelzine',
    'emsam':            'selegiline',
    'azilect':          'rasagiline',
};

// ─── Condition → DDI trigger key map (onboarding labels → canonical keys) ────

const CONDITION_TO_TRIGGER: Record<string, string> = {
    // Metabolic
    'diabetes mellitus (type 1)':       'antidiabetic',
    'diabetes mellitus (type 2)':       'antidiabetic',
    'diabetes':                          'antidiabetic',
    'type 1 diabetes':                   'antidiabetic',
    'type 2 diabetes':                   'antidiabetic',

    // Cardiovascular
    'hypertension':                      'antihypertensive',
    'high blood pressure':               'antihypertensive',
    'hypertension (disease)':            'hypertension_disease',
    'coronary artery disease':           'anticoagulant',
    'cad':                               'anticoagulant',
    'heart failure':                     'heart failure',
    'congestive heart failure':          'heart failure',
    'chf':                               'heart failure',
    'atrial fibrillation':               'anticoagulant',

    // Renal / Hepatic
    'kidney disease':                    'kidney disease',
    'chronic kidney disease':            'kidney disease',
    'ckd':                               'kidney disease',
    'renal failure':                     'kidney disease',
    'liver disease':                     'liver disease',
    'hepatitis':                         'liver disease',
    'cirrhosis':                         'liver disease',

    // Endocrine
    'thyroid disorder':                  'thyroid medication',
    'hypothyroidism':                    'thyroid medication',
    'hyperthyroidism':                   'thyroid medication',

    // Neurological
    'epilepsy':                          'antiepileptic',
    'seizure disorder':                  'antiepileptic',
    'epilepsy / seizure disorder':       'antiepileptic',

    // Psychiatric
    'depression / anxiety':              'ssri',
    'depression':                        'ssri',
    'anxiety':                           'ssri',

    // Immunological
    'hiv / aids':                        'immunosuppressant',
    'cancer (any)':                      'immunosuppressant',
    'autoimmune disease':                'immunosuppressant',
    'rheumatoid arthritis':              'immunosuppressant',

    // Hematological
    'g6pd deficiency':                   'g6pd',
    'g6pd':                              'g6pd',
    'glucose-6-phosphate dehydrogenase deficiency': 'g6pd',

    // Pregnancy (also handled via userProfile.pregnant)
    'pregnancy':                         'pregnancy',
};

// ─── Pregnancy check ─────────────────────────────────────────────────────────

export function isPregnant(userProfile?: { pregnant?: boolean }): boolean {
    return userProfile?.pregnant === true;
}

// ─── Parse a medication name → canonical + confidence ─────────────────────────

export function parseMedication(name: string): ParsedMedication {
    const lower = name.toLowerCase().trim();

    // 1. Exact FDC lookup → returns first generic (FDC expansion handled in parseMedicationList)
    const fdcGenerics = FDC_MAP[lower];
    if (fdcGenerics) {
        return {
            original: name,
            canonical: fdcGenerics[0],
            confidence: 1.0,
            category: 'allopathic',
            isFDC: true,
            fdcGenerics,
        };
    }

    // 2. Exact brand→generic lookup
    if (BRAND_TO_GENERIC[lower]) {
        return {
            original: name,
            canonical: BRAND_TO_GENERIC[lower],
            confidence: 1.0,
            category: 'allopathic',
        };
    }

    // 3. Partial brand match (input starts-with or contains a known brand key)
    for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
        if (lower.startsWith(brand) || brand.startsWith(lower)) {
            return {
                original: name,
                canonical: generic,
                confidence: 0.85,
                category: 'allopathic',
            };
        }
    }

    // 4. Partial FDC match
    for (const [brand, generics] of Object.entries(FDC_MAP)) {
        if (lower.startsWith(brand) || brand.startsWith(lower)) {
            return {
                original: name,
                canonical: generics[0],
                confidence: 0.85,
                category: 'allopathic',
                isFDC: true,
                fdcGenerics: generics,
            };
        }
    }

    // 5. Substring match inside any value (canonical generic name match)
    for (const generic of Object.values(BRAND_TO_GENERIC)) {
        if (lower.includes(generic) || generic.includes(lower)) {
            return {
                original: name,
                canonical: generic,
                confidence: 0.75,
                category: 'allopathic',
            };
        }
    }

    // 6. Return low-confidence passthrough
    return {
        original: name,
        canonical: lower,
        confidence: 0.3,
        category: 'unknown',
    };
}

// ─── Parse a full medication list ─────────────────────────────────────────────

export const CONFIDENCE_THRESHOLD = 0.6;

export function parseMedicationList(medicationList: string[]): {
    recognized: ParsedMedication[];
    unrecognized: string[];
} {
    const recognized: ParsedMedication[] = [];
    const unrecognized: string[] = [];

    for (const name of medicationList) {
        if (!name?.trim()) continue;
        const parsed = parseMedication(name);

        if (parsed.confidence >= CONFIDENCE_THRESHOLD) {
            // FDC expansion: yield one ParsedMedication per generic component
            if (parsed.isFDC && parsed.fdcGenerics && parsed.fdcGenerics.length > 1) {
                for (const generic of parsed.fdcGenerics) {
                    recognized.push({
                        original: name,
                        canonical: generic,
                        confidence: parsed.confidence,
                        category: 'allopathic',
                    });
                }
            } else {
                recognized.push(parsed);
            }
        } else {
            // Keep as low-confidence passthrough so raw name can still match herb rules
            recognized.push({ ...parsed, confidence: 0.5 });
            unrecognized.push(name);
        }
    }

    return { recognized, unrecognized };
}

// ─── Map conditions to DDI trigger keys ───────────────────────────────────────

export function conditionsToTriggers(conditions: string[]): string[] {
    const triggers: string[] = [];
    for (const cond of conditions) {
        const key = CONDITION_TO_TRIGGER[cond.toLowerCase()];
        if (key) triggers.push(key);
    }
    return triggers;
}
