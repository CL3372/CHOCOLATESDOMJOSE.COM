import { useState } from "react";
import { useCart, type Lang } from "../context/CartContext";
import { calculateShippingCents, PT_FREE_SHIPPING_THRESHOLD_CENTS } from "../lib/shipping";

const labels: Record<
  Lang,
  {
    title: string;
    empty: string;
    checkout: string;
    subtotal: string;
    loading: string;
    remove: string;
    error: string;
    emailRequired: string;
    name: string;
    email: string;
    phone: string;
    phoneTip: string;
    nif: string;
    nifTip: string;
    invoiceNote: string;
    pay: string;
    back: string;
    customerTitle: string;
    address: string;
    postcode: string;
    city: string;
    country: string;
    shippingTitle: string;
    shippingCost: string;
    shippingFree: string;
    total: string;
  }
> = {
  PT: {
    title: "O seu carrinho",
    empty: "O carrinho está vazio.",
    checkout: "Finalizar compra",
    subtotal: "Subtotal",
    loading: "A processar…",
    remove: "Remover",
    error: "Erro ao processar. Tente novamente.",
    emailRequired: "Indique um email válido — é necessário para receber a fatura.",
    name: "Nome",
    email: "E-mail",
    phone: "Telemóvel (para MB WAY)",
    phoneTip: "Ex: 912345678",
    nif: "NIF (opcional)",
    nifTip: "9 dígitos — deixe em branco se não pretender NIF na fatura",
    invoiceNote: "A fatura é sempre enviada por email após o pagamento.",
    pay: "Pagar com EasyPay",
    back: "← Voltar",
    customerTitle: "Os seus dados",
    address: "Morada (rua e número)",
    postcode: "Código Postal",
    city: "Cidade",
    country: "País",
    shippingTitle: "Morada de envio",
    shippingCost: "Portes de envio",
    shippingFree: "Grátis",
    total: "Total",
  },
  EN: {
    title: "Your cart",
    empty: "Your cart is empty.",
    checkout: "Checkout",
    subtotal: "Subtotal",
    loading: "Processing…",
    remove: "Remove",
    error: "Payment failed. Please try again.",
    emailRequired: "Please enter a valid email — it is needed to receive your invoice.",
    name: "Name",
    email: "Email",
    phone: "Mobile (for MB WAY)",
    phoneTip: "e.g. 912345678",
    nif: "Tax ID / NIF (optional)",
    nifTip: "9 digits — leave blank if no NIF on invoice",
    invoiceNote: "An invoice is always emailed after payment.",
    pay: "Pay with EasyPay",
    back: "← Back",
    customerTitle: "Your details",
    address: "Address (street and number)",
    postcode: "Postcode",
    city: "City",
    country: "Country",
    shippingTitle: "Shipping address",
    shippingCost: "Shipping",
    shippingFree: "Free",
    total: "Total",
  },
  DE: {
    title: "Ihr Warenkorb",
    empty: "Ihr Warenkorb ist leer.",
    checkout: "Zur Kasse",
    subtotal: "Zwischensumme",
    loading: "Wird verarbeitet…",
    remove: "Entfernen",
    error: "Zahlung fehlgeschlagen. Bitte erneut versuchen.",
    emailRequired: "Bitte geben Sie eine gültige E-Mail-Adresse ein — sie wird für die Rechnung benötigt.",
    name: "Name",
    email: "E-Mail",
    phone: "Mobilnummer (für MB WAY)",
    phoneTip: "z. B. 912345678",
    nif: "Steuernummer / NIF (optional)",
    nifTip: "9 Ziffern — leer lassen, wenn kein NIF auf der Rechnung",
    invoiceNote: "Die Rechnung wird nach der Zahlung immer per E-Mail gesendet.",
    pay: "Mit EasyPay bezahlen",
    back: "← Zurück",
    customerTitle: "Ihre Daten",
    address: "Adresse (Straße und Nummer)",
    postcode: "Postleitzahl",
    city: "Stadt",
    country: "Land",
    shippingTitle: "Lieferadresse",
    shippingCost: "Versand",
    shippingFree: "Kostenlos",
    total: "Gesamt",
  },
  NL: {
    title: "Uw winkelwagen",
    empty: "Uw winkelwagen is leeg.",
    checkout: "Afrekenen",
    subtotal: "Subtotaal",
    loading: "Verwerken…",
    remove: "Verwijderen",
    error: "Betaling mislukt. Probeer opnieuw.",
    emailRequired: "Vul een geldig e-mailadres in — dit is nodig om uw factuur te ontvangen.",
    name: "Naam",
    email: "E-mail",
    phone: "Mobiel (voor MB WAY)",
    phoneTip: "bijv. 912345678",
    nif: "Btw-nummer / NIF (optioneel)",
    nifTip: "9 cijfers — laat leeg als geen NIF op factuur",
    invoiceNote: "De factuur wordt altijd per e-mail verzonden na betaling.",
    pay: "Betalen met EasyPay",
    back: "← Terug",
    customerTitle: "Uw gegevens",
    address: "Adres (straat en nummer)",
    postcode: "Postcode",
    city: "Stad",
    country: "Land",
    shippingTitle: "Verzendadres",
    shippingCost: "Verzendkosten",
    shippingFree: "Gratis",
    total: "Totaal",
  },
};

export default function CartDrawer({ lang }: { lang: Lang }) {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCart();
  const l = labels[lang];

  const [step, setStep] = useState<"cart" | "details">("cart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nif, setNif] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Portugal");

  const shippingCents = calculateShippingCents(
    items.map((i) => ({ id: i.id, quantity: i.quantity })),
    total,
    country,
  );
  const grandTotal = total + shippingCents;

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleCheckout = async () => {
    if (!isValidEmail(email.trim())) {
      setError(l.emailRequired);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const origin = window.location.origin;
      try {
        localStorage.setItem("lang", lang);
      } catch {
        // ignore storage errors (e.g. private mode)
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          successUrl: `${origin}/checkout/success?lang=${lang}`,
          cancelUrl: `${origin}/checkout/cancel?lang=${lang}`,
          customer: {
            name: name.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            nif: nif.trim() || undefined,
          },
          shipping: {
            address: address.trim() || undefined,
            postcode: postcode.trim() || undefined,
            city: city.trim() || undefined,
            country: country.trim() || undefined,
          },
          lang,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? l.error);
        setLoading(false);
      }
    } catch {
      setError(l.error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    closeCart();
    setStep("cart");
    setError(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[#0f0a07] border-l border-white/10 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">
            {step === "details" ? l.customerTitle : l.title}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-white/50 hover:text-white transition"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {step === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <p className="mt-8 text-center text-white/40">{l.empty}</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name[lang]}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm font-medium text-white">
                        {item.name[lang]}
                      </p>
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
                        <span className="w-4 text-center text-sm text-white">
                          {item.quantity}
                        </span>
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
              <div className="border-t border-white/10 px-6 py-5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{l.subtotal}</span>
                  <span className="text-white/90">€{(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{l.shippingCost}</span>
                  <span className="text-white/90">
                    {shippingCents === 0 ? l.shippingFree : `€${(shippingCents / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-white pt-2">
                  <span className="text-white/70">{l.total}</span>
                  <span className="text-lg font-semibold text-yellow-300">
                    €{(grandTotal / 100).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => { setError(null); setStep("details"); }}
                  className="w-full rounded-2xl bg-yellow-400 py-3 font-semibold text-black transition hover:bg-yellow-300 active:scale-95"
                >
                  {l.checkout}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col px-6 py-5 gap-4 overflow-y-auto">
            <button
              onClick={() => { setStep("cart"); setError(null); }}
              className="self-start text-sm text-white/50 hover:text-white transition"
            >
              {l.back}
            </button>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">{l.name}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  placeholder={l.name}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">{l.email} *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  placeholder="exemplo@email.com"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">{l.phone}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  placeholder={l.phoneTip}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">{l.nif}</label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  inputMode="numeric"
                  maxLength={15}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  placeholder={l.nifTip}
                />
                <p className="text-[11px] text-white/40 mt-1 italic">{l.invoiceNote}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs uppercase tracking-wide text-white/40 mb-2">{l.shippingTitle}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">{l.address}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                    placeholder={l.address}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">{l.postcode}</label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                      placeholder="1000-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">{l.city}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                      placeholder="Lisboa"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">{l.country}</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">{l.subtotal}</span>
                <span className="text-white/90">€{(total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{l.shippingCost}</span>
                <span className="text-white/90">
                  {shippingCents === 0 ? l.shippingFree : `€${(shippingCents / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-white/60">{l.total}</span>
                <span className="font-semibold text-yellow-300">
                  €{(grandTotal / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <p className="text-xs text-white/50 leading-relaxed">
                MB WAY · Multibanco · Cartão de crédito/débito
              </p>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-2xl bg-yellow-400 py-3 font-semibold text-black transition hover:bg-yellow-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-auto"
            >
              {loading ? l.loading : l.pay}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
