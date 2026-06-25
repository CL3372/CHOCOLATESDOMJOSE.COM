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
 * Extract the client IP from req.ip, which Express derives from X-Forwarded-For
 * using the `trust proxy` setting in app.ts. With `trust proxy: 1`, Express
 * strips the rightmost XFF entry (added by Replit's proxy) and sets req.ip to
 * that value — the actual client IP as observed by Replit's load balancer.
 * This is NOT spoofable by a client: any attacker-injected leftmost XFF values
 * are ignored by Express because only one hop is trusted.
 *
 * Do NOT parse XFF manually here — reading the leftmost value directly would
 * allow an attacker to rotate fake IPs and bypass the per-IP bucket entirely.
 */
function clientIp(req: Request): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  // Bound the identifier so an oversized IP string can't bloat Postgres keys.
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
