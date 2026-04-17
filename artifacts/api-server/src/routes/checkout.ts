import { Router } from "express";
import { createEasyPayCheckout } from "../lib/easypay.js";

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
    const { items, successUrl, cancelUrl, customer } = req.body as {
      items: { id: string; quantity: number }[];
      successUrl: string;
      cancelUrl: string;
      customer?: { name?: string; email?: string; phone?: string };
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

    res.json({ url });
  } catch (err: any) {
    console.error("EasyPay checkout error:", err);
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

export default checkoutRouter;
