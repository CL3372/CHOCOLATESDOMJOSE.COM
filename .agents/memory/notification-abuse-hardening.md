---
name: Notification endpoint hardening
description: How public notification endpoints (contact/checkout) are protected against spam and HTML injection on this Express API.
---

# Public notification endpoints — abuse hardening

The Chocolates Dom José API exposes unauthenticated `POST /api/contact` and
`POST /api/checkout` that fan out to merchant email + Telegram (and checkout
creates EasyPay sessions). Two classes of abuse must stay closed:

## Rate limiting must be cross-instance + spoof-resistant
The deployment runs multiple instances behind a load balancer, so any
in-memory limiter only protects one process. Rate limiting is therefore
**Postgres-backed** (fixed-window counter in `rate_limits`, atomic
`INSERT ... ON CONFLICT DO UPDATE count = count + 1 RETURNING count`).

Each limiter enforces **two** counters per window:
- per-IP (client IP from `X-Forwarded-For`, left-most entry)
- a global per-bucket backstop ("all")

**Why both:** behind the Replit proxy the client IP comes from XFF, which is
**spoofable** — an attacker can rotate fake IPs to dodge the per-IP cap. The
global backstop caps total outbound notifications regardless of IP.

**Why global is checked first (short-circuit):** if you increment per-IP before
the global check, spoofed high-cardinality IPs churn unbounded rows in
`rate_limits` even while being 429'd. Checking/incrementing the single global
row first and returning early bounds per-IP row creation to the global cap.

Other constraints learned: use ONE `windowStart` per request for both counters
(independent `Date.now()` calls can straddle a window boundary); cap the IP key
length (hostile oversized XFF); limiter **fails open** on DB error on purpose
(a transient DB issue must not take down checkout/contact — the global backstop
still applies once DB recovers).

## Untrusted fields in emails must be HTML-escaped
Checkout/shipping/contact fields are attacker-controlled and were interpolated
raw into HTML email templates (phishing vector via injected links). All such
sinks go through `escapeHtml()` (exported from `lib/notify.ts`, shared by
`routes/contact.ts`). When adding any new field to a notification template,
escape it.
