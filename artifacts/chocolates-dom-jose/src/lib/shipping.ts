// Mirrors artifacts/api-server/src/routes/checkout.ts — keep both in sync if
// either the product weights or the PostLog/GLS PT rate table changes. The
// backend value is always authoritative for what's actually charged; this
// copy only drives the cart preview shown before checkout.

export const PRODUCT_WEIGHTS_GRAMS: Record<string, number> = {
  trufas_artesanais: 300,
  trufas_laranja: 300,
  trufas_chocolate_77: 300,
  peras_bebedas: 600,
  dom_piri_piri: 200,
  cabazes: 2000,
};

const PT_SHIPPING_TIERS: { maxGrams: number; cents: number }[] = [
  { maxGrams: 1000, cents: 475 },
  { maxGrams: 3000, cents: 532 },
  { maxGrams: 5000, cents: 558 },
  { maxGrams: 10000, cents: 627 },
  { maxGrams: 15000, cents: 722 },
  { maxGrams: 20000, cents: 778 },
  { maxGrams: 25000, cents: 874 },
  { maxGrams: 30000, cents: 912 },
];
const PT_SHIPPING_ADIC_CENTS_PER_KG = 28;
export const PT_FREE_SHIPPING_THRESHOLD_CENTS = 10000;

function isPortugal(country: string): boolean {
  const c = country.trim().toLowerCase();
  return c === "portugal" || c === "pt";
}

export function calculateShippingCents(
  items: { id: string; quantity: number }[],
  subtotalCents: number,
  country: string,
): number {
  if (!isPortugal(country)) return 0;
  if (subtotalCents >= PT_FREE_SHIPPING_THRESHOLD_CENTS) return 0;

  const totalWeightGrams = items.reduce(
    (sum, i) => sum + (PRODUCT_WEIGHTS_GRAMS[i.id] ?? 0) * i.quantity,
    0,
  );

  const tier = PT_SHIPPING_TIERS.find((t) => totalWeightGrams <= t.maxGrams);
  if (tier) return tier.cents;

  const lastTier = PT_SHIPPING_TIERS[PT_SHIPPING_TIERS.length - 1];
  const extraKg = Math.ceil((totalWeightGrams - lastTier.maxGrams) / 1000);
  return lastTier.cents + extraKg * PT_SHIPPING_ADIC_CENTS_PER_KG;
}
