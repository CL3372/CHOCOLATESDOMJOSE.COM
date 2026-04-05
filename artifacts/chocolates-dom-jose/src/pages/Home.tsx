import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Mail, Instagram, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = ["Coleções", "História", "Ideal Para", "Contactos"];
const languages = ["PT", "EN", "DE", "NL"];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="min-h-[100dvh] w-full relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12 flex items-center justify-between mix-blend-difference text-white">
        <div className="flex items-center gap-8">
          <a href="#" className="text-xl font-serif tracking-widest uppercase data-[testid=logo]">CDJ</a>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-sm tracking-widest uppercase hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-xs tracking-widest">
            {languages.map((lang, idx) => (
              <button key={lang} className={`transition-colors ${idx === 0 ? "text-primary font-bold" : "text-white/60 hover:text-white"}`} data-testid={`lang-${lang}`}>
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=1920&q=80" 
            alt="Dark chocolate background" 
            className="w-full h-full object-cover brightness-[0.3]"
          />
        </motion.div>
        
        <div className="relative z-10 container mx-auto px-6 text-center mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl md:text-8xl lg:text-[10rem] leading-none mb-6 text-primary tracking-tight"
          >
            Dom José
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg md:text-2xl font-light text-foreground/80 max-w-3xl mx-auto tracking-wide"
          >
            Chocolataria portuguesa, apresentação refinada e sabores memoráveis numa identidade sofisticada.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 animate-bounce"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Featured Products */}
      <section id="coleções" className="py-32 md:py-48 px-6 md:px-12 bg-background relative z-20">
        <div className="container mx-auto">
          <div className="mb-20 md:mb-32 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.h2 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl text-primary"
            >
              As Nossas<br/>Criações
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-foreground/70 max-w-md font-sans text-lg"
            >
              Feitas à mão em Portugal, com cacau de origem selecionada e ingredientes premium.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                title: "Trufas Artesanais",
                desc: "Sabores elegantes e intensos, feitos artesanalmente para oferecer ou saborear.",
                img: "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=900&q=80"
              },
              {
                title: "Pêras Bebedas",
                desc: "Pêras em frasco, sofisticadas e diferentes, ideais para cabazes e presentes gourmet.",
                img: "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=900&q=80"
              },
              {
                title: "Dom Piri Piri",
                desc: "O picante do rei — um produto com personalidade forte e apresentação premium.",
                img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"
              }
            ].map((prod, idx) => (
              <motion.div 
                key={prod.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
                className="group cursor-pointer"
                data-testid={`product-${idx}`}
              >
                <div className="overflow-hidden aspect-[3/4] mb-6">
                  <img 
                    src={prod.img} 
                    alt={prod.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-2xl font-serif text-primary mb-3">{prod.title}</h3>
                <p className="text-foreground/70 leading-relaxed font-sans">{prod.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section id="história" className="py-32 md:py-48 px-6 md:px-12 bg-secondary text-center">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-3xl md:text-5xl text-primary mb-10 leading-snug">
              "A Chocolates Dom José nasce da paixão por criar produtos com identidade, qualidade e apresentação de excelência."
            </h2>
            <div className="w-1px h-24 bg-primary mx-auto opacity-50 mb-10"></div>
            <p className="text-lg text-foreground/80 font-sans max-w-2xl mx-auto">
              Cada peça é uma ode à tradição chocolateira, desenhada meticulosamente no nosso atelier para lhe proporcionar uma experiência sensorial única, digna dos paladares mais exigentes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Ideal Para */}
      <section id="ideal-para" className="py-32 md:py-48 px-6 md:px-12 bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <h2 className="text-4xl md:text-6xl text-primary mb-12">Excelência<br/>Partilhada</h2>
              <ul className="space-y-6">
                {["Presentes e Cabazes", "Lojas Gourmet", "Eventos de Prestígio", "Parcerias", "Clientes Particulares", "Empresas"].map((item, idx) => (
                  <motion.li 
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="flex items-center gap-4 text-xl font-sans text-foreground/80"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {item}
                  </motion.li>
                ))}
              </ul>
              
              <Button className="mt-12 group bg-primary text-primary-foreground hover:bg-primary/90" size="lg" data-testid="btn-partnerships">
                Descobrir Parcerias <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-square"
            >
              <img 
                src="https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=900&q=80" 
                alt="Gourmet chocolate presentation" 
                className="w-full h-full object-cover rounded-sm grayscale-[30%] contrast-125"
              />
              <div className="absolute inset-0 border border-primary/30 m-6" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contactos" className="py-32 px-6 md:px-12 bg-secondary border-t border-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl text-primary mb-8">Entre em Contacto</h2>
              <p className="text-foreground/70 mb-12 font-sans text-lg">
                Seja para encomendas exclusivas, parcerias ou questões, estamos ao seu dispor.
              </p>
              
              <div className="space-y-6">
                <a href="mailto:geral@chocolatesdomjose.com" className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors font-sans" data-testid="link-email">
                  <Mail className="w-5 h-5 text-primary" /> geral@chocolatesdomjose.com
                </a>
                <a href="#" className="flex items-center gap-4 text-foreground/80 hover:text-primary transition-colors font-sans" data-testid="link-instagram">
                  <Instagram className="w-5 h-5 text-primary" /> @chocolatesdomjose
                </a>
                <div className="flex items-center gap-4 text-foreground/80 font-sans">
                  <MapPin className="w-5 h-5 text-primary" /> Portugal
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <form className="space-y-6 font-sans flex flex-col" onSubmit={(e) => e.preventDefault()}>
                <input type="text" placeholder="Nome" className="w-full bg-transparent border-b border-primary/20 py-3 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" data-testid="input-name" />
                <input type="email" placeholder="Email" className="w-full bg-transparent border-b border-primary/20 py-3 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" data-testid="input-email" />
                <input type="text" placeholder="Assunto" className="w-full bg-transparent border-b border-primary/20 py-3 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" data-testid="input-subject" />
                <textarea placeholder="Mensagem" rows={4} className="w-full bg-transparent border-b border-primary/20 py-3 text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground" data-testid="input-message" />
                <Button type="submit" className="self-start mt-4 bg-primary text-primary-foreground hover:bg-primary/90" size="lg" data-testid="btn-submit">
                  Enviar Mensagem
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm font-sans text-foreground/50 border-t border-primary/10">
        <p>&copy; {new Date().getFullYear()} Chocolates Dom José. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
