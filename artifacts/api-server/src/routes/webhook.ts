import { Router } from "express";
import { sendEmail, sendTelegram } from "../lib/notify.js";
import {
  getPendingOrder,
  deletePendingOrder,
  tryReservePayment,
  releasePayment,
} from "../lib/orderStore.js";
import { issueInvoiceReceipt } from "../lib/moloni.js";

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

    // Only treat fully settled payments as paid. Skip "authorisation" — it's pre-capture.
    const isPaid = status === "success" || status === "paid";

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

    const orderKey: string =
      body?.order?.key ??
      body?.transaction?.key ??
      body?.payment?.key ??
      body?.key ??
      "";

    // Idempotency — if EasyPay re-delivers, don't double-issue or double-notify
    if (!tryReservePayment(paymentId)) {
      console.log(`Webhook duplicate for paymentId=${paymentId} — ignoring`);
      res.json({ received: true, deduped: true });
      return;
    }

    const methodLabel =
      method === "MB" ? "Multibanco" :
      method === "MBW" ? "MB WAY" :
      method === "CC" ? "Cartão de crédito" :
      method;

    const amountStr = Number(amount).toFixed(2);

    let faturaLine = "";
    const stored = orderKey ? getPendingOrder(orderKey) : undefined;

    if (stored) {
      // Reconcile webhook amount vs stored cart total — guard against tampering / mismatches
      const storedTotalCents = Math.round(stored.totalEur * 100);
      const paidCents = Math.round(Number(amount) * 100);
      if (paidCents > 0 && Math.abs(storedTotalCents - paidCents) > 1) {
        faturaLine =
          `⚠️ Fatura NÃO emitida — valor pago (€${amountStr}) não corresponde ao total da encomenda (€${stored.totalEur.toFixed(2)}). Verifique manualmente.\n`;
      } else {
        try {
          const result = await issueInvoiceReceipt({
            customer: stored.customer,
            shipping: stored.shipping,
            items: stored.items,
            totalEur: stored.totalEur,
            paymentMethodLabel: methodLabel,
            paymentRef: paymentId,
          });
          faturaLine =
            `📄 Fatura-Recibo: ${result.document_number || result.document_id}` +
            (result.emailedTo ? ` (enviada para ${result.emailedTo})` : ` (NÃO enviada por email — verifique Moloni)`) +
            `\n`;
          deletePendingOrder(orderKey);
        } catch (e: any) {
          console.error("Moloni invoice error:", e);
          faturaLine = `⚠️ ERRO ao emitir fatura no Moloni: ${e?.message ?? e}\n   → Emita manualmente em https://www.moloni.pt\n`;
          // release reservation so a manual retry/EasyPay re-delivery can try again
          releasePayment(paymentId);
        }
      }
    } else {
      faturaLine = orderKey
        ? `⚠️ Fatura NÃO emitida (encomenda ${orderKey} não encontrada no servidor — pode ter expirado ou reiniciado). Emita manualmente.\n`
        : `⚠️ Fatura NÃO emitida (sem chave da encomenda no webhook). Emita manualmente.\n`;
    }

    const text =
      `✅ PAGAMENTO CONFIRMADO\n\n` +
      `🍫 Chocolates Dom José\n\n` +
      `💶 Valor: €${amountStr}\n` +
      `💳 Método: ${methodLabel}\n` +
      `🆔 ID: ${paymentId}\n` +
      (orderKey ? `🔑 Encomenda: ${orderKey}\n` : "") +
      `\n${faturaLine}` +
      `\nPode preparar a encomenda. Verifique a morada de envio na encomenda original.`;

    const subject = `✅ Pagamento confirmado €${amountStr} — Chocolates Dom José`;

    await Promise.allSettled([sendEmail(subject, text), sendTelegram(text)]);

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default webhookRouter;
