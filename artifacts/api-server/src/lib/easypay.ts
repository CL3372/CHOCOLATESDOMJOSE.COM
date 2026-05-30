const EASYPAY_BASE = "https://api.prod.easypay.pt/2.0";

/**
 * Canonical first-party origin for return URL generation.
 * Must be set in production. Falls back to the production domain.
 */
export const SITE_URL = (process.env.SITE_URL ?? "https://chocolatesdomjose.com").replace(/\/$/, "");

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

export type VerifiedTransaction = {
  /** EasyPay-confirmed payment status ("success"). */
  status: string;
  /**
   * The transaction key set during checkout creation — equals the internal
   * orderKey stored in our database. Authoritative; never trust the webhook body.
   */
  orderKey: string;
  /** Amount actually captured, in EUR (authoritative). */
  paidAmount: number;
  /** Payment method code: "CC", "MB", "MBW", etc. */
  method: string;
};

/**
 * Fetch and verify a transaction from EasyPay server-side.
 *
 * Returns a VerifiedTransaction when EasyPay confirms status === "success",
 * or null when the transaction exists but is not (yet) paid.
 * Throws on network errors or non-2xx responses so the caller can decide
 * whether to retry or log and drop the webhook.
 *
 * The returned fields are authoritative — callers must use them instead of
 * the untrusted webhook body for any business-critical decisions
 * (order lookup, amount reconciliation, invoice issuance).
 */
export async function verifyEasyPayTransaction(
  transactionId: string
): Promise<VerifiedTransaction | null> {
  const res = await fetch(
    `${EASYPAY_BASE}/transaction/${encodeURIComponent(transactionId)}`,
    { method: "GET", headers: getHeaders() }
  );

  if (!res.ok) {
    throw new Error(
      `EasyPay transaction lookup failed (${res.status}) for id=${transactionId}`
    );
  }

  const data = await res.json() as Record<string, any>;

  if (data?.status !== "success") {
    return null;
  }

  return {
    status: data.status as string,
    orderKey: (data?.key ?? data?.transaction_key ?? "") as string,
    paidAmount: Number(data?.values?.paid ?? data?.amount ?? 0),
    method: (data?.type ?? data?.method ?? "") as string,
  };
}

export async function createEasyPayCheckout(params: {
  amountCents: number;
  returnUrl: string;
  cancelUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
  orderKey?: string;
}): Promise<{ url: string; orderKey: string }> {
  const amountEur = parseFloat((params.amountCents / 100).toFixed(2));

  const orderKey =
    params.orderKey ??
    `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const body: Record<string, unknown> = {
    type: ["single"],
    payment: {
      methods: ["CC", "MB", "MBW"],
      currency: "EUR",
      capture: {
        transaction_key: orderKey,
        descriptive: "Chocolates Dom Jose",
      },
      // EasyPay Forms-checkout: redirect URLs after payment.
      // Different EasyPay account profiles accept different field names —
      // we send them all; unknown fields are ignored by the API.
      config: {
        success_url: params.returnUrl,
        failed_url: params.cancelUrl,
        back_url: params.cancelUrl,
        redirect_url: params.returnUrl,
      },
    },
    order: {
      key: orderKey,
      value: amountEur,
    },
    // Top-level variants for backward compatibility with older EasyPay
    // checkout profiles.
    success_url: params.returnUrl,
    failed_url: params.cancelUrl,
    back_url: params.cancelUrl,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    url: {
      success: params.returnUrl,
      failed: params.cancelUrl,
      back: params.cancelUrl,
    },
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

  const manifest = Buffer.from(
    JSON.stringify({ id: data.id, session: data.session, config: data.config ?? null })
  ).toString("base64");

  return {
    url: `https://pay.easypay.pt/?manifest=${encodeURIComponent(manifest)}`,
    orderKey,
  };
}
