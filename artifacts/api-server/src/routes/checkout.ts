import { Router } from "express";
import { createEasyPayCheckout, SITE_URL } from "../lib/easypay.js";
import { notifyOrder } from "../lib/notify.js";
import { setPendingOrder, type Lang } from "../lib/orderStore.js";
import { rateLimit } from "../lib/rateLimit.js";

const VALID_LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

const checkoutRouter = Router();

// Each accepted checkout creates an EasyPay session, a pending-order row, and a
// merchant notification — all before any payment. Throttle to stop a flood of
// fake orders from spamming the operator and exhausting EasyPay quota.
const checkoutLimiter = rateLimit({
  bucket: "checkout",
  perIp: 10,
  global: 120,
  windowMs: 10 * 60 * 1000,
});

const PRODUCTS: Record<string, { name: string; price: number; weightGrams: number }> = {
  trufas_artesanais: { name: "Trufas Artesanais", price: 1500, weightGrams: 300 },
  trufas_laranja: { name: "Trufas de Laranja", price: 1500, weightGrams: 300 },
  trufas_chocolate_77: { name: "Trufas de Chocolate 77%", price: 1500, weightGrams: 300 },
  peras_bebedas: { name: "Pêras Bebedas", price: 700, weightGrams: 600 },
  dom_piri_piri: { name: "Dom Piri Piri", price: 700, weightGrams: 200 },
  // Cabazes vary by contents; billed at the 2kg cap (heaviest offered) so
  // shipping is never undercharged.
  cabazes: { name: "Cabazes", price: 3000, weightGrams: 2000 },
};

// PostLog/GLS PT rates (24h-48h service), each with a flat +€1.50 markup already
// applied. Tiers are "up to N grams"; PT_SHIPPING_ADIC_CENTS is the per-extra-kg
// rate PostLog charges above the 30kg tier (no markup added to that marginal rate).
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
const PT_FREE_SHIPPING_THRESHOLD_CENTS = 10000; // €100

function isPortugal(country: string | undefined): boolean {
  const c = (country ?? "").trim().toLowerCase();
  return c === "portugal" || c === "pt";
}

// Shipping only applies to Portugal for now — international rates are not yet
// implemented (see replit.md), matching current Terms & Conditions language.
function calculateShippingCents(totalWeightGrams: number, subtotalCents: number, country: string | undefined): number {
  if (!isPortugal(country)) return 0;
  if (subtotalCents >= PT_FREE_SHIPPING_THRESHOLD_CENTS) return 0;

  const tier = PT_SHIPPING_TIERS.find((t) => totalWeightGrams <= t.maxGrams);
  if (tier) return tier.cents;

  const lastTier = PT_SHIPPING_TIERS[PT_SHIPPING_TIERS.length - 1];
  const extraKg = Math.ceil((totalWeightGrams - lastTier.maxGrams) / 1000);
  return lastTier.cents + extraKg * PT_SHIPPING_ADIC_CENTS_PER_KG;
}

checkoutRouter.post("/checkout", checkoutLimiter, async (req, res) => {
  try {
    const { items, customer, shipping, lang: rawLang } = req.body as {
      items: { id: string; quantity: number }[];
      customer?: { name?: string; email?: string; phone?: string; nif?: string };
      shipping?: {
        address?: string;
        postcode?: string;
        city?: string;
        country?: string;
      };
      lang?: string;
    };

    // Return URLs are generated server-side from the canonical site origin.
    // Client-supplied redirect targets are never trusted.
    const successUrl = `${SITE_URL}/?payment=success`;
    const cancelUrl = `${SITE_URL}/?payment=cancel`;

    const lang: Lang = VALID_LANGS.includes((rawLang ?? "").toUpperCase() as Lang)
      ? ((rawLang as string).toUpperCase() as Lang)
      : "PT";

    if (!items?.length) {
      res.status(400).json({ error: "No items in cart" });
      return;
    }

    const validItems = items.filter((i) => PRODUCTS[i.id]);
    if (!validItems.length) {
      res.status(400).json({ error: "No valid products in cart" });
      return;
    }

    const hasInvalidQuantity = validItems.some(
      (i) =>
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > 100
    );
    if (hasInvalidQuantity) {
      res.status(400).json({ error: "Invalid quantity: must be a whole number between 1 and 100" });
      return;
    }

    const subtotalCents = validItems.reduce(
      (sum, i) => sum + PRODUCTS[i.id].price * i.quantity,
      0
    );
    const totalWeightGrams = validItems.reduce(
      (sum, i) => sum + PRODUCTS[i.id].weightGrams * i.quantity,
      0
    );
    const shippingCents = calculateShippingCents(totalWeightGrams, subtotalCents, shipping?.country);
    const amountCents = subtotalCents + shippingCents;

    const { url, orderKey } = await createEasyPayCheckout({
      amountCents,
      returnUrl: successUrl,
      cancelUrl,
      customer,
    });

    const itemsForStore = validItems.map((i) => ({
      reference: i.id,
      name: PRODUCTS[i.id].name,
      quantity: i.quantity,
      unitPriceEur: PRODUCTS[i.id].price / 100,
    }));
    if (shippingCents > 0) {
      itemsForStore.push({
        reference: "shipping",
        name: "Portes de envio",
        quantity: 1,
        unitPriceEur: shippingCents / 100,
      });
    }

    // Persist BEFORE returning the EasyPay URL so the order is durably stored
    // even if the webhook arrives within milliseconds (and on a different
    // server instance behind the load balancer).
    await setPendingOrder(orderKey, {
      customer: {
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        nif: customer?.nif,
      },
      shipping: {
        address: shipping?.address ?? "",
        postcode: shipping?.postcode ?? "",
        city: shipping?.city ?? "",
        country: shipping?.country ?? "Portugal",
      },
      items: itemsForStore,
      totalEur: amountCents / 100,
      lang,
    });

    notifyOrder({
      customerName: customer?.name ?? "",
      customerEmail: customer?.email ?? "",
      customerPhone: customer?.phone ?? "",
      customerNif: customer?.nif ?? "",
      shippingAddress: shipping?.address ?? "",
      shippingPostcode: shipping?.postcode ?? "",
      shippingCity: shipping?.city ?? "",
      shippingCountry: shipping?.country ?? "Portugal",
      items: itemsForStore.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceEur: i.unitPriceEur,
      })),
      totalEur: amountCents / 100,
      status: "pending",
      lang,
    }).catch((err: any) => req.log.error({ err: err?.message }, "Notify error (non-blocking)"));

    res.json({ url });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "EasyPay checkout error");
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

export default checkoutRouter;
