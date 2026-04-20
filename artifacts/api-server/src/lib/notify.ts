import nodemailer from "nodemailer";

export type OrderDetails = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingPostcode: string;
  shippingCity: string;
  shippingCountry: string;
  items: { name: string; quantity: number; unitPriceEur: number }[];
  totalEur: number;
  paymentId?: string;
  status: "pending" | "paid";
};

export function buildOrderText(o: OrderDetails): string {
  const itemsText = o.items
    .map(
      (i) =>
        `  • ${i.quantity}× ${i.name} — €${(i.unitPriceEur * i.quantity).toFixed(2)}`
    )
    .join("\n");

  const statusLabel = o.status === "paid" ? "✅ PAGAMENTO CONFIRMADO" : "🛒 NOVA ENCOMENDA (a aguardar pagamento)";

  return (
    `${statusLabel}\n\n` +
    `🍫 Chocolates Dom José\n\n` +
    `👤 Cliente: ${o.customerName || "-"}\n` +
    `📧 Email: ${o.customerEmail || "-"}\n` +
    `📱 Telemóvel: ${o.customerPhone || "-"}\n\n` +
    `📦 Morada de envio:\n` +
    `   ${o.shippingAddress || "-"}\n` +
    `   ${o.shippingPostcode || ""} ${o.shippingCity || ""}\n` +
    `   ${o.shippingCountry || ""}\n\n` +
    `🛍 Artigos:\n${itemsText}\n\n` +
    `💶 Total: €${o.totalEur.toFixed(2)}\n` +
    (o.paymentId ? `🆔 ID: ${o.paymentId}\n` : "")
  );
}

export async function sendEmail(subject: string, text: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const notifyEmail = process.env.NOTIFY_EMAIL ?? gmailUser;

  if (!gmailUser || !gmailPass) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"Chocolates Dom José" <${gmailUser}>`,
    to: notifyEmail,
    subject,
    text,
  });
  console.log("Email notification sent to", notifyEmail);
}

export async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping Telegram");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  if (!res.ok) {
    console.error("Telegram error:", res.status, await res.text());
  } else {
    console.log("Telegram notification sent");
  }
}

export async function notifyOrder(order: OrderDetails) {
  const text = buildOrderText(order);
  const subject =
    order.status === "paid"
      ? `✅ Pagamento confirmado €${order.totalEur.toFixed(2)} — Chocolates Dom José`
      : `🛒 Nova encomenda €${order.totalEur.toFixed(2)} — Chocolates Dom José`;

  await Promise.allSettled([sendEmail(subject, text), sendTelegram(text)]);
}
