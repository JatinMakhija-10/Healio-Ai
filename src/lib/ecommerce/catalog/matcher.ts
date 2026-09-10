/**
 * Formulation-to-SKU Recommendation Matcher
 * 
 * Bridges the clinical diagnostic engine (Bayesian probabilities + RAG classical monographs)
 * to real-world commercial Ayurvedic products from Vaidyanath Group and authorized suppliers.
 */

import { ProductSKU, DoshaType, TraceabilityMetadata } from '../types';
import { AYURVEDIC_CATALOG } from './catalogData';

export interface ClinicalMatchRequest {
  diagnosticId: string;
  recommendedFormulations: string[];    // e.g. ["Avipattikar Churna", "Ashwagandha", "Sitopaladi"]
  patientVikriti: DoshaType;            // Active imbalance
  patientPrakriti?: DoshaType;          // Baseline constitution
  patientConditions?: string[];         // e.g. ["pregnancy", "hypertension", "diabetes"]
  patientAge?: number;
  preferredBrand?: string;              // Default: "Vaidyanath Group"
}

export interface ProductMatchResult {
  product: ProductSKU;
  matchScore: number;                   // 0 to 100
  isSafe: boolean;
  requiresPrescription: boolean;
  safetyAlerts: string[];
  clinicalRationale: string;
  traceability: TraceabilityMetadata;
}

export class FormulationMatcher {
  private catalog: ProductSKU[];

  constructor(customCatalog?: ProductSKU[]) {
    this.catalog = customCatalog || AYURVEDIC_CATALOG;
  }

  /**
   * Matches diagnostic recommendations to catalog SKUs with clinical safety filtering
   */
  public matchRecommendations(request: ClinicalMatchRequest): ProductMatchResult[] {
    const results: ProductMatchResult[] = [];
    const normalizedConditions = (request.patientConditions || []).map(c => c.toLowerCase().trim());
    const userAge = request.patientAge ?? 30;

    for (const formulationName of request.recommendedFormulations) {
      const cleanFormulation = formulationName.toLowerCase().trim();

      for (const product of this.catalog) {
        const meta = product.ayurvedicMetadata;
        const classicalName = meta.classicalFormulationName.toLowerCase();
        
        // 1. Text & Synonym Formulation Matching
        const isDirectMatch = classicalName.includes(cleanFormulation) || cleanFormulation.includes(classicalName);
        const isBotanicalMatch = meta.botanicalComposition.some(b => 
          b.herbName.toLowerCase().includes(cleanFormulation) || 
          (b.latinName && b.latinName.toLowerCase().includes(cleanFormulation))
        );

        if (!isDirectMatch && !isBotanicalMatch) {
          continue;
        }

        let score = 50;
        const safetyAlerts: string[] = [];
        let isSafe = true;

        // 2. Brand Priority (Vaidyanath Group partnership priority)
        const targetBrand = request.preferredBrand || 'Vaidyanath Group';
        if (product.brand.toLowerCase() === targetBrand.toLowerCase()) {
          score += 15;
        }

        // 3. Dosha Harmony Scoring
        if (meta.doshaTarget.pacifies.includes(request.patientVikriti)) {
          score += 25;
        }
        if (meta.doshaTarget.aggravates?.includes(request.patientVikriti)) {
          score -= 35;
          safetyAlerts.push(`Caution: May aggravate active ${request.patientVikriti.toUpperCase()} imbalance.`);
        }
        if (request.patientPrakriti && meta.doshaTarget.aggravates?.includes(request.patientPrakriti)) {
          score -= 15;
          safetyAlerts.push(`Note: Aggravates baseline ${request.patientPrakriti.toUpperCase()} constitution; short-term use recommended.`);
        }

        // 4. Clinical Contraindications
        for (const userCondition of normalizedConditions) {
          const matchedContra = meta.contraindications.find(ci => ci.toLowerCase().includes(userCondition));
          if (matchedContra) {
            isSafe = false;
            score -= 60;
            safetyAlerts.push(`CONTRAINDICATED: Incompatible with reported condition (${matchedContra}).`);
          }
        }

        // 5. Age Suitability
        if (userAge < meta.ageSuitability.minAge) {
          isSafe = false;
          score -= 50;
          safetyAlerts.push(`Age Restriction: Minimum recommended age is ${meta.ageSuitability.minAge} years.`);
        }

        // 6. Stock & Availability
        if (product.stockQuantity <= 0) {
          score -= 20;
          safetyAlerts.push('Direct inventory out of stock. Instant dispatch available via Vaidyanath affiliate.');
        }

        // 7. Clinical Traceability
        const primaryAnupana = meta.recommendedAnupana[0] || 'lukewarm water';
        const defaultDosage = meta.form === 'churna' ? '3g twice daily before food' :
                             meta.form === 'vati' ? '1 to 2 tablets twice daily after meals' :
                             meta.form === 'asava_arishta' ? '20ml with equal water after meals' :
                             'As directed by Ayurvedic physician';

        const rationale = `Recommended to pacify ${request.patientVikriti.toUpperCase()} via classical ${meta.classicalFormulationName} formulation (${meta.classicalTextReference}).`;

        const traceability: TraceabilityMetadata = {
          diagnosticId: request.diagnosticId,
          targetDosha: request.patientVikriti,
          recommendedDosage: defaultDosage,
          anupana: primaryAnupana,
          rationale,
          clinicalSafetyApproved: isSafe
        };

        results.push({
          product,
          matchScore: Math.min(100, Math.max(0, score)),
          isSafe,
          requiresPrescription: meta.isScheduleE1,
          safetyAlerts,
          clinicalRationale: rationale,
          traceability
        });
      }
    }

    // Sort by: safe items first, then highest match score, then stock
    return results.sort((a, b) => {
      if (a.isSafe !== b.isSafe) return a.isSafe ? -1 : 1;
      return b.matchScore - a.matchScore;
    });
  }
}
