import { NextRequest, NextResponse } from 'next/server';
import { AYURVEDIC_CATALOG } from '@/lib/ecommerce/catalog/catalogData';
import { DoshaType } from '@/lib/ecommerce/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const brand = (searchParams.get('brand') || '').toLowerCase().trim();
    const dosha = (searchParams.get('dosha') || '').toLowerCase().trim() as DoshaType;
    const form = (searchParams.get('form') || '').toLowerCase().trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    let filtered = [...AYURVEDIC_CATALOG];

    if (search) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.ayurvedicMetadata.classicalFormulationName.toLowerCase().includes(search) ||
        p.ayurvedicMetadata.botanicalComposition.some(b => b.herbName.toLowerCase().includes(search))
      );
    }

    if (brand) {
      filtered = filtered.filter(p => p.brand.toLowerCase().includes(brand));
    }

    if (dosha) {
      filtered = filtered.filter(p => p.ayurvedicMetadata.doshaTarget.pacifies.includes(dosha));
    }

    if (form) {
      filtered = filtered.filter(p => p.ayurvedicMetadata.form === form);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      total,
      offset,
      limit,
      products: paginated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error fetching products' },
      { status: 500 }
    );
  }
}
