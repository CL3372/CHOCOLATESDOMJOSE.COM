import type { Lang } from "../context/CartContext";

export const LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

// Checks ?lang= first (so hreflang alternate URLs actually resolve to the
// matching language instead of always rendering PT), then a saved
// preference, defaulting to `fallback` (PT unless the caller knows its route
// implies another language, e.g. /terms passing "EN" — see Legal.tsx).
// Deliberately does NOT fall back to the browser's navigator.language: the
// prerendered build (scripts/prerender.mjs) always captures the bare URLs
// with this same fallback, and auto-switching off browser locale would
// fight that prerendered content on every hydration for non-matching
// visitors instead of only when they actually asked for another language.
export function detectLang(fallback: Lang = "PT"): Lang {
  if (typeof window === "undefined") return fallback;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("lang")?.toUpperCase();
  if (fromQuery && (LANGS as string[]).includes(fromQuery)) return fromQuery as Lang;
  const stored = localStorage.getItem("lang")?.toUpperCase();
  if (stored && (LANGS as string[]).includes(stored)) return stored as Lang;
  return fallback;
}

// Keeps the URL's ?lang= param (and saved preference) in sync when the user
// switches language, so the page stays shareable/bookmarkable per language
// and matches what the site's hreflang tags promise search engines.
export function setLangInUrl(lang: Lang) {
  try {
    localStorage.setItem("lang", lang);
  } catch {
    // ignore storage errors (e.g. private mode)
  }
  const url = new URL(window.location.href);
  if (lang === "PT") {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", lang);
  }
  window.history.replaceState({}, "", url);
}
