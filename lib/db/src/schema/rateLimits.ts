import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Fixed-window rate-limit counters. Stored in Postgres (not in memory) because
 * the deployment runs multiple server instances behind a load balancer — an
 * in-memory counter would only protect a single instance, letting an attacker
 * multiply their allowance by hitting different processes.
 *
 * `id` encodes the bucket, identifier (e.g. client IP), and window start, so a
 * row is unique per window and is incremented atomically via upsert.
 */
export const rateLimitsTable = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  count: integer("count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
