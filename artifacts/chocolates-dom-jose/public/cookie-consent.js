// Cookie consent banner for the Google tag (Consent Mode v2).
// Plain script outside the React app on purpose: it never touches #root, so it
// cannot cause hydration mismatches, and it skips itself during the build's
// headless prerender (navigator.webdriver) so the banner is never baked into
// the prerendered HTML.
(function () {
  var KEY = "cookie_consent";
  var BANNER_ID = "dj-cookie-banner";

  var TEXT = {
    PT: {
      msg: "Utilizamos cookies para medir os resultados dos nossos anúncios e melhorar o site. Pode aceitar ou recusar.",
      accept: "Aceitar",
      decline: "Recusar",
      more: "Política de Privacidade",
      href: "/privacidade?lang=PT",
    },
    EN: {
      msg: "We use cookies to measure how our ads perform and to improve the site. You can accept or decline.",
      accept: "Accept",
      decline: "Decline",
      more: "Privacy Policy",
      href: "/privacy?lang=EN",
    },
    DE: {
      msg: "Wir verwenden Cookies, um die Wirkung unserer Anzeigen zu messen und die Website zu verbessern. Sie können zustimmen oder ablehnen.",
      accept: "Akzeptieren",
      decline: "Ablehnen",
      more: "Datenschutz",
      href: "/privacy?lang=DE",
    },
    NL: {
      msg: "Wij gebruiken cookies om de resultaten van onze advertenties te meten en de site te verbeteren. U kunt accepteren of weigeren.",
      accept: "Accepteren",
      decline: "Weigeren",
      more: "Privacybeleid",
      href: "/privacy?lang=NL",
    },
  };

  function lang() {
    var l = "";
    try {
      l = (new URLSearchParams(location.search).get("lang") || localStorage.getItem("lang") || "").toUpperCase();
    } catch (e) {}
    return TEXT[l] ? l : "PT";
  }

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function apply(choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch (e) {}
    var v = choice === "granted" ? "granted" : "denied";
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: v,
        ad_user_data: v,
        ad_personalization: v,
        analytics_storage: v,
      });
    }
  }

  function close() {
    var el = document.getElementById(BANNER_ID);
    if (el) el.parentNode.removeChild(el);
  }

  function show() {
    if (document.getElementById(BANNER_ID)) return;
    var t = TEXT[lang()];
    var box = document.createElement("div");
    box.id = BANNER_ID;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", "Cookies");
    box.style.cssText =
      "position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;" +
      "background:#1a0f08;color:#fff;border:1px solid rgba(253,224,71,.35);border-radius:14px;" +
      "padding:16px 18px;box-shadow:0 10px 30px rgba(0,0,0,.45);font:14px/1.45 Inter,system-ui,sans-serif;";

    var p = document.createElement("p");
    p.style.cssText = "margin:0 0 12px;";
    p.appendChild(document.createTextNode(t.msg + " "));
    var a = document.createElement("a");
    a.href = t.href;
    a.textContent = t.more;
    a.style.cssText = "color:#fde047;text-decoration:underline;";
    p.appendChild(a);
    box.appendChild(p);

    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;";

    function btn(label, primary, onClick) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.cssText =
        "cursor:pointer;border-radius:999px;padding:8px 18px;font:600 14px Inter,system-ui,sans-serif;" +
        (primary
          ? "background:#fde047;color:#1a0f08;border:1px solid #fde047;"
          : "background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4);");
      b.addEventListener("click", onClick);
      return b;
    }

    row.appendChild(btn(t.decline, false, function () { apply("denied"); close(); }));
    row.appendChild(btn(t.accept, true, function () { apply("granted"); close(); }));
    box.appendChild(row);
    document.body.appendChild(box);
  }

  // Lets any link with data-cookie-settings reopen the banner to change the choice.
  window.openCookieSettings = show;
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-cookie-settings]") : null;
    if (el) {
      e.preventDefault();
      show();
    }
  });

  if (navigator.webdriver) return; // headless prerender during the build
  if (stored()) return; // visitor already chose
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", show);
  } else {
    show();
  }
})();
