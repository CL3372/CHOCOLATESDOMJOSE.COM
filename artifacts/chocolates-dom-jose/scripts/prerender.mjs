// Runs after `vite build`. Serves the built dist/public output locally,
// visits each real route in headless Chromium, waits for React to finish
// rendering (including the async JSON-LD injection on the homepage), and
// writes the resulting HTML back into dist/public so search engines and
// social scrapers see real content instead of an empty <div id="root">.
// The client still hydrates on top of this markup (see main.tsx) — nothing
// changes for real visitors.

import { chromium } from "playwright";
import sparticuzChromium from "@sparticuz/chromium";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist", "public");
const PORT = 41734;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

// Routes to prerender: real content pages only. /checkout/success and
// /checkout/cancel are transactional (no SEO value) and stay client-only.
const ROUTES = [
  { path: "/", out: "index.html", waitFor: "#product-jsonld" },
  { path: "/termos", out: "termos/index.html", waitFor: "h1" },
  { path: "/terms", out: "terms/index.html", waitFor: "h1" },
  { path: "/privacidade", out: "privacidade/index.html", waitFor: "h1" },
  { path: "/privacy", out: "privacy/index.html", waitFor: "h1" },
];

const SITE = "https://chocolatesdomjose.com";

// Every indexable URL plus its language alternates, used to (re)generate
// sitemap.xml on every build so lastmod can never go stale by being
// hand-edited and forgotten. /termos and /terms are two distinct canonical
// URLs (PT and EN respectively — see App.tsx defaultLang), each listing the
// same full set of alternates per the hreflang spec; DE/NL have no
// dedicated path and live under ?lang= on the PT URL.
const SITEMAP_PAGES = [
  {
    loc: "/",
    changefreq: "weekly",
    priority: "1.0",
    alternates: { pt: "/", en: "/?lang=EN", de: "/?lang=DE", nl: "/?lang=NL" },
  },
  {
    loc: "/termos",
    changefreq: "yearly",
    priority: "0.3",
    alternates: { pt: "/termos", en: "/terms", de: "/termos?lang=DE", nl: "/termos?lang=NL" },
  },
  {
    loc: "/terms",
    changefreq: "yearly",
    priority: "0.3",
    alternates: { pt: "/termos", en: "/terms", de: "/termos?lang=DE", nl: "/termos?lang=NL" },
  },
  {
    loc: "/privacidade",
    changefreq: "yearly",
    priority: "0.3",
    alternates: { pt: "/privacidade", en: "/privacy", de: "/privacidade?lang=DE", nl: "/privacidade?lang=NL" },
  },
  {
    loc: "/privacy",
    changefreq: "yearly",
    priority: "0.3",
    alternates: { pt: "/privacidade", en: "/privacy", de: "/privacidade?lang=DE", nl: "/privacidade?lang=NL" },
  },
];

async function writeSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = SITEMAP_PAGES.map((page) => {
    const alternates = Object.entries(page.alternates)
      .map(([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${SITE}${href}" />`)
      .join("\n");
    return [
      "  <url>",
      `    <loc>${SITE}${page.loc}</loc>`,
      alternates,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;

  await writeFile(path.join(distDir, "sitemap.xml"), xml);
  console.log(`prerender: sitemap.xml regenerated (lastmod ${lastmod})`);
}

function startServer() {
  const server = createServer(async (req, res) => {
    const urlPath = req.url.split("?")[0];
    const filePath = path.join(distDir, urlPath);
    const ext = path.extname(filePath);

    try {
      if (ext && existsSync(filePath)) {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
        res.end(data);
        return;
      }
    } catch {
      // fall through to SPA fallback below
    }

    // SPA fallback for build-time crawling only — production is served
    // straight from the per-route files this script writes.
    const indexHtml = await readFile(path.join(distDir, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  if (!existsSync(distDir)) {
    console.error(`prerender: ${distDir} does not exist — run vite build first`);
    process.exit(1);
  }

  const server = await startServer();
  // Vercel's build container has no apt/root access, so a normal
  // playwright-downloaded Chromium fails there with missing shared
  // libraries (libnspr4.so etc). @sparticuz/chromium ships a Chromium
  // build made for exactly this kind of restricted Linux environment, so
  // it is used only when running on Vercel; local dev keeps the regular
  // playwright-managed Chromium.
  const launchOptions = process.env.VERCEL
    ? { executablePath: await sparticuzChromium.executablePath(), args: sparticuzChromium.args }
    : {};

  try {
    for (const route of ROUTES) {
      // A fresh browser per route (not just a fresh context) because
      // sparticuz's Chromium runs with --single-process --no-zygote (needed
      // to launch at all in Vercel's restricted build container), and that
      // mode does not reliably survive closing one context and opening the
      // next — the whole process dies after the first context.close().
      const browser = await chromium.launch(launchOptions);
      // locale "pt-PT" matches this site's default market so
      // detectLang()'s navigator.language fallback lands on Portuguese
      // instead of Chromium's default en-US.
      const context = await browser.newContext({ locale: "pt-PT" });
      const page = await context.newPage();

      const url = `http://localhost:${PORT}${route.path}`;
      await page.goto(url, { waitUntil: "networkidle" });
      // state: "attached" (not the default "visible") since the wait target
      // for "/" is a <script> tag, which never reports as visible.
      await page.waitForSelector(route.waitFor, { state: "attached", timeout: 10000 }).catch(() => {
        console.warn(`prerender: "${route.waitFor}" not found for ${route.path}, capturing anyway`);
      });
      // Let the title/meta-sync useEffect settle after the selector appears.
      await page.waitForTimeout(150);

      const html = await page.content();
      const outPath = path.join(distDir, route.out);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html);
      console.log(`prerender: ${route.path} -> ${route.out} (${(html.length / 1024).toFixed(0)}KB)`);

      await browser.close();
    }

    await writeSitemap();
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
