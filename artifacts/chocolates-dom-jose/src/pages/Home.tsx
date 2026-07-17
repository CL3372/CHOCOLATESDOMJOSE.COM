import { useState, useEffect, useRef, type ReactNode } from "react";
import { useCart, type Lang } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import logoSrc from "@assets/logo_bw.png";
// Product photos below are phone shots pending the professional Bombarral shoot.
// When those land, swap the imports in place — ProductCard already renders any
// source through a fixed object-cover frame, so new photos don't need matching dimensions.
import trufaImg1 from "@assets/4601CB5C-1354-4ED9-A3C5-D566E3957B7B_1775497051986.JPG";
import trufaImg2 from "@assets/F71F42C7-4094-48EA-BCED-9575AD4E41E8_1_105_c_1775497155075.jpeg";
import peraImg1 from "@assets/D0001014-D8F0-4669-AA75-AA5FC99B9C61_1775497657429.JPG";
import peraImg2 from "@assets/27402DCF-137B-4302-ADCE-BF183A97BB50_1775497663265.JPG";
import laranjaImg from "@assets/C5049C7D-4C50-4DC6-9FF1-35C328026F8A_1_105_c_1775497857994.jpeg";
import choc77Img from "@assets/C8C3450E-D74C-4028-8A60-556EA3DA337B_1_105_c_1775497898196.jpeg";
import trufaFestImg from "@assets/52EF516A-0E69-4111-BB45-52077856933F_1_105_c_1775497921548.jpeg";
import piriImg1 from "@assets/1A7B88D2-D1EA-4199-A7D2-B37DEF6AB8B2_1_105_c_1775498174881.jpeg";
import piriImg2 from "@assets/470F55A1-A0DE-438A-8CE6-9420CC02210B_1_105_c_1775498178960.jpeg";
import piriImg3 from "@assets/5D196451-7C91-40D5-A833-00FFBF39133A_1_105_c_1775498185074.jpeg";
import piriImg4 from "@assets/piri_extra.jpg";
import crownSrc from "@assets/logo_crown_transparent.png";
import cabazImg1 from "@assets/3394A237-FCD2-4AEF-84A0-9E929846C4BE_1_201_a_1775498751104.jpeg";
import cabazImg2 from "@assets/6B7C46BB-4F99-4C06-B042-49477038A177_1_105_c_1775498765125.jpeg";
import cabazImg3 from "@assets/2F27B28B-3481-45FF-9C0A-4F9CA152FA00_1_105_c_1775498790966.jpeg";
import cabazImg4 from "@assets/B32139AA-0033-43EA-9DD9-C46E629306AC_1_105_c_1775498796966.jpeg";
import { PaymentLogos } from "../components/PaymentLogos";

const translations: Record<Lang, {
  badge: string;
  headline: string;
  subtitle: string;
  btnProducts: string;
  btnCatalogue: string;
  stat1Title: string; stat1Desc: string;
  stat2Title: string; stat2Desc: string;
  stat3Title: string; stat3Desc: string;
  productsLabel: string;
  productsHeading: string;
  productsDesc: string;
  learnMore: string;
  historyLabel: string;
  historyHeading: string;
  historyP1: string;
  historyP2: string;
  idealTitle: string;
  idealItems: string[];
  partnersLabel: string;
  partnersHeading: string;
  partnersDesc: string;
  btnTalk: string;
  btnDownload: string;
  contactLabel: string;
  contactHeading: string;
  contactDesc: string;
  contactEmail: string;
  contactPhone: string;
  contactInstagram: string;
  contactLocation: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderSubject: string;
  placeholderMessage: string;
  btnSend: string;
  btnSending: string;
  contactSuccess: string;
  contactError: string;
  contactRequired: string;
  ivaIncluded: string;
  footer: string;
  addToCart: string;
  priceFrom: string;
}> = {
  PT: {
    badge: "Chocolates Dom José",
    headline: "Chocolates artesanais com elegância atemporal",
    subtitle: "Artesanato português, apresentação refinada e sabores memoráveis numa identidade sofisticada.",
    btnProducts: "Ver produtos",
    btnCatalogue: "Pedir catálogo",
    stat1Title: "Artesanal", stat1Desc: "Produção cuidada, em pequenas quantidades",
    stat2Title: "Gourmet", stat2Desc: "Apresentação elegante para oferta e revenda",
    stat3Title: "Portugal", stat3Desc: "Marca com identidade portuguesa e sabor distinto",
    productsLabel: "Os nossos produtos",
    productsHeading: "Uma coleção pensada para surpreender",
    productsDesc: "Da indulgência das trufas ao carácter dos produtos gourmet em frasco, cada detalhe é pensado para elevar a experiência.",
    learnMore: "Saber mais",
    historyLabel: "A nossa história",
    historyHeading: "Uma marca feita com paixão, resiliência e sabor",
    historyP1: "A Chocolates Dom José nasce da paixão por criar produtos com identidade, qualidade e apresentação de excelência. O objetivo é simples: transformar momentos normais em experiências especiais.",
    historyP2: "Seja para clientes particulares, cabazes, eventos ou lojas gourmet, queremos levar um produto português distinto a mais pessoas.",
    idealTitle: "Ideal para",
    idealItems: ["Presentes e cabazes", "Lojas gourmet", "Eventos especiais", "Parcerias de revenda", "Clientes particulares", "Empresas e ofertas corporativas"],
    partnersLabel: "Parcerias",
    partnersHeading: "Quer vender Chocolates Dom José na sua loja?",
    partnersDesc: "Estamos disponíveis para parcerias com lojas gourmet, espaços premium, hotéis, eventos e projetos especiais.",
    btnTalk: "Falar connosco",
    btnDownload: "Descarregar catálogo",
    contactLabel: "Contacto",
    contactHeading: "Vamos criar algo delicioso juntos",
    contactDesc: "Use esta secção para receber pedidos, contactos de revenda ou mensagens de clientes interessados nos seus produtos.",
    contactEmail: "Email: geral@chocolatesdomjose.com",
    contactPhone: "Telefone: +351 912 630 054",
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Localização: Portugal",
    placeholderName: "O seu nome",
    placeholderEmail: "O seu email",
    placeholderSubject: "Assunto",
    placeholderMessage: "A sua mensagem",
    btnSend: "Enviar pedido",
    btnSending: "A enviar…",
    contactSuccess: "Mensagem enviada com sucesso! Entraremos em contacto em breve.",
    contactError: "Não foi possível enviar a sua mensagem. Por favor tente novamente ou escreva para geral@chocolatesdomjose.com.",
    contactRequired: "Por favor preencha nome, email e mensagem.",
    ivaIncluded: "Preços com IVA incluído (23%)",
    footer: "Todos os direitos reservados.",
    addToCart: "Adicionar ao carrinho",
    priceFrom: "A partir de",
  },
  EN: {
    badge: "Chocolates Dom José",
    headline: "Artisan chocolates with timeless elegance",
    subtitle: "Portuguese craftsmanship, refined presentation, and memorable flavours in a sophisticated identity.",
    btnProducts: "See products",
    btnCatalogue: "Request catalogue",
    stat1Title: "Artisanal", stat1Desc: "Careful production, in small quantities",
    stat2Title: "Gourmet", stat2Desc: "Elegant presentation for gifting and resale",
    stat3Title: "Portugal", stat3Desc: "Brand with Portuguese identity and distinct flavour",
    productsLabel: "Our products",
    productsHeading: "A collection designed to surprise",
    productsDesc: "From the indulgence of truffles to the character of gourmet jarred products, every detail is designed to elevate the experience.",
    learnMore: "Learn more",
    historyLabel: "Our story",
    historyHeading: "A brand built with passion, resilience and flavour",
    historyP1: "Chocolates Dom José was born from a passion for creating products with identity, quality and excellence in presentation. The goal is simple: to turn ordinary moments into special experiences.",
    historyP2: "Whether for private customers, hampers, events or gourmet stores, we want to bring a distinctive Portuguese product to more people.",
    idealTitle: "Ideal for",
    idealItems: ["Gifts and hampers", "Gourmet stores", "Special events", "Resale partnerships", "Private customers", "Companies and corporate gifts"],
    partnersLabel: "Partnerships",
    partnersHeading: "Want to sell Chocolates Dom José in your store?",
    partnersDesc: "We are available for partnerships with gourmet stores, premium spaces, hotels, events and special projects.",
    btnTalk: "Talk to us",
    btnDownload: "Download catalogue",
    contactLabel: "Contact",
    contactHeading: "Let's create something delicious together",
    contactDesc: "Use this section to receive orders, resale enquiries or messages from customers interested in your products.",
    contactEmail: "Email: geral@chocolatesdomjose.com",
    contactPhone: "Phone: +351 912 630 054",
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Location: Portugal",
    placeholderName: "Your name",
    placeholderEmail: "Your email",
    placeholderSubject: "Subject",
    placeholderMessage: "Your message",
    btnSend: "Send request",
    btnSending: "Sending…",
    contactSuccess: "Message sent successfully! We'll be in touch shortly.",
    contactError: "We couldn't send your message. Please try again or email geral@chocolatesdomjose.com.",
    contactRequired: "Please fill in your name, email and message.",
    ivaIncluded: "Prices include VAT (23%)",
    footer: "All rights reserved.",
    addToCart: "Add to cart",
    priceFrom: "From",
  },
  DE: {
    badge: "Chocolates Dom José",
    headline: "Handgemachte Schokoladen mit zeitloser Eleganz",
    subtitle: "Portugiesisches Handwerk, raffinierte Präsentation und unvergessliche Aromen in einer eleganten Identität.",
    btnProducts: "Produkte ansehen",
    btnCatalogue: "Katalog anfordern",
    stat1Title: "Handwerklich", stat1Desc: "Sorgfältige Herstellung in kleinen Mengen",
    stat2Title: "Gourmet", stat2Desc: "Elegante Präsentation für Geschenke und Wiederverkauf",
    stat3Title: "Portugal", stat3Desc: "Marke mit portugiesischer Identität und unverwechselbarem Geschmack",
    productsLabel: "Unsere Produkte",
    productsHeading: "Eine Kollektion, die überrascht",
    productsDesc: "Von der Genussvollen Trüffel bis zum Charakter unserer Gourmet-Produkte im Glas — jedes Detail wurde bedacht, um das Erlebnis zu steigern.",
    learnMore: "Mehr erfahren",
    historyLabel: "Unsere Geschichte",
    historyHeading: "Eine Marke mit Leidenschaft, Resilienz und Geschmack",
    historyP1: "Chocolates Dom José entstand aus der Leidenschaft, Produkte mit Identität, Qualität und erstklassiger Präsentation zu schaffen. Das Ziel ist einfach: gewöhnliche Momente in besondere Erlebnisse zu verwandeln.",
    historyP2: "Ob für Privatkunden, Körbe, Veranstaltungen oder Gourmetläden — wir möchten ein unverwechselbares portugiesisches Produkt mehr Menschen zugänglich machen.",
    idealTitle: "Ideal für",
    idealItems: ["Geschenke und Körbe", "Gourmetläden", "Besondere Veranstaltungen", "Wiederverkaufspartnerschaften", "Privatkunden", "Unternehmen und Firmengeschenke"],
    partnersLabel: "Partnerschaften",
    partnersHeading: "Möchten Sie Chocolates Dom José in Ihrem Geschäft verkaufen?",
    partnersDesc: "Wir sind offen für Partnerschaften mit Gourmetläden, Premium-Räumen, Hotels, Veranstaltungen und Sonderprojekten.",
    btnTalk: "Kontakt aufnehmen",
    btnDownload: "Katalog herunterladen",
    contactLabel: "Kontakt",
    contactHeading: "Lassen Sie uns gemeinsam etwas Köstliches schaffen",
    contactDesc: "Nutzen Sie diesen Bereich für Bestellungen, Wiederverkaufsanfragen oder Nachrichten von Kunden, die an Ihren Produkten interessiert sind.",
    contactEmail: "E-Mail: geral@chocolatesdomjose.com",
    contactPhone: "Telefon: +351 912 630 054",
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Standort: Portugal",
    placeholderName: "Ihr Name",
    placeholderEmail: "Ihre E-Mail",
    placeholderSubject: "Betreff",
    placeholderMessage: "Ihre Nachricht",
    btnSend: "Anfrage senden",
    btnSending: "Wird gesendet…",
    contactSuccess: "Nachricht erfolgreich gesendet! Wir melden uns in Kürze.",
    contactError: "Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie an geral@chocolatesdomjose.com.",
    contactRequired: "Bitte geben Sie Name, E-Mail und Nachricht ein.",
    ivaIncluded: "Preise inkl. MwSt. (23%)",
    footer: "Alle Rechte vorbehalten.",
    addToCart: "In den Warenkorb",
    priceFrom: "Ab",
  },
  NL: {
    badge: "Chocolates Dom José",
    headline: "Ambachtelijke chocolade met tijdloze elegantie",
    subtitle: "Portugees vakmanschap, verfijnde presentatie en onvergetelijke smaken in een verfijnde identiteit.",
    btnProducts: "Bekijk producten",
    btnCatalogue: "Catalogus aanvragen",
    stat1Title: "Ambachtelijk", stat1Desc: "Zorgvuldige productie, in kleine hoeveelheden",
    stat2Title: "Gourmet", stat2Desc: "Elegante presentatie voor giften en wederverkoop",
    stat3Title: "Portugal", stat3Desc: "Merk met Portugese identiteit en onderscheidende smaak",
    productsLabel: "Onze producten",
    productsHeading: "Een collectie om te verrassen",
    productsDesc: "Van de wellust van truffels tot het karakter van gourmetproducten in pot, elk detail is doordacht om de beleving te verhogen.",
    learnMore: "Meer weten",
    historyLabel: "Ons verhaal",
    historyHeading: "Een merk gemaakt met passie, veerkracht en smaak",
    historyP1: "Chocolates Dom José is ontstaan uit de passie om producten te creëren met identiteit, kwaliteit en uitstekende presentatie. Het doel is eenvoudig: gewone momenten omzetten in bijzondere ervaringen.",
    historyP2: "Of het nu voor particuliere klanten, manden, evenementen of gourmetwinkels is — we willen een onderscheidend Portugees product bij meer mensen brengen.",
    idealTitle: "Ideaal voor",
    idealItems: ["Cadeaus en manden", "Gourmetwinkels", "Speciale evenementen", "Wederverkooppartnerschappen", "Particuliere klanten", "Bedrijven en zakelijke cadeaus"],
    partnersLabel: "Partnerschappen",
    partnersHeading: "Wilt u Chocolates Dom José in uw winkel verkopen?",
    partnersDesc: "We zijn beschikbaar voor partnerschappen met gourmetwinkels, premiumruimtes, hotels, evenementen en speciale projecten.",
    btnTalk: "Neem contact op",
    btnDownload: "Catalogus downloaden",
    contactLabel: "Contact",
    contactHeading: "Laten we samen iets heerlijks creëren",
    contactDesc: "Gebruik dit gedeelte voor bestellingen, wederverkoopvragen of berichten van klanten die geïnteresseerd zijn in uw producten.",
    contactEmail: "E-mail: geral@chocolatesdomjose.com",
    contactPhone: "Telefoon: +351 912 630 054",
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Locatie: Portugal",
    placeholderName: "Uw naam",
    placeholderEmail: "Uw e-mail",
    placeholderSubject: "Onderwerp",
    placeholderMessage: "Uw bericht",
    btnSend: "Verzoek verzenden",
    btnSending: "Versturen…",
    contactSuccess: "Bericht succesvol verzonden! We nemen spoedig contact op.",
    contactError: "Uw bericht kon niet worden verzonden. Probeer het opnieuw of mail naar geral@chocolatesdomjose.com.",
    contactRequired: "Vul a.u.b. uw naam, e-mail en bericht in.",
    ivaIncluded: "Prijzen incl. btw (23%)",
    footer: "Alle rechten voorbehouden.",
    addToCart: "Toevoegen aan winkelwagen",
    priceFrom: "Vanaf",
  },
};

const products = [
  {
    id: "trufas_artesanais",
    price: 1500,
    name: { PT: "Trufas Artesanais", EN: "Artisan Truffles", DE: "Handwerkliche Trüffeln", NL: "Ambachtelijke Truffels" },
    description: {
      PT: "Sabores elegantes e intensos, feitos artesanalmente para oferecer ou saborear.",
      EN: "Elegant and intense flavours, handcrafted to give as a gift or savour.",
      DE: "Elegante und intensive Aromen, handgefertigt zum Verschenken oder Genießen.",
      NL: "Elegante en intense smaken, met de hand gemaakt om te geven of te genieten.",
    },
    images: [trufaImg1, trufaImg2, trufaFestImg],
  },
  {
    id: "peras_bebedas",
    price: 700,
    name: { PT: "Pêras Bebedas", EN: "Drunken Pears", DE: "Betrunkene Birnen", NL: "Dronken Peren" },
    description: {
      PT: "Pêras em frasco, sofisticadas e diferentes, ideais para cabazes e presentes gourmet. Confecionadas com vinho (álcool fervido); recomenda-se precaução a grávidas.",
      EN: "Jarred pears, sophisticated and unique, ideal for hampers and gourmet gifts. Cooked with wine (alcohol boiled off); caution advised for pregnant women.",
      DE: "Birnen im Glas, anspruchsvoll und einzigartig, ideal für Körbe und Gourmet-Geschenke. Mit Wein zubereitet (Alkohol verdampft); Schwangeren wird Vorsicht empfohlen.",
      NL: "Peren in pot, verfijnd en uniek, ideaal voor manden en gourmetcadeaus. Bereid met wijn (alcohol weggekookt); voorzichtigheid aangeraden voor zwangere vrouwen.",
    },
    // peraImg3/peraImg4 (region seal + PT-only promo graphic) were dropped: they broke
    // the EN/DE/NL carousel with untranslatable baked-in text. Swap all peraImg* for the
    // professional shoot once it's ready.
    images: [peraImg1, peraImg2],
  },
  {
    id: "trufas_laranja",
    price: 1500,
    name: { PT: "Trufas de Laranja", EN: "Orange Truffles", DE: "Orangentrüffeln", NL: "Sinaasappeltruffels" },
    description: {
      PT: "Intensidade cítrica num interior cremoso — trufas artesanais com laranja fresca e chocolate premium.",
      EN: "Citrus intensity in a creamy centre — handmade truffles with fresh orange and premium chocolate.",
      DE: "Zitrusintensität in einem cremigen Kern — handgefertigte Trüffeln mit frischer Orange und Premium-Schokolade.",
      NL: "Citrusintensiteit in een romig hart — ambachtelijke truffels met verse sinaasappel en premium chocolade.",
    },
    images: [laranjaImg],
  },
  {
    id: "trufas_chocolate_77",
    price: 1500,
    name: { PT: "Trufas de Chocolate 77%", EN: "77% Chocolate Truffles", DE: "Schokoladentrüffeln 77%", NL: "Chocoladetruffels 77%" },
    description: {
      PT: "Para os amantes do chocolate puro — trufas intensas com cacau 77%, elegantes e sofisticadas.",
      EN: "For pure chocolate lovers — intense truffles with 77% cacao, elegant and sophisticated.",
      DE: "Für reine Schokoladenliebhaber — intensive Trüffeln mit 77% Kakao, elegant und raffiniert.",
      NL: "Voor liefhebbers van pure chocolade — intense truffels met 77% cacao, elegant en verfijnd.",
    },
    images: [choc77Img],
  },
  {
    id: "dom_piri_piri",
    price: 700,
    name: { PT: "Dom Piri Piri", EN: "Dom Piri Piri", DE: "Dom Piri Piri", NL: "Dom Piri Piri" },
    description: {
      PT: "O picante do rei — um produto com personalidade forte e apresentação premium.",
      EN: "The king's heat — a product with strong personality and premium presentation.",
      DE: "Die Schärfe des Königs — ein Produkt mit starker Persönlichkeit und erstklassiger Präsentation.",
      NL: "De pittigheid van de koning — een product met een sterke persoonlijkheid en premium presentatie.",
    },
    images: [piriImg1, piriImg2, piriImg3, piriImg4],
  },
  {
    id: "cabazes",
    price: 3000,
    priceIsFrom: true,
    name: { PT: "Cabazes", EN: "Gift Hampers", DE: "Geschenkkörbe", NL: "Cadeaumanden" },
    description: {
      PT: "Composições exclusivas com os nossos produtos artesanais — ideais para oferta, empresas e ocasiões especiais.",
      EN: "Exclusive compositions with our artisan products — ideal for gifts, corporate orders and special occasions.",
      DE: "Exklusive Zusammenstellungen unserer handwerklichen Produkte — ideal für Geschenke, Firmen und besondere Anlässe.",
      NL: "Exclusieve samenstellingen met onze ambachtelijke producten — ideaal voor cadeaus, bedrijven en bijzondere gelegenheden.",
    },
    images: [cabazImg1, cabazImg2, cabazImg3, cabazImg4],
  },
];

function FadeIn({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

type ContactT = {
  placeholderName: string;
  placeholderEmail: string;
  placeholderSubject: string;
  placeholderMessage: string;
  btnSend: string;
  btnSending: string;
  contactSuccess: string;
  contactError: string;
  contactRequired: string;
};

function ContactForm({ lang, t }: { lang: Lang; t: ContactT }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error");
      setErrorMsg(t.contactRequired);
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, lang }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg(t.contactError);
    }
  }

  const sending = status === "sending";

  return (
    <form
      className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4">
        <input
          data-testid="input-name"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40 disabled:opacity-50"
          placeholder={t.placeholderName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={sending}
        />
        <input
          data-testid="input-email"
          type="email"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40 disabled:opacity-50"
          placeholder={t.placeholderEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={sending}
        />
        <input
          data-testid="input-subject"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40 disabled:opacity-50"
          placeholder={t.placeholderSubject}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sending}
        />
        <textarea
          data-testid="input-message"
          className="min-h-[140px] rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40 resize-none disabled:opacity-50"
          placeholder={t.placeholderMessage}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          data-testid="btn-submit"
          disabled={sending}
          className="rounded-xl bg-yellow-400 px-5 py-3 font-medium text-black transition hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? t.btnSending : t.btnSend}
        </button>

        {status === "success" && (
          <div
            data-testid="contact-success"
            className="rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-200"
            role="status"
          >
            ✓ {t.contactSuccess}
          </div>
        )}
        {status === "error" && (
          <div
            data-testid="contact-error"
            className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {errorMsg || t.contactError}
          </div>
        )}
      </div>
    </form>
  );
}

function ProductCard({ product, lang, addToCartLabel, priceFromLabel, ivaLabel }: {
  product: typeof products[number];
  lang: Lang;
  addToCartLabel: string;
  priceFromLabel: string;
  ivaLabel: string;
}) {
  const { addItem } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = product.images;
  const hasMultiple = imgs.length > 1;

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imgs[0],
    });
  };

  const priceDisplay = product.priceIsFrom
    ? `${priceFromLabel} €${(product.price / 100).toFixed(0)}`
    : `€${(product.price / 100).toFixed(2)}`;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl transition-shadow duration-300 hover:shadow-yellow-900/20 hover:shadow-2xl">
      <div className="relative h-72 w-full flex-shrink-0 overflow-hidden">
        <img
          src={imgs[imgIdx]}
          alt={product.name[lang]}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasMultiple && (
          <>
            <button
              onClick={() => setImgIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => setImgIdx((i) => (i + 1) % imgs.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
              aria-label="Next image"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-5 bg-yellow-300" : "w-1.5 bg-white/50"}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-semibold">{product.name[lang]}</h3>
        <p className="mt-1 text-lg font-medium text-yellow-300">{priceDisplay}</p>
        <p className="text-[11px] text-white/40">{ivaLabel}</p>
        <p className="mt-3 flex-1 text-white/70">{product.description[lang]}</p>
        <button
          onClick={handleAdd}
          className="mt-6 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 active:scale-95"
        >
          {addToCartLabel}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("PT");
  const t = translations[lang];
  const { openCart, count } = useCart();

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const orderStatus = params.get("order");
  const [banner, setBanner] = useState<"success" | "cancelled" | null>(
    orderStatus === "success" ? "success" : orderStatus === "cancelled" ? "cancelled" : null
  );

  useEffect(() => {
    const origin = window.location.origin;
    const toAbs = (src: string) =>
      src.startsWith("http") ? src : `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name.PT,
          description: p.description.PT,
          image: p.images.map(toAbs),
          brand: { "@type": "Brand", name: "Chocolates Dom José" },
          category: "Chocolate",
          offers: {
            "@type": "Offer",
            url: `${origin}/`,
            price: (p.price / 100).toFixed(2),
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "Nelson & Carla Louro Lda" },
          },
        },
      })),
    };
    const id = "product-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(itemList);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0a07] text-white">
      <CartDrawer lang={lang} />

      {/* Order status banner */}
      {banner === "success" && (
        <div className="animate-fade-in-down fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-green-800/95 px-6 py-3 text-sm text-white shadow-lg backdrop-blur">
          <p className="font-medium">✓ {lang === "PT" ? "Pagamento confirmado! Obrigado pela sua compra." : lang === "DE" ? "Zahlung bestätigt! Danke für Ihren Kauf." : lang === "NL" ? "Betaling bevestigd! Bedankt voor uw aankoop." : "Payment confirmed! Thank you for your order."}</p>
          <button onClick={() => setBanner(null)} className="text-white/70 hover:text-white transition">✕</button>
        </div>
      )}
      {banner === "cancelled" && (
        <div className="animate-fade-in-down fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-yellow-800/95 px-6 py-3 text-sm text-white shadow-lg backdrop-blur">
          <p>{lang === "PT" ? "Pagamento cancelado. O seu carrinho foi mantido." : lang === "DE" ? "Zahlung abgebrochen. Ihr Warenkorb wurde gespeichert." : lang === "NL" ? "Betaling geannuleerd. Uw winkelwagen is bewaard." : "Payment cancelled. Your cart has been kept."}</p>
          <button onClick={() => setBanner(null)} className="text-white/70 hover:text-white transition">✕</button>
        </div>
      )}

      {/* Free shipping announcement bar */}
      <div className="bg-gradient-to-r from-[#5a2a0a] via-[#7a3a14] to-[#5a2a0a] px-4 py-2 text-center text-xs font-medium text-amber-100 sm:text-sm">
        🚚 {lang === "PT"
          ? "Portes grátis em Portugal em encomendas acima de €100 · Envios internacionais grátis em encomendas acima de €75"
          : lang === "DE"
          ? "Kostenloser Versand in Portugal ab €100 · Internationaler Versand kostenlos ab €75"
          : lang === "NL"
          ? "Gratis verzending in Portugal vanaf €100 · Internationale verzending gratis vanaf €75"
          : "Free shipping in Portugal on orders over €100 · Free international shipping on orders over €75"}
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111] via-black to-[#111111]" />
        {/* Warm amber glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(180,100,20,0.18) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">

          {/* Language switcher + cart */}
          <div className="mb-8 flex items-center justify-end gap-4">
            <div className="flex gap-2 text-sm text-white/70">
              {(["PT", "EN", "DE", "NL"] as Lang[]).map((l) => (
                <button
                  key={l}
                  data-testid={`lang-${l}`}
                  onClick={() => setLang(l)}
                  className={`rounded-full border px-3 py-1 transition ${
                    lang === l
                      ? "border-yellow-400/60 text-yellow-300 font-medium"
                      : "border-white/15 hover:border-white/30"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={openCart}
              data-testid="btn-cart"
              className="relative rounded-full border border-white/20 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
              aria-label="Open cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          </div>

          <div className="mx-auto max-w-4xl text-center">

            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <img
                src={logoSrc}
                alt="Dom José Logo"
                className="max-h-[200px] w-auto object-contain"
                style={{ filter: "invert(1)" }}
                data-testid="img-logo"
              />
            </div>

            <p className="mb-4 inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm uppercase tracking-[0.2em] text-white">
              {t.badge}
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {t.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75">
              {t.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#produtos"
                data-testid="btn-ver-produtos"
                className="rounded-2xl bg-white px-6 py-3 font-medium text-black shadow-lg transition hover:scale-[1.02]"
              >
                {t.btnProducts}
              </a>
              <a
                href="#contacto"
                data-testid="btn-pedir-catalogo"
                className="rounded-2xl border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                {t.btnCatalogue}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 text-center sm:grid-cols-3 lg:px-10">
          <div>
            <p className="text-3xl font-semibold text-yellow-300">{t.stat1Title}</p>
            <p className="mt-2 text-white/65">{t.stat1Desc}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-yellow-300">{t.stat2Title}</p>
            <p className="mt-2 text-white/65">{t.stat2Desc}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-yellow-300">{t.stat3Title}</p>
            <p className="mt-2 text-white/65">{t.stat3Desc}</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="produtos" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <FadeIn>
          <div className="mb-12 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">{t.productsLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.productsHeading}</h2>
            <p className="mt-4 text-white/70">{t.productsDesc}</p>
          </div>
        </FadeIn>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product, idx) => (
            <FadeIn key={idx} delay={idx * 80}>
              <div data-testid={`card-product-${idx}`} className="h-full">
                <ProductCard
                  product={product}
                  lang={lang}
                  addToCartLabel={t.addToCart}
                  priceFromLabel={t.priceFrom}
                  ivaLabel={t.ivaIncluded}
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Brand story + Ideal para */}
      <section className="bg-[#17110d]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <FadeIn>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">{t.historyLabel}</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.historyHeading}</h2>
              <p className="mt-5 text-white/75">{t.historyP1}</p>
              <p className="mt-4 text-white/75">{t.historyP2}</p>
            </div>
          </FadeIn>
          <FadeIn delay={150}>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl">
              <h3 className="text-2xl font-semibold">{t.idealTitle}</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {t.idealItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Partnerships CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-[2rem] border border-yellow-400/20 bg-gradient-to-r from-yellow-500/10 to-amber-700/10 p-8 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">{t.partnersLabel}</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.partnersHeading}</h2>
              <p className="mt-4 max-w-2xl text-white/75">{t.partnersDesc}</p>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <a
                href="#contacto"
                data-testid="btn-falar-connosco"
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-medium text-black transition hover:bg-yellow-300"
              >
                {t.btnTalk}
              </a>
              <a
                href="/catalogo-dom-jose.pdf"
                download="Catalogo-Dom-Jose.pdf"
                data-testid="btn-descarregar-catalogo"
                className="rounded-2xl border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                {t.btnDownload}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="border-t border-white/10 bg-black/30">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">{t.contactLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.contactHeading}</h2>
            <p className="mt-4 max-w-xl text-white/75">{t.contactDesc}</p>
            <div className="mt-8 space-y-3 text-white/70">
              <a href="mailto:geral@chocolatesdomjose.com" className="block transition hover:text-yellow-300">{t.contactEmail}</a>
              <a href="tel:+351912630054" className="block transition hover:text-yellow-300">{t.contactPhone}</a>
              <a
                href="https://www.instagram.com/chocolatesdomjose/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 transition hover:text-yellow-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram: @chocolatesdomjose
              </a>
              <p>{t.contactLocation}</p>
              <a
                href="https://www.facebook.com/freshflavoursofportugal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 transition hover:text-yellow-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                Facebook: Fresh Flavours of Portugal
              </a>
            </div>
          </div>

          <ContactForm lang={lang} t={t} />

        </div>
      </section>

      {/* Footer */}
      <div className="flex justify-center pb-6 pt-10">
        <img
          src={crownSrc}
          alt="Dom José crown"
          className="h-12 w-auto opacity-60"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
        <div className="mb-5">
          <PaymentLogos />
        </div>
        <div className="mb-3 flex items-center justify-center gap-5">
          <a
            href="https://www.chocolatesdomjose.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-300/60 hover:text-yellow-300 transition"
          >
            www.chocolatesdomjose.com
          </a>
          <a
            href="https://www.instagram.com/chocolatesdomjose/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-yellow-300 transition"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="https://www.facebook.com/freshflavoursofportugal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-yellow-300 transition"
            aria-label="Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
          </a>
        </div>
        <div className="mb-3 flex items-center justify-center gap-4 text-xs">
          <a
            href={`/termos?lang=${lang}`}
            className="text-white/50 hover:text-yellow-300 transition"
          >
            {lang === "PT" ? "Termos e Condições" : lang === "DE" ? "AGB" : lang === "NL" ? "Algemene Voorwaarden" : "Terms & Conditions"}
          </a>
          <span className="text-white/20">·</span>
          <a
            href={`/privacidade?lang=${lang}`}
            className="text-white/50 hover:text-yellow-300 transition"
          >
            {lang === "PT" ? "Política de Privacidade" : lang === "DE" ? "Datenschutz" : lang === "NL" ? "Privacybeleid" : "Privacy Policy"}
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Nelson &amp; Carla Louro Lda · NIPC 513070389. {t.footer}</p>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/351912630054"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact via WhatsApp"
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:bg-[#1ebe5d] hover:scale-110 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Sticky floating cart button */}
      <button
        onClick={openCart}
        aria-label="Open cart"
        className={`fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-black shadow-2xl transition-all duration-300 hover:bg-yellow-300 hover:scale-110 active:scale-95 ${count > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-yellow-400">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
    </div>
  );
}
