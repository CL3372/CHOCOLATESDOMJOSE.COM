import { db, pendingOrdersTable, processedPaymentsTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";

export type StoredOrderItem = {
  reference: string;
  name: string;
  quantity: number;
  unitPriceEur: number;
};

export type Lang = "PT" | "EN" | "DE" | "NL";

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
  lang: Lang;
};

const TTL_MS = 24 * 60 * 60 * 1000;
const PROCESSED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Persist a pending order keyed by orderKey. Uses Postgres so it survives
 * container restarts and works across multiple server instances (the
 * deployment may run more than one process behind a load balancer).
 */
export async function setPendingOrder(orderKey: string, order: StoredOrder): Promise<void> {
  await db
    .insert(pendingOrdersTable)
    .values({ orderKey, data: order })
    .onConflictDoUpdate({
      target: pendingOrdersTable.orderKey,
      set: { data: order, createdAt: new Date() },
    });
}

export async function getPendingOrder(orderKey: string): Promise<StoredOrder | undefined> {
  const rows = await db
    .select()
    .from(pendingOrdersTable)
    .where(eq(pendingOrdersTable.orderKey, orderKey))
    .limit(1);

  const row = rows[0];
  if (!row) return undefined;

  if (Date.now() - row.createdAt.getTime() > TTL_MS) {
    await db.delete(pendingOrdersTable).where(eq(pendingOrdersTable.orderKey, orderKey));
    return undefined;
  }

  return row.data as StoredOrder;
}

export async function deletePendingOrder(orderKey: string): Promise<void> {
  await db.delete(pendingOrdersTable).where(eq(pendingOrdersTable.orderKey, orderKey));
}

/**
 * Atomically reserve a payment id so duplicate webhook deliveries from EasyPay
 * don't double-issue invoices or double-send notifications. Returns true if
 * this caller wins the race, false if another caller already reserved it.
 */
export async function tryReservePayment(paymentId: string): Promise<boolean> {
  if (!paymentId || paymentId === "-") return true;

  // Best-effort GC of expired entries (cheap, runs in same connection)
  const cutoff = new Date(Date.now() - PROCESSED_TTL_MS);
  await db.delete(processedPaymentsTable).where(lt(processedPaymentsTable.processedAt, cutoff));

  const inserted = await db
    .insert(processedPaymentsTable)
    .values({ paymentId })
    .onConflictDoNothing()
    .returning({ paymentId: processedPaymentsTable.paymentId });

  return inserted.length > 0;
}

/** Release a reservation (call on failure so retries can proceed). */
export async function releasePayment(paymentId: string): Promise<void> {
  if (!paymentId) return;
  await db.delete(processedPaymentsTable).where(eq(processedPaymentsTable.paymentId, paymentId));
}
