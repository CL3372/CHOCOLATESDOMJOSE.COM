import { useState } from "react";
import logoSrc from "@assets/logo_bw.png";
import trufaImg1 from "@assets/4601CB5C-1354-4ED9-A3C5-D566E3957B7B_1775497051986.JPG";
import trufaImg2 from "@assets/F71F42C7-4094-48EA-BCED-9575AD4E41E8_1_105_c_1775497155075.jpeg";

type Lang = "PT" | "EN" | "DE" | "NL";

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
  contactInstagram: string;
  contactLocation: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderSubject: string;
  placeholderMessage: string;
  btnSend: string;
  footer: string;
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
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Localização: Portugal",
    placeholderName: "O seu nome",
    placeholderEmail: "O seu email",
    placeholderSubject: "Assunto",
    placeholderMessage: "A sua mensagem",
    btnSend: "Enviar pedido",
    footer: "Todos os direitos reservados.",
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
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Location: Portugal",
    placeholderName: "Your name",
    placeholderEmail: "Your email",
    placeholderSubject: "Subject",
    placeholderMessage: "Your message",
    btnSend: "Send request",
    footer: "All rights reserved.",
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
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Standort: Portugal",
    placeholderName: "Ihr Name",
    placeholderEmail: "Ihre E-Mail",
    placeholderSubject: "Betreff",
    placeholderMessage: "Ihre Nachricht",
    btnSend: "Anfrage senden",
    footer: "Alle Rechte vorbehalten.",
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
    contactInstagram: "Instagram: @chocolatesdomjose",
    contactLocation: "Locatie: Portugal",
    placeholderName: "Uw naam",
    placeholderEmail: "Uw e-mail",
    placeholderSubject: "Onderwerp",
    placeholderMessage: "Uw bericht",
    btnSend: "Verzoek verzenden",
    footer: "Alle rechten voorbehouden.",
  },
};

const products = [
  {
    name: { PT: "Trufas Artesanais", EN: "Artisan Truffles", DE: "Handwerkliche Trüffeln", NL: "Ambachtelijke Truffels" },
    description: {
      PT: "Sabores elegantes e intensos, feitos artesanalmente para oferecer ou saborear.",
      EN: "Elegant and intense flavours, handcrafted to give as a gift or savour.",
      DE: "Elegante und intensive Aromen, handgefertigt zum Verschenken oder Genießen.",
      NL: "Elegante en intense smaken, met de hand gemaakt om te geven of te genieten.",
    },
    images: [trufaImg1, trufaImg2],
  },
  {
    name: { PT: "Pêras Bebedas", EN: "Drunken Pears", DE: "Betrunkene Birnen", NL: "Dronken Peren" },
    description: {
      PT: "Pêras em frasco, sofisticadas e diferentes, ideais para cabazes e presentes gourmet.",
      EN: "Jarred pears, sophisticated and unique, ideal for hampers and gourmet gifts.",
      DE: "Birnen im Glas, anspruchsvoll und einzigartig, ideal für Körbe und Gourmet-Geschenke.",
      NL: "Peren in pot, verfijnd en uniek, ideaal voor manden en gourmetcadeaus.",
    },
    images: ["https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=900&q=80"],
  },
  {
    name: { PT: "Dom Piri Piri", EN: "Dom Piri Piri", DE: "Dom Piri Piri", NL: "Dom Piri Piri" },
    description: {
      PT: "O picante do rei — um produto com personalidade forte e apresentação premium.",
      EN: "The king's heat — a product with strong personality and premium presentation.",
      DE: "Die Schärfe des Königs — ein Produkt mit starker Persönlichkeit und erstklassiger Präsentation.",
      NL: "De pittigheid van de koning — een product met een sterke persoonlijkheid en premium presentatie.",
    },
    images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"],
  },
];

function ProductCard({ product, lang, learnMore }: {
  product: typeof products[number];
  lang: Lang;
  learnMore: string;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = product.images;
  const hasMultiple = imgs.length > 1;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl">
      <div className="relative h-72 w-full overflow-hidden">
        <img
          src={imgs[imgIdx]}
          alt={product.name[lang]}
          className="h-full w-full object-cover transition-opacity duration-300"
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
      <div className="p-6">
        <h3 className="text-2xl font-semibold">{product.name[lang]}</h3>
        <p className="mt-3 text-white/70">{product.description[lang]}</p>
        <button className="mt-6 rounded-xl border border-yellow-300/40 px-4 py-2 text-sm text-yellow-200 transition hover:bg-yellow-300/10">
          {learnMore}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("PT");
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0f0a07] text-white">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111] via-black to-[#111111]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">

          {/* Language switcher */}
          <div className="mb-8 flex justify-end">
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
        <div className="mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">{t.productsLabel}</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.productsHeading}</h2>
          <p className="mt-4 text-white/70">{t.productsDesc}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product, idx) => (
            <div key={idx} data-testid={`card-product-${idx}`}>
              <ProductCard product={product} lang={lang} learnMore={t.learnMore} />
            </div>
          ))}
        </div>
      </section>

      {/* Brand story + Ideal para */}
      <section className="bg-[#17110d]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">{t.historyLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.historyHeading}</h2>
            <p className="mt-5 text-white/75">{t.historyP1}</p>
            <p className="mt-4 text-white/75">{t.historyP2}</p>
          </div>
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
              <p>{t.contactEmail}</p>
              <p>{t.contactInstagram}</p>
              <p>{t.contactLocation}</p>
            </div>
          </div>

          <form className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4">
              <input
                data-testid="input-name"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40"
                placeholder={t.placeholderName}
              />
              <input
                data-testid="input-email"
                type="email"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40"
                placeholder={t.placeholderEmail}
              />
              <input
                data-testid="input-subject"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40"
                placeholder={t.placeholderSubject}
              />
              <textarea
                data-testid="input-message"
                className="min-h-[140px] rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40 resize-none"
                placeholder={t.placeholderMessage}
              />
              <button
                type="submit"
                data-testid="btn-submit"
                className="rounded-xl bg-yellow-400 px-5 py-3 font-medium text-black transition hover:bg-yellow-300"
              >
                {t.btnSend}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/40">
        <p>&copy; {new Date().getFullYear()} Chocolates Dom José. {t.footer}</p>
      </footer>
    </div>
  );
}
