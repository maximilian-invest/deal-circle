// Zentrale Stripe-Init. Settings via Env:
//
//   DC_STRIPE_SECRET_KEY     sk_test_... oder sk_live_...
//   DC_STRIPE_WEBHOOK_SECRET whsec_...
//   DC_SITE_URL              https://deal-circle.at   (für success_url/cancel_url)
//
// Wenn DC_STRIPE_SECRET_KEY fehlt → checkout() und webhook() werfen 503.

import Stripe from "stripe";

const SECRET = process.env.DC_STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.DC_STRIPE_WEBHOOK_SECRET;
export const SITE_URL = (process.env.DC_SITE_URL || "https://deal-circle.at").replace(/\/+$/, "");

let warned = false;
let _stripe = null;

export function getStripe() {
  if (!SECRET) {
    if (!warned) {
      console.warn("[stripe] DC_STRIPE_SECRET_KEY nicht gesetzt — Zahlungen deaktiviert");
      warned = true;
    }
    return null;
  }
  if (!_stripe) {
    _stripe = new Stripe(SECRET, {
      apiVersion: "2024-10-28.acacia",
      typescript: false,
    });
  }
  return _stripe;
}

export function getWebhookSecret() {
  return WEBHOOK_SECRET || null;
}

export function isEnabled() {
  return !!SECRET;
}
