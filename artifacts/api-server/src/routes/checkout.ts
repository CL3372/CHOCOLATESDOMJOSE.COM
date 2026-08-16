import { Router } from "express";
import { createEasyPayCheckout } from "../lib/easypay.js";
import { notifyOrder } from "../lib/notify.js";
import { setPendingOrder, type Lang } from "../lib/orderStore.js";
import { rateLimit } from "../lib/rateLimit.js";
import { isValidEmail } from "../lib/validate.js";

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

// PostLog/GLS rates (24h-48h service). Tiers are "up to N grams". PT carries a
// flat +€1.50 markup and is free above €100 subtotal; international (the
// PostLog "ES" column, used for any non-PT destination) carries a +€2.00
// markup and is always charged — no free threshold. The *_ADIC_CENTS_PER_KG
// rates PostLog charges above the 30kg tier carry no markup (marginal rate).
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

const INTL_SHIPPING_TIERS: { maxGrams: number; cents: number }[] = [
  { maxGrams: 1000, cents: 772 },
  { maxGrams: 3000, cents: 772 },
  { maxGrams: 5000, cents: 848 },
  { maxGrams: 10000, cents: 1001 },
  { maxGrams: 15000, cents: 1114 },
  { maxGrams: 20000, cents: 1209 },
  { maxGrams: 25000, cents: 1396 },
  { maxGrams: 30000, cents: 1533 },
];
const INTL_SHIPPING_ADIC_CENTS_PER_KG = 57;

function isPortugal(country: string | undefined): boolean {
  const c = (country ?? "").trim().toLowerCase();
  return c === "" || c === "portugal" || c === "pt";
}

function tierLookup(totalWeightGrams: number, tiers: { maxGrams: number; cents: number }[], adicCentsPerKg: number): number {
  const tier = tiers.find((t) => totalWeightGrams <= t.maxGrams);
  if (tier) return tier.cents;

  const lastTier = tiers[tiers.length - 1];
  const extraKg = Math.ceil((totalWeightGrams - lastTier.maxGrams) / 1000);
  return lastTier.cents + extraKg * adicCentsPerKg;
}

function calculateShippingCents(totalWeightGrams: number, subtotalCents: number, country: string | undefined): number {
  if (isPortugal(country)) {
    if (subtotalCents >= PT_FREE_SHIPPING_THRESHOLD_CENTS) return 0;
    return tierLookup(totalWeightGrams, PT_SHIPPING_TIERS, PT_SHIPPING_ADIC_CENTS_PER_KG);
  }
  return tierLookup(totalWeightGrams, INTL_SHIPPING_TIERS, INTL_SHIPPING_ADIC_CENTS_PER_KG);
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

    // Customer/shipping fields are attacker-controlled and, unlike /api/contact,
    // were previously accepted with no validation — an empty or garbage
    // customer+shipping payload would still create a real EasyPay session, a
    // stored pending order, and a merchant notification. Reject early instead.
    const cleanCustomer = {
      name: (customer?.name ?? "").trim().slice(0, 200),
      email: (customer?.email ?? "").trim().slice(0, 200),
      phone: (customer?.phone ?? "").trim().slice(0, 40),
      nif: customer?.nif?.trim().slice(0, 40),
    };
    const cleanShipping = {
      address: (shipping?.address ?? "").trim().slice(0, 500),
      postcode: (shipping?.postcode ?? "").trim().slice(0, 20),
      city: (shipping?.city ?? "").trim().slice(0, 200),
      country: (shipping?.country ?? "Portugal").trim().slice(0, 100) || "Portugal",
    };

    if (!cleanCustomer.name || !cleanCustomer.email || !cleanCustomer.phone) {
      res.status(400).json({ error: "missing_customer_fields" });
      return;
    }
    if (!isValidEmail(cleanCustomer.email)) {
      res.status(400).json({ error: "invalid_email" });
      return;
    }
    if (!cleanShipping.address || !cleanShipping.postcode || !cleanShipping.city) {
      res.status(400).json({ error: "missing_shipping_fields" });
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
    const shippingCents = calculateShippingCents(totalWeightGrams, subtotalCents, cleanShipping.country);
    const amountCents = subtotalCents + shippingCents;

    const { manifest, orderKey } = await createEasyPayCheckout({
      amountCents,
      customer: cleanCustomer,
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
      customer: cleanCustomer,
      shipping: cleanShipping,
      items: itemsForStore,
      totalEur: amountCents / 100,
      lang,
    });

    notifyOrder({
      customerName: cleanCustomer.name,
      customerEmail: cleanCustomer.email,
      customerPhone: cleanCustomer.phone,
      customerNif: cleanCustomer.nif ?? "",
      shippingAddress: cleanShipping.address,
      shippingPostcode: cleanShipping.postcode,
      shippingCity: cleanShipping.city,
      shippingCountry: cleanShipping.country,
      items: itemsForStore.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceEur: i.unitPriceEur,
      })),
      totalEur: amountCents / 100,
      status: "pending",
      lang,
    }).catch((err: any) => req.log.error({ err: err?.message }, "Notify error (non-blocking)"));

    res.json({ manifest, orderKey });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "EasyPay checkout error");
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

export default checkoutRouter;
