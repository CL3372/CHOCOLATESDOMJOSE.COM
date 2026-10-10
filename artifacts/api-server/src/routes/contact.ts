import { Router } from "express";
import { sendEmail, sendTelegram, escapeHtml } from "../lib/notify.js";
import { rateLimit } from "../lib/rateLimit.js";
import { isValidEmail } from "../lib/validate.js";

type Lang = "PT" | "EN" | "DE" | "NL";
const VALID_LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

const contactRouter = Router();

// Public, unauthenticated form wired straight to merchant email + Telegram.
// Throttle per IP, with a global backstop so spoofed IPs can't flood operators.
const contactLimiter = rateLimit({
  bucket: "contact",
  perIp: 5,
  global: 60,
  windowMs: 10 * 60 * 1000,
});

async function verifyTurnstile(token: string, remoteIp: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail closed: if the secret isn't configured, don't silently let traffic through.
    return false;
  }
  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

contactRouter.post("/contact", contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, lang: rawLang, website, turnstileToken } = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      lang?: string;
      website?: string;
      turnstileToken?: string;
    };

    // Honeypot: real visitors never see or fill this field. Bots usually do.
    // Return a fake success so the bot doesn't know it was caught, but skip the notification.
    if (typeof website === "string" && website.trim().length > 0) {
      res.json({ ok: true });
      return;
    }

    const cleanName = (name ?? "").trim();
    const cleanEmail = (email ?? "").trim();
    const cleanSubject = (subject ?? "").trim();
    const cleanMessage = (message ?? "").trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: "invalid_email" });
      return;
    }
    if (cleanMessage.length > 5000) {
      res.status(400).json({ error: "message_too_long" });
      return;
    }

    const remoteIp = req.ip;
    const captchaOk = await verifyTurnstile(typeof turnstileToken === "string" ? turnstileToken : "", remoteIp);
    if (!captchaOk) {
      res.status(400).json({ error: "captcha_failed" });
      return;
    }

    const lang: Lang =
      typeof rawLang === "string" && VALID_LANGS.includes(rawLang as Lang)
        ? (rawLang as Lang)
        : "PT";

    const safeName = escapeHtml(cleanName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeSubject = escapeHtml(cleanSubject || "(sem assunto)");
    const safeMessage = escapeHtml(cleanMessage).replace(/\n/g, "<br/>");

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <h2 style="background:#5a2a0a;color:#fff;padding:14px;margin:0;border-radius:6px 6px 0 0">📩 Novo contacto — Chocolates Dom José</h2>
      <div style="border:1px solid #ddd;border-top:0;padding:18px;border-radius:0 0 6px 6px">
        <p style="margin:0 0 12px"><strong>Nome:</strong> ${safeName}</p>
        <p style="margin:0 0 12px"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin:0 0 12px"><strong>Assunto:</strong> ${safeSubject}</p>
        <p style="margin:0 0 6px"><strong>Idioma:</strong> ${lang}</p>
        <hr style="border:0;border-top:1px solid #eee;margin:18px 0" />
        <p style="margin:0 0 6px"><strong>Mensagem:</strong></p>
        <div style="background:#fff8ef;border:1px solid #f0d9b5;padding:12px;border-radius:6px;line-height:1.6">
          ${safeMessage}
        </div>
        <p style="margin-top:18px;font-size:13px;color:#666">
          Para responder ao cliente, basta usar o botão "Responder" — irá responder diretamente para ${safeEmail}.
        </p>
      </div>
    </div>`;

    const text =
      `Novo contacto via formulário do site\n\n` +
      `Nome: ${cleanName}\n` +
      `Email: ${cleanEmail}\n` +
      `Assunto: ${cleanSubject || "(sem assunto)"}\n` +
      `Idioma: ${lang}\n\n` +
      `Mensagem:\n${cleanMessage}\n`;

    const subjectLine = `📩 Novo contacto: ${cleanSubject || cleanName} (${lang})`;

    const telegramMsg =
      `📩 Novo contacto via site\n\n` +
      `👤 ${cleanName}\n` +
      `📧 ${cleanEmail}\n` +
      `📝 ${cleanSubject || "(sem assunto)"}\n` +
      `🌐 ${lang}\n\n` +
      `💬 ${cleanMessage}`;

    await Promise.allSettled([
      sendEmail(subjectLine, text, html),
      sendTelegram(telegramMsg),
    ]);

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "contact form error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default contactRouter;
