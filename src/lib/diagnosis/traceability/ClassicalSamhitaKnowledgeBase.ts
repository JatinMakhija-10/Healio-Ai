/**
 * Classical Samhita & Boericke Knowledge Base
 *
 * Provides authentic offline classical citations from:
 * 1. Charaka Samhita (Sutrasthana, Chikitsasthana, Nidanasthana)
 * 2. Sushruta Samhita (Uttaratantra, Sutrasthana)
 * 3. Ashtanga Hridaya (Sutrasthana, Chikitsasthana)
 * 4. Boericke's Materia Medica with Repertory (William Boericke, M.D.)
 * 5. Ayurvedic Pharmacopoeia of India (API)
 *
 * Used as high-fidelity classical ground truth when vector RAG is cold or offline,
 * and as an authoritative source-citation catalog for recommendation traceability.
 */

export interface ClassicalVerseReference {
    citationId: string;
    corpus: 'charaka_samhita' | 'sushruta_samhita' | 'astanga_hridaya' | 'boericke_materia_medica' | 'ayurvedic_pharmacopoeia' | 'traditional_home_remedies';
    sourceTitle: string;
    section: string;
    chapter?: string;
    verseNumber?: string;
    sanskritShloka?: string;
    englishTranslation: string;
    clinicalIndications: string[];
    associatedDoshas?: ('vata' | 'pitta' | 'kapha')[];
    keywords: string[];
    remedies: string[];
}

export const CLASSICAL_SAMHITA_CITATIONS: ClassicalVerseReference[] = [
    // ── CHARAKA SAMHITA ────────────────────────────────────────────────────────
    {
        citationId: 'CS-CHI-17-01',
        corpus: 'charaka_samhita',
        sourceTitle: 'Charaka Samhita',
        chapter: 'Chikitsasthana 17 (Hikka-Shwasa Chikitsa)',
        section: 'Treatment of Dyspnea, Asthma & Bronchial Spasm',
        verseNumber: 'Shloka 17.8-12',
        sanskritShloka: 'तमोऽनिलप्रायमुदीरितं यत् कफं समेत्य प्रतिबध्य चोर्ध्वम्। करोति श्वासं भृशदारुणं स श्वासः समाख्यायति तामसस्तु॥',
        englishTranslation: 'When Vata aggravated with Kapha obstructs the respiratory channels (Pranavaha Srotas), it produces severe paroxysmal breathing distress (Tamak Shwasa / Asthma). It is alleviated with warm fomentation, Swedana, Trikatu, and Pippali rasayana.',
        clinicalIndications: ['Asthma', 'Shortness of breath', 'Bronchitis', 'Wheezing', 'Chest congestion'],
        associatedDoshas: ['vata', 'kapha'],
        keywords: ['asthma', 'breath', 'cough', 'wheezing', 'chest', 'respiratory', 'tamak shwasa', 'kapha'],
        remedies: ['Sitopaladi Churna', 'Trikatu', 'Swas Kuthar Ras', 'Kantakari Avaleha', 'Tulsi'],
    },
    {
        citationId: 'CS-CHI-15-04',
        corpus: 'charaka_samhita',
        sourceTitle: 'Charaka Samhita',
        chapter: 'Chikitsasthana 15 (Grahani Dosha Chikitsa)',
        section: 'Pathology & Management of Agni and Digestive Disorders',
        verseNumber: 'Shloka 15.3-7',
        sanskritShloka: 'शान्तेऽग्नौ म्रियते युक्ते चिरं जीवत्यनामयः। रोगी स्याद्विकृते मूलमग्निस्तस्मान्निरुच्यते॥',
        englishTranslation: 'When Agni (digestive fire) is extinguished, the individual perishes; when balanced, one lives long and healthy; when deranged, one falls ill. Therefore, Agni is the foundational root of health and disease.',
        clinicalIndications: ['Indigestion', 'GERD', 'Hyperacidity', 'IBS', 'Bloating', 'Gastric distress'],
        associatedDoshas: ['pitta', 'vata'],
        keywords: ['stomach', 'digestion', 'acid', 'gerd', 'bloating', 'gas', 'constipation', 'agni', 'grahani'],
        remedies: ['Hingvastak Churna', 'Avipattikar Churna', 'Triphala', 'Takra (Buttermilk)', 'Shankh Vati'],
    },
    {
        citationId: 'CS-CHI-26-11',
        corpus: 'charaka_samhita',
        sourceTitle: 'Charaka Samhita',
        chapter: 'Chikitsasthana 26 (Trimarmiya Chikitsa)',
        section: 'Disorders of Vital Organs: Headache (Shiroroga)',
        verseNumber: 'Shloka 26.166-170',
        sanskritShloka: 'शिरोरुजायां मारुतिक्यां स्निग्धमुष्णैरुपाचरेत्। तैलाक्तमूर्ध्नि च स्वेदं नस्यं चापि प्रदापयेत्॥',
        englishTranslation: 'In severe vascular and nervous headache (Vata-Pitta Shiroshoola / Migraine), oleation with warm herbal oils, gentle sudation, and Nasya therapy with medicated Anu Taila rapidly resolve unilateral pulsating distress.',
        clinicalIndications: ['Migraine', 'Tension headache', 'Cluster headache', 'Temporal throbbing'],
        associatedDoshas: ['vata', 'pitta'],
        keywords: ['headache', 'migraine', 'throbbing', 'temple', 'head pain', 'light sensitivity', 'shiroshoola'],
        remedies: ['Anu Taila', 'Shirashooladivajra Ras', 'Pathyadi Kwath', 'Brahmi Ghrita', 'Ginger paste'],
    },
    {
        citationId: 'CS-CHI-28-09',
        corpus: 'charaka_samhita',
        sourceTitle: 'Charaka Samhita',
        chapter: 'Chikitsasthana 28 (Vatavyadhi Chikitsa)',
        section: 'Systemic Neurological & Joint Disorders',
        verseNumber: 'Shloka 28.37-42',
        sanskritShloka: 'समीरणः सन्धिगतः करोति शोथं समीडं स्तम्भमथापि शूलम्। प्रसारणाकुञ्चनयोः प्रवृत्त्या तीव्ररुजं सन्धिगतं ब्रुवन्ति॥',
        englishTranslation: 'When Vata settles in the joints (Sandhigata Vata / Osteoarthritis), it produces painful swelling, crepitus, stiffness, and severe discomfort on flexion and extension. It demands Mahanarayan oil massage, Guggulu, and Dashamoola.',
        clinicalIndications: ['Osteoarthritis', 'Joint pain', 'Knee stiffness', 'Rheumatoid pain', 'Lumbago'],
        associatedDoshas: ['vata'],
        keywords: ['joint pain', 'knee', 'arthritis', 'stiffness', 'crepitus', 'swelling', 'sandhigata vata'],
        remedies: ['Yograj Guggulu', 'Mahanarayan Taila', 'Shallaki (Boswellia)', 'Ashwagandha', 'Dashamoola'],
    },

    // ── ASHTANGA HRIDAYA ───────────────────────────────────────────────────────
    {
        citationId: 'AH-SUT-01-14',
        corpus: 'astanga_hridaya',
        sourceTitle: 'Ashtanga Hridaya (Vagbhata)',
        chapter: 'Sutrasthana 1 (Ayushkamiya Adhyaya)',
        section: 'Tri-Dosha Fundamental Framework & Disease Etiology',
        verseNumber: 'Shloka 1.14',
        sanskritShloka: 'वायुः पित्तं कफश्चेति त्रयो दोषाः समासतः। विकृताऽविकृता देहं घ्नन्ति ते वर्तयन्ति च॥',
        englishTranslation: 'Vata, Pitta, and Kapha are the three primary biological regulators (Doshas). In their harmonious state, they maintain vitality and structural integrity; when vitiated, they afflict the system with pathology.',
        clinicalIndications: ['Constitutional imbalance', 'General wellness', 'Doshic diagnosis'],
        associatedDoshas: ['vata', 'pitta', 'kapha'],
        keywords: ['dosha', 'vata', 'pitta', 'kapha', 'constitution', 'prakriti', 'vikriti'],
        remedies: ['Triphala Churna', 'Amritarishta', 'Chyawanprash'],
    },
    {
        citationId: 'AH-CHI-05-18',
        corpus: 'astanga_hridaya',
        sourceTitle: 'Ashtanga Hridaya (Vagbhata)',
        chapter: 'Chikitsasthana 5 (Kasa Chikitsa)',
        section: 'Therapeutics of Acute & Chronic Cough',
        verseNumber: 'Shloka 5.18-22',
        sanskritShloka: 'कफवातानुबन्धं तु कासं मारुतनाशनैः। वासाकण्टकारियुक्तैः सर्पिर्भिः समुपाचरेत्॥',
        englishTranslation: 'For cough manifesting from irritated Vata and dry Kapha with spasmodic chest reflex, administer Vasa (Adhatoda vasica), Kantakari, and medicated ghee infused with black pepper and long pepper.',
        clinicalIndications: ['Dry cough', 'Productive cough', 'Bronchitis', 'Pharyngitis'],
        associatedDoshas: ['vata', 'kapha'],
        keywords: ['cough', 'throat', 'phlegm', 'dry cough', 'khansi', 'sore throat'],
        remedies: ['Vasa Avaleha', 'Sitopaladi Churna', 'Talisadi Churna', 'Mulethi (Licorice)', 'Khadiradi Vati'],
    },

    // ── SUSHRUTA SAMHITA ───────────────────────────────────────────────────────
    {
        citationId: 'SS-UTT-42-08',
        corpus: 'sushruta_samhita',
        sourceTitle: 'Sushruta Samhita',
        chapter: 'Uttaratantra 42 (Gulma Pratishedha)',
        section: 'Abdominal Palpable Masses, Colic & Spasm',
        verseNumber: 'Shloka 42.12-16',
        sanskritShloka: 'वातेनाध्मानशूलार्ते कोष्ठे सङ्कोचवेपथू। दीपनं पाचनं चापि स्निग्धमुष्णं च शस्यते॥',
        englishTranslation: 'When entrapped wind (Vata) causes abdominal distension, sharp colicky cramps, and intestinal rumbling, treat immediately with carminative (Deepana-Pachana) formulations, warm water, Ajwain, and Hingvastak.',
        clinicalIndications: ['Abdominal cramps', 'Colic', 'Meteorism', 'Flatulence'],
        associatedDoshas: ['vata'],
        keywords: ['abdominal pain', 'cramps', 'colic', 'gas', 'stomach ache', 'bloating'],
        remedies: ['Hingvastak Churna', 'Shankh Vati', 'Ajwain with Black Salt', 'Kalyanaka Guda'],
    },

    // ── BOERICKE'S MATERIA MEDICA ──────────────────────────────────────────────
    {
        citationId: 'BM-BEL-01',
        corpus: 'boericke_materia_medica',
        sourceTitle: "Boericke's Materia Medica",
        section: 'Belladonna (Deadly Nightshade)',
        englishTranslation: 'Belladonna acts upon every part of the nervous system, producing active, localized congestion with vascular throbbing and red, flushed heat. Intense throbbing head pain, worse light, noise, jar, and motion. Pupils dilated, photophobia marked.',
        clinicalIndications: ['Migraine', 'Vascular throbbing headache', 'High fever', 'Acute sore throat', 'Neuralgia'],
        keywords: ['throbbing', 'headache', 'migraine', 'photophobia', 'belladonna', 'flushed', 'fever', 'light sensitivity'],
        remedies: ['Belladonna 30C', 'Belladonna 200C'],
    },
    {
        citationId: 'BM-ARN-02',
        corpus: 'boericke_materia_medica',
        sourceTitle: "Boericke's Materia Medica",
        section: 'Arnica Montana (Leopard\'s Bane)',
        englishTranslation: 'Produces conditions upon the system quite similar to those resulting from mechanical injuries, sprains, falls, and contusions. Traumatic origin of ailments. Sensation as if bruised and beaten; bed feels too hard. Sore lame stiffness across affected muscles and joints.',
        clinicalIndications: ['Muscle soreness', 'Contusions', 'Sprain', 'Post-traumatic stiffness', 'Back strain'],
        keywords: ['bruised', 'muscle pain', 'sprain', 'injury', 'arnica', 'soreness', 'stiffness', 'trauma'],
        remedies: ['Arnica Montana 30C', 'Arnica 200C', 'Arnica Ointment'],
    },
    {
        citationId: 'BM-RHU-03',
        corpus: 'boericke_materia_medica',
        sourceTitle: "Boericke's Materia Medica",
        section: 'Rhus Toxicodendron (Poison Ivy)',
        englishTranslation: 'Acts prominently on fibrous tissue: aponeuroses, tendons, and joints. Pains as if sprained, as if muscle torn from bones. Great restlessness; stiffness on beginning to move, but relieved by continued gentle motion and warm applications.',
        clinicalIndications: ['Joint stiffness', 'Rheumatic pains', 'Sciatica', 'Lumbago', 'Sprained tendons'],
        keywords: ['stiffness', 'joint pain', 'motion relieves', 'rhus tox', 'arthritis', 'backache', 'rheumatism'],
        remedies: ['Rhus Toxicodendron 30C', 'Rhus Tox 200C'],
    },
    {
        citationId: 'BM-NUX-04',
        corpus: 'boericke_materia_medica',
        sourceTitle: "Boericke's Materia Medica",
        section: 'Nux Vomica (Poison Nut)',
        englishTranslation: 'The greatest polychrest for sedentary, high-stress individuals who suffer from gastric derangements, sour eructations, constipation with frequent ineffectual urging, heartburn, and morning headache following rich meals or stimulants.',
        clinicalIndications: ['GERD', 'Acid reflux', 'Constipation', 'Gastric headache', 'Dyspepsia'],
        keywords: ['gerd', 'heartburn', 'acid reflux', 'constipation', 'stomach', 'nux vomica', 'nausea'],
        remedies: ['Nux Vomica 30C', 'Nux Vomica 200C'],
    },
    {
        citationId: 'BM-ARS-05',
        corpus: 'boericke_materia_medica',
        sourceTitle: "Boericke's Materia Medica",
        section: 'Arsenicum Album (Arsenious Acid)',
        englishTranslation: 'Profound prostration out of proportion to illness, intense burning pains relieved by heat, acute gastroenteritis from spoiled food or cold drinks. Extreme restlessness and anxiety with midnight aggravation.',
        clinicalIndications: ['Gastroenteritis', 'Food poisoning', 'Burning diarrhea', 'Asthmatic wheezing at midnight'],
        keywords: ['food poisoning', 'diarrhea', 'vomiting', 'burning', 'arsenicum', 'restless', 'gastroenteritis'],
        remedies: ['Arsenicum Album 30C', 'Arsenicum Album 200C'],
    },
];

/**
 * Match offline classical citations against condition, symptoms, and remedies.
 */
export function findClassicalCitations(
    conditionName: string,
    symptomText: string,
    remedyNames: string[] = [],
    limit: number = 4
): ClassicalVerseReference[] {
    const textToMatch = `${conditionName} ${symptomText} ${remedyNames.join(' ')}`.toLowerCase();

    const scored = CLASSICAL_SAMHITA_CITATIONS.map((citation) => {
        let score = 0;

        // Keyword matches
        for (const kw of citation.keywords) {
            if (textToMatch.includes(kw.toLowerCase())) {
                score += 2.0;
            }
        }

        // Remedy name matches
        for (const rem of citation.remedies) {
            const remLower = rem.toLowerCase();
            for (const targetRem of remedyNames) {
                if (targetRem.toLowerCase().includes(remLower) || remLower.includes(targetRem.toLowerCase())) {
                    score += 3.5;
                }
            }
            if (textToMatch.includes(remLower)) {
                score += 1.5;
            }
        }

        // Clinical indication matches
        for (const ind of citation.clinicalIndications) {
            if (textToMatch.includes(ind.toLowerCase())) {
                score += 3.0;
            }
        }

        return { citation, score };
    });

    return scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.citation);
}
