import nodemailer from "nodemailer";
import type { Lang } from "./orderStore.js";

/**
 * Escape untrusted text before interpolating it into an HTML email template.
 * Checkout/shipping fields are attacker-controlled, so without this they could
 * inject clickable links or styled blocks into merchant/customer inboxes
 * (a realistic phishing channel).
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    team: 'Chocolates Dom José <span style="color:#c0392b">♥</span>',
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
    team: 'Chocolates Dom José <span style="color:#c0392b">♥</span>',
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
    team: 'Chocolates Dom José <span style="color:#c0392b">♥</span>',
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
    team: 'Chocolates Dom José <span style="color:#c0392b">♥</span>',
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
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.quantity}× ${escapeHtml(i.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.unitPriceEur * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const statusLabel = o.status === "paid" ? "✅ PAGAMENTO CONFIRMADO" : "🛒 NOVA ENCOMENDA (a aguardar pagamento)";

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <h2 style="background:#5a2a0a;color:#fff;padding:14px;margin:0;border-radius:6px 6px 0 0">${statusLabel}</h2>
    <div style="border:1px solid #ddd;border-top:0;padding:18px;border-radius:0 0 6px 6px">
      <h3 style="margin-top:0">🍫 Chocolates Dom José</h3>

      <h4 style="margin-bottom:4px">👤 Cliente</h4>
      <p style="margin:2px 0"><strong>Nome:</strong> ${escapeHtml(o.customerName) || "-"}</p>
      <p style="margin:2px 0"><strong>Email:</strong> ${escapeHtml(o.customerEmail) || "-"}</p>
      <p style="margin:2px 0"><strong>Telemóvel:</strong> ${escapeHtml(o.customerPhone) || "-"}</p>
      <p style="margin:2px 0"><strong>NIF:</strong> ${escapeHtml(o.customerNif ?? "") || "-"}</p>

      <h4 style="margin-bottom:4px;margin-top:18px">📦 Morada de envio</h4>
      <div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;line-height:1.6">
        <div>${escapeHtml(o.shippingAddress) || "-"}</div>
        <div>${escapeHtml(o.shippingPostcode)} ${escapeHtml(o.shippingCity)}</div>
        <div>${escapeHtml(o.shippingCountry)}</div>
      </div>

      <h4 style="margin-bottom:4px;margin-top:18px">🛍 Artigos</h4>
      <table style="width:100%;border-collapse:collapse">${itemsRows}</table>

      <p style="margin-top:18px;font-size:18px"><strong>💶 Total: €${o.totalEur.toFixed(2)}</strong></p>
      ${o.paymentId ? `<p style="color:#666;font-size:12px">ID: ${escapeHtml(o.paymentId)}</p>` : ""}
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
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.quantity}× ${escapeHtml(i.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.unitPriceEur * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <h2 style="background:#5a2a0a;color:#fff;padding:14px;margin:0;border-radius:6px 6px 0 0">🍫 Chocolates Dom José</h2>
    <div style="border:1px solid #ddd;border-top:0;padding:18px;border-radius:0 0 6px 6px">
      <p style="font-size:16px">${copy.greeting(escapeHtml(o.customerName || ""))}</p>
      <p style="font-size:16px"><strong>${copy.thanks}</strong></p>
      <p>${copy.processing}</p>

      <h4 style="margin-bottom:4px;margin-top:18px">${copy.shippingTitle}</h4>
      <div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;line-height:1.6">
        <div>${escapeHtml(o.shippingAddress) || "-"}</div>
        <div>${escapeHtml(o.shippingPostcode)} ${escapeHtml(o.shippingCity)}</div>
        <div>${escapeHtml(o.shippingCountry)}</div>
      </div>

      <h4 style="margin-bottom:4px;margin-top:18px">${copy.orderTitle}</h4>
      <table style="width:100%;border-collapse:collapse">${itemsRows}</table>
      <p style="margin-top:14px;font-size:18px"><strong>${copy.totalLabel}: €${o.totalEur.toFixed(2)}</strong></p>

      ${o.customerNif ? `<p style="font-size:13px;color:#666">${copy.nifLine(escapeHtml(o.customerNif))}</p>` : ""}

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

const INVOICE_EMAIL_COPY: Record<
  Lang,
  { subject: (docNumber: string) => string; greeting: (name: string) => string; body: string; signature: string }
> = {
  PT: {
    subject: (n) => `A sua fatura-recibo ${n} — Chocolates Dom José`,
    greeting: (name) => `Olá ${name || ""},`.trim(),
    body: "Em anexo encontra a fatura-recibo da sua encomenda. Obrigado pela sua compra!",
    signature: "Com os melhores cumprimentos,<br/>Chocolates Dom José",
  },
  EN: {
    subject: (n) => `Your invoice-receipt ${n} — Chocolates Dom José`,
    greeting: (name) => `Hello ${name || ""},`.trim(),
    body: "Please find your order's invoice-receipt attached. Thank you for your purchase!",
    signature: "Kind regards,<br/>Chocolates Dom José",
  },
  DE: {
    subject: (n) => `Ihre Rechnung ${n} — Chocolates Dom José`,
    greeting: (name) => `Hallo ${name || ""},`.trim(),
    body: "Im Anhang finden Sie die Rechnung zu Ihrer Bestellung. Vielen Dank für Ihren Einkauf!",
    signature: "Mit freundlichen Grüßen,<br/>Chocolates Dom José",
  },
  NL: {
    subject: (n) => `Uw factuur ${n} — Chocolates Dom José`,
    greeting: (name) => `Hallo ${name || ""},`.trim(),
    body: "In de bijlage vindt u de factuur van uw bestelling. Bedankt voor uw aankoop!",
    signature: "Met vriendelijke groet,<br/>Chocolates Dom José",
  },
};

/**
 * Downloads the invoice PDF from the Moloni-issued link and emails it to the
 * customer as an attachment, using our own SMTP (the same one that sends the
 * order confirmation) — because Moloni's API has no built-in "email this
 * document to the customer" call. Returns true only if the email was
 * actually sent, so the caller can log an accurate status.
 */
export async function sendInvoiceEmail(args: {
  customerEmail: string;
  customerName: string;
  documentNumber: string;
  pdfUrl: string;
  lang?: Lang;
}): Promise<boolean> {
  const cfg = buildTransport();
  if (!cfg) {
    console.warn("No SMTP/Gmail credentials configured — skipping invoice email");
    return false;
  }
  if (!args.customerEmail || !args.pdfUrl) return false;

  let buf: Buffer;
  try {
    const res = await fetch(args.pdfUrl);
    if (!res.ok) {
      console.error("Invoice PDF download failed, HTTP", res.status);
      return false;
    }
    const contentType = res.headers.get("content-type") || "";
    buf = Buffer.from(await res.arrayBuffer());
    if (!contentType.includes("pdf") && buf.length < 500) {
      console.error(
        "Invoice PDF download did not look like a PDF (content-type:",
        contentType,
        ", size:",
        buf.length,
        "bytes)"
      );
      return false;
    }
  } catch (e) {
    console.error("Invoice PDF download error:", e);
    return false;
  }

  const lang: Lang = args.lang ?? "PT";
  const copy = INVOICE_EMAIL_COPY[lang] ?? INVOICE_EMAIL_COPY.PT;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <p>${copy.greeting(escapeHtml(args.customerName || ""))}</p>
    <p>${copy.body}</p>
    <p style="margin-top:24px;color:#555">${copy.signature}</p>
  </div>`;

  await cfg.transporter.sendMail({
    from: cfg.from,
    to: args.customerEmail,
    subject: copy.subject(args.documentNumber),
    html,
    attachments: [
      {
        filename: `${(args.documentNumber || "fatura").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
        content: buf,
        contentType: "application/pdf",
      },
    ],
  });
  console.log(`Invoice email (${lang}) sent to ${args.customerEmail}`);
  return true;
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

export type CartRecoveryStage = "reminder" | "proof" | "deadline";

export type CartRecoveryOrder = {
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; unitPriceEur: number }[];
  totalEur: number;
  lang: Lang;
};

type CartRecoveryCopy = {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  // "proof" only
  awardLine?: string;
  quoteLabel?: string;
  // "deadline" only — {date} is replaced with the formatted cutoff date
  deadlineLine?: (date: string) => string;
  itemsTitle: string;
  totalLabel: string;
  cta: string;
  signature: string;
};

// The judges' quote is the exact wording already published on the site next
// to the Great Taste badge (Home.tsx) — never invent review/award text.
const GREAT_TASTE_QUOTE =
  "A fun little product with a complex spiced aroma and fascinating appearance. On the tongue the spices remain and are well defined if a little more gentle than had been expected. The texture of the pear remains excellent, providing for a satisfying bite.";

const CART_RECOVERY_COPY: Record<Lang, Record<CartRecoveryStage, CartRecoveryCopy>> = {
  PT: {
    reminder: {
      subject: "Ainda tem um carrinho à sua espera — Chocolates Dom José",
      greeting: (n) => `Olá ${n || ""},`.trim(),
      intro:
        "Reparámos que começou uma encomenda na nossa loja mas não chegou a concluir o pagamento. Ficou tudo guardado, se quiser terminar:",
      itemsTitle: "🛍 O que tinha no carrinho",
      totalLabel: "Total",
      cta: "Terminar a minha encomenda",
      signature: "Com os melhores cumprimentos,<br/>Chocolates Dom José",
    },
    proof: {
      subject: "Um prémio Great Taste pode ajudar a decidir — Chocolates Dom José",
      greeting: (n) => `Olá ${n || ""},`.trim(),
      intro:
        "A sua encomenda continua guardada. Entretanto, talvez isto ajude a decidir: as nossas Perinhas Bêbedas receberam 1 Estrela nos Great Taste Awards 2026, um dos prémios mais respeitados do mundo gourmet.",
      awardLine: "🏅 Great Taste 2026 · 1 Estrela",
      quoteLabel: "O que disseram os jurados:",
      itemsTitle: "🛍 O que tinha no carrinho",
      totalLabel: "Total",
      cta: "Terminar a minha encomenda",
      signature: "Com os melhores cumprimentos,<br/>Chocolates Dom José",
    },
    deadline: {
      subject: "Último prazo para chegar antes do Natal — Chocolates Dom José",
      greeting: (n) => `Olá ${n || ""},`.trim(),
      intro: "A sua encomenda ainda está guardada, mas o prazo para garantir a entrega antes do Natal está a aproximar-se.",
      deadlineLine: (date) => `📅 Para chegar antes do Natal, a encomenda precisa de ser feita até ${date}.`,
      itemsTitle: "🛍 O que tinha no carrinho",
      totalLabel: "Total",
      cta: "Terminar a minha encomenda",
      signature: "Com os melhores cumprimentos,<br/>Chocolates Dom José",
    },
  },
  EN: {
    reminder: {
      subject: "You still have a cart waiting — Chocolates Dom José",
      greeting: (n) => `Hello ${n || ""},`.trim(),
      intro:
        "We noticed you started an order on our site but didn't finish checking out. Everything's still saved if you'd like to complete it:",
      itemsTitle: "🛍 What was in your cart",
      totalLabel: "Total",
      cta: "Finish my order",
      signature: "Kind regards,<br/>Chocolates Dom José",
    },
    proof: {
      subject: "A Great Taste award might help you decide — Chocolates Dom José",
      greeting: (n) => `Hello ${n || ""},`.trim(),
      intro:
        "Your order is still saved. In the meantime, this might help: our Perinhas Bêbedas (Drunken Pears) won 1 Star at the Great Taste Awards 2026, one of the most respected awards in the gourmet food world.",
      awardLine: "🏅 Great Taste 2026 · 1 Star",
      quoteLabel: "What the judges said:",
      itemsTitle: "🛍 What was in your cart",
      totalLabel: "Total",
      cta: "Finish my order",
      signature: "Kind regards,<br/>Chocolates Dom José",
    },
    deadline: {
      subject: "Last chance to arrive before Christmas — Chocolates Dom José",
      greeting: (n) => `Hello ${n || ""},`.trim(),
      intro: "Your order is still saved, but the deadline to guarantee delivery before Christmas is approaching.",
      deadlineLine: (date) => `📅 To arrive before Christmas, the order needs to be placed by ${date}.`,
      itemsTitle: "🛍 What was in your cart",
      totalLabel: "Total",
      cta: "Finish my order",
      signature: "Kind regards,<br/>Chocolates Dom José",
    },
  },
  DE: {
    reminder: {
      subject: "Ihr Warenkorb wartet noch — Chocolates Dom José",
      greeting: (n) => `Hallo ${n || ""},`.trim(),
      intro:
        "Uns ist aufgefallen, dass Sie eine Bestellung begonnen, aber den Bezahlvorgang nicht abgeschlossen haben. Alles ist noch gespeichert, falls Sie sie abschließen möchten:",
      itemsTitle: "🛍 Ihr Warenkorb",
      totalLabel: "Gesamt",
      cta: "Bestellung abschließen",
      signature: "Mit freundlichen Grüßen,<br/>Chocolates Dom José",
    },
    proof: {
      subject: "Eine Great-Taste-Auszeichnung könnte Ihnen helfen — Chocolates Dom José",
      greeting: (n) => `Hallo ${n || ""},`.trim(),
      intro:
        "Ihre Bestellung ist noch gespeichert. Vielleicht hilft das bei der Entscheidung: Unsere Perinhas Bêbedas (betrunkene Birnen) gewannen 1 Stern bei den Great Taste Awards 2026, einer der angesehensten Auszeichnungen der Gourmet-Welt.",
      awardLine: "🏅 Great Taste 2026 · 1 Stern",
      quoteLabel: "Das sagten die Juroren:",
      itemsTitle: "🛍 Ihr Warenkorb",
      totalLabel: "Gesamt",
      cta: "Bestellung abschließen",
      signature: "Mit freundlichen Grüßen,<br/>Chocolates Dom José",
    },
    deadline: {
      subject: "Letzte Chance vor Weihnachten — Chocolates Dom José",
      greeting: (n) => `Hallo ${n || ""},`.trim(),
      intro: "Ihre Bestellung ist noch gespeichert, aber die Frist für eine Lieferung vor Weihnachten rückt näher.",
      deadlineLine: (date) => `📅 Damit die Bestellung noch vor Weihnachten ankommt, muss sie bis zum ${date} aufgegeben werden.`,
      itemsTitle: "🛍 Ihr Warenkorb",
      totalLabel: "Gesamt",
      cta: "Bestellung abschließen",
      signature: "Mit freundlichen Grüßen,<br/>Chocolates Dom José",
    },
  },
  NL: {
    reminder: {
      subject: "Uw winkelmandje wacht nog op u — Chocolates Dom José",
      greeting: (n) => `Hallo ${n || ""},`.trim(),
      intro:
        "We merkten dat u een bestelling begon op onze site, maar het afrekenen niet hebt afgerond. Alles is nog opgeslagen als u het wilt afronden:",
      itemsTitle: "🛍 Wat er in uw mandje zat",
      totalLabel: "Totaal",
      cta: "Bestelling afronden",
      signature: "Met vriendelijke groet,<br/>Chocolates Dom José",
    },
    proof: {
      subject: "Een Great Taste-onderscheiding kan u helpen beslissen — Chocolates Dom José",
      greeting: (n) => `Hallo ${n || ""},`.trim(),
      intro:
        "Uw bestelling is nog opgeslagen. Misschien helpt dit bij uw beslissing: onze Perinhas Bêbedas (dronken peren) wonnen 1 Ster bij de Great Taste Awards 2026, een van de meest gerespecteerde onderscheidingen in de gastronomische wereld.",
      awardLine: "🏅 Great Taste 2026 · 1 Ster",
      quoteLabel: "Wat de jury zei:",
      itemsTitle: "🛍 Wat er in uw mandje zat",
      totalLabel: "Totaal",
      cta: "Bestelling afronden",
      signature: "Met vriendelijke groet,<br/>Chocolates Dom José",
    },
    deadline: {
      subject: "Laatste kans om voor Kerstmis te ontvangen — Chocolates Dom José",
      greeting: (n) => `Hallo ${n || ""},`.trim(),
      intro: "Uw bestelling is nog opgeslagen, maar de deadline om levering voor Kerstmis te garanderen komt dichterbij.",
      deadlineLine: (date) => `📅 Om voor Kerstmis te ontvangen, moet de bestelling uiterlijk op ${date} geplaatst worden.`,
      itemsTitle: "🛍 Wat er in uw mandje zat",
      totalLabel: "Totaal",
      cta: "Bestelling afronden",
      signature: "Met vriendelijke groet,<br/>Chocolates Dom José",
    },
  },
};

function buildCartRecoveryHtml(
  order: CartRecoveryOrder,
  copy: CartRecoveryCopy,
  deadlineDateLabel?: string
): string {
  const itemsRows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.quantity}× ${escapeHtml(i.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.unitPriceEur * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <h2 style="background:#5a2a0a;color:#fff;padding:14px;margin:0;border-radius:6px 6px 0 0">🍫 Chocolates Dom José</h2>
    <div style="border:1px solid #ddd;border-top:0;padding:18px;border-radius:0 0 6px 6px">
      <p style="font-size:16px">${copy.greeting(escapeHtml(order.customerName || ""))}</p>
      <p>${copy.intro}</p>

      ${
        copy.awardLine
          ? `<div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;margin:14px 0">
               <p style="margin:0 0 6px 0;font-weight:bold;color:#5a2a0a">${copy.awardLine}</p>
               ${copy.quoteLabel ? `<p style="margin:0 0 4px 0;font-size:13px;color:#666">${copy.quoteLabel}</p>` : ""}
               <p style="margin:0;font-style:italic">"${escapeHtml(GREAT_TASTE_QUOTE)}"</p>
             </div>`
          : ""
      }

      ${
        copy.deadlineLine && deadlineDateLabel
          ? `<p style="background:#fdeeee;border:1px solid #f3c6c6;padding:12px;border-radius:6px;font-weight:bold;color:#a33">${copy.deadlineLine(deadlineDateLabel)}</p>`
          : ""
      }

      <h4 style="margin-bottom:4px;margin-top:18px">${copy.itemsTitle}</h4>
      <table style="width:100%;border-collapse:collapse">${itemsRows}</table>
      <p style="margin-top:14px;font-size:18px"><strong>${copy.totalLabel}: €${order.totalEur.toFixed(2)}</strong></p>

      <p style="margin-top:22px">
        <a href="https://chocolatesdomjose.com" style="display:inline-block;background:#5a2a0a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${copy.cta}</a>
      </p>

      <p style="margin-top:24px;color:#555;font-size:13px">
        ${copy.signature}<br/>
        <a href="https://chocolatesdomjose.com" style="color:#5a2a0a">chocolatesdomjose.com</a>
      </p>
    </div>
  </div>`;
}

/**
 * Sends one stage of the abandoned-checkout recovery sequence. Called by the
 * daily cart-recovery cron (routes/cron.ts), never directly from checkout —
 * this is a reminder about an order the customer already started, not cold
 * marketing, and it only ever fires once per stage per order (the cron
 * tracks that via StoredOrder.remindersSent).
 */
export async function sendCartRecoveryEmail(
  order: CartRecoveryOrder,
  stage: CartRecoveryStage,
  deadlineDateLabel?: string
): Promise<boolean> {
  const cfg = buildTransport();
  if (!cfg) {
    console.warn("No SMTP/Gmail credentials configured — skipping cart recovery email");
    return false;
  }
  if (!order.customerEmail) return false;

  const lang: Lang = order.lang ?? "PT";
  const copy = (CART_RECOVERY_COPY[lang] ?? CART_RECOVERY_COPY.PT)[stage];

  const html = buildCartRecoveryHtml(order, copy, deadlineDateLabel);

  await cfg.transporter.sendMail({
    from: cfg.from,
    to: order.customerEmail,
    subject: copy.subject,
    html,
  });
  console.log(`Cart recovery email (${stage}/${lang}) sent to ${order.customerEmail}`);
  return true;
}
