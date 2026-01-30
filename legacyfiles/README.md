# Pawollie Sense Legacy Site

This folder contains the static site. It is meant to be served as a standalone site.

Quick start (Windows):
1) Open PowerShell.
2) Run:
   cd D:\OliSense\OliSense-main\legacyfiles
   python -m http.server 4173
3) Open:
   http://localhost:4173/index.html

Notes:
- The intake and memorial forms are Netlify-compatible and will work when deployed to Netlify.
- PayPal requires a client id in `cart.html` and Netlify environment variables:
  `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_BASE_URL`.
- Netlify publish directory should be `legacyfiles` (see `netlify.toml`).
