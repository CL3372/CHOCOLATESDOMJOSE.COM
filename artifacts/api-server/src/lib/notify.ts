import nodemailer from "nodemailer";

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

export async function sendEmail(subject: string, text: string, html?: string) {
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

function buildCustomerHtml(o: OrderDetails): string {
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
      <p>Olá ${o.customerName || ""},</p>
      <p>Obrigado pela sua encomenda! Recebemos os seus dados e iremos processar o seu pedido em breve.</p>

      <h4 style="margin-bottom:4px;margin-top:18px">📦 Morada de envio</h4>
      <div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;line-height:1.6">
        <div>${o.shippingAddress || "-"}</div>
        <div>${o.shippingPostcode || ""} ${o.shippingCity || ""}</div>
        <div>${o.shippingCountry || ""}</div>
      </div>

      <h4 style="margin-bottom:4px;margin-top:18px">🛍 Resumo da encomenda</h4>
      <table style="width:100%;border-collapse:collapse">${itemsRows}</table>
      <p style="margin-top:14px;font-size:18px"><strong>Total: €${o.totalEur.toFixed(2)}</strong></p>

      ${o.customerNif ? `<p style="font-size:13px;color:#666">NIF para fatura: <strong>${o.customerNif}</strong></p>` : ""}

      <hr style="border:0;border-top:1px solid #eee;margin:20px 0" />

      <p style="font-size:13px;color:#555">
        <strong>📄 Fatura:</strong> A fatura oficial será emitida pelo nosso sistema de faturação certificado e enviada para este email assim que possível${o.customerNif ? ", com o seu NIF" : ""}.
      </p>

      <p style="margin-top:24px;color:#555">
        Com os melhores cumprimentos,<br/>
        <strong>Chocolates Dom José</strong><br/>
        <a href="https://chocolatesdomjose.com" style="color:#5a2a0a">chocolatesdomjose.com</a>
      </p>
    </div>
  </div>`;
}

async function sendCustomerConfirmation(order: OrderDetails) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass || !order.customerEmail) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const subject = `Confirmação da sua encomenda — Chocolates Dom José`;
  const html = buildCustomerHtml(order);

  await transporter.sendMail({
    from: `"Chocolates Dom José" <${gmailUser}>`,
    to: order.customerEmail,
    subject,
    html,
  });
  console.log("Customer confirmation sent to", order.customerEmail);
}

export async function notifyOrder(order: OrderDetails) {
  const text = buildOrderText(order);
  const subject =
    order.status === "paid"
      ? `✅ Pagamento confirmado €${order.totalEur.toFixed(2)} — Chocolates Dom José`
      : `🛒 Nova encomenda €${order.totalEur.toFixed(2)} — Chocolates Dom José`;

  const html = buildOrderHtml(order);
  await Promise.allSettled([
    sendEmail(subject, text, html),
    sendTelegram(text),
    sendCustomerConfirmation(order).catch((e) => console.error("Customer email error:", e)),
  ]);
}
