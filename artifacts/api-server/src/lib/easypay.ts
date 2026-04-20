const EASYPAY_BASE = "https://api.prod.easypay.pt/2.0";

function getHeaders(): Record<string, string> {
  const accountId = process.env.EASYPAY_ACCOUNT_ID;
  const apiKey = process.env.EASYPAY_API_KEY;
  if (!accountId || !apiKey) {
    throw new Error(
      "EasyPay credentials not configured. Set EASYPAY_ACCOUNT_ID and EASYPAY_API_KEY in Secrets."
    );
  }
  return {
    AccountId: accountId,
    ApiKey: apiKey,
    "Content-Type": "application/json",
  };
}

export async function createEasyPayCheckout(params: {
  amountCents: number;
  returnUrl: string;
  cancelUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
}): Promise<string> {
  const amountEur = parseFloat((params.amountCents / 100).toFixed(2));

  const orderKey = `ORDER-${Date.now()}`;
  const txKey = `TXN-${Date.now()}`;

  const body: Record<string, unknown> = {
    type: ["single"],
    payment: {
      methods: ["CC", "MB", "MBW"],
      currency: "EUR",
      capture: {
        transaction_key: txKey,
        descriptive: "Chocolates Dom Jose",
      },
    },
    order: {
      key: orderKey,
      value: amountEur,
    },
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
  };

  if (params.customer && Object.values(params.customer).some(Boolean)) {
    body.customer = params.customer;
  }

  const res = await fetch(`${EASYPAY_BASE}/checkout`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, any>;

  console.log("EasyPay checkout response:", JSON.stringify(data, null, 2));

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? JSON.stringify(data);
    throw new Error(`EasyPay error (${res.status}): ${msg}`);
  }

  if (!data?.id || !data?.session) {
    throw new Error("EasyPay did not return id/session. Response: " + JSON.stringify(data));
  }

  const manifestConfig = {
    ...(data.config ?? {}),
    redirect: { auto: true, time: 3 },
  };

  const manifest = Buffer.from(
    JSON.stringify({ id: data.id, session: data.session, config: manifestConfig })
  ).toString("base64");

  return `https://pay.easypay.pt/?manifest=${encodeURIComponent(manifest)}`;
}
