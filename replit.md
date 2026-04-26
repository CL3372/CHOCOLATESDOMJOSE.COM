# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Chocolates Dom José — Moloni invoicing integration

Auto-issues a Fatura-Recibo (FR) in Moloni after every paid order and emails it to the customer.

- Library: `artifacts/api-server/src/lib/moloni.ts`
- Pending order store: `artifacts/api-server/src/lib/orderStore.ts` (in-memory, 24h TTL — not persistent across restarts)
- Wired in: `routes/checkout.ts` stores order; `routes/webhook.ts` issues fatura on payment confirmation
- Auth: OAuth2 password grant (Moloni requires this for custom dev apps)
- Body format: `application/x-www-form-urlencoded` (Moloni rejects JSON bodies)
- VAT: 23% (IVA Normal); article prices stored excluding VAT, recomputed from gross
- Articles: one per product (auto-created in Moloni on first sale, cached in memory)
- Customer: looked up by NIF then by email; created if missing (NIF defaults to 999999990 / Consumidor Final)
- Email: fatura is sent automatically from Moloni to customer's email after issuance
- Document type: invoiceReceipts/insert (Fatura-Recibo, status=1 = closed)
- Required secrets: `MOLONI_CLIENT_ID` (the Developer ID/Slug, not the numeric app ID), `MOLONI_CLIENT_SECRET`, `MOLONI_USERNAME` (login email), `MOLONI_PASSWORD`, `MOLONI_COMPANY_ID` (numeric — verify via `companies/getAll`)
- Failure handling: if Moloni call fails, payment still succeeds and merchant gets a notification with the error so they can issue manually in moloni.pt

## Chocolates Dom José — Customer notifications

When EasyPay confirms payment (webhook), the customer automatically receives a friendly multilingual confirmation email in their browsing language (PT/EN/DE/NL).

- Library: `artifacts/api-server/src/lib/notify.ts` — `sendCustomerConfirmation()`
- Triggered from: `routes/webhook.ts` after successful payment, alongside merchant email + Telegram + Moloni fatura
- Language: cart sends `lang` field to `/api/checkout`; stored on the pending order; webhook reads it and picks the right copy
- Content: greeting + "Thank you for your order, your payment has been confirmed and your order is being processed" + shipping address + order summary + total + (if NIF given) note that fatura will arrive separately
- Merchant fallback: even if customer email fails, merchant still gets the order notification via Gmail and Telegram
- Required secrets (deployment + dev): `GMAIL_USER` and `GMAIL_APP_PASSWORD` — without these all email is silently skipped (Telegram still works)
