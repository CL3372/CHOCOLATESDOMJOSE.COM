import { Router } from "express";

const webhookRouter = Router();

async function sendWhatsApp(message: string) {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const phone = process.env.NOTIFY_PHONE ?? "351912630054";

  if (!apiKey) {
    console.warn("CALLMEBOT_API_KEY not set — skipping WhatsApp notification");
    return;
  }

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("CallMeBot error:", res.status, await res.text());
  } else {
    console.log("WhatsApp notification sent successfully");
  }
}

webhookRouter.post("/webhook/easypay", async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    console.log("EasyPay webhook received:", JSON.stringify(body, null, 2));

    const status: string =
      body?.transaction?.status ??
      body?.payment?.status ??
      body?.status ??
      "";

    const isPaid =
      status === "success" ||
      status === "paid" ||
      status === "authorisation" ||
      body?.type === "authorisation";

    if (!isPaid) {
      res.json({ received: true });
      return;
    }

    const amount: number =
      body?.transaction?.values?.paid ??
      body?.payment?.amount ??
      body?.amount ??
      0;

    const method: string =
      body?.transaction?.type ??
      body?.payment?.method ??
      body?.method ??
      "Cartão";

    const customerName: string =
      body?.payment?.customer?.name ??
      body?.customer?.name ??
      "Cliente";

    const customerPhone: string =
      body?.payment?.customer?.phone ??
      body?.customer?.phone ??
      "";

    const paymentId: string =
      body?.transaction?.id ??
      body?.payment?.id ??
      body?.id ??
      "-";

    const amountFormatted = `€${Number(amount).toFixed(2)}`;
    const methodLabel =
      method === "MB" ? "Multibanco" :
      method === "MBW" ? "MB WAY" :
      method === "CC" ? "Cartão de crédito" :
      method;

    const message =
      `🍫 *Nova encomenda - Chocolates Dom José!*\n\n` +
      `👤 Cliente: ${customerName}\n` +
      `📱 Telemóvel: ${customerPhone || "não fornecido"}\n` +
      `💶 Valor: ${amountFormatted}\n` +
      `💳 Método: ${methodLabel}\n` +
      `🆔 ID: ${paymentId}\n\n` +
      `Verifique o painel EasyPay para detalhes.`;

    await sendWhatsApp(message);

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default webhookRouter;
