/**
 * DDI Static Ruleset — India Edition
 *
 * Curated interaction rules for:
 *  - Allopathic medication ↔ herbal/Ayurvedic/home remedy conflicts
 *  - Condition-triggered contraindications (kidney disease, pregnancy, G6PD, etc.)
 *  - Homeopathic same-substance cautions (mother tincture risk)
 *  - India-specific edge cases (Acitrom, Revital/ginseng, Shelcal/Thyronorm timing)
 *
 * Matching is done lowercase against canonical remedy names.
 * Rules are stateless and re-evaluated fresh on every diagnosis request.
 *
 * Severity guide:
 *   contraindicated — Never recommend, shown ~~struck through~~
 *   major          — Significant risk, shown with orange ⚠ badge
 *   moderate       — Monitor, shown with yellow caution badge
 *   minor          — Low risk, informational note
 *   caution        — Homeopathic/dilution edge-case, minimal label
 *
 * timingNote field — for interactions that are timing-only (e.g. Shelcal + Thyronorm):
 *   severity stays 'major', but UI renders ⏱ timing badge instead of ⚠ warning
 */

import { DDIRule } from './types';

export const DDI_RULES: DDIRule[] = [

    // ─── ANTICOAGULANTS / BLOOD THINNERS ─────────────────────────────────────
    // NOTE: Acenocoumarol (Acitrom) is the dominant OAC in India — covered alongside warfarin

    {
        triggers: ['warfarin', 'heparin', 'clopidogrel', 'aspirin', 'rivaroxaban', 'apixaban',
                   'dabigatran', 'acenocoumarol', 'anticoagulant', 'blood thinner'],
        conflictsWith: ['garlic', 'ginger', 'turmeric', 'ginkgo', 'dong quai', 'feverfew',
                        'fish oil', 'vitamin e', 'clove', 'danshen', 'tulsi', 'holy basil',
                        'amla', 'triphala'],
        severity: 'major',
        reason: 'Additive anticoagulant/antiplatelet effect — may increase bleeding risk significantly. Avoid high-dose supplemental use.',
    },
    {
        triggers: ['warfarin', 'acenocoumarol', 'anticoagulant'],
        conflictsWith: ['st. john', 'st johns wort', 'hypericum'],
        severity: 'contraindicated',
        reason: "St. John's Wort significantly reduces warfarin/acenocoumarol effectiveness (CYP3A4 induction) — contraindicated.",
    },
    {
        triggers: ['warfarin', 'acenocoumarol', 'anticoagulant'],
        conflictsWith: ['ginseng', 'panax ginseng', 'ashwagandha', 'withania'],
        severity: 'major',
        reason: 'Ginseng/ashwagandha may alter INR unpredictably in patients on anticoagulants.',
    },
    {
        triggers: ['warfarin', 'acenocoumarol', 'aspirin', 'clopidogrel', 'anticoagulant'],
        conflictsWith: ['papaya', 'papaya leaf', 'raw papaya', 'carica papaya'],
        severity: 'major',
        reason: 'Papaya may enhance anticoagulation effect — monitor INR closely. Commonly used in India for dengue (platelet support).',
    },
    {
        triggers: ['warfarin', 'acenocoumarol', 'aspirin', 'clopidogrel', 'anticoagulant'],
        conflictsWith: ['pineapple', 'bromelain', 'ananas'],
        severity: 'moderate',
        reason: 'Bromelain in pineapple has antiplatelet properties — additive bleeding risk with anticoagulants.',
    },
    {
        triggers: ['warfarin', 'acenocoumarol', 'aspirin', 'clopidogrel', 'anticoagulant'],
        conflictsWith: ['kalmegh', 'andrographis'],
        severity: 'major',
        reason: 'Andrographis (Kalmegh) has antiplatelet properties — additive bleeding risk.',
    },

    // ─── SSRIs / SNRIs / ANTIDEPRESSANTS ─────────────────────────────────────

    {
        triggers: ['fluoxetine', 'sertraline', 'paroxetine', 'escitalopram', 'citalopram',
                   'fluvoxamine', 'venlafaxine', 'duloxetine', 'antidepressant', 'ssri'],
        conflictsWith: ['st. john', 'st johns wort', 'hypericum', 'saint johns wort'],
        severity: 'contraindicated',
        reason: "Serotonin syndrome risk — St. John's Wort combined with SSRIs can be life-threatening.",
    },
    {
        triggers: ['fluoxetine', 'sertraline', 'paroxetine', 'escitalopram', 'citalopram',
                   'antidepressant', 'ssri'],
        conflictsWith: ['ginseng', 'panax ginseng', 'kava', 'kava kava'],
        severity: 'major',
        reason: 'May potentiate serotonergic or sedative effects — consult physician before combining.',
    },
    {
        triggers: ['fluoxetine', 'sertraline', 'paroxetine', 'escitalopram', 'ssri', 'antidepressant'],
        conflictsWith: ['valerian', 'ashwagandha'],
        severity: 'moderate',
        reason: 'Additive CNS depression possible — monitor for excessive sedation or mood changes.',
    },
    {
        triggers: ['fluoxetine', 'sertraline', 'escitalopram', 'ssri'],
        conflictsWith: ['tryptophan'],
        severity: 'major',
        reason: 'High-dose tryptophan combined with SSRIs can precipitate serotonin syndrome.',
    },

    // ─── MAOIs ────────────────────────────────────────────────────────────────

    {
        triggers: ['phenelzine', 'tranylcypromine', 'selegiline', 'rasagiline', 'moclobemide', 'maoi'],
        conflictsWith: ['ginseng', 'panax ginseng', 'ephedra', 'somalata', 'ma huang', 'licorice',
                        'mulethi', 'yohimbe', 'caffeine', 'green tea', 'guarana'],
        severity: 'contraindicated',
        reason: 'Hypertensive crisis risk with MAOIs — multiple herbal stimulants are contraindicated.',
    },

    // ─── DIABETES MEDICATIONS ─────────────────────────────────────────────────
    // Karela and methi are EXTREMELY common Indian remedies for diabetes — high priority

    {
        triggers: ['metformin', 'antidiabetic', 'diabetes medication'],
        conflictsWith: ['bitter melon', 'karela', 'bitter gourd'],
        severity: 'moderate',
        reason: 'Karela has blood glucose-lowering properties — additive hypoglycemia risk with metformin. Risk is dose-dependent: dietary amounts (small vegetable serving) are generally safe; karela juice (250–500ml+) or supplements carry significant risk. Monitor blood sugar closely.',
    },
    {
        triggers: ['metformin', 'antidiabetic', 'diabetes medication'],
        conflictsWith: ['fenugreek', 'methi'],
        severity: 'moderate',
        reason: 'Fenugreek seeds have hypoglycemic properties — additive effect with metformin. Monitor blood sugar, especially with large medicinal doses (≥5g/day).',
    },
    {
        triggers: ['metformin', 'antidiabetic', 'diabetes medication'],
        conflictsWith: ['cinnamon', 'dalchini', 'cassia'],
        severity: 'moderate',
        reason: 'High-dose cinnamon supplementation may lower blood glucose — additive with diabetes medications.',
    },
    {
        triggers: ['metformin', 'antidiabetic', 'diabetes medication'],
        conflictsWith: ['gymnema', 'gurmar', 'gymnema sylvestre'],
        severity: 'moderate',
        reason: 'Gymnema (Gurmar) is an Ayurvedic antidiabetic — additive glucose-lowering with metformin.',
    },
    {
        triggers: ['metformin', 'antidiabetic', 'diabetes medication'],
        conflictsWith: ['neem', 'azadirachta', 'neem leaf'],
        severity: 'moderate',
        reason: 'Neem has documented hypoglycemic properties — monitor blood sugar closely with coadministration.',
    },
    {
        // Sulfonylureas are higher-risk than metformin — upgrade to major
        triggers: ['glimepiride', 'glipizide', 'glibenclamide', 'sulfonylurea'],
        conflictsWith: ['bitter melon', 'karela', 'fenugreek', 'methi', 'gymnema', 'gurmar',
                        'bitter gourd', 'amla', 'neem', 'vijaysar', 'berberine'],
        severity: 'major',
        reason: 'Sulfonylureas have a narrow therapeutic window — these herbs may cause severe hypoglycemia requiring emergency treatment. Do not combine without close medical supervision.',
    },
    {
        triggers: ['insulin'],
        conflictsWith: ['bitter melon', 'karela', 'fenugreek', 'methi', 'gymnema', 'gurmar'],
        severity: 'major',
        reason: 'These herbs can cause severe hypoglycemia when combined with insulin. Monitor blood glucose very closely.',
    },
    {
        triggers: ['metformin', 'antidiabetic'],
        conflictsWith: ['ginseng', 'panax ginseng', 'siberian ginseng'],
        severity: 'moderate',
        reason: 'Ginseng may lower blood glucose levels and potentiate antidiabetic effect.',
    },

    // ─── ANTIHYPERTENSIVES ────────────────────────────────────────────────────

    {
        triggers: ['amlodipine', 'atenolol', 'losartan', 'telmisartan', 'ramipril', 'enalapril',
                   'hydrochlorothiazide', 'furosemide', 'metoprolol', 'carvedilol', 'bisoprolol',
                   'antihypertensive', 'blood pressure medication'],
        conflictsWith: ['licorice', 'mulethi', 'yashtimadhu', 'ephedra', 'somalata', 'ma huang',
                        'yohimbe', 'ginkgo'],
        severity: 'moderate',
        reason: 'These herbs can raise blood pressure or counteract antihypertensive medication effect.',
    },
    {
        triggers: ['amlodipine', 'felodipine', 'calcium channel blocker'],
        conflictsWith: ['grapefruit', 'grapefruit seed extract'],
        severity: 'major',
        reason: 'Grapefruit inhibits CYP3A4 — significantly increases blood levels of calcium channel blockers.',
    },
    {
        triggers: ['amlodipine', 'atenolol', 'losartan', 'antihypertensive', 'blood pressure medication'],
        conflictsWith: ['ashwagandha', 'withania'],
        severity: 'moderate',
        reason: 'Ashwagandha has mild blood pressure-lowering properties — may have additive effect on antihypertensives.',
    },
    {
        // ACE inhibitors → hyperkalemia from high-K herbs
        triggers: ['ramipril', 'enalapril', 'lisinopril', 'perindopril', 'ace inhibitor'],
        conflictsWith: ['nettle', 'banana stem', 'coconut water', 'banana flower'],
        severity: 'moderate',
        reason: 'High-potassium herbs combined with ACE inhibitors increase risk of dangerous hyperkalemia.',
    },
    {
        // Beta-blockers + ginseng (Revital contains ginseng — critical to catch)
        triggers: ['atenolol', 'metoprolol', 'bisoprolol', 'carvedilol', 'beta blocker'],
        conflictsWith: ['ginseng', 'panax ginseng'],
        severity: 'moderate',
        reason: 'Ginseng may counteract beta-blockade or cause unpredictable BP/heart rate changes. Note: Revital and Revital H contain ginseng.',
    },

    // ─── STATINS ──────────────────────────────────────────────────────────────

    {
        triggers: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'lovastatin', 'pravastatin', 'statin'],
        conflictsWith: ['red yeast rice'],
        severity: 'major',
        reason: 'Red yeast rice contains monacolin K (natural lovastatin) — duplicate statin mechanism, myopathy/rhabdomyolysis risk.',
    },
    {
        triggers: ['simvastatin', 'lovastatin'],
        conflictsWith: ['grapefruit', 'grapefruit seed extract'],
        severity: 'major',
        reason: 'Grapefruit inhibits CYP3A4 — dangerously raises simvastatin/lovastatin blood levels, rhabdomyolysis risk.',
    },
    {
        triggers: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'statin'],
        conflictsWith: ['niacin', 'nicotinic acid'],
        severity: 'moderate',
        reason: 'High-dose niacin combined with statins increases risk of myopathy.',
    },
    {
        triggers: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'statin'],
        conflictsWith: ['amla', 'indian gooseberry'],
        severity: 'minor',
        reason: 'Amla may theoretically interact with statins via CYP pathway — likely safe in dietary amounts; high-dose supplements not studied adequately.',
    },
    {
        triggers: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'statin'],
        conflictsWith: ['milk thistle', 'silymarin'],
        severity: 'minor',
        reason: 'Milk thistle may interact with statin metabolism (CYP3A4/2C9) — generally low risk but monitor.',
    },

    // ─── THYROID MEDICATIONS ──────────────────────────────────────────────────

    {
        triggers: ['levothyroxine', 'eltroxin', 'thyronorm', 'thyroxine', 'thyroid medication'],
        conflictsWith: ['calcium carbonate', 'calcium', 'shelcal', 'calcitrol', 'calcimax'],
        severity: 'major',
        timingNote: 'Take levothyroxine (Thyronorm/Eltroxin) and calcium supplements (Shelcal) at least 4 hours apart. Calcium significantly reduces thyroid hormone absorption.',
        reason: 'Calcium supplements dramatically reduce levothyroxine absorption — this is a timing interaction, not a contraindication. Must be separated by ≥4 hours.',
    },
    {
        triggers: ['levothyroxine', 'eltroxin', 'thyronorm', 'thyroxine', 'thyroid medication'],
        conflictsWith: ['ashwagandha', 'withania', 'sea kelp', 'kelp', 'bladderwrack', 'bugleweed',
                        'lemon balm', 'iodine supplement'],
        severity: 'moderate',
        reason: 'May alter thyroid hormone synthesis or T4/T3 conversion — monitor thyroid function.',
    },
    {
        triggers: ['levothyroxine', 'thyroid medication'],
        conflictsWith: ['soy', 'soja', 'soya'],
        severity: 'moderate',
        reason: 'Large amounts of soy interfere with levothyroxine absorption — avoid co-administration.',
    },

    // ─── IMMUNOSUPPRESSANTS ───────────────────────────────────────────────────

    {
        triggers: ['cyclosporine', 'tacrolimus', 'azathioprine', 'methotrexate', 'mycophenolate',
                   'immunosuppressant', 'prednisolone', 'corticosteroid'],
        conflictsWith: ['echinacea', 'andrographis', 'kalmegh', 'elderberry', 'astragalus',
                        'cat\'s claw', 'giloy', 'guduchi', 'turmeric', 'reishi', 'shiitake extract',
                        'ashwagandha'],
        severity: 'major',
        reason: 'Immune-stimulating herbs counteract immunosuppressive therapy — risk of rejection, flare, or treatment failure.',
    },
    {
        triggers: ['cyclosporine', 'tacrolimus', 'immunosuppressant'],
        conflictsWith: ['st. john', 'st johns wort', 'hypericum'],
        severity: 'contraindicated',
        reason: 'St. John\'s Wort dramatically reduces cyclosporine/tacrolimus blood levels — transplant rejection risk.',
    },

    // ─── DIURETICS ────────────────────────────────────────────────────────────

    {
        triggers: ['furosemide', 'spironolactone', 'hydrochlorothiazide', 'torsemide', 'diuretic'],
        conflictsWith: ['dandelion', 'horsetail', 'juniper berry', 'buchu', 'parsley seed',
                        'bearberry', 'punarnava'],
        severity: 'moderate',
        reason: 'Additive diuresis — risk of dehydration and electrolyte imbalance.',
    },

    // ─── DIGOXIN / CARDIAC GLYCOSIDES ─────────────────────────────────────────

    {
        triggers: ['digoxin', 'digitalis'],
        conflictsWith: ['hawthorn', 'strophanthus', 'oleander', 'lily of the valley', 'foxglove'],
        severity: 'contraindicated',
        reason: 'Cardiac glycoside potentiation — risk of fatal arrhythmia and digoxin toxicity.',
    },
    {
        triggers: ['digoxin'],
        conflictsWith: ['licorice', 'mulethi', 'st. john', 'hypericum'],
        severity: 'major',
        reason: 'Licorice causes potassium loss increasing digoxin toxicity risk. St. John\'s Wort reduces digoxin levels.',
    },
    {
        triggers: ['digoxin'],
        conflictsWith: ['neem', 'azadirachta', 'arjuna', 'terminalia arjuna'],
        severity: 'moderate',
        reason: 'Arjuna has cardiac glycoside-like activity. Neem may alter digoxin levels. Monitor cardiac status.',
    },

    // ─── ANTIBIOTICS ──────────────────────────────────────────────────────────

    {
        triggers: ['ciprofloxacin', 'levofloxacin', 'tetracycline', 'doxycycline', 'antibiotic'],
        conflictsWith: ['calcium supplement', 'calcium carbonate', 'shelcal', 'iron supplement',
                        'magnesium supplement', 'antacid'],
        severity: 'moderate',
        reason: 'Divalent cations (calcium, iron, magnesium) chelate fluoroquinolones/tetracyclines — reduces antibiotic absorption by up to 90%. Take antibiotic 2 hours before or 6 hours after.',
        timingNote: 'Take this antibiotic at least 2 hours before or 6 hours after calcium, iron, or antacid supplements.',
    },

    // ─── SEDATIVES / ANXIOLYTICS ──────────────────────────────────────────────

    {
        triggers: ['alprazolam', 'diazepam', 'clonazepam', 'lorazepam', 'benzodiazepine',
                   'zolpidem', 'sedative'],
        conflictsWith: ['kava', 'kava kava', 'valerian', 'ashwagandha', 'passionflower',
                        'hops', 'california poppy'],
        severity: 'major',
        reason: 'Additive CNS depression — risk of excessive sedation, respiratory depression.',
    },
    {
        triggers: ['alprazolam', 'clonazepam', 'diazepam', 'benzodiazepine'],
        conflictsWith: ['brahmi', 'bacopa', 'shankhapushpi'],
        severity: 'moderate',
        reason: 'Brahmi and Shankhapushpi have mild CNS-sedating properties — may enhance benzodiazepine sedation.',
    },

    // ─── ANTIEPILEPTICS ───────────────────────────────────────────────────────

    {
        triggers: ['phenytoin', 'carbamazepine', 'valproate', 'levetiracetam', 'lamotrigine',
                   'antiepileptic', 'anticonvulsant', 'epilepsy medication'],
        conflictsWith: ['st. john', 'st johns wort', 'hypericum'],
        severity: 'contraindicated',
        reason: "St. John's Wort induces CYP enzymes — significantly reduces antiepileptic drug levels, seizure risk.",
    },
    {
        triggers: ['phenytoin', 'carbamazepine', 'valproate', 'antiepileptic'],
        conflictsWith: ['ginkgo', 'evening primrose oil', 'borage oil'],
        severity: 'major',
        reason: 'These herbs may lower seizure threshold or alter anticonvulsant metabolism.',
    },
    {
        triggers: ['phenytoin', 'antiepileptic'],
        conflictsWith: ['shankhapushpi', 'shankhpushpi'],
        severity: 'major',
        reason: 'Shankhapushpi (Convolvulus pluricaulis) can significantly alter phenytoin blood levels — monitor anticonvulsant levels closely.',
    },

    // ─── HORMONE THERAPY ──────────────────────────────────────────────────────

    {
        triggers: ['tamoxifen', 'letrozole', 'anastrozole', 'aromatase inhibitor', 'hormone therapy',
                   'breast cancer medication'],
        conflictsWith: ['shatavari', 'asparagus racemosus', 'red clover', 'flaxseed oil', 'dong quai'],
        severity: 'major',
        reason: 'Phytoestrogenic herbs may counteract estrogen-receptor-targeted cancer therapy or affect hormone balance.',
    },

    // ─── PIPERINE / TRIKATU — BIOAVAILABILITY ENHANCER ───────────────────────

    {
        triggers: ['antiepileptic', 'antihypertensive', 'antidiabetic', 'anticoagulant',
                   'statin', 'thyroid medication', 'ssri', 'immunosuppressant'],
        conflictsWith: ['trikatu', 'piperine', 'black pepper supplement', 'bioperine'],
        severity: 'caution',
        reason: 'Piperine (in Trikatu and black pepper supplements) significantly enhances absorption of co-administered drugs — may unpredictably increase blood levels of prescription medications. Use with caution if on multiple Rx drugs.',
    },

    // ─── ARJUNA (Terminalia arjuna) ───────────────────────────────────────────

    {
        triggers: ['digoxin', 'digitalis', 'antihypertensive', 'beta blocker', 'calcium channel blocker'],
        conflictsWith: ['arjuna', 'terminalia arjuna'],
        severity: 'moderate',
        reason: 'Arjuna (Terminalia arjuna) has cardiac glycoside-like and antihypertensive properties — may interact with cardiac medications.',
    },

    // ─── PUNARNAVA ────────────────────────────────────────────────────────────

    {
        triggers: ['furosemide', 'spironolactone', 'hydrochlorothiazide', 'diuretic',
                   'antihypertensive'],
        conflictsWith: ['punarnava', 'boerhavia diffusa'],
        severity: 'moderate',
        reason: 'Punarnava has diuretic properties — additive effect with diuretics and antihypertensives.',
    },

    // ─── PREGNANCY CONTRAINDICATIONS ──────────────────────────────────────────

    {
        triggers: ['pregnancy'],
        conflictsWith: ['arnica', 'blue cohosh', 'pennyroyal', 'tansy', 'mugwort',
                        'aloe vera oral', 'aloe juice', 'senna', 'cascara', 'black cohosh',
                        'dong quai', 'sassafras', 'goldenseal', 'cotton root', 'rue'],
        severity: 'contraindicated',
        pregnancyRule: true,
        reason: 'Contraindicated in pregnancy — uterotonic, emmenagogue, or teratogenic potential. Do not use.',
    },
    {
        triggers: ['pregnancy'],
        conflictsWith: ['raw papaya', 'papaya unripe', 'green papaya', 'papaya seed'],
        severity: 'contraindicated',
        pregnancyRule: true,
        reason: 'Raw/unripe papaya is contraindicated in pregnancy — contains papain and high bromelain which have uterotonic effects.',
    },
    {
        triggers: ['pregnancy'],
        conflictsWith: ['pineapple', 'ananas', 'bromelain'],
        severity: 'contraindicated',
        pregnancyRule: true,
        reason: 'Large amounts of pineapple or bromelain supplements are contraindicated in pregnancy — uterotonic effect.',
    },
    {
        triggers: ['pregnancy'],
        conflictsWith: ['ajwain', 'carom seeds', 'ajwain water'],
        severity: 'contraindicated',
        pregnancyRule: true,
        reason: 'Large doses of ajwain (carom seeds) are contraindicated in pregnancy — stimulates uterine contractions.',
    },
    {
        triggers: ['pregnancy'],
        conflictsWith: ['methi', 'fenugreek', 'fenugreek seeds'],
        severity: 'major',
        pregnancyRule: true,
        reason: 'Large doses of fenugreek may stimulate uterine contractions — avoid medicinal/supplement doses during pregnancy. Culinary amounts are generally safe.',
    },
    {
        triggers: ['pregnancy'],
        conflictsWith: ['sesame', 'sesame seeds', 'til', 'sesame oil oral'],
        severity: 'major',
        pregnancyRule: true,
        reason: 'Large amounts of sesame seeds are traditionally considered uterotonic — avoid medicinal doses in pregnancy.',
    },
    {
        triggers: ['pregnancy'],
        conflictsWith: ['castor oil', 'ephedra', 'somalata', 'ma huang', 'yohimbe',
                        'rosemary high dose', 'sage high dose', 'licorice high dose'],
        severity: 'major',
        pregnancyRule: true,
        reason: 'Not recommended during pregnancy — may stimulate uterine contractions or affect fetal development.',
    },

    // ─── KIDNEY DISEASE ───────────────────────────────────────────────────────

    {
        triggers: ['kidney disease', 'chronic kidney disease', 'ckd', 'renal disease', 'renal failure'],
        conflictsWith: ['nettle', 'horsetail', 'dandelion', 'bearberry', 'uva ursi',
                        'parsley seed extract', 'juniper berry', 'banana stem', 'coconut water excess'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'High-potassium or nephrotoxic herbs are contraindicated in kidney disease — hyperkalemia and further renal damage risk.',
    },
    {
        triggers: ['kidney disease', 'chronic kidney disease', 'ckd'],
        conflictsWith: ['licorice', 'mulethi', 'yashtimadhu', 'star fruit', 'carambola'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'Star fruit is nephrotoxic in renal disease. Licorice causes sodium/water retention and potassium loss.',
    },

    // ─── LIVER DISEASE ────────────────────────────────────────────────────────

    {
        triggers: ['liver disease', 'hepatitis', 'cirrhosis', 'liver failure'],
        conflictsWith: ['kava', 'kava kava', 'chaparral', 'comfrey', 'germander', 'pennyroyal',
                        'sassafras', 'pyrrolizidine'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'Potentially hepatotoxic herbs — contraindicated in patients with existing liver disease.',
    },
    {
        triggers: ['liver disease', 'hepatitis', 'cirrhosis'],
        conflictsWith: ['turmeric supplement', 'high dose turmeric', 'curcumin supplement'],
        severity: 'major',
        conditionRule: true,
        reason: 'High-dose turmeric/curcumin supplements (not culinary) may stress the liver in diseased states — avoid concentrated supplements.',
    },

    // ─── HEART FAILURE ────────────────────────────────────────────────────────

    {
        triggers: ['heart failure'],
        conflictsWith: ['licorice', 'mulethi', 'yashtimadhu'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'Licorice/mulethi causes sodium retention and fluid overload — contraindicated in heart failure.',
    },
    {
        triggers: ['heart failure'],
        conflictsWith: ['dandelion', 'horsetail', 'punarnava', 'juniper berry'],
        severity: 'major',
        conditionRule: true,
        reason: 'Herbal diuretics may worsen electrolyte imbalance and hemodynamic instability in heart failure.',
    },
    {
        triggers: ['heart failure'],
        conflictsWith: ['arjuna', 'terminalia arjuna'],
        severity: 'major',
        conditionRule: true,
        reason: 'Arjuna has cardiac glycoside-like activity — potential for additive effect in heart failure patients.',
    },

    // ─── HYPERTENSION (AS DISEASE) ────────────────────────────────────────────

    {
        triggers: ['hypertension_disease'],
        conflictsWith: ['ephedra', 'somalata', 'ma huang'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'Ephedra has potent sympathomimetic effects — contraindicated in hypertension.',
    },
    {
        triggers: ['hypertension_disease'],
        conflictsWith: ['licorice', 'mulethi', 'yashtimadhu', 'ginseng'],
        severity: 'major',
        conditionRule: true,
        reason: 'Licorice causes pseudoaldosteronism (raised BP). Ginseng may cause BP fluctuations.',
    },

    // ─── G6PD DEFICIENCY ──────────────────────────────────────────────────────
    // G6PD deficiency is prevalent in India (especially South India, tribal populations)

    {
        triggers: ['g6pd'],
        conflictsWith: ['henna', 'mehndi', 'lawsonia'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'Henna (mehndi) can trigger acute hemolytic anemia in G6PD-deficient individuals — contraindicated.',
    },
    {
        triggers: ['g6pd'],
        conflictsWith: ['vitamin c', 'ascorbic acid', 'limcee'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'High-dose Vitamin C (>1g) is contraindicated in G6PD deficiency — hemolytic crisis risk.',
    },
    {
        triggers: ['g6pd'],
        conflictsWith: ['bitter melon', 'karela'],
        severity: 'major',
        conditionRule: true,
        reason: 'Bitter melon contains vicine/convicine compounds that can trigger hemolysis in G6PD deficiency.',
    },
    {
        triggers: ['g6pd'],
        conflictsWith: ['camphor', 'kapoor'],
        severity: 'contraindicated',
        conditionRule: true,
        reason: 'Camphor (oral/inhalation in large amounts) can cause hemolysis in G6PD-deficient individuals.',
    },

    // ─── EPILEPSY / SEIZURE DISORDER ──────────────────────────────────────────

    {
        triggers: ['antiepileptic', 'epilepsy medication'],
        conflictsWith: ['evening primrose oil', 'borage oil', 'ginkgo', 'camphor'],
        severity: 'major',
        conditionRule: true,
        reason: 'These substances may lower seizure threshold — avoid in epilepsy.',
    },

    // ─── HOMEOPATHIC CAUTIONS ─────────────────────────────────────────────────

    {
        triggers: ['warfarin', 'aspirin', 'clopidogrel', 'acenocoumarol', 'blood thinner', 'anticoagulant'],
        conflictsWith: ['arnica', 'arnica montana'],
        severity: 'caution',
        applicableTo: ['homeopathic'],
        reason: 'Arnica in standard homeopathic potencies (30C+) is likely pharmacologically inert, but mother tincture/Q potency may have mild anticoagulant properties. Use 30C or higher only.',
    },
    {
        triggers: ['antihypertensive', 'blood pressure medication', 'amlodipine', 'atenolol'],
        conflictsWith: ['rauwolfia', 'rauwolfia serpentina', 'sarpagandha'],
        severity: 'caution',
        applicableTo: ['homeopathic', 'ayurvedic'],
        reason: 'Rauwolfia contains reserpine-like alkaloids at low dilutions — additive BP-lowering in tincture/Q potency. Prefer high potency (30C+) only.',
    },
    {
        triggers: ['thyroid medication', 'levothyroxine', 'thyroxine'],
        conflictsWith: ['thyroidinum', 'iodine', 'iodatum'],
        severity: 'caution',
        applicableTo: ['homeopathic'],
        reason: 'Thyroid-derived homeopathic remedies at low potencies may have pharmacological thyroid activity. Prefer 30C or higher.',
    },
];
