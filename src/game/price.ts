import { z } from 'zod';

/** USD prices use cents. The only upper bound protects integer cent precision. */
export function normalizePrice(value: number): number | null {
  if (!Number.isFinite(value) || value < 0.01 || value > Number.MAX_SAFE_INTEGER / 100) return null;
  const cents = Math.round(value * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents / 100 : null;
}

// Preserve historical fractional prices; all new price actions normalize to cents.
export const PriceSchema = z.number().refine(value => normalizePrice(value) !== null, 'Choose a positive USD price within safe cent precision.');
