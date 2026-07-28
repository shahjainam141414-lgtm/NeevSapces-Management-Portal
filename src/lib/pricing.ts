/** Indian real-estate price helpers (Lac / Cr). 1 Cr = 100 Lac. */

export type PriceUnit = "lac" | "cr";

export const PRICE_UNITS: { value: PriceUnit; label: string }[] = [
  { value: "lac", label: "Lac." },
  { value: "cr", label: "Cr." },
];

export type StructuredPrice = {
  amount: number;
  unit: PriceUnit;
};

/** Convert any Lac/Cr amount into Lac for comparison / sorting. */
export function toLac(amount: number, unit: PriceUnit): number {
  return unit === "cr" ? amount * 100 : amount;
}

/** Pretty amount: strip trailing zeros (1.30 → 1.3, 90.0 → 90). */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const rounded = Math.round(amount * 1000) / 1000;
  return String(rounded);
}

export function formatPricePart(amount: number, unit: PriceUnit): string {
  const n = formatAmount(amount);
  if (!n) return "";
  return unit === "cr" ? `${n} Cr.` : `${n} Lac.`;
}

/** Single card display label, with trailing * (listing convention). */
export function formatCardPrice(
  amount: number | null | undefined,
  unit: PriceUnit | null | undefined,
): string {
  if (amount == null || !Number.isFinite(amount) || !unit) return "";
  return `${formatPricePart(amount, unit)}*`;
}

/**
 * Pick the nicest unit for a Lac-equivalent value when auto-formatting a bound.
 * Prefer Cr when ≥ 100 Lac (i.e. ≥ 1 Cr).
 */
export function preferUnit(lacValue: number): StructuredPrice {
  if (lacValue >= 100) {
    return { amount: lacValue / 100, unit: "cr" };
  }
  return { amount: lacValue, unit: "lac" };
}

/**
 * Build "90 Lac. - 1.3 Cr.*" from structured card prices.
 * Orders by absolute value (Lac-equivalent), so Cr then Lac still sorts correctly.
 */
export function buildPriceRangeLabel(
  prices: Array<{ amount?: number | null; unit?: PriceUnit | null }>,
): string {
  const parsed = prices
    .filter(
      (p): p is StructuredPrice =>
        p.amount != null &&
        Number.isFinite(p.amount) &&
        p.amount > 0 &&
        (p.unit === "lac" || p.unit === "cr"),
    )
    .map((p) => ({ ...p, lac: toLac(p.amount, p.unit) }))
    .sort((a, b) => a.lac - b.lac);

  if (parsed.length === 0) return "";
  if (parsed.length === 1) {
    return `${formatPricePart(parsed[0].amount, parsed[0].unit)}*`;
  }

  const min = parsed[0];
  const max = parsed[parsed.length - 1];
  if (Math.abs(min.lac - max.lac) < 0.0001) {
    return `${formatPricePart(min.amount, min.unit)}*`;
  }

  return `${formatPricePart(min.amount, min.unit)} - ${formatPricePart(max.amount, max.unit)}*`;
}

/**
 * Parse free-text prices like "1.3 Cr.*", "90 Lac", "1.55 Cr" into structured.
 * Returns null if it looks like a range or can't be parsed.
 */
export function parsePriceLabel(raw: string | null | undefined): StructuredPrice | null {
  if (!raw?.trim()) return null;
  const text = raw.trim();
  // Skip range strings
  if (/\s-\s/.test(text) || /–/.test(text)) return null;

  const m = text.match(
    /^([\d]+(?:\.\d+)?)\s*(cr|crore|lac|lakh|lacs|lakhs)\.?\s*\*?$/i,
  );
  if (!m) return null;
  const amount = Number(m[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const u = m[2].toLowerCase();
  const unit: PriceUnit = u.startsWith("cr") ? "cr" : "lac";
  return { amount, unit };
}

/** Allow decimal typing: digits + one optional dot. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function parseDecimal(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
