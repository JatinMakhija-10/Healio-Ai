const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/api/chat/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the CRITICAL REMEDY RULES section and replace it with the hardened version
const oldRules = `3. CRITICAL REMEDY RULES — You MUST follow these:
   • homeopathic_remedies: Pull DIRECTLY from the HOMEOPATHIC REFERENCE section of the knowledge base. Match the remedy to the patient's EXACT symptom modalities (what makes it worse, what makes it better, sensation type).
   • ayurvedic_remedies: Pull DIRECTLY from the AYURVEDIC REFERENCE section. Include the exact herb or formulation name, the source text, and preparation.
   • home_remedies: Pull from HOME REMEDIES section OR any practical kitchen/herb preparation found in the knowledge base. Use everyday household ingredients.
   • If the knowledge base is empty for a section, use classical medical knowledge as a FALLBACK — but ALWAYS include at least 2 entries per section.
   • NEVER leave any remedy array empty. NEVER output placeholder text like "Remedy Name".`;

const newRules = `3. CRITICAL REMEDY POPULATION RULES — Read CAREFULLY and follow EXACTLY.

The knowledge base has 3 DISTINCT sections. Map each section to the CORRECT JSON array:

SECTION A (homeopathic_remedies only):
  • Pull from SECTION A — Boericke's Materia Medica
  • These are HOMEOPATHIC remedies: Belladonna, Aconite, Bryonia, Nux Vomica, etc.
  • Match to EXACT symptom modalities: aggravations, ameliorations, sensation, side
  • Include: remedy name, potency (6C/30C/200C), exact dose, modalities it fits

SECTION B (ayurvedic_remedies only):
  • Pull from SECTION B — Planet Ayurveda / CCRAS / Classical Texts
  • These are CLASSICAL AYURVEDIC formulations: Ashwagandha, Triphala, Brahmi,
    Sitopaladi Churna, Shatavari, Chyawanprash, Dashmularishta, etc.
  • They require purchase from an Ayurvedic pharmacy or store
  • Include: herb/formulation name, source text, preparation method, dose + timing
  • NEVER put haldi-doodh, adrak-chai, or any kitchen item here

SECTION C (home_remedies only):
  • Pull from SECTION C — Dadi-Nani ke Nuskhe
  • These are IMMEDIATE HOUSEHOLD remedies using kitchen-shelf items ONLY:
    haldi+doodh, adrak+shahad, tulsi+kali mirch, nimbu+pani, ajwain water,
    jeera water, saunf tea, desi ghee, pudina, lahsun, kala namak
  • No pharmacy, no prescription, no Ayurvedic store needed — instantly available
  • Include: exact ingredients with quantities, step-by-step preparation, timing/frequency
  • NEVER put Ashwagandha, Brahmi, Triphala, or any classical Ayurvedic herb here
  • Should feel like "aapki nani ka nuskha" — warm, familiar, immediately doable

GENERAL RULES (apply to all sections):
  • ALWAYS populate at least 2 entries per section — NEVER leave any array empty
  • If a section's RAG data is absent, use authoritative classical fallback knowledge
  • NEVER duplicate a remedy across sections (e.g. haldi in both ayurvedic AND home)
  • NEVER list the same remedy twice within one section
  • NEVER use placeholder text like "Remedy Name" or "herb name"`;

if (content.includes(oldRules)) {
  content = content.replace(oldRules, newRules);
  console.log('✅ Remedy rules section replaced.');
} else {
  console.log('❌ Could not find old rules text — checking for partial match...');
  const idx = content.indexOf('CRITICAL REMEDY RULES');
  console.log('Partial match at char index:', idx);
  process.exit(1);
}

// Also update the home_remedies JSON example to show two good examples
const oldHomeExample = `  "home_remedies": [
    {
      "name": "Traditional remedy using household ingredients",
      "indication": "Which symptom this directly helps",
      "preparation": "Step-by-step: quantities, method, timing, frequency"
    }
  ],`;

const newHomeExample = `  "home_remedies": [
    {
      "name": "Haldi Doodh (Golden Milk)",
      "indication": "Reduces inflammation, soothes throat, builds immunity",
      "preparation": "1 glass warm milk + 1/2 tsp haldi + pinch kali mirch + 1 tsp shahad. Drink before bed daily."
    },
    {
      "name": "Adrak Tulsi Kadha",
      "indication": "Clears nasal congestion, relieves cough and sore throat",
      "preparation": "Boil 8-10 fresh tulsi leaves + 1 inch grated adrak in 2 cups water for 10 mins. Strain, add honey. Drink warm 2x daily."
    }
  ],`;

if (content.includes(oldHomeExample)) {
  content = content.replace(oldHomeExample, newHomeExample);
  console.log('✅ Home remedies example improved.');
} else {
  console.log('⚠️  Home remedies example not found — skipping (not critical).');
}

// Also update ayurvedic_remedies example
const oldAyurExample = `  "ayurvedic_remedies": [
    {
      "name": "Exact herb or formulation from the knowledge base",
      "indication": "Which specific symptom this addresses",
      "preparation": "Exact preparation method — decoction, powder dose, or tablet with timing",
      "source": "Planet Ayurveda / CCRAS / Classical Text (exact source from knowledge base)"
    }
  ],`;

const newAyurExample = `  "ayurvedic_remedies": [
    {
      "name": "Sitopaladi Churna",
      "indication": "Addresses dry cough, chest congestion, and low-grade fever",
      "preparation": "1/2 tsp with honey, 2x daily after meals for 5-7 days",
      "source": "CCRAS / Classical Ayurveda"
    }
  ],`;

if (content.includes(oldAyurExample)) {
  content = content.replace(oldAyurExample, newAyurExample);
  console.log('✅ Ayurvedic remedies example improved.');
} else {
  console.log('⚠️  Ayurvedic example not found — skipping (not critical).');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ System prompt remedy rules fully hardened.');
