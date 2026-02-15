param(
  [string]$ForwardTo = "http://localhost:8888/.netlify/functions/stripe-webhook"
)

Write-Host "Starting Stripe CLI webhook forwarding..."
Write-Host "Forward target: $ForwardTo"
Write-Host ""
Write-Host "Important:"
Write-Host "1) Keep this terminal running."
Write-Host "2) Copy the webhook secret shown by Stripe (whsec_...)."
Write-Host "3) Use that value as STRIPE_WEBHOOK_SECRET for local testing."
Write-Host ""

stripe listen --events checkout.session.completed --forward-to $ForwardTo
