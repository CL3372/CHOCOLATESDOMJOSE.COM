import type { Lang } from "../context/CartContext";

export const LANGS: Lang[] = ["PT", "EN", "DE", "NL"];

// Checks ?lang= first (so hreflang alternate URLs actually resolve to the
// matching language instead of always rendering PT), then a saved
// preference, then the browser's language, defaulting to PT.
export function detectLang(): Lang {
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
