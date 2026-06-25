---
name: EasyPay Visa/Mastercard validation
description: What EasyPay's card-payment validation checklist requires on the storefront, and the non-obvious decisions taken for Chocolates Dom José.
---

# EasyPay Visa/Mastercard validation (Chocolates Dom José)

EasyPay sends merchants a PT checklist before enabling Visa/Mastercard. Items that need site/code work (most legal text already lived in `Legal.tsx`):

- **Brand logos in footer or Terms.** EasyPay wants Visa & Mastercard/EasyPay logos, ideally from https://www.easypay.pt/brand-center/. We ship hand-coded SVG/text recreations in `src/components/PaymentLogos.tsx` (white chips). **Why:** brand-center may require the merchant's login and exact trademark assets; recreations are a pragmatic first pass. **How to apply:** if a reviewer rejects them, ask the merchant for the official brand-center files and swap them in — don't AI-generate brand logos.
- **Advertised payment methods must match reality.** The footer logo set must equal the methods in the Terms (MB WAY / Multibanco / Visa / Mastercard). We removed PayPal/Revolut Pay because the Terms don't list them and showing unavailable methods risks rejection.
- **Contacts page needs BOTH email and phone.** Phone `+351 912 630 054`.
- **VAT indication.** Must state whether IVA is included; we show "IVA incluído (23%)" under each price and in Terms.
- **Delivery policy must name the carrier(s) and state portes.** Generic "operadores logísticos" is not enough — EasyPay explicitly wants the transportadora named. Merchant uses **GLS / CTT**; under-€75 international portes vary by volume so they're computed at checkout (merchant would not give a fixed figure).
- **+18 pop-up only for alcoholic *beverages*.** Chocolates/food (incl. wine-cooked "Pêras Bebedas", alcohol boiled off) do NOT need an age gate; a pregnancy-caution advisory on the product is the appropriate response instead.
