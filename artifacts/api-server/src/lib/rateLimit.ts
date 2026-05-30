import type { Request, Response, NextFunction } from "express";
import { db, rateLimitsTable } from "@workspace/db";
import { sql, lt } from "drizzle-orm";

/**
 * Cross-instance fixed-window rate limiter backed by Postgres.
 *
 * The deployment runs multiple server instances behind a load balancer, so an
 * in-memory counter would only throttle a single process. We instead keep the
 * counter in Postgres and increment it atomically with an upsert, so the limit
 * holds across every instance.
 */
async function hit(
  bucket: string,
  identifier: string,
  limit: number,
  windowStart: number,
  windowMs: number,
): Promise<boolean> {
  const id = `${bucket}:${identifier}:${windowStart}`;
  const expiresAt = new Date(windowStart + windowMs);

  const rows = await db
    .insert(rateLimitsTable)
    .values({ id, count: 1, expiresAt })
    .onConflictDoUpdate({
      target: rateLimitsTable.id,
      set: { count: sql`${rateLimitsTable.count} + 1` },
    })
    .returning({ count: rateLimitsTable.count });

  const count = rows[0]?.count ?? 1;
  return count <= limit;
}

/** Best-effort GC of expired windows. Fire-and-forget; never blocks a request. */
let lastGc = 0;
function maybeGc(): void {
  const now = Date.now();
  if (now - lastGc < 60_000) return;
  lastGc = now;
  db.delete(rateLimitsTable)
    .where(lt(rateLimitsTable.expiresAt, new Date(now)))
    .catch(() => {});
}

/**
 * Extract the client IP. Behind the Replit proxy the real client is in
 * X-Forwarded-For; the left-most entry is the original client. This value is
 * spoofable, which is why every limiter is paired with an IP-independent global
 * backstop (see `limit()` options).
 */
function clientIp(req: Request): string {
  let ip = req.ip ?? req.socket.remoteAddress ?? "";
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first) ip = first;
  } else if (Array.isArray(xff) && xff[0]) {
    ip = xff[0];
  }
  if (!ip) ip = "unknown";
  // Bound the identifier so a hostile, oversized X-Forwarded-For can't bloat keys.
  return ip.slice(0, 64);
}

export type RateLimitOptions = {
  /** Logical name for this limiter, e.g. "contact". */
  bucket: string;
  /** Max requests per IP per window. */
  perIp: number;
  /** Max requests across ALL IPs per window (spoof-resistant backstop). */
  global: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

/**
 * Express middleware enforcing both a per-IP limit and a global per-bucket
 * limit within a fixed time window. Returns HTTP 429 when either is exceeded.
 *
 * Fails open on database errors: a transient DB problem must not take down the
 * public endpoints, and the global backstop still caps total outbound abuse
 * once the DB recovers.
 */
export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      maybeGc();
      // Single timestamp so both counters fall in the same fixed window.
      const windowStart = Math.floor(Date.now() / opts.windowMs) * opts.windowMs;

      // Check the IP-independent global backstop FIRST and short-circuit. This
      // stops an attacker rotating spoofed X-Forwarded-For values from churning
      // unbounded per-IP rows once the global cap for the window is reached.
      const globalOk = await hit(
        `${opts.bucket}:__global__`,
        "all",
        opts.global,
        windowStart,
        opts.windowMs,
      );
      if (!globalOk) {
        req.log?.warn?.({ bucket: opts.bucket, globalExceeded: true }, "rate limit exceeded");
        res.status(429).json({ error: "rate_limited" });
        return;
      }

      const ipOk = await hit(opts.bucket, clientIp(req), opts.perIp, windowStart, opts.windowMs);
      if (!ipOk) {
        req.log?.warn?.({ bucket: opts.bucket, ipExceeded: true }, "rate limit exceeded");
        res.status(429).json({ error: "rate_limited" });
        return;
      }
    } catch (err) {
      req.log?.error?.({ err }, "rate limit check failed (failing open)");
    }
    next();
  };
}
