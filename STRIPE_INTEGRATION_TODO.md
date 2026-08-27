# Stripe Integration Guide & Setup TODO

This document serves as the single source of truth for the Stripe Checkout, Subscription Cancellation, and Webhook integration in **Pensionsmanager**.

---

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [src/app/api/create-checkout-session/route.ts](src/app/api/create-checkout-session/route.ts)

| Field | Current Value | What to Set |
|---|---|---|
| `mode` | `subscription` | Configured for recurring subscriptions. |
| `success_url` | `${process.env.DOMAIN || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}` | Post-payment success page URL (rendered via [src/app/success/page.tsx](src/app/success/page.tsx)). |
| `cancel_url` | `${process.env.DOMAIN || "http://localhost:3000"}/account/tarif` | Cancel/return page URL. |
| `line_items[].price` | `price_...` | Your actual Stripe Price ID from the Stripe Dashboard ([https://dashboard.stripe.com/prices](https://dashboard.stripe.com/prices)) or passed dynamically. |

---

## Configured Parameters

These parameters were configured in Checkout Studio and are set in the server route:

**Files containing these parameters:**
- [src/app/api/create-checkout-session/route.ts](src/app/api/create-checkout-session/route.ts)

| Parameter | Value |
|---|---|
| `ui_mode` | `hosted_page` (Stripe SDK `^22.6.0` >= 21.0.0 uses `hosted_page`) |
| `mode` | `subscription` |
| `billing_address_collection` | `required` |
| `name_collection` | `{ "individual": { "enabled": true }, "business": { "enabled": true } }` |
| `payment_method_collection` | `always` |
| `allow_promotion_codes` | `false` |
| `consent_collection` | `{ "terms_of_service": "required" }` |
| `automatic_tax` | `{ "enabled": true }` |
| `submit_type` | `auto` |
| `tax_id_collection` | `{ "enabled": true, "required": "never" }` |
| `integration_identifier` | `hosted_mobile_app_0001` |
| `origin_context` | `mobile_app` |

---

## Kündigungs- & Test-Workflows

Auf der Seite [src/app/account/tarif/page.tsx](src/app/account/tarif/page.tsx) und über den Endpunkt [src/app/api/subscriptions/cancel/route.ts](src/app/api/subscriptions/cancel/route.ts) stehen folgende Kündigungsarten bereit:

### 1. Reguläre Kündigung zum Monatsende
- **Aktion**: `stripe.subscriptions.update(id, { cancel_at_period_end: true })`
- **Verhalten**: Das Abonnement bleibt bis zum Ende des aktuellen Abrechnungsmonats aktiv. Ein Info-Banner zeigt den Status an und bietet die Option *„Kündigung widerrufen“*.

### 2. ⚡ Sofortige Kündigung (Testmodus / Sandbox)
- **Aktion**: `stripe.subscriptions.cancel(id)`
- **Verhalten**: Beendet das Abonnement mit sofortiger Wirkung. Der Account wird unmittelbar zurückgesetzt, sodass sofort ein neuer Checkout-Vorgang und ein neues Abo getestet werden können.
- **Sicherheits-Guard**: Sofortige Kündigungen sind server-seitig nur mit Test-Keys (`sk_test_...`) oder in `NODE_ENV !== 'production'` erlaubt.

---

## Webhook-Ereignisse (Stripe Webhooks)

Der Endpunkt [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts) verarbeitet folgende Ereignisse:

### Empfohlene Ereignisse (Recommended)
1. **`checkout.session.completed`**:
   - Tritt ein, wenn eine Checkout-Sitzung erfolgreich abgeschlossen wurde.
   - Weist das Abonnement dem Kunden/der Pension zu, erfasst TOS-Zustimmung & Werbe-Opt-in.
2. **`invoice.paid`**:
   - Tritt ein, wenn eine Rechnungszahlung erfolgreich durchgeführt oder als bezahlt markiert wurde.
   - Aktualisiert den Abrechnungszeitraum und setzt Mahnstatus zurück.
3. **`invoice.payment_failed`**:
   - Tritt ein, wenn ein Zahlungsversuch fehlschlägt (z. B. Karte abgelaufen / abgelehnt).
   - Setzt Warnbanner im Pensionsmanager-Account.

### Optionale Ereignisse (Optional)
- **`customer.subscription.created`**: Kunde hat ein neues Abonnement abgeschlossen.
- **`customer.subscription.updated`**: Tarifwechsel (Upgrade/Downgrade) oder Kündigungsvormerkung.
- **`customer.subscription.deleted`**: Abonnement endgültig beendet / abgelaufen.
- **`payment_intent.succeeded`**: Einzelzahlung erfolgreich gebucht.
- **`setup_intent.succeeded`**: Zahlungsmethode erfolgreich eingerichtet/hinterlegt.

---

## Setup and Next Steps

### 1. Umgebungsvariablen (.env.local)
Ihre Stripe Test-Sandbox-Schlüssel sind in `.env.local` hinterlegt:

```env
# Stripe Secret Key (server-side only)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Publishable Key (browser-accessible)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51T813QK7YXP9exJoE37vCBv1jINTTCLU0wn8C1x53SEP5OQRrCabHsYwayawQIGArdMaJzbGB8IBApugShyOm7xP00xOwNXcPf

# Stripe Webhook Secret (erhalten über Stripe CLI oder Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_...

# Standard Stripe Preis-ID (optional Fallback)
STRIPE_DEFAULT_PRICE_ID=price_...

# App URL
DOMAIN=http://localhost:3000
```

### 2. Rechtliche Links (AGB & Datenschutz) im Stripe Dashboard hinterlegen
Damit die Links in der Checkout-Checkbox (*„Ich stimme den Nutzungsbedingungen und der Datenschutzerklärung zu“*) anklickbar sind, müssen diese in den öffentlichen Kontoeinstellungen hinterlegt werden:

1. Öffnen Sie im Stripe Dashboard: [Stripe Dashboard > Einstellungen > Öffentliche Angaben](https://dashboard.stripe.com/test/settings/public)
2. Tragen Sie folgende URLs ein:
   * **Nutzungsbedingungen (Terms of Service URL)**: `https://pensionsmanager.de/agb` (oder `http://localhost:3000/agb`)
   * **Datenschutzerklärung (Privacy Policy URL)**: `https://pensionsmanager.de/datenschutz` (oder `http://localhost:3000/datenschutz`)
3. Klicken Sie auf **Speichern**. Stripe verlinkt die Checkbox-Texte auf der Checkout-Seite ab dann automatisch mit diesen URLs.

### 3. Projektstruktur
- [src/app/api/create-checkout-session/route.ts](src/app/api/create-checkout-session/route.ts): Route-Handler zur Erstellung der Checkout-Session mit `mode: "subscription"`.
- [src/app/api/subscriptions/cancel/route.ts](src/app/api/subscriptions/cancel/route.ts): Kündigungs- und Reaktivierungs-Endpunkt (inklusive Sandbox-Sofort-Reset).
- [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts): Webhook-Handler für alle empfohlenen & optionalen Stripe-Events.
- [src/app/success/page.tsx](src/app/success/page.tsx): Bestätigungsseite nach erfolgreichem Checkout.
- [src/app/account/tarif/page.tsx](src/app/account/tarif/page.tsx): Tarifübersicht mit Kündigungs- & Checkout-Aktionen.

### 4. Lokales Testen mit Stripe CLI
```bash
# 1. Stripe CLI Login
stripe login

# 2. Webhooks an lokalen Next.js Server weiterleiten
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Test-Ereignisse simulieren
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

### 4. Ressourcen
- [Stripe Dashboard Test-Keys](https://dashboard.stripe.com/test/apikeys)
- [Stripe Checkout Dokumentation](https://docs.stripe.com/checkout)
- [Stripe Webhooks Leitfaden](https://docs.stripe.com/webhooks)
