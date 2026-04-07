import { useState } from "react";
import { useCart, type Lang } from "../context/CartContext";

const drawerLabels: Record<Lang, { title: string; empty: string; checkout: string; subtotal: string; loading: string; remove: string; error: string }> = {
  PT: { title: "O seu carrinho", empty: "O carrinho está vazio.", checkout: "Finalizar compra", subtotal: "Subtotal", loading: "A processar…", remove: "Remover", error: "Erro ao processar. Tente novamente." },
  EN: { title: "Your cart", empty: "Your cart is empty.", checkout: "Checkout", subtotal: "Subtotal", loading: "Processing…", remove: "Remove", error: "Checkout failed. Please try again." },
  DE: { title: "Ihr Warenkorb", empty: "Ihr Warenkorb ist leer.", checkout: "Zur Kasse", subtotal: "Zwischensumme", loading: "Wird verarbeitet…", remove: "Entfernen", error: "Fehler beim Bezahlen. Bitte erneut versuchen." },
  NL: { title: "Uw winkelwagen", empty: "Uw winkelwagen is leeg.", checkout: "Afrekenen", subtotal: "Subtotaal", loading: "Verwerken…", remove: "Verwijderen", error: "Afrekenen mislukt. Probeer opnieuw." },
};

export default function CartDrawer({ lang }: { lang: Lang }) {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCart();
  const l = drawerLabels[lang];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          successUrl: `${origin}/?order=success`,
          cancelUrl: `${origin}/?order=cancelled`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? l.error);
        setLoading(false);
      }
    } catch (err) {
      setError(l.error);
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[#0f0a07] border-l border-white/10 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">{l.title}</h2>
          <button
            onClick={closeCart}
            className="rounded-full p-1 text-white/50 hover:text-white transition"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-white/40">{l.empty}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <img
                  src={item.image}
                  alt={item.name[lang]}
                  className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm font-medium text-white">{item.name[lang]}</p>
                  <p className="text-sm text-yellow-300">
                    €{((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white transition"
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-sm text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white transition"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto text-xs text-white/30 hover:text-red-400 transition"
                    >
                      {l.remove}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-white">
              <span className="text-white/70">{l.subtotal}</span>
              <span className="text-lg font-semibold text-yellow-300">
                €{(total / 100).toFixed(2)}
              </span>
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 text-center">
                {error}
              </p>
            )}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-2xl bg-yellow-400 py-3 font-semibold text-black transition hover:bg-yellow-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? l.loading : l.checkout}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
