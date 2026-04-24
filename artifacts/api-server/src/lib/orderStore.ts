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
