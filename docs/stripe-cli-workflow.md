# Stripe CLI Workflow

This project can use Stripe CLI to simplify webhook testing in local development.

## Key point

Stripe CLI does **not** replace server-side Stripe secrets for checkout creation.

- `STRIPE_SECRET_KEY` is still required by `netlify/functions/create-checkout.js`.
- Stripe CLI mainly helps with webhook forwarding and event replay.

## One-time setup

1. Install Stripe CLI: https://docs.stripe.com/stripe-cli
2. Login:
   - `stripe login`

## Local webhook testing

1. Start local app + functions:
   - `npm run dev:netlify`
2. In a second terminal, start Stripe forwarding:
   - `npm run stripe:listen`
3. Stripe CLI will print a webhook secret (`whsec_...`).
4. Set local env var:
   - `STRIPE_WEBHOOK_SECRET=<that whsec value>`
5. Run checkout flow from your app.

## Trigger test event manually

- `npm run stripe:trigger:checkout`

This sends a synthetic `checkout.session.completed` event through your local webhook path.

## Production recommendation

For production, keep using:

- `STRIPE_SECRET_KEY` in Netlify environment variables
- Dashboard-configured webhook endpoint:
  - `/api/stripe-webhook`
- `STRIPE_WEBHOOK_SECRET` from the production endpoint in Stripe Dashboard

Use Stripe CLI for local debugging and replay, not as a production webhook transport.
