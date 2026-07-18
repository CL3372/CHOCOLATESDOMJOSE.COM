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
  const browser = await chromium.launch(
    process.env.VERCEL
      ? { executablePath: await sparticuzChromium.executablePath(), args: sparticuzChromium.args }
      : {}
  );

  try {
    for (const route of ROUTES) {
      // A fresh context per route avoids any localStorage carrying over
      // between pages, and locale "pt-PT" matches this site's default
      // market so detectLang()'s navigator.language fallback lands on
      // Portuguese instead of Chromium's default en-US.
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

      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
