import { ProductForm, DoshaType } from './types';

/**
 * User-facing display labels for Ayurvedic product forms.
 * Replaces raw internal database enum values (e.g. ASAVA_ARISHTA, TAILA).
 */
export const FORM_DISPLAY_LABELS: Record<ProductForm, string> = {
  churna: 'Churna (powder)',
  vati: 'Vati (tablet)',
  taila: 'Taila (oil)',
  asava_arishta: 'Asava and arishta',
  avaleha: 'Avaleha (herbal paste)',
  ghrita: 'Ghrita (medicated ghee)',
  kashaya: 'Kashaya (decoction)',
  capsule: 'Capsule',
  syrup: 'Syrup',
};

/**
 * Format raw form enum to a clean, human-readable display string.
 */
export function getFormLabel(form: ProductForm | string): string {
  if (form in FORM_DISPLAY_LABELS) {
    return FORM_DISPLAY_LABELS[form as ProductForm];
  }
  // Fallback for unmapped forms
  return form
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Formats pack size unit for scanning (e.g. "100g" -> "100 g", "450ml" -> "450 ml").
 */
export function formatPackSize(unit: string): string {
  if (!unit) return '';
  return unit
    .replace(/(\d+)\s*(g|gm|ml|kg)/i, '$1 $2')
    .toLowerCase();
}

/**
 * Formats dosha pacification targets into calm, plain sentence-case text.
 * Replaces confusing symbols like "↓ PITTA".
 * Example: "Pacifies Pitta, Vata"
 */
export function formatDoshaPacification(pacifies: DoshaType[] = []): string {
  if (!pacifies || pacifies.length === 0) return 'Dosha balancing';

  const normalized = pacifies.map((d) => d.toLowerCase());
  const hasVata = normalized.includes('vata');
  const hasPitta = normalized.includes('pitta');
  const hasKapha = normalized.includes('kapha');

  if (hasVata && hasPitta && hasKapha) {
    return 'Pacifies Vata, Pitta, Kapha (Tridoshic)';
  }

  const names = pacifies.map(
    (d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()
  );

  return `Pacifies ${names.join(', ')}`;
}

/**
 * Accurately compute discount percentage from stored MRP and selling price.
 */
export function getDiscountPercentage(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
