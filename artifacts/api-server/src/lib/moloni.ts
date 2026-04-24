const MOLONI_BASE = "https://api.moloni.pt/v1";

type TokenCache = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type SetupCache = {
  document_set_id: number;
  tax_id_23: number;
  payment_methods: { id: number; name: string }[];
  default_payment_method_id: number;
  unit_id: number;
  category_id: number;
};

let tokenCache: TokenCache | null = null;
let setupCache: SetupCache | null = null;
let countryCache: Map<string, number> | null = null;
const productIdCache = new Map<string, number>();

function getCompanyId(): number {
  const id = Number(process.env.MOLONI_COMPANY_ID);
  if (!id || Number.isNaN(id)) {
    throw new Error("MOLONI_COMPANY_ID is missing or not numeric");
  }
  return id;
}

async function fetchNewToken(): Promise<TokenCache> {
  const clientId = process.env.MOLONI_CLIENT_ID;
  const clientSecret = process.env.MOLONI_CLIENT_SECRET;
  const username = process.env.MOLONI_USERNAME;
  const password = process.env.MOLONI_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Moloni credentials missing (CLIENT_ID/SECRET/USERNAME/PASSWORD)");
  }

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  });

  const res = await fetch(`${MOLONI_BASE}/grant/?${params.toString()}`, {
    method: "GET",
  });
  const data = (await res.json()) as Record<string, any>;

  if (!res.ok || !data?.access_token) {
    throw new Error(
      `Moloni token error (${res.status}): ${JSON.stringify(data).slice(0, 300)}`
    );
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expires_at > Date.now() + 60_000) {
    return tokenCache.access_token;
  }
  tokenCache = await fetchNewToken();
  return tokenCache.access_token;
}

function encodeFormParams(obj: any, prefix = ""): string[] {
  const out: string[] = [];
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      out.push(...encodeFormParams(v, `${prefix}[${i}]`));
    });
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}[${k}]` : k;
      out.push(...encodeFormParams(v, key));
    }
    return out;
  }
  // primitive
  out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
  return out;
}

async function moloniCall<T = any>(endpoint: string, body: object): Promise<T> {
  const token = await getToken();
  const url = `${MOLONI_BASE}/${endpoint}/?access_token=${token}`;
  const formBody = encodeFormParams(body).join("&");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });
  const data = (await res.json()) as any;

  if (!res.ok || data?.error) {
    throw new Error(
      `Moloni ${endpoint} error (${res.status}): ${JSON.stringify(data).slice(0, 500)}`
    );
  }
  return data as T;
}

async function ensureSetup(): Promise<SetupCache> {
  if (setupCache) return setupCache;
  const company_id = getCompanyId();

  const docSets: any = await moloniCall("documentSets/getAll", { company_id });
  if (!Array.isArray(docSets) || !docSets.length) {
    throw new Error("Moloni: no document sets configured for this company");
  }

  const taxes: any = await moloniCall("taxes/getAll", { company_id });
  if (!Array.isArray(taxes) || !taxes.length) {
    throw new Error("Moloni: no taxes configured for this company");
  }
  const tax23 = taxes.find((t: any) => Number(t.value) === 23);
  if (!tax23) {
    throw new Error("Moloni: 23% IVA tax not found — please create it in Moloni");
  }

  const paymentMethodsRaw: any = await moloniCall("paymentMethods/getAll", { company_id });
  if (!Array.isArray(paymentMethodsRaw) || !paymentMethodsRaw.length) {
    throw new Error("Moloni: no payment methods configured");
  }
  const payment_methods = paymentMethodsRaw.map((p: any) => ({
    id: p.payment_method_id as number,
    name: String(p.name ?? ""),
  }));
  // Prefer Multibanco / Transferência as a sensible default for online payments
  const preferredDefault =
    payment_methods.find((p) => /multibanco/i.test(p.name)) ||
    payment_methods.find((p) => /transfer/i.test(p.name)) ||
    payment_methods[0];

  const units: any = await moloniCall("measurementUnits/getAll", { company_id });
  if (!Array.isArray(units) || !units.length) {
    throw new Error("Moloni: no measurement units configured");
  }

  let category_id: number;
  const categories: any = await moloniCall("productCategories/getAll", {
    company_id,
    parent_id: 0,
  });
  const existingOnline =
    Array.isArray(categories) &&
    categories.find((c: any) => c?.name === "Loja Online");
  if (existingOnline) {
    category_id = existingOnline.category_id;
  } else if (Array.isArray(categories) && categories.length) {
    category_id = categories[0].category_id;
  } else {
    const created: any = await moloniCall("productCategories/insert", {
      company_id,
      name: "Loja Online",
      pos_enabled: 0,
    });
    category_id = created.category_id;
  }

  setupCache = {
    document_set_id: docSets[0].document_set_id,
    tax_id_23: tax23.tax_id,
    payment_methods,
    default_payment_method_id: preferredDefault.id,
    unit_id: units[0].unit_id,
    category_id,
  };
  return setupCache;
}

async function getCountryId(country: string): Promise<number> {
  const fallback = 1; // Portugal
  const c = (country || "").trim();
  if (!c) return fallback;

  if (!countryCache) {
    try {
      const list: any = await moloniCall("countries/getAll", {});
      const map = new Map<string, number>();
      if (Array.isArray(list)) {
        for (const item of list) {
          const id = Number(item.country_id);
          if (!id) continue;
          if (item.iso_3166_1) map.set(String(item.iso_3166_1).toLowerCase(), id);
          if (item.name) map.set(String(item.name).toLowerCase(), id);
          if (item.title) map.set(String(item.title).toLowerCase(), id);
        }
      }
      countryCache = map;
    } catch (e) {
      console.warn("Moloni countries/getAll failed, defaulting all to PT:", e);
      countryCache = new Map();
    }
  }

  // Common name aliases (PT users may write "Portugal", "PT", "Reino Unido", etc.)
  const aliases: Record<string, string> = {
    "portugal": "pt",
    "espanha": "es", "spain": "es", "españa": "es",
    "frança": "fr", "france": "fr",
    "alemanha": "de", "germany": "de", "deutschland": "de",
    "holanda": "nl", "países baixos": "nl", "paises baixos": "nl", "netherlands": "nl",
    "reino unido": "gb", "united kingdom": "gb", "uk": "gb",
    "estados unidos": "us", "united states": "us", "usa": "us",
    "bélgica": "be", "belgica": "be", "belgium": "be",
    "luxemburgo": "lu", "luxembourg": "lu",
    "itália": "it", "italia": "it", "italy": "it",
    "suíça": "ch", "suica": "ch", "switzerland": "ch",
    "irlanda": "ie", "ireland": "ie",
    "áustria": "at", "austria": "at",
  };
  const lower = c.toLowerCase();
  const normalized = aliases[lower] ?? lower;
  return countryCache.get(normalized) ?? countryCache.get(lower) ?? fallback;
}

function pickPaymentMethodId(setup: SetupCache, label?: string): number {
  if (!label) return setup.default_payment_method_id;
  const l = label.toLowerCase();
  // EasyPay labels: "Multibanco", "MB WAY", "Cartão de crédito"
  if (l.includes("mb way") || l.includes("mbway")) {
    const m = setup.payment_methods.find((p) => /mb\s*way|mbway/i.test(p.name));
    if (m) return m.id;
  }
  if (l.includes("multibanco")) {
    const m = setup.payment_methods.find((p) => /multibanco/i.test(p.name));
    if (m) return m.id;
  }
  if (l.includes("cart")) {
    const m = setup.payment_methods.find((p) => /cart|cred|debit/i.test(p.name));
    if (m) return m.id;
  }
  return setup.default_payment_method_id;
}

async function ensureProduct(
  reference: string,
  name: string,
  priceInclVatEur: number
): Promise<number> {
  if (productIdCache.has(reference)) return productIdCache.get(reference)!;
  const company_id = getCompanyId();
  const setup = await ensureSetup();

  try {
    const found: any = await moloniCall("products/getByReference", {
      company_id,
      reference,
    });
    if (Array.isArray(found) && found[0]?.product_id) {
      productIdCache.set(reference, found[0].product_id);
      return found[0].product_id;
    }
  } catch {
    // not found — fall through to create
  }

  const priceExcl = priceInclVatEur / 1.23;
  const created: any = await moloniCall("products/insert", {
    company_id,
    category_id: setup.category_id,
    type: 1,
    name,
    summary: name,
    reference,
    price: Number(priceExcl.toFixed(4)),
    unit_id: setup.unit_id,
    has_stock: 0,
    stock: 0,
    minimum_stock: 0,
    pos_favorite: 0,
    at_product_category: "M",
    taxes: [
      { tax_id: setup.tax_id_23, value: 23, order: 1, cumulative: 0 },
    ],
  });

  productIdCache.set(reference, created.product_id);
  return created.product_id;
}

async function ensureCustomer(c: {
  name: string;
  email: string;
  nif?: string;
  phone?: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
}): Promise<number> {
  const company_id = getCompanyId();
  const setup = await ensureSetup();

  if (c.nif && /^\d{9}$/.test(c.nif)) {
    try {
      const found: any = await moloniCall("customers/getByVat", {
        company_id,
        vat: c.nif,
      });
      if (Array.isArray(found) && found[0]?.customer_id) return found[0].customer_id;
    } catch {
      // ignore
    }
  }

  if (c.email) {
    try {
      const found: any = await moloniCall("customers/getBySearch", {
        company_id,
        search: c.email,
      });
      if (Array.isArray(found) && found[0]?.customer_id) return found[0].customer_id;
    } catch {
      // ignore
    }
  }

  const country_id = await getCountryId(c.country);
  const isPT = country_id === 1;
  // For PT use NIF if valid, else generic consumidor final. For non-PT, use 999999990 (Moloni accepts).
  const vat = isPT && c.nif && /^\d{9}$/.test(c.nif) ? c.nif : "999999990";

  const number = `WEB${Date.now().toString().slice(-9)}`;
  const created: any = await moloniCall("customers/insert", {
    company_id,
    vat,
    number,
    name: c.name?.trim() || c.email || "Cliente Loja Online",
    language_id: 1,
    address: c.address || "-",
    zip_code: c.postcode || "0000-000",
    city: c.city || "-",
    country_id,
    email: c.email || "",
    phone: c.phone || "",
    maturity_date_id: 1,
    payment_method_id: setup.default_payment_method_id,
    salesman_id: 0,
    payment_day: 0,
    discount: 0,
    credit_limit: 0,
    delivery_method_id: 0,
    field_notes: `Cliente da loja online (${c.country || "PT"})`,
  });

  return created.customer_id;
}

export type IssueInvoiceArgs = {
  customer: {
    name: string;
    email: string;
    nif?: string;
    phone?: string;
  };
  shipping: {
    address: string;
    postcode: string;
    city: string;
    country: string;
  };
  items: {
    reference: string;
    name: string;
    quantity: number;
    unitPriceEur: number; // VAT-included
  }[];
  totalEur: number;
  paymentMethodLabel?: string;
  paymentRef?: string;
};

export type IssueInvoiceResult = {
  document_id: number;
  document_number: string;
  emailedTo?: string;
};

export async function issueInvoiceReceipt(
  order: IssueInvoiceArgs
): Promise<IssueInvoiceResult> {
  const company_id = getCompanyId();
  const setup = await ensureSetup();

  const customer_id = await ensureCustomer({
    name: order.customer.name,
    email: order.customer.email,
    nif: order.customer.nif,
    phone: order.customer.phone,
    address: order.shipping.address,
    postcode: order.shipping.postcode,
    city: order.shipping.city,
    country: order.shipping.country,
  });

  const products = await Promise.all(
    order.items.map(async (i, idx) => {
      const product_id = await ensureProduct(i.reference, i.name, i.unitPriceEur);
      const priceExcl = i.unitPriceEur / 1.23;
      return {
        product_id,
        name: i.name,
        summary: i.name,
        qty: i.quantity,
        price: Number(priceExcl.toFixed(4)),
        discount: 0,
        order: idx + 1,
        taxes: [
          { tax_id: setup.tax_id_23, value: 23, order: 1, cumulative: 0 },
        ],
        exemption_reason: "",
      };
    })
  );

  const today = new Date().toISOString().slice(0, 10);

  const inv: any = await moloniCall("invoiceReceipts/insert", {
    company_id,
    date: today,
    expiration_date: today,
    document_set_id: setup.document_set_id,
    customer_id,
    your_reference: order.paymentRef ?? "",
    notes: `Encomenda online${order.paymentMethodLabel ? ` — ${order.paymentMethodLabel}` : ""}`,
    products,
    payments: [
      {
        payment_method_id: pickPaymentMethodId(setup, order.paymentMethodLabel),
        value: Number(order.totalEur.toFixed(2)),
        date: today,
        notes: order.paymentMethodLabel ?? "",
      },
    ],
    status: 1,
  });

  const documentNumber: string =
    inv?.entity_document_number ?? inv?.document_set_name ?? String(inv?.document_id ?? "");

  let emailedTo: string | undefined;
  if (order.customer.email) {
    try {
      await moloniCall("documents/sendByEmail", {
        company_id,
        document_id: inv.document_id,
        email: order.customer.email,
        msg:
          "Em anexo encontra a sua fatura-recibo.\n\n" +
          "Obrigado pela sua encomenda!\n\nChocolates Dom José\nhttps://chocolatesdomjose.com",
      });
      emailedTo = order.customer.email;
    } catch (e) {
      console.error("Moloni sendByEmail (non-fatal):", e);
    }
  }

  return {
    document_id: inv.document_id,
    document_number: documentNumber,
    emailedTo,
  };
}
