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
  // Confirmed directly with EasyPay support (2026-07-20): /single/{id} is not
  // meant for payment-status lookups at all (it 404s with "Payment not found"
  // even for genuinely paid transactions) — the correct resource for
  // confirming a capture is /capture/{id}. This, plus the earlier /transaction
  // -> /single path typo, is why zero payment notifications succeeded from at
  // least April 2026 until this fix.
  const res = await fetch(
    `${EASYPAY_BASE}/capture/${encodeURIComponent(transactionId)}`,
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
    // /capture/{id} returns the paid amount as a flat "value" field (confirmed
    // via EasyPay's example response), not values.paid or amount like the
    // wrong endpoints we tried before.
    paidAmount: Number(data?.value ?? data?.values?.paid ?? data?.amount ?? 0),
    // payment_type/method are not present on the capture response — this
    // endpoint doesn't expose the original payment method (MB/MBW/CC), so
    // methodLabel in webhook.ts will fall back to its "Cartão" default until
    // we find another way to recover it. Not blocking: notifications, invoice
    // issuance, and order lookup do not depend on this field.
    method: (data?.type ?? data?.method ?? "") as string,
  };
}

/** The manifest shape the @easypaypt/checkout-sdk's startCheckout expects. */
export type CheckoutManifest = {
  id: string;
  session: string;
  config: Record<string, unknown> | null;
};

export async function createEasyPayCheckout(params: {
  amountCents: number;
  customer?: { name?: string; email?: string; phone?: string };
  orderKey?: string;
}): Promise<{ manifest: CheckoutManifest; orderKey: string }> {
  const amountEur = parseFloat((params.amountCents / 100).toFixed(2));

  const orderKey =
    params.orderKey ??
    `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // No success/return/cancel URL fields here: those were guesses at
  // undocumented field names, based on how a hosted-page redirect flow would
  // normally work. EasyPay's actual (and only documented) integration is the
  // client-side @easypaypt/checkout-sdk, which embeds the payment form on our
  // own page inside an iframe and reports completion via postMessage/
  // onSuccess — not a URL EasyPay redirects the browser to. See CartDrawer.tsx.
  const body: Record<string, unknown> = {
    type: ["single"],
    payment: {
      methods: ["CC", "MB", "MBW"],
      currency: "EUR",
      capture: {
        transaction_key: orderKey,
        descriptive: "Chocolates Dom Jose",
      },
    },
    order: {
      key: orderKey,
      value: amountEur,
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

  return {
    manifest: { id: data.id, session: data.session, config: data.config ?? null },
    orderKey,
  };
}
