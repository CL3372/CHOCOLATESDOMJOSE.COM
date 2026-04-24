import { useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { useCart, type Lang } from "../context/CartContext";

const LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

const COPY: Record<Lang, {
  title: string;
  subtitle: string;
  body: string;
  bodyEmail: string;
  cta: string;
  closing: string;
  thanks: string;
}> = {
  PT: {
    title: "Obrigado pela sua encomenda!",
    subtitle: "Pagamento confirmado",
    body: "Recebemos a sua encomenda e estamos a prepará-la com todo o cuidado.",
    bodyEmail: "Em breve receberá a fatura-recibo no seu email.",
    cta: "Voltar à loja",
    closing: "A Chocolates Dom José agradece-lhe",
    thanks: "Chocolates Dom José",
  },
  EN: {
    title: "Thank you for your order!",
    subtitle: "Payment confirmed",
    body: "We have received your order and are preparing it with great care.",
    bodyEmail: "You will receive your invoice by email shortly.",
    cta: "Back to shop",
    closing: "Chocolates Dom José thanks you",
    thanks: "Chocolates Dom José",
  },
  DE: {
    title: "Vielen Dank für Ihre Bestellung!",
    subtitle: "Zahlung bestätigt",
    body: "Wir haben Ihre Bestellung erhalten und bereiten sie sorgfältig vor.",
    bodyEmail: "Sie erhalten in Kürze Ihre Rechnung per E-Mail.",
    cta: "Zurück zum Shop",
    closing: "Chocolates Dom José bedankt sich bei Ihnen",
    thanks: "Chocolates Dom José",
  },
  NL: {
    title: "Bedankt voor uw bestelling!",
    subtitle: "Betaling bevestigd",
    body: "We hebben uw bestelling ontvangen en bereiden deze met zorg voor.",
    bodyEmail: "U ontvangt binnenkort uw factuur per e-mail.",
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

export default function CheckoutSuccess() {
  const { clearCart } = useCart();
  const lang = useMemo(detectLang, []);
  const c = COPY[lang];

  const cleared = useRef(false);
  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-b from-[#1a0f08] via-[#0e0805] to-black text-white">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80 mb-3">
          {c.subtitle}
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-6">
          {c.title}
        </h1>

        <p className="text-white/80 text-lg leading-relaxed mb-2">{c.body}</p>
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
