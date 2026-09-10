import { NextRequest, NextResponse } from 'next/server';
import { FormulationMatcher, ClinicalMatchRequest } from '@/lib/ecommerce/catalog/matcher';

const matcher = new FormulationMatcher();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ClinicalMatchRequest;

    if (!body.diagnosticId || !body.recommendedFormulations || !Array.isArray(body.recommendedFormulations)) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: diagnosticId and recommendedFormulations array.' },
        { status: 400 }
      );
    }

    if (!body.patientVikriti) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: patientVikriti (active dosha imbalance).' },
        { status: 400 }
      );
    }

    const matches = matcher.matchRecommendations({
      diagnosticId: body.diagnosticId,
      recommendedFormulations: body.recommendedFormulations,
      patientVikriti: body.patientVikriti,
      patientPrakriti: body.patientPrakriti,
      patientConditions: body.patientConditions || [],
      patientAge: body.patientAge,
      preferredBrand: body.preferredBrand || 'Vaidyanath Group'
    });

    return NextResponse.json({
      success: true,
      diagnosticId: body.diagnosticId,
      matchCount: matches.length,
      matches
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error executing formulation matching' },
      { status: 500 }
    );
  }
}
