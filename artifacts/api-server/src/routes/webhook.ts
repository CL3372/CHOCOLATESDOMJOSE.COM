import { Router } from "express";
import nodemailer from "nodemailer";

const webhookRouter = Router();

function buildOrderMessage(data: {
  customerName: string;
  customerPhone: string;
  amount: string;
  methodLabel: string;
  paymentId: string;
}) {
  return (
    `🍫 Nova encomenda - Chocolates Dom José!\n\n` +
    `👤 Cliente: ${data.customerName}\n` +
    `📱 Telemóvel: ${data.customerPhone || "não fornecido"}\n` +
    `💶 Valor: ${data.amount}\n` +
    `💳 Método: ${data.methodLabel}\n` +
    `🆔 ID: ${data.paymentId}\n\n` +
    `Verifique o painel EasyPay para detalhes.`
  );
}

async function sendEmail(subject: string, text: string) {
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

async function sendTelegram(message: string) {
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

async function sendWhatsApp(message: string) {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const phone = process.env.NOTIFY_PHONE ?? "351912630054";

  if (!apiKey) return;

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("CallMeBot error:", res.status, await res.text());
  } else {
    console.log("WhatsApp notification sent");
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

    const messageData = {
      customerName,
      customerPhone,
      amount: amountFormatted,
      methodLabel,
      paymentId,
    };

    const message = buildOrderMessage(messageData);
    const subject = `🍫 Nova encomenda ${amountFormatted} — Chocolates Dom José`;

    await Promise.allSettled([
      sendEmail(subject, message),
      sendTelegram(message),
      sendWhatsApp(message),
    ]);

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default webhookRouter;
