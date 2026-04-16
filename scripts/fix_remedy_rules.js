const fs = require('fs');
const f = 'src/app/api/chat/route.ts';
let c = fs.readFileSync(f, 'utf8');

const startMarker = 'CRITICAL REMEDY RULES';
const endMarker = '   \u2022 NEVER leave any remedy array empty. NEVER output placeholder text like "Remedy Name".';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx < 0 || endIdx < 0) {
    console.log('Markers not found. start:', startIdx, 'end:', endIdx);
    // Print what's around the expected area
    const idx2 = c.indexOf('NEVER leave any remedy');
    console.log('Alt end at:', idx2, JSON.stringify(c.substring(idx2, idx2+80)));
    process.exit(1);
}

const endWithNL = endIdx + endMarker.length;

const newRules = `CRITICAL REMEDY POPULATION RULES — Read CAREFULLY and follow EXACTLY.

The knowledge base has 3 DISTINCT sections. Map each to the CORRECT JSON array:

SECTION A -> homeopathic_remedies ONLY:
  Pull from SECTION A (Boericke Materia Medica).
  Homeopathic remedies: Belladonna, Aconite, Bryonia, Nux Vomica, Pulsatilla, etc.
  Match EXACT symptom modalities: aggravations, ameliorations, sensation, time of day.
  Include: remedy name, potency (6C/30C/200C), exact dose, which modalities it fits.

SECTION B -> ayurvedic_remedies ONLY:
  Pull from SECTION B (Planet Ayurveda / CCRAS / Classical Sanskrit Texts).
  CLASSICAL Ayurvedic formulations requiring an Ayurvedic pharmacy:
  Ashwagandha, Triphala, Brahmi, Sitopaladi Churna, Shatavari, Dashmularishta, etc.
  Include: exact herb/formulation name, source text, preparation method, dose + timing.
  NEVER put kitchen items (haldi-doodh, adrak) here — those belong in SECTION C.

SECTION C -> home_remedies ONLY:
  Pull from SECTION C (Dadi-Nani ke Nuskhe — nuskhe.json).
  IMMEDIATE household remedies using kitchen-shelf items ONLY. No pharmacy needed:
  haldi+doodh, adrak+shahad, tulsi+kali mirch, nimbu+pani, ajwain pani,
  jeera water, saunf tea, desi ghee, pudina, lahsun, kala namak, methi seeds.
  Should feel like aapki nani ka nuskha — warm, familiar, instantly doable.
  Include: ingredients with quantities, step-by-step preparation, timing, frequency.
  NEVER put Ashwagandha, Brahmi, Triphala, Sitopaladi or any classical herb here.

MANDATORY RULES (apply to ALL sections):
  - ALWAYS include at least 2 entries per section. NEVER leave any array empty.
  - If RAG data is absent for a section, use authoritative classical fallback knowledge.
  - NEVER duplicate a remedy across sections (e.g. no haldi in both ayurvedic AND home).
  - NEVER list the same remedy twice within one section.
  - NEVER use placeholder text like "Remedy Name" or "herb name".`;

c = c.substring(0, startIdx) + newRules + c.substring(endWithNL);
fs.writeFileSync(f, c, 'utf8');
console.log('Done. File length:', c.length);
