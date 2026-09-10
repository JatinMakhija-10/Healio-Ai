/**
 * Verified Product Catalog with Vaidyanath Group as Primary Supplier
 * Grounded in classical Ayurvedic formulations and standard AYUSH Pharmacopoeia.
 */

import { ProductSKU } from '../types';

export const AYURVEDIC_CATALOG: ProductSKU[] = [
  // ─── Digestion & Acidity (Amlapitta / Agni Disorders) ─────────────────────
  {
    id: 'prod_vdn_001',
    sku: 'VDN-AVP-100G',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Avipattikar Churna',
    description: 'Classical Ayurvedic formulation for hyperacidity, heartburn, gastritis, and digestive disorders caused by aggravated Pitta dosha. Promotes healthy secretion of digestive enzymes.',
    priceInINR: 175,
    mrpInINR: 195,
    stockQuantity: 120,
    unit: '100g',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/avipattikar-churna-100gm',
    rating: 4.8,
    reviewCount: 342,
    ayurvedicMetadata: {
      classicalFormulationName: 'Avipattikar Churna',
      classicalTextReference: 'Bhaishajya Ratnavali, Amlapitta Rogadhikara 25-29',
      form: 'churna',
      doshaTarget: {
        pacifies: ['pitta', 'vata'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['diarrhea', 'ulcerative colitis in active flare', 'diabetes (contains Sharkara)'],
      recommendedAnupana: ['lukewarm water', 'cold milk', 'coconut water'],
      botanicalComposition: [
        { herbName: 'Amla', latinName: 'Phyllanthus emblica', partUsed: 'Fruit', percentage: 33 },
        { herbName: 'Haritaki', latinName: 'Terminalia chebula', partUsed: 'Fruit', percentage: 8 },
        { herbName: 'Bibhitaki', latinName: 'Terminalia bellirica', partUsed: 'Fruit', percentage: 8 },
        { herbName: 'Nishoth', latinName: 'Operculina turpethum', partUsed: 'Root', percentage: 44 },
        { herbName: 'Elaichi', latinName: 'Elettaria cardamomum', partUsed: 'Seed', percentage: 3 },
        { herbName: 'Lavanga', latinName: 'Syzygium aromaticum', partUsed: 'Flower bud', percentage: 4 }
      ],
      ageSuitability: { minAge: 12 }
    }
  },
  {
    id: 'prod_vdn_002',
    sku: 'VDN-LAVAN-100G',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Lavan Bhaskar Churna',
    description: 'Traditional carminative powder for loss of appetite (Aruchi), indigestion (Ajeerna), abdominal flatulence, and sluggish Agni (Mandagni).',
    priceInINR: 130,
    mrpInINR: 145,
    stockQuantity: 85,
    unit: '100g',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/lavan-bhaskar-churna',
    rating: 4.7,
    reviewCount: 215,
    ayurvedicMetadata: {
      classicalFormulationName: 'Lavan Bhaskar Churna',
      classicalTextReference: 'Sharangadhara Samhita, Madhyama Khanda 6/138-144',
      form: 'churna',
      doshaTarget: {
        pacifies: ['vata', 'kapha'],
        aggravates: ['pitta']
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['hypertension', 'severe acid peptic disease', 'edema', 'sodium restricted diet'],
      recommendedAnupana: ['buttermilk (Takra)', 'lukewarm water'],
      botanicalComposition: [
        { herbName: 'Samudra Lavana', latinName: 'Sea Salt', percentage: 25 },
        { herbName: 'Sauvarchala Lavana', latinName: 'Black Salt', percentage: 15 },
        { herbName: 'Pippali', latinName: 'Piper longum', partUsed: 'Fruit', percentage: 10 },
        { herbName: 'Jeeraka', latinName: 'Cuminum cyminum', partUsed: 'Seed', percentage: 15 },
        { herbName: 'Dadima', latinName: 'Punica granatum', partUsed: 'Seed', percentage: 10 }
      ],
      ageSuitability: { minAge: 10 }
    }
  },

  // ─── Stress, Sleep & Insomnia (Vata Disorders & Manovaha Srotas) ────────────
  {
    id: 'prod_vdn_003',
    sku: 'VDN-ASH-450ML',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Ashwagandharishta Special',
    description: 'Premier nervine tonic and adaptogenic restorative. Calms nervous debility, mental exhaustion, fatigue, and insomnia (Anidra) caused by Vata aggravation.',
    priceInINR: 260,
    mrpInINR: 290,
    stockQuantity: 150,
    unit: '450ml',
    imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f879ad8cb48?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/ashwagandharishta-450ml',
    rating: 4.9,
    reviewCount: 512,
    ayurvedicMetadata: {
      classicalFormulationName: 'Ashwagandharishta',
      classicalTextReference: 'Bhaishajya Ratnavali, Murccha Rogadhikara 13-17',
      form: 'asava_arishta',
      doshaTarget: {
        pacifies: ['vata', 'kapha'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['pregnancy', 'hyperthyroidism', 'severe peptic ulceration'],
      recommendedAnupana: ['equal volume of water after meals'],
      botanicalComposition: [
        { herbName: 'Ashwagandha', latinName: 'Withania somnifera', partUsed: 'Root', percentage: 35 },
        { herbName: 'Mushali', latinName: 'Asparagus adscendens', partUsed: 'Tuber', percentage: 15 },
        { herbName: 'Manjistha', latinName: 'Rubia cordifolia', partUsed: 'Stem', percentage: 10 },
        { herbName: 'Haritaki', latinName: 'Terminalia chebula', partUsed: 'Fruit', percentage: 10 },
        { herbName: 'Dhataki', latinName: 'Woodfordia fruticosa', partUsed: 'Flower', percentage: 15 }
      ],
      ageSuitability: { minAge: 16 }
    }
  },
  {
    id: 'prod_vdn_004',
    sku: 'VDN-BRAH-80TAB',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Brahmi Vati (Gold & Sarpagandha Free)',
    description: 'Renowned Medhya Rasayana (cognitive & memory tonic). Alleviates mental anxiety, overthinking, tension headaches, and promotes restorative restful sleep.',
    priceInINR: 195,
    mrpInINR: 220,
    stockQuantity: 95,
    unit: '80 Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/brahmi-bati-80tab',
    rating: 4.8,
    reviewCount: 189,
    ayurvedicMetadata: {
      classicalFormulationName: 'Brahmi Vati',
      classicalTextReference: 'Siddha Yoga Sangraha, Manas Roga',
      form: 'vati',
      doshaTarget: {
        pacifies: ['pitta', 'vata'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['bradycardia', 'severe hypotension'],
      recommendedAnupana: ['warm milk with honey', 'Gulkand', 'lukewarm water'],
      botanicalComposition: [
        { herbName: 'Brahmi', latinName: 'Bacopa monnieri', partUsed: 'Whole plant', percentage: 40 },
        { herbName: 'Shankhpushpi', latinName: 'Convolvulus pluricaulis', partUsed: 'Whole plant', percentage: 25 },
        { herbName: 'Vacha', latinName: 'Acorus calamus', partUsed: 'Rhizome', percentage: 15 },
        { herbName: 'Jatamansi', latinName: 'Nardostachys jatamansi', partUsed: 'Root', percentage: 20 }
      ],
      ageSuitability: { minAge: 14 }
    }
  },

  // ─── Joint Mobility, Arthritis & Pain (Sandhivata / Amavata) ───────────────
  {
    id: 'prod_vdn_005',
    sku: 'VDN-YOG-80TAB',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Yograj Guggulu',
    description: 'Classical anti-inflammatory formulation for chronic joint stiffness, osteoarthritis, sciatica, and neuromuscular discomfort. Clears Ama (metabolic toxins) from deep joint tissues.',
    priceInINR: 230,
    mrpInINR: 255,
    stockQuantity: 110,
    unit: '80 Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/yograj-guggulu-80-tab',
    rating: 4.8,
    reviewCount: 290,
    ayurvedicMetadata: {
      classicalFormulationName: 'Yograj Guggulu',
      classicalTextReference: 'Bhaishajya Ratnavali, Vatarogadhikara 101-110',
      form: 'vati',
      doshaTarget: {
        pacifies: ['vata', 'kapha'],
        aggravates: ['pitta']
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['pregnancy', 'bleeding disorders', 'concurrent high-dose anticoagulants'],
      recommendedAnupana: ['Maharasnadi Kwath', 'lukewarm water', 'dashamoola kwath'],
      botanicalComposition: [
        { herbName: 'Shuddha Guggulu', latinName: 'Commiphora mukul', partUsed: 'Purified Gum Resin', percentage: 50 },
        { herbName: 'Chitraka', latinName: 'Plumbago zeylanica', partUsed: 'Root', percentage: 8 },
        { herbName: 'Pippalimoola', latinName: 'Piper longum', partUsed: 'Root', percentage: 7 },
        { herbName: 'Rasna', latinName: 'Pluchea lanceolata', partUsed: 'Leaf', percentage: 10 },
        { herbName: 'Gokshura', latinName: 'Tribulus terrestris', partUsed: 'Fruit', percentage: 10 }
      ],
      ageSuitability: { minAge: 18 }
    }
  },
  {
    id: 'prod_vdn_006',
    sku: 'VDN-RHEUMA-100ML',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Rheuma Oil',
    description: 'Fast-penetrating herbal liniment enriched with Gandhapura and Maha Narayan Taila for quick relief from muscle spasms, backache, and stiff arthritic joints.',
    priceInINR: 180,
    mrpInINR: 199,
    stockQuantity: 75,
    unit: '100ml',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-2244436858e6?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/rheuma-oil-100ml',
    rating: 4.7,
    reviewCount: 164,
    ayurvedicMetadata: {
      classicalFormulationName: 'Mahanarayan Taila & Gandhapura',
      classicalTextReference: 'Bhaishajya Ratnavali, Vatavyadhi',
      form: 'taila',
      doshaTarget: {
        pacifies: ['vata'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['broken skin', 'open wounds', 'active rash/eczema'],
      recommendedAnupana: ['external application followed by warm fomentation (Swedana)'],
      botanicalComposition: [
        { herbName: 'Gandhapura Taila', latinName: 'Gaultheria fragrantissima', partUsed: 'Oil', percentage: 25 },
        { herbName: 'Mahanarayan Taila', partUsed: 'Medicated Sesame Oil', percentage: 50 },
        { herbName: 'Karpura', latinName: 'Cinnamomum camphora', percentage: 10 },
        { herbName: 'Pudina Satva', latinName: 'Mentha arvensis', percentage: 15 }
      ],
      ageSuitability: { minAge: 8 }
    }
  },

  // ─── Respiratory & Immunity (Kasa / Shwasa / Rasayana) ────────────────────
  {
    id: 'prod_vdn_007',
    sku: 'VDN-SITO-60G',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Sitopaladi Churna',
    description: 'Time-tested Ayurvedic respiratory remedy for wet cough, throat irritation, bronchitis, and chest congestion. Soothes airway inflammation and balances Kapha and Pitta.',
    priceInINR: 160,
    mrpInINR: 180,
    stockQuantity: 140,
    unit: '60g',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/sitopaladi-churna-60gm',
    rating: 4.9,
    reviewCount: 420,
    ayurvedicMetadata: {
      classicalFormulationName: 'Sitopaladi Churna',
      classicalTextReference: 'Sharangadhara Samhita, Madhyama Khanda 6/134-137',
      form: 'churna',
      doshaTarget: {
        pacifies: ['kapha', 'pitta'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['uncontrolled diabetes (contains rock sugar)'],
      recommendedAnupana: ['pure organic honey (Madhu)', 'clarified butter (Ghee)'],
      botanicalComposition: [
        { herbName: 'Mishri (Rock Sugar)', percentage: 51 },
        { herbName: 'Vanshlochan', latinName: 'Bambusa arundinacea', percentage: 26 },
        { herbName: 'Pippali', latinName: 'Piper longum', partUsed: 'Fruit', percentage: 13 },
        { herbName: 'Ela', latinName: 'Elettaria cardamomum', partUsed: 'Seed', percentage: 7 },
        { herbName: 'Twak', latinName: 'Cinnamomum zeylanicum', partUsed: 'Bark', percentage: 3 }
      ],
      ageSuitability: { minAge: 3 }
    }
  },
  {
    id: 'prod_vdn_008',
    sku: 'VDN-CHYAWAN-1KG',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Chyawanprash Special',
    description: 'Flagship Rasayana prepared from fresh wild Amla fruits and 52 Himalayan herbs. Fortifies mucosal immunity, promotes cellular rejuvenation, and revitalizes Ojas.',
    priceInINR: 395,
    mrpInINR: 440,
    stockQuantity: 200,
    unit: '1kg',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/chyawanprash-special-1kg',
    rating: 4.9,
    reviewCount: 780,
    ayurvedicMetadata: {
      classicalFormulationName: 'Chyawanprash Rasayana',
      classicalTextReference: 'Charaka Samhita, Chikitsa Sthana, Ch. 1:1, Verse 62-74',
      form: 'avaleha',
      doshaTarget: {
        pacifies: ['vata', 'pitta', 'kapha'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['uncontrolled diabetes (unless sugar-free variant used)'],
      recommendedAnupana: ['warm cow milk', 'lukewarm water'],
      botanicalComposition: [
        { herbName: 'Amalaki (Fresh Amla)', latinName: 'Phyllanthus emblica', partUsed: 'Fruit pulp', percentage: 48 },
        { herbName: 'Dashamoola', partUsed: 'Ten sacred roots', percentage: 12 },
        { herbName: 'Pippali', latinName: 'Piper longum', percentage: 5 },
        { herbName: 'Guduchi', latinName: 'Tinospora cordifolia', percentage: 6 },
        { herbName: 'Bala', latinName: 'Sida cordifolia', percentage: 4 }
      ],
      ageSuitability: { minAge: 4 }
    }
  },

  // ─── Detoxification & Gut Health (Ama Pachana) ───────────────────────────
  {
    id: 'prod_vdn_009',
    sku: 'VDN-TRI-100G',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Triphala Churna',
    description: 'Canonical blend of Haritaki, Bibhitaki, and Amalaki. Provides gentle colon cleansing, relieves habitual constipation, and supports eye and skin health.',
    priceInINR: 110,
    mrpInINR: 125,
    stockQuantity: 300,
    unit: '100g',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/triphala-churna-100g',
    rating: 4.8,
    reviewCount: 620,
    ayurvedicMetadata: {
      classicalFormulationName: 'Triphala Churna',
      classicalTextReference: 'Charaka Samhita, Chikitsa Sthana 1:3',
      form: 'churna',
      doshaTarget: {
        pacifies: ['vata', 'pitta', 'kapha'],
        aggravates: []
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: false,
      contraindications: ['acute diarrhea', 'severe dehydration', 'pregnancy'],
      recommendedAnupana: ['lukewarm water before bed', 'ghee and honey (in unequal proportions)'],
      botanicalComposition: [
        { herbName: 'Haritaki', latinName: 'Terminalia chebula', percentage: 33.3 },
        { herbName: 'Bibhitaki', latinName: 'Terminalia bellirica', percentage: 33.3 },
        { herbName: 'Amalaki', latinName: 'Phyllanthus emblica', percentage: 33.3 }
      ],
      ageSuitability: { minAge: 6 }
    }
  },

  // ─── Schedule E-1 Regulated Herb (Requires Prescription / Clinical Review) ──
  {
    id: 'prod_vdn_010',
    sku: 'VDN-AGNIT-80TAB',
    brand: 'Vaidyanath Group',
    title: 'Baidyanath Agnitundi Vati (Schedule E-1 Regulated)',
    description: 'Extremely potent digestive stimulant for acute intestinal colic, dyspepsia, and severe Agnimandya. Contains Shuddha Kupilu (purified Strychnos nux-vomica).',
    priceInINR: 145,
    mrpInINR: 165,
    stockQuantity: 40,
    unit: '80 Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    supplierId: 'VAIDYANATH_GROUP',
    isAvailableForDirectPurchase: true,
    affiliateFallbackUrl: 'https://www.baidyanath.co.in/product/agnitundi-bati',
    rating: 4.6,
    reviewCount: 78,
    ayurvedicMetadata: {
      classicalFormulationName: 'Agnitundi Vati',
      classicalTextReference: 'Bhaishajya Ratnavali, Agnimandya Rogadhikara 103-107',
      form: 'vati',
      doshaTarget: {
        pacifies: ['vata', 'kapha'],
        aggravates: ['pitta']
      },
      ayushLicenseNumber: 'AYUSH-UP-1029-A',
      isScheduleE1: true, // Requires Prescription / AYUSH Practitioner Audit
      contraindications: ['pregnancy', 'lactation', 'children', 'cardiac arrhythmias', 'neurological excitability'],
      recommendedAnupana: ['lime juice', 'warm water'],
      botanicalComposition: [
        { herbName: 'Shuddha Kupilu (Purified Nux-Vomica)', latinName: 'Strychnos nux-vomica', percentage: 12 },
        { herbName: 'Shuddha Parada', percentage: 6 },
        { herbName: 'Shuddha Gandhaka', percentage: 6 },
        { herbName: 'Ajwain', latinName: 'Trachyspermum ammi', percentage: 12 },
        { herbName: 'Chitraka', latinName: 'Plumbago zeylanica', percentage: 12 }
      ],
      ageSuitability: { minAge: 18 }
    }
  }
];
