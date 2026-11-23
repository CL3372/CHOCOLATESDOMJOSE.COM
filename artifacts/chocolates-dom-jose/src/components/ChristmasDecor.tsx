import { useEffect, useState } from "react";
import type { Lang } from "@/context/CartContext";
import { getActiveSeason } from "@/lib/seasonalGreeting";

/**
 * True only in the browser and only while the Christmas season is active.
 * Checked on the client (not at build time) so the flying sleigh and snow
 * switch themselves off after the season ends even if the site isn't
 * redeployed, and so the prerendered HTML never contains them.
 */
export function useIsChristmasClient(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(getActiveSeason() === "christmas");
  }, []);
  return active;
}

const C = {
  red: "#d0142c",
  redDark: "#8e0c20",
  white: "#ffffff",
  skin: "#f4c9a6",
  black: "#1c1410",
  gold: "#f0c45a",
  sack: "#9a6a3a",
  deer: "#a8703f",
  deerLight: "#d29a62",
  deerDark: "#6b4325",
  antler: "#ead2a8",
};

/** One reindeer, drawn facing right, centred on its body at (0, 0). */
function Reindeer({ x, y, delay }: { x: number; y: number; delay: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="xmas-gallop" style={{ animationDelay: delay }}>
        {/* legs */}
        <path d="M9 4 L17 11 M6 5 L12 14 M-9 4 L-17 9 M-11 3 L-19 12" stroke={C.deerDark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        {/* tail */}
        <path d="M-14 -3 L-19 -6" stroke={C.deerLight} strokeWidth="3" strokeLinecap="round" />
        {/* body + lighter belly */}
        <ellipse cx="0" cy="0" rx="15" ry="6.5" fill={C.deer} />
        <ellipse cx="0" cy="2.6" rx="10" ry="3" fill={C.deerLight} opacity="0.75" />
        {/* neck + head */}
        <path d="M9 -3 L17 -14" stroke={C.deer} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="21" cy="-16" rx="6" ry="3.4" transform="rotate(18 21 -16)" fill={C.deer} />
        <circle cx="26.6" cy="-14.2" r="1.5" fill={C.black} />
        <circle cx="19.8" cy="-17.6" r="0.9" fill={C.black} />
        {/* antlers */}
        <path d="M16 -18 L12 -27 M14 -22 L9 -24 M13 -25.5 L15 -30 M18 -19 L19 -28 M18.6 -24 L23 -27" stroke={C.antler} strokeWidth="1.7" strokeLinecap="round" fill="none" />
        {/* red collar with a gold bell */}
        <path d="M7.5 -5 L12.5 -1.5" stroke={C.red} strokeWidth="3" strokeLinecap="round" />
        <circle cx="11" cy="0.6" r="1.4" fill={C.gold} />
      </g>
    </g>
  );
}

/** Father Christmas in his red sleigh, pulled by three reindeer. */
function SleighSvg() {
  return (
    <svg viewBox="0 0 320 84" className="h-auto w-[220px] sm:w-[300px]" aria-hidden="true">
      {/* sparkle trail */}
      <g fill={C.gold}>
        <circle className="xmas-twinkle" cx="6" cy="50" r="1.6" />
        <circle className="xmas-twinkle" style={{ animationDelay: "0.4s" }} cx="0" cy="58" r="1.1" />
        <circle className="xmas-twinkle" style={{ animationDelay: "0.8s" }} cx="12" cy="62" r="1.3" />
      </g>
      {/* reins */}
      <path d="M84 33 Q160 26 290 35" stroke={C.gold} strokeWidth="1" fill="none" opacity="0.9" />
      {/* sack of presents */}
      <path d="M26 42 Q22 22 38 20 Q52 22 48 42 Z" fill={C.sack} />
      <path d="M35 21 L33 15 M38 20 L41 14" stroke={C.sack} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="31" y="26" width="7" height="7" fill={C.red} />
      <rect x="40" y="29" width="6" height="6" fill={C.gold} />
      {/* Santa: red suit, black belt */}
      <circle cx="62" cy="35" r="11" fill={C.red} />
      <rect x="51" y="36" width="22" height="3.2" fill={C.black} />
      <rect x="60" y="35.4" width="4.4" height="4.4" fill="none" stroke={C.gold} strokeWidth="1.2" />
      {/* face, beard, hat */}
      <circle cx="67" cy="21" r="5.6" fill={C.skin} />
      <path d="M61.5 21.5 Q62 32 68.5 31 Q74.5 29.5 72.8 21.5 Q67 24.5 61.5 21.5 Z" fill={C.white} />
      <circle cx="69.4" cy="19.6" r="0.8" fill={C.black} />
      <path d="M61 17 Q68 5 81 10 L73 16 Z" fill={C.red} />
      <path d="M60.5 17.6 L73.6 16.4" stroke={C.white} strokeWidth="3" strokeLinecap="round" />
      <circle cx="82" cy="10" r="2.6" fill={C.white} />
      {/* arm holding the reins */}
      <path d="M68 32 L82 33" stroke={C.red} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M79.5 33 L80.5 33" stroke={C.white} strokeWidth="4" />
      <circle cx="84.4" cy="33" r="2" fill={C.black} />
      {/* red sleigh with gold trim */}
      <path d="M20 42 L95 42 Q101 42 100 48 L96 57 Q94 62 87 62 L36 62 Q22 62 20 52 Z" fill={C.red} />
      <path d="M24 46 L94 46" stroke={C.gold} strokeWidth="1.2" />
      <path d="M50 54 Q56 49 62 54 Q68 59 74 54" stroke={C.gold} strokeWidth="1.2" fill="none" />
      <path d="M21 43 Q11 33 17 25 Q21 21 25 25" stroke={C.redDark} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* gold runners */}
      <path d="M40 62 L40 69 M84 62 L84 69" stroke={C.gold} strokeWidth="2.2" />
      <path d="M16 69 L102 69 Q112 69 113 60" stroke={C.gold} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Reindeer x={170} y={44} delay="0s" />
      <Reindeer x={222} y={40} delay="0.15s" />
      <Reindeer x={274} y={36} delay="0.3s" />
    </svg>
  );
}

// Fixed (not random) positions so every render is identical.
const FLAKES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 2 + (i % 3),
  duration: 9 + (i % 5) * 2,
  delay: -((i * 1.7) % 14),
  drift: i % 2 === 0 ? 1 : -1,
}));

/** Snow + flying sleigh layered over the hero. Purely decorative. */
export function ChristmasSky() {
  const active = useIsChristmasClient();
  if (!active) return null;
  return (
    <div className="xmas-sky pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="xmas-flake"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            ["--drift" as string]: `${f.drift * 24}px`,
          }}
        />
      ))}
      <div className="xmas-sleigh text-[#f3d27a]">
        <div className="xmas-bob">
          <SleighSvg />
        </div>
      </div>
    </div>
  );
}

const BANNER_TEXT: Record<Lang, { text: string; cta: string }> = {
  PT: { text: "Os nossos Cabazes de Natal já chegaram — o presente perfeito, também para empresas.", cta: "Ver cabazes" },
  EN: { text: "Our Christmas Hampers are here — the perfect gift, for family and business alike.", cta: "See hampers" },
  DE: { text: "Unsere Weihnachtskörbe sind da — das perfekte Geschenk, auch für Firmen.", cta: "Zu den Körben" },
  NL: { text: "Onze Kerstmanden zijn er — het perfecte cadeau, ook voor bedrijven.", cta: "Bekijk kerstmanden" },
};

/** Festive red strip promoting the Christmas hampers. */
export function ChristmasBanner({ lang }: { lang: Lang }) {
  const b = BANNER_TEXT[lang];
  return (
    <div className="relative overflow-hidden border-b border-[#f3d27a]/30 bg-gradient-to-r from-[#5c0c18] via-[#8e1426] to-[#5c0c18] px-4 py-3 text-center text-sm text-white sm:text-base">
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle, #f3d27a 1px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
      <p className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span aria-hidden="true" className="hidden sm:inline">🎄</span>
        <span className="font-medium">{b.text}</span>
        <a
          href="#produtos"
          data-testid="btn-xmas-hampers"
          className="rounded-full border border-[#f3d27a]/70 px-4 py-1 text-sm font-semibold text-[#f3d27a] transition hover:bg-[#f3d27a] hover:text-[#5c0c18]"
        >
          {b.cta} →
        </a>
      </p>
    </div>
  );
}
