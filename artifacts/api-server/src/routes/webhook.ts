import { Router } from "express";
import { sendEmail, sendTelegram } from "../lib/notify.js";

const webhookRouter = Router();

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
      body?.order?.value ??
      body?.amount ??
      0;

    const method: string =
      body?.transaction?.type ??
      body?.payment?.method ??
      body?.method ??
      "Cartão";

    const paymentId: string =
      body?.transaction?.id ??
      body?.payment?.id ??
      body?.id ??
      "-";

    const methodLabel =
      method === "MB" ? "Multibanco" :
      method === "MBW" ? "MB WAY" :
      method === "CC" ? "Cartão de crédito" :
      method;

    const text =
      `✅ PAGAMENTO CONFIRMADO\n\n` +
      `🍫 Chocolates Dom José\n\n` +
      `💶 Valor: €${Number(amount).toFixed(2)}\n` +
      `💳 Método: ${methodLabel}\n` +
      `🆔 ID: ${paymentId}\n\n` +
      `Pode preparar a encomenda. Verifique a morada de envio na encomenda original.`;

    const subject = `✅ Pagamento confirmado €${Number(amount).toFixed(2)} — Chocolates Dom José`;

    await Promise.allSettled([sendEmail(subject, text), sendTelegram(text)]);

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default webhookRouter;
