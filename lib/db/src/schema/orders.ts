import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const pendingOrdersTable = pgTable("pending_orders", {
  orderKey: text("order_key").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const processedPaymentsTable = pgTable("processed_payments", {
  paymentId: text("payment_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});
