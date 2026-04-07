import { Router } from "express";
import { getUncachableStripeClient } from "../lib/stripe.js";

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
    const { items, successUrl, cancelUrl } = req.body as {
      items: { id: string; quantity: number }[];
      successUrl: string;
      cancelUrl: string;
    };

    if (!items?.length) {
      res.status(400).json({ error: "No items in cart" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    const lineItems = items
      .filter((item) => PRODUCTS[item.id])
      .map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: PRODUCTS[item.id].name },
          unit_amount: PRODUCTS[item.id].price,
        },
        quantity: item.quantity,
      }));

    if (!lineItems.length) {
      res.status(400).json({ error: "No valid products in cart" });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      phone_number_collection: { enabled: true },
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: [
          "PT", "ES", "FR", "DE", "NL", "BE", "IT", "GB", "AT", "CH",
          "SE", "NO", "DK", "FI", "IE", "LU", "PL", "CZ", "SK", "HU",
          "RO", "HR", "SI", "EE", "LV", "LT", "US", "CA", "AU", "BR",
        ],
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

export default checkoutRouter;
