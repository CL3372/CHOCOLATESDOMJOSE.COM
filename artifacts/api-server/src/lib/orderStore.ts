export type StoredOrderItem = {
  reference: string;
  name: string;
  quantity: number;
  unitPriceEur: number;
};

export type StoredOrder = {
  customer: {
    name: string;
    email: string;
    phone: string;
    nif?: string;
  };
  shipping: {
    address: string;
    postcode: string;
    city: string;
    country: string;
  };
  items: StoredOrderItem[];
  totalEur: number;
};

const TTL_MS = 24 * 60 * 60 * 1000;
const store = new Map<string, { order: StoredOrder; createdAt: number }>();

function gc() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
}

export function setPendingOrder(orderKey: string, order: StoredOrder): void {
  gc();
  store.set(orderKey, { order, createdAt: Date.now() });
}

export function getPendingOrder(orderKey: string): StoredOrder | undefined {
  return store.get(orderKey)?.order;
}

export function deletePendingOrder(orderKey: string): void {
  store.delete(orderKey);
}

// --- Idempotency: track processed payment IDs so duplicate webhooks don't double-issue ---
const processed = new Map<string, number>();
const PROCESSED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function gcProcessed() {
  const now = Date.now();
  for (const [k, t] of processed) {
    if (now - t > PROCESSED_TTL_MS) processed.delete(k);
  }
}

/** Atomically reserve a payment for processing. Returns true if this caller wins the race, false if already processed/in-flight. */
export function tryReservePayment(paymentId: string): boolean {
  gcProcessed();
  if (!paymentId || paymentId === "-") return true; // can't dedupe without an id
  if (processed.has(paymentId)) return false;
  processed.set(paymentId, Date.now());
  return true;
}

/** Release a reservation (call on failure so retries can proceed). */
export function releasePayment(paymentId: string): void {
  if (paymentId) processed.delete(paymentId);
}
