import { useMemo } from "react";
import { Link } from "wouter";
import { type Lang } from "../context/CartContext";

const LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

const COPY: Record<Lang, {
  title: string;
  subtitle: string;
  body: string;
  cta: string;
  thanks: string;
}> = {
  PT: {
    title: "Pagamento cancelado",
    subtitle: "Encomenda não concluída",
    body:
      "O seu pagamento foi cancelado e não lhe foi cobrado nada. Os seus produtos continuam no carrinho — pode tentar novamente quando quiser.",
    cta: "Voltar à loja",
    thanks: "Chocolates Dom José",
  },
  EN: {
    title: "Payment cancelled",
    subtitle: "Order not completed",
    body:
      "Your payment was cancelled and you have not been charged. Your items are still in your cart — feel free to try again whenever you like.",
    cta: "Back to shop",
    thanks: "Chocolates Dom José",
  },
  DE: {
    title: "Zahlung abgebrochen",
    subtitle: "Bestellung nicht abgeschlossen",
    body:
      "Ihre Zahlung wurde abgebrochen und Ihnen wurde nichts berechnet. Ihre Artikel befinden sich noch im Warenkorb — Sie können es jederzeit erneut versuchen.",
    cta: "Zurück zum Shop",
    thanks: "Chocolates Dom José",
  },
  NL: {
    title: "Betaling geannuleerd",
    subtitle: "Bestelling niet voltooid",
    body:
      "Uw betaling is geannuleerd en er is niets in rekening gebracht. Uw producten staan nog in uw winkelwagen — u kunt het wanneer u wilt opnieuw proberen.",
    cta: "Terug naar de winkel",
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

export default function CheckoutCancel() {
  const lang = useMemo(detectLang, []);
  const c = COPY[lang];

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80 mb-3">
          {c.subtitle}
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-6">
          {c.title}
        </h1>

        <p className="text-white/80 text-lg leading-relaxed mb-10">{c.body}</p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-amber-300 px-8 py-3 text-sm font-medium text-black hover:bg-amber-200 transition-colors"
        >
          {c.cta}
        </Link>

        <p className="mt-12 font-serif italic text-amber-200/70">{c.thanks}</p>
      </div>
    </div>
  );
}
