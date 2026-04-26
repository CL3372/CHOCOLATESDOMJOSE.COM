import nodemailer from "nodemailer";
import type { Lang } from "./orderStore.js";

export type OrderDetails = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNif?: string;
  shippingAddress: string;
  shippingPostcode: string;
  shippingCity: string;
  shippingCountry: string;
  items: { name: string; quantity: number; unitPriceEur: number }[];
  totalEur: number;
  paymentId?: string;
  status: "pending" | "paid";
  lang?: Lang;
};

type CustomerCopy = {
  subject: string;
  greeting: (name: string) => string;
  thanks: string;
  processing: string;
  shippingTitle: string;
  orderTitle: string;
  totalLabel: string;
  nifLine: (nif: string) => string;
  faturaNote: string;
  signature: string;
  team: string;
};

const CUSTOMER_COPY: Record<Lang, CustomerCopy> = {
  PT: {
    subject: "Obrigado pela sua encomenda — Chocolates Dom José",
    greeting: (n) => `Olá ${n || ""},`.trim(),
    thanks: "Obrigado pela sua encomenda!",
    processing:
      "O seu pagamento foi confirmado e a sua encomenda está a ser processada. Iremos prepará-la com todo o cuidado e enviá-la o mais brevemente possível.",
    shippingTitle: "📦 Morada de envio",
    orderTitle: "🛍 Resumo da encomenda",
    totalLabel: "Total",
    nifLine: (nif) => `NIF para fatura: <strong>${nif}</strong>`,
    faturaNote:
      "A fatura oficial será emitida pelo nosso sistema de faturação certificado e enviada para este email.",
    signature: "Com os melhores cumprimentos,",
    team: "Chocolates Dom José ♥",
  },
  EN: {
    subject: "Thank you for your order — Chocolates Dom José",
    greeting: (n) => `Hello ${n || ""},`.trim(),
    thanks: "Thank you for your order!",
    processing:
      "Your payment has been confirmed and your order is now being processed. We will prepare it with great care and ship it as soon as possible.",
    shippingTitle: "📦 Shipping address",
    orderTitle: "🛍 Order summary",
    totalLabel: "Total",
    nifLine: (nif) => `Tax number for invoice: <strong>${nif}</strong>`,
    faturaNote:
      "The official invoice will be issued by our certified invoicing system and sent to this email.",
    signature: "Kind regards,",
    team: "Chocolates Dom José ♥",
  },
  DE: {
    subject: "Vielen Dank für Ihre Bestellung — Chocolates Dom José",
    greeting: (n) => `Hallo ${n || ""},`.trim(),
    thanks: "Vielen Dank für Ihre Bestellung!",
    processing:
      "Ihre Zahlung wurde bestätigt und Ihre Bestellung wird jetzt bearbeitet. Wir werden sie mit größter Sorgfalt vorbereiten und so schnell wie möglich versenden.",
    shippingTitle: "📦 Lieferadresse",
    orderTitle: "🛍 Bestellübersicht",
    totalLabel: "Gesamt",
    nifLine: (nif) => `Steuernummer für Rechnung: <strong>${nif}</strong>`,
    faturaNote:
      "Die offizielle Rechnung wird von unserem zertifizierten Rechnungssystem ausgestellt und an diese E-Mail-Adresse gesendet.",
    signature: "Mit freundlichen Grüßen,",
    team: "Chocolates Dom José ♥",
  },
  NL: {
    subject: "Bedankt voor uw bestelling — Chocolates Dom José",
    greeting: (n) => `Hallo ${n || ""},`.trim(),
    thanks: "Bedankt voor uw bestelling!",
    processing:
      "Uw betaling is bevestigd en uw bestelling wordt nu verwerkt. We zullen deze met de grootste zorg voorbereiden en zo snel mogelijk verzenden.",
    shippingTitle: "📦 Verzendadres",
    orderTitle: "🛍 Besteloverzicht",
    totalLabel: "Totaal",
    nifLine: (nif) => `Btw-nummer voor factuur: <strong>${nif}</strong>`,
    faturaNote:
      "De officiële factuur wordt uitgegeven door ons gecertificeerde factureringssysteem en naar dit e-mailadres verzonden.",
    signature: "Met vriendelijke groet,",
    team: "Chocolates Dom José ♥",
  },
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
    `📱 Telemóvel: ${o.customerPhone || "-"}\n` +
    `🧾 NIF: ${o.customerNif || "-"}\n\n` +
    `📦 Morada de envio:\n` +
    `   ${o.shippingAddress || "-"}\n` +
    `   ${o.shippingPostcode || ""} ${o.shippingCity || ""}\n` +
    `   ${o.shippingCountry || ""}\n\n` +
    `🛍 Artigos:\n${itemsText}\n\n` +
    `💶 Total: €${o.totalEur.toFixed(2)}\n` +
    (o.paymentId ? `🆔 ID: ${o.paymentId}\n` : "")
  );
}

function buildOrderHtml(o: OrderDetails): string {
  const itemsRows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.quantity}× ${i.name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.unitPriceEur * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const statusLabel = o.status === "paid" ? "✅ PAGAMENTO CONFIRMADO" : "🛒 NOVA ENCOMENDA (a aguardar pagamento)";

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <h2 style="background:#5a2a0a;color:#fff;padding:14px;margin:0;border-radius:6px 6px 0 0">${statusLabel}</h2>
    <div style="border:1px solid #ddd;border-top:0;padding:18px;border-radius:0 0 6px 6px">
      <h3 style="margin-top:0">🍫 Chocolates Dom José</h3>

      <h4 style="margin-bottom:4px">👤 Cliente</h4>
      <p style="margin:2px 0"><strong>Nome:</strong> ${o.customerName || "-"}</p>
      <p style="margin:2px 0"><strong>Email:</strong> ${o.customerEmail || "-"}</p>
      <p style="margin:2px 0"><strong>Telemóvel:</strong> ${o.customerPhone || "-"}</p>
      <p style="margin:2px 0"><strong>NIF:</strong> ${o.customerNif || "-"}</p>

      <h4 style="margin-bottom:4px;margin-top:18px">📦 Morada de envio</h4>
      <div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;line-height:1.6">
        <div>${o.shippingAddress || "-"}</div>
        <div>${o.shippingPostcode || ""} ${o.shippingCity || ""}</div>
        <div>${o.shippingCountry || ""}</div>
      </div>

      <h4 style="margin-bottom:4px;margin-top:18px">🛍 Artigos</h4>
      <table style="width:100%;border-collapse:collapse">${itemsRows}</table>

      <p style="margin-top:18px;font-size:18px"><strong>💶 Total: €${o.totalEur.toFixed(2)}</strong></p>
      ${o.paymentId ? `<p style="color:#666;font-size:12px">ID: ${o.paymentId}</p>` : ""}
    </div>
  </div>`;
}

/**
 * Build a nodemailer transport. Prefers generic SMTP (works with cPanel /
 * Dominios.pt / any provider) when SMTP_HOST is configured. Falls back to
 * Gmail when only GMAIL_USER + GMAIL_APP_PASSWORD are set. Returns null +
 * sender address if no email provider is configured.
 */
function buildTransport(): { transporter: nodemailer.Transporter; from: string } | null {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    // 465 = implicit TLS (SMTPS), 587 = STARTTLS
    const secure = port === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    });
    return { transporter, from: `"Chocolates Dom José" <${smtpUser}>` };
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    return { transporter, from: `"Chocolates Dom José" <${gmailUser}>` };
  }

  return null;
}

export async function sendEmail(subject: string, text: string, html?: string) {
  const cfg = buildTransport();
  if (!cfg) {
    console.warn("No SMTP/Gmail credentials configured — skipping email");
    return;
  }

  const notifyEmail =
    process.env.NOTIFY_EMAIL ??
    process.env.SMTP_USER ??
    process.env.GMAIL_USER ??
    "";

  if (!notifyEmail) {
    console.warn("No notify recipient resolved — skipping email");
    return;
  }

  await cfg.transporter.sendMail({
    from: cfg.from,
    to: notifyEmail,
    subject,
    text,
    html,
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

function buildCustomerHtml(o: OrderDetails, copy: CustomerCopy): string {
  const itemsRows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.quantity}× ${i.name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.unitPriceEur * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <h2 style="background:#5a2a0a;color:#fff;padding:14px;margin:0;border-radius:6px 6px 0 0">🍫 Chocolates Dom José</h2>
    <div style="border:1px solid #ddd;border-top:0;padding:18px;border-radius:0 0 6px 6px">
      <p style="font-size:16px">${copy.greeting(o.customerName || "")}</p>
      <p style="font-size:16px"><strong>${copy.thanks}</strong></p>
      <p>${copy.processing}</p>

      <h4 style="margin-bottom:4px;margin-top:18px">${copy.shippingTitle}</h4>
      <div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;line-height:1.6">
        <div>${o.shippingAddress || "-"}</div>
        <div>${o.shippingPostcode || ""} ${o.shippingCity || ""}</div>
        <div>${o.shippingCountry || ""}</div>
      </div>

      <h4 style="margin-bottom:4px;margin-top:18px">${copy.orderTitle}</h4>
      <table style="width:100%;border-collapse:collapse">${itemsRows}</table>
      <p style="margin-top:14px;font-size:18px"><strong>${copy.totalLabel}: €${o.totalEur.toFixed(2)}</strong></p>

      ${o.customerNif ? `<p style="font-size:13px;color:#666">${copy.nifLine(o.customerNif)}</p>` : ""}

      <hr style="border:0;border-top:1px solid #eee;margin:20px 0" />

      <p style="font-size:13px;color:#555">
        <strong>📄</strong> ${copy.faturaNote}
      </p>

      <p style="margin-top:24px;color:#555">
        ${copy.signature}<br/>
        <strong>${copy.team}</strong><br/>
        <a href="https://chocolatesdomjose.com" style="color:#5a2a0a">chocolatesdomjose.com</a>
      </p>
    </div>
  </div>`;
}

export async function sendCustomerConfirmation(order: OrderDetails): Promise<void> {
  const cfg = buildTransport();
  if (!cfg) {
    console.warn("No SMTP/Gmail credentials configured — skipping customer confirmation email");
    return;
  }
  if (!order.customerEmail) {
    console.warn("No customer email — skipping customer confirmation");
    return;
  }

  const lang: Lang = order.lang ?? "PT";
  const copy = CUSTOMER_COPY[lang] ?? CUSTOMER_COPY.PT;

  const html = buildCustomerHtml(order, copy);

  await cfg.transporter.sendMail({
    from: cfg.from,
    to: order.customerEmail,
    subject: copy.subject,
    html,
  });
  console.log(`Customer confirmation (${lang}) sent to ${order.customerEmail}`);
}

export async function notifyOrder(order: OrderDetails) {
  const text = buildOrderText(order);
  const subject =
    order.status === "paid"
      ? `✅ Pagamento confirmado €${order.totalEur.toFixed(2)} — Chocolates Dom José`
      : `🛒 Nova encomenda €${order.totalEur.toFixed(2)} — Chocolates Dom José`;

  const html = buildOrderHtml(order);
  // Note: customer confirmation is intentionally NOT sent here.
  // It is sent from the EasyPay webhook once payment is actually confirmed,
  // so the customer doesn't get "your order is being processed" before they pay.
  await Promise.allSettled([
    sendEmail(subject, text, html),
    sendTelegram(text),
  ]);
}
