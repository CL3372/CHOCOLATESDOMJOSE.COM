# Threat Model

## Project Overview

Public e-commerce site for Chocolates Dom José with a React/Vite storefront and an Express 5 API. The production deployment processes contact submissions, initiates EasyPay checkouts, stores pending orders in PostgreSQL via Drizzle, issues Moloni invoices after payment callbacks, and sends merchant/customer notifications through SMTP/Gmail and Telegram.

The production-facing code is primarily `artifacts/api-server` and `artifacts/chocolates-dom-jose`. `artifacts/mockup-sandbox` is a development-only mockup environment and should be ignored unless something explicitly routes production traffic into it.

## Assets

- **Order and customer data** — names, email addresses, phone numbers, VAT/NIF values, shipping addresses, cart contents, payment references, and language preferences. Exposure affects customer privacy and order fulfillment integrity.
- **Payment and invoicing authority** — EasyPay checkout creation capability, payment-confirmation handling, and Moloni invoice issuance. Abuse can create fraudulent payment sessions, false order states, or incorrect tax documents.
- **Operational messaging channels** — merchant email inbox and Telegram bot/chat used for order and contact notifications. Abuse can spam operators, phish staff, or hide legitimate orders in noise.
- **Application secrets** — EasyPay credentials, Moloni OAuth credentials, SMTP/Gmail credentials, Telegram bot token, and database credentials. Compromise enables third-party account takeover or payment/invoice abuse.
- **Pending-order database state** — the mapping between EasyPay order keys, stored cart contents, idempotency records, and invoice status. Integrity matters because the webhook trusts this state to decide what to invoice and notify.

## Trust Boundaries

- **Browser to API** — all storefront and attacker-controlled input crosses this boundary. `/api/checkout`, `/api/contact`, and `/api/webhook/easypay` must treat every field and caller as untrusted.
- **API to PostgreSQL** — pending orders and processed-payment markers are stored server-side. Tampering at the API layer can change what gets invoiced or emailed.
- **API to EasyPay** — the server uses secret credentials to create payment sessions and accepts EasyPay callback data. Requests crossing this boundary must not be forgeable by arbitrary internet clients.
- **API to Moloni** — the server uses high-privilege invoicing credentials and sends customer/order data to generate fiscal documents.
- **API to Email/Telegram providers** — user-controlled content can be forwarded to operators and customers through channels that may render HTML or trigger downstream actions.
- **Production vs dev-only artifacts** — `artifacts/mockup-sandbox` and local tooling are out of scope unless production code imports or exposes them.

## Scan Anchors

- Production backend entry points: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, and `artifacts/api-server/src/routes/*`.
- Highest-risk areas: `routes/checkout.ts`, `routes/webhook.ts`, `lib/easypay.ts`, `lib/moloni.ts`, `lib/notify.ts`, `lib/orderStore.ts`, and repo-level config files that may contain secrets.
- Public surfaces: `POST /api/checkout`, `POST /api/contact`, `POST /api/webhook/easypay`, `GET /api/healthz`, and the public storefront in `artifacts/chocolates-dom-jose`.
- Dev-only area: `artifacts/mockup-sandbox` unless future scans find production routing or imports into the deployed app.

## Threat Categories

### Spoofing

The most important spoofing risk is the payment webhook boundary. The application must only treat callbacks as payment confirmations when they are cryptographically or otherwise strongly authenticated as originating from EasyPay. Merchant notification channels and invoice issuance must not be triggerable by arbitrary public requests that merely resemble provider payloads.

### Tampering

Clients control cart item arrays, quantities, redirect URLs, contact-form fields, and checkout customer/shipping fields before the server uses them for payment creation, storage, notifications, and invoicing. The server must derive authoritative prices from a server-side catalog, enforce sane quantity and type constraints, and reject attacker-controlled redirect targets or business-critical fields that can alter payment or fulfillment behavior.

### Information Disclosure

The application handles customer PII and multiple third-party credentials. Secrets must remain in the Replit Secrets store and never appear in checked-in config. Notifications, logs, and API errors must avoid exposing unnecessary personal data or credentials. HTML-bearing messages sent to operators or customers must not allow attackers to inject active content or misleading links.

### Denial of Service

All public endpoints are unauthenticated. The application must prevent cheap abuse of `/api/contact`, `/api/checkout`, and `/api/webhook/easypay` that can spam operators, exhaust third-party quotas, create unbounded pending-order records, or otherwise degrade service. External API calls should remain bounded and resilient to repeated attacker-triggered requests.

### Elevation of Privilege

Third-party service credentials confer privileges beyond ordinary storefront use: creating payment sessions, sending merchant notifications, and issuing invoices. The system must not let arbitrary users escalate into those capabilities through missing validation, missing webhook verification, or exposed secrets. All external-service actions must be authorized by trusted server-side state and validated payment context, not just client-supplied fields.
