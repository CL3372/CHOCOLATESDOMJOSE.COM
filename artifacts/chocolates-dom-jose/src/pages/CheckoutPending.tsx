import { useMemo } from "react";
import { Link } from "wouter";
import type { Lang } from "../context/CartContext";
import { getActiveSeason, SEASONAL_GREETING } from "../lib/seasonalGreeting";

const LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

const COPY: Record<Lang, {
  subtitle: string;
  title: string;
  body: string;
  entityLabel: string;
  referenceLabel: string;
  valueLabel: string;
  expirationLabel: string;
  bodyEmail: string;
  cta: string;
  closing: string;
  thanks: string;
}> = {
  PT: {
    subtitle: "Pagamento pendente",
    title: "A aguardar o seu pagamento Multibanco",
    body: "Recebemos a sua encomenda. Para a confirmar, complete o pagamento Multibanco com os dados abaixo.",
    entityLabel: "Entidade",
    referenceLabel: "Referência",
    valueLabel: "Valor",
    expirationLabel: "Válido até",
    bodyEmail: "Assim que o pagamento for confirmado, enviaremos a fatura e a confirmação da encomenda para o seu email.",
    cta: "Voltar à loja",
    closing: "A Chocolates Dom José agradece-lhe",
    thanks: "Chocolates Dom José",
  },
  EN: {
    subtitle: "Payment pending",
    title: "Awaiting your Multibanco payment",
    body: "We've received your order. To confirm it, complete the Multibanco payment using the details below.",
    entityLabel: "Entity",
    referenceLabel: "Reference",
    valueLabel: "Amount",
    expirationLabel: "Valid until",
    bodyEmail: "As soon as your payment is confirmed, we'll email you the invoice and order confirmation.",
    cta: "Back to shop",
    closing: "Chocolates Dom José thanks you",
    thanks: "Chocolates Dom José",
  },
  DE: {
    subtitle: "Zahlung ausstehend",
    title: "Wir warten auf Ihre Multibanco-Zahlung",
    body: "Wir haben Ihre Bestellung erhalten. Um sie zu bestätigen, schließen Sie die Multibanco-Zahlung mit den folgenden Angaben ab.",
    entityLabel: "Entität",
    referenceLabel: "Referenz",
    valueLabel: "Betrag",
    expirationLabel: "Gültig bis",
    bodyEmail: "Sobald Ihre Zahlung bestätigt ist, senden wir Ihnen die Rechnung und die Bestellbestätigung per E-Mail.",
    cta: "Zurück zum Shop",
    closing: "Chocolates Dom José bedankt sich bei Ihnen",
    thanks: "Chocolates Dom José",
  },
  NL: {
    subtitle: "Betaling in behandeling",
    title: "We wachten op uw Multibanco-betaling",
    body: "We hebben uw bestelling ontvangen. Om deze te bevestigen, rondt u de Multibanco-betaling af met onderstaande gegevens.",
    entityLabel: "Entiteit",
    referenceLabel: "Referentie",
    valueLabel: "Bedrag",
    expirationLabel: "Geldig tot",
    bodyEmail: "Zodra uw betaling is bevestigd, sturen we u de factuur en bestelbevestiging per e-mail.",
    cta: "Terug naar de winkel",
    closing: "Chocolates Dom José dankt u",
    thanks: "Chocolates Dom José",
  },
};

function detectLang(): Lang {
  if (typeof window === "undefined") return "PT";
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("lang")?.toUpperCase();
  if (fromQuery && (LANGS as string[]).includes(fromQuery)) return fromQuery as Lang;
  const stored = localStorage.getItem("lang")?.toUpperCase();
  if (stored && (LANGS as string[]).includes(stored)) return stored as Lang;
  const nav = (navigator.language || "").slice(0, 2).toUpperCase();
  if ((LANGS as string[]).includes(nav)) return nav as Lang;
  return "PT";
}

function detectPaymentDetails() {
  if (typeof window === "undefined") {
    return { entity: "", reference: "", value: "", expirationDate: "" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    entity: params.get("entity") ?? "",
    reference: params.get("reference") ?? "",
    value: params.get("value") ?? "",
    expirationDate: params.get("expirationDate") ?? "",
  };
}

// This page is shown when EasyPay's checkout reports a payment as "pending"
// rather than "paid" — in practice, this means the customer chose Multibanco
// and was issued an Entity + Reference to pay separately (at an ATM or via
// home banking), not that anything has actually been charged yet. We never
// show the "Pagamento Confirmado" page for this case — the real confirmation
// only happens once the EasyPay webhook verifies the payment server-side
// (see routes/webhook.ts), which triggers the invoice + confirmation emails.
export default function CheckoutPending() {
  const lang = useMemo(detectLang, []);
  const details = useMemo(detectPaymentDetails, []);
  const c = COPY[lang];
  const season = getActiveSeason();

  const hasMbDetails = Boolean(details.entity && details.reference);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-b from-[#1a0f08] via-[#0e0805] to-black text-white">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15 ring-2 ring-amber-400/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-amber-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80 mb-3">
          {c.subtitle}
        </p>
        {season && (
          <p className="text-lg font-serif text-amber-200 mb-1">
            {SEASONAL_GREETING[season][lang]}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-6">
          {c.title}
        </h1>

        <p className="text-white/80 text-lg leading-relaxed mb-8">{c.body}</p>

        {hasMbDetails && (
          <div className="mx-auto mb-8 max-w-sm rounded-2xl border border-amber-300/30 bg-amber-500/5 p-6 text-left">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-white/60">{c.entityLabel}</span>
              <span className="font-mono text-lg font-semibold text-amber-200">{details.entity}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-white/60">{c.referenceLabel}</span>
              <span className="font-mono text-lg font-semibold text-amber-200">{details.reference}</span>
            </div>
            {details.value && (
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-sm text-white/60">{c.valueLabel}</span>
                <span className="font-mono text-lg font-semibold text-amber-200">€{details.value}</span>
              </div>
            )}
            {details.expirationDate && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-white/60">{c.expirationLabel}</span>
                <span className="font-mono text-sm text-white/70">{details.expirationDate}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-white/60 leading-relaxed mb-10">{c.bodyEmail}</p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-amber-300 px-8 py-3 text-sm font-medium text-black hover:bg-amber-200 transition-colors"
        >
          {c.cta}
        </Link>

        <p className="mt-12 text-sm text-white/70">
          {c.closing} <span className="text-rose-400">♥</span>
        </p>
        <p className="mt-1 font-serif italic text-amber-200/70">{c.thanks}</p>
      </div>
    </div>
  );
}
