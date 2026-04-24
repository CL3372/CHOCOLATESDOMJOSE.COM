const MOLONI_BASE = "https://api.moloni.pt/v1";

type TokenCache = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type SetupCache = {
  document_set_id: number;
  tax_id_23: number;
  payment_method_id: number;
  unit_id: number;
  category_id: number;
};

let tokenCache: TokenCache | null = null;
let setupCache: SetupCache | null = null;
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

async function moloniCall<T = any>(endpoint: string, body: object): Promise<T> {
  const token = await getToken();
  const url = `${MOLONI_BASE}/${endpoint}/?access_token=${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

  const paymentMethods: any = await moloniCall("paymentMethods/getAll", { company_id });
  if (!Array.isArray(paymentMethods) || !paymentMethods.length) {
    throw new Error("Moloni: no payment methods configured");
  }

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
    payment_method_id: paymentMethods[0].payment_method_id,
    unit_id: units[0].unit_id,
    category_id,
  };
  return setupCache;
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

  const number = `WEB${Date.now().toString().slice(-9)}`;
  const created: any = await moloniCall("customers/insert", {
    company_id,
    vat: c.nif && /^\d{9}$/.test(c.nif) ? c.nif : "999999990",
    number,
    name: c.name?.trim() || c.email || "Cliente Loja Online",
    language_id: 1,
    address: c.address || "-",
    zip_code: c.postcode || "0000-000",
    city: c.city || "-",
    country_id: 1,
    email: c.email || "",
    phone: c.phone || "",
    maturity_date_id: 1,
    payment_method_id: setup.payment_method_id,
    salesman_id: 0,
    payment_day: 0,
    discount: 0,
    credit_limit: 0,
    delivery_method_id: 0,
    field_notes: "Cliente da loja online",
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
        payment_method_id: setup.payment_method_id,
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
