import { Router } from "express";
import { createEasyPayCheckout } from "../lib/easypay.js";
import { notifyOrder } from "../lib/notify.js";
import { setPendingOrder, type Lang } from "../lib/orderStore.js";

const VALID_LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

const checkoutRouter = Router();

const PRODUCTS: Record<string, { name: string; price: number }> = {
  trufas_artesanais: { name: "Trufas Artesanais", price: 1500 },
  trufas_laranja: { name: "Trufas de Laranja", price: 1500 },
  trufas_chocolate_77: { name: "Trufas de Chocolate 77%", price: 1500 },
  peras_bebedas: { name: "Pêras Bebedas", price: 700 },
  dom_piri_piri: { name: "Dom Piri Piri", price: 700 },
  cabazes: { name: "Cabazes", price: 3000 },
};

checkoutRouter.post("/checkout", async (req, res) => {
  try {
    const { items, successUrl, cancelUrl, customer, shipping, lang: rawLang } = req.body as {
      items: { id: string; quantity: number }[];
      successUrl: string;
      cancelUrl: string;
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

    const amountCents = validItems.reduce(
      (sum, i) => sum + PRODUCTS[i.id].price * i.quantity,
      0
    );

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
    }).catch((err) => console.error("Notify error (non-blocking):", err));

    res.json({ url });
  } catch (err: any) {
    console.error("EasyPay checkout error:", err);
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

export default checkoutRouter;
