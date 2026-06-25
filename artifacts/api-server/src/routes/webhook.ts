import { Router } from "express";
import { sendEmail, sendTelegram, sendCustomerConfirmation } from "../lib/notify.js";
import {
  getPendingOrder,
  deletePendingOrder,
  tryReservePayment,
  releasePayment,
} from "../lib/orderStore.js";
import { issueInvoiceReceipt } from "../lib/moloni.js";
import { verifyEasyPayTransaction } from "../lib/easypay.js";
import { rateLimit } from "../lib/rateLimit.js";

const webhookRouter = Router();

// Guard the webhook against unauthenticated spam that would force an outbound
// EasyPay verification call for every inbound request and burn third-party quota.
// Limits are generous enough to accommodate EasyPay's own retry attempts from
// their shared IP ranges, while capping a single attacker to 30 hits per 10 min.
const webhookLimiter = rateLimit({
  bucket: "webhook_easypay",
  perIp: 30,
  global: 300,
  windowMs: 10 * 60 * 1000,
});

webhookRouter.post("/webhook/easypay", webhookLimiter, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;

    // Extract the transaction ID from the webhook body — this is the only
    // field we trust from the untrusted caller at this stage. Everything else
    // (status, amount, orderKey, method) is derived from EasyPay's own API.
    const rawTransactionId: string =
      body?.transaction?.id ??
      body?.payment?.id ??
      body?.id ??
      "";

    if (!rawTransactionId) {
      req.log.warn("Webhook rejected: no transaction id to verify");
      res.json({ received: true });
      return;
    }

    // Authenticate + fetch authoritative details: confirm with EasyPay that
    // this transaction actually exists, is paid, and retrieve its canonical
    // orderKey and paid amount — never from req.body.
    let txn;
    try {
      txn = await verifyEasyPayTransaction(rawTransactionId);
    } catch (verifyErr: any) {
      req.log.error(
        { transactionId: rawTransactionId, err: verifyErr?.message },
        "EasyPay transaction verification error"
      );
      // Return 200 so EasyPay does not retry indefinitely.
      res.json({ received: true });
      return;
    }

    if (!txn) {
      // Transaction exists but EasyPay does not report it as "success".
      req.log.warn(
        { transactionId: rawTransactionId },
        "Webhook rejected: EasyPay did not confirm transaction as paid"
      );
      res.json({ received: true });
      return;
    }

    // From here, all business-critical fields come from the verified EasyPay
    // response — not from the attacker-controlled webhook body.
    const { orderKey, paidAmount, method } = txn;
    const paymentId = rawTransactionId;

    // Idempotency — if EasyPay re-delivers, don't double-issue or double-notify.
    if (!(await tryReservePayment(paymentId))) {
      req.log.info({ paymentId }, "Webhook duplicate — ignoring");
      res.json({ received: true, deduped: true });
      return;
    }

    const methodLabel =
      method === "MB"  ? "Multibanco" :
      method === "MBW" ? "MB WAY" :
      method === "CC"  ? "Cartão de crédito" :
      method || "Cartão";

    const amountStr = paidAmount.toFixed(2);

    let faturaLine = "";
    const stored = orderKey ? await getPendingOrder(orderKey) : undefined;

    if (stored) {
      // Reconcile EasyPay-confirmed paid amount vs stored cart total.
      const storedTotalCents = Math.round(stored.totalEur * 100);
      const paidCents = Math.round(paidAmount * 100);
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
            (result.emailedTo
              ? ` (enviada para ${result.emailedTo})`
              : ` (NÃO enviada por email — verifique Moloni)`) +
            `\n`;
          await deletePendingOrder(orderKey);
        } catch (e: any) {
          req.log.error({ err: e?.message }, "Moloni invoice error");
          faturaLine = `⚠️ ERRO ao emitir fatura no Moloni: ${e?.message ?? e}\n   → Emita manualmente em https://www.moloni.pt\n`;
          // Release reservation so a manual retry/EasyPay re-delivery can try again.
          await releasePayment(paymentId);
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

    const tasks: Promise<unknown>[] = [sendEmail(subject, text), sendTelegram(text)];

    // Send the customer their confirmation email in their language (PT/EN/DE/NL).
    if (stored && stored.customer.email) {
      tasks.push(
        sendCustomerConfirmation({
          customerName: stored.customer.name,
          customerEmail: stored.customer.email,
          customerPhone: stored.customer.phone,
          customerNif: stored.customer.nif,
          shippingAddress: stored.shipping.address,
          shippingPostcode: stored.shipping.postcode,
          shippingCity: stored.shipping.city,
          shippingCountry: stored.shipping.country,
          items: stored.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPriceEur: i.unitPriceEur,
          })),
          totalEur: stored.totalEur,
          paymentId,
          status: "paid",
          lang: stored.lang,
        }).catch((e: any) =>
          req.log.error({ err: e?.message }, "Customer confirmation email error")
        )
      );
    }

    await Promise.allSettled(tasks);

    res.json({ received: true });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Webhook error");
    res.status(500).json({ error: err.message });
  }
});

export default webhookRouter;
