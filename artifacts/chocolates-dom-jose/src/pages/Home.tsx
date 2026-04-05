import logoSrc from "@assets/0C72531B-1759-4199-886F-93339619B831_1775420886008.JPG";

const products = [
  {
    name: "Trufas Artesanais",
    description: "Sabores elegantes e intensos, feitos artesanalmente para oferecer ou saborear.",
    image: "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pêras Bebedas",
    description: "Pêras em frasco, sofisticadas e diferentes, ideais para cabazes e presentes gourmet.",
    image: "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Dom Piri Piri",
    description: "O picante do rei — um produto com personalidade forte e apresentação premium.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0a07] text-white">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111] via-black to-[#111111]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">

          {/* Language switcher */}
          <div className="mb-8 flex justify-end">
            <div className="flex gap-2 text-sm text-white/70">
              {["PT", "EN", "DE", "NL"].map((lang, idx) => (
                <span
                  key={lang}
                  data-testid={`lang-${lang}`}
                  className={`rounded-full border px-3 py-1 cursor-pointer transition ${
                    idx === 0
                      ? "border-yellow-400/60 text-yellow-300"
                      : "border-white/15 hover:border-white/30"
                  }`}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-4xl text-center">

            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <div className="rounded-2xl bg-white px-10 py-8 shadow-2xl">
                <img
                  src={logoSrc}
                  alt="Dom José Logo"
                  className="max-h-[180px] w-auto object-contain"
                  data-testid="img-logo"
                />
              </div>
            </div>

            <p className="mb-4 inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm uppercase tracking-[0.2em] text-white">
              Chocolates Dom José
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Artisan chocolates with timeless elegance
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75">
              Portuguese craftsmanship, refined presentation, and memorable flavours in a sophisticated black and white identity.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#produtos"
                data-testid="btn-ver-produtos"
                className="rounded-2xl bg-white px-6 py-3 font-medium text-black shadow-lg transition hover:scale-[1.02]"
              >
                Ver produtos
              </a>
              <a
                href="#contacto"
                data-testid="btn-pedir-catalogo"
                className="rounded-2xl border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Pedir catálogo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 text-center sm:grid-cols-3 lg:px-10">
          <div>
            <p className="text-3xl font-semibold text-yellow-300">Artesanal</p>
            <p className="mt-2 text-white/65">Produção cuidada, em pequenas quantidades</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-yellow-300">Gourmet</p>
            <p className="mt-2 text-white/65">Apresentação elegante para oferta e revenda</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-yellow-300">Portugal</p>
            <p className="mt-2 text-white/65">Marca com identidade portuguesa e sabor distinto</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="produtos" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">Os nossos produtos</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Uma coleção pensada para surpreender</h2>
          <p className="mt-4 text-white/70">
            Da indulgência das trufas ao carácter dos produtos gourmet em frasco, cada detalhe é pensado para elevar a experiência.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product, idx) => (
            <div
              key={product.name}
              data-testid={`card-product-${idx}`}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl"
            >
              <img src={product.image} alt={product.name} className="h-72 w-full object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-semibold">{product.name}</h3>
                <p className="mt-3 text-white/70">{product.description}</p>
                <button
                  data-testid={`btn-saber-mais-${idx}`}
                  className="mt-6 rounded-xl border border-yellow-300/40 px-4 py-2 text-sm text-yellow-200 transition hover:bg-yellow-300/10"
                >
                  Saber mais
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand story + Ideal para */}
      <section className="bg-[#17110d]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">A nossa história</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Uma marca feita com paixão, resiliência e sabor</h2>
            <p className="mt-5 text-white/75">
              A Chocolates Dom José nasce da paixão por criar produtos com identidade, qualidade e apresentação de excelência. O objetivo é simples: transformar momentos normais em experiências especiais.
            </p>
            <p className="mt-4 text-white/75">
              Seja para clientes particulares, cabazes, eventos ou lojas gourmet, queremos levar um produto português distinto a mais pessoas.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl">
            <h3 className="text-2xl font-semibold">Ideal para</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Presentes e cabazes",
                "Lojas gourmet",
                "Eventos especiais",
                "Parcerias de revenda",
                "Clientes particulares",
                "Empresas e ofertas corporativas",
              ].map((item) => (
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
              <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">Parcerias</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Quer vender Chocolates Dom José na sua loja?</h2>
              <p className="mt-4 max-w-2xl text-white/75">
                Estamos disponíveis para parcerias com lojas gourmet, espaços premium, hotéis, eventos e projetos especiais.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <a
                href="#contacto"
                data-testid="btn-falar-connosco"
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-medium text-black transition hover:bg-yellow-300"
              >
                Falar connosco
              </a>
              <a
                href="#"
                data-testid="btn-descarregar-catalogo"
                className="rounded-2xl border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Descarregar catálogo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="border-t border-white/10 bg-black/30">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">Contacto</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Vamos criar algo delicioso juntos</h2>
            <p className="mt-4 max-w-xl text-white/75">
              Use esta secção para receber pedidos, contactos de revenda ou mensagens de clientes interessados nos seus produtos.
            </p>
            <div className="mt-8 space-y-3 text-white/70">
              <p>Email: geral@chocolatesdomjose.com</p>
              <p>Instagram: @chocolatesdomjose</p>
              <p>Localização: Portugal</p>
            </div>
          </div>

          <form className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4">
              <input
                data-testid="input-name"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40"
                placeholder="O seu nome"
              />
              <input
                data-testid="input-email"
                type="email"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40"
                placeholder="O seu email"
              />
              <input
                data-testid="input-subject"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40"
                placeholder="Assunto"
              />
              <textarea
                data-testid="input-message"
                className="min-h-[140px] rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-yellow-400/40 resize-none"
                placeholder="A sua mensagem"
              />
              <button
                type="submit"
                data-testid="btn-submit"
                className="rounded-xl bg-yellow-400 px-5 py-3 font-medium text-black transition hover:bg-yellow-300"
              >
                Enviar pedido
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/40">
        <p>&copy; {new Date().getFullYear()} Chocolates Dom José. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
