/** 1 square yard = 9 square feet */
export const SQFT_PER_SQYD = 9;

export function parseAreaInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatAreaValue(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function sqftToSqyd(sqft: number): number {
  return Math.round((sqft / SQFT_PER_SQYD) * 100) / 100;
}

export function sqydToSqft(sqyd: number): number {
  return Math.round(sqyd * SQFT_PER_SQYD * 100) / 100;
}

export function convertFromSqft(sqftRaw: string): { sqft: string; sqyd: string } {
  const n = parseAreaInput(sqftRaw);
  if (n == null) return { sqft: sqftRaw, sqyd: "" };
  return { sqft: sqftRaw, sqyd: formatAreaValue(sqftToSqyd(n)) };
}

export function convertFromSqyd(sqydRaw: string): { sqft: string; sqyd: string } {
  const n = parseAreaInput(sqydRaw);
  if (n == null) return { sqft: "", sqyd: sqydRaw };
  return { sqft: formatAreaValue(sqydToSqft(n)), sqyd: sqydRaw };
}
