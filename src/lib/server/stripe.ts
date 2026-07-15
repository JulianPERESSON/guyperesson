import Stripe from "stripe";

export type StripeConfiguration = {
  stripe: Stripe;
  siteUrl: string;
  webhookSecret: string;
};

let stripeClient: Stripe | null = null;

function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getStripeConfiguration(): StripeConfiguration | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const siteUrl = getSiteUrl();

  // Checkout is only considered complete when its webhook can also be verified.
  if (
    !secretKey?.startsWith("sk_") ||
    secretKey.length < 24 ||
    !webhookSecret?.startsWith("whsec_") ||
    webhookSecret.length < 24 ||
    !siteUrl
  ) {
    return null;
  }

  stripeClient ??= new Stripe(secretKey, {
    appInfo: { name: "L'Inventaire", version: "0.1.0" },
  });

  return { stripe: stripeClient, siteUrl, webhookSecret };
}

export function isStripeCheckoutConfigured() {
  return getStripeConfiguration() !== null;
}
