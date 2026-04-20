import { Router } from "express";
import { createEasyPayCheckout } from "../lib/easypay.js";
import { notifyOrder } from "../lib/notify.js";

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
    const { items, successUrl, cancelUrl, customer, shipping } = req.body as {
      items: { id: string; quantity: number }[];
      successUrl: string;
      cancelUrl: string;
      customer?: { name?: string; email?: string; phone?: string };
      shipping?: {
        address?: string;
        postcode?: string;
        city?: string;
        country?: string;
      };
    };

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

    const url = await createEasyPayCheckout({
      amountCents,
      returnUrl: successUrl,
      cancelUrl,
      customer,
    });

    notifyOrder({
      customerName: customer?.name ?? "",
      customerEmail: customer?.email ?? "",
      customerPhone: customer?.phone ?? "",
      shippingAddress: shipping?.address ?? "",
      shippingPostcode: shipping?.postcode ?? "",
      shippingCity: shipping?.city ?? "",
      shippingCountry: shipping?.country ?? "Portugal",
      items: validItems.map((i) => ({
        name: PRODUCTS[i.id].name,
        quantity: i.quantity,
        unitPriceEur: PRODUCTS[i.id].price / 100,
      })),
      totalEur: amountCents / 100,
      status: "pending",
    }).catch((err) => console.error("Notify error (non-blocking):", err));

    res.json({ url });
  } catch (err: any) {
    console.error("EasyPay checkout error:", err);
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

export default checkoutRouter;
