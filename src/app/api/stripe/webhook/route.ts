import type Stripe from "stripe";
import { type NextRequest } from "next/server";
import { jsonError, noStoreJson } from "@/lib/server/http";
import { getStripeConfiguration } from "@/lib/server/stripe";

const MAX_WEBHOOK_BYTES = 1024 * 1024;
const EVENT_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

type CachedEvent = { state: "PROCESSING" | "PROCESSED"; expiresAt: number };
type GlobalWithStripeEventCache = typeof globalThis & {
  __linventaireStripeEventCache?: Map<string, CachedEvent>;
};

const globalEventCache = globalThis as GlobalWithStripeEventCache;
const eventCache =
  globalEventCache.__linventaireStripeEventCache ??
  (globalEventCache.__linventaireStripeEventCache = new Map());

function claimEvent(eventId: string) {
  const now = Date.now();

  if (eventCache.size >= 1_000) {
    for (const [cachedEventId, cachedEvent] of eventCache) {
      if (cachedEvent.expiresAt <= now) eventCache.delete(cachedEventId);
    }

    while (eventCache.size > 5_000) {
      const oldestEventId = eventCache.keys().next().value;
      if (typeof oldestEventId !== "string") break;
      eventCache.delete(oldestEventId);
    }
  }

  const existing = eventCache.get(eventId);
  if (existing && existing.expiresAt > now) return false;

  eventCache.set(eventId, {
    state: "PROCESSING",
    expiresAt: now + EVENT_CACHE_TTL_MS,
  });
  return true;
}

function markEventProcessed(eventId: string) {
  eventCache.set(eventId, {
    state: "PROCESSED",
    expiresAt: Date.now() + EVENT_CACHE_TTL_MS,
  });
}

async function handleVerifiedEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Production persistence belongs in one transaction: claim event.id in a
      // table with a UNIQUE key, lock every product, create/update the order,
      // decrement stock, then mark the event processed. The metadata draft id is
      // the stable link to the pending order created before redirecting to Stripe.
      console.info("Verified Stripe checkout event", {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        orderDraftId: session.metadata?.orderDraftId ?? null,
      });
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      console.info("Verified Stripe checkout did not complete", {
        eventId: event.id,
        eventType: event.type,
      });
      break;
    default:
      // Acknowledging unhandled, verified event types prevents needless retries.
      break;
  }
}

export async function POST(request: NextRequest) {
  const stripeConfiguration = getStripeConfiguration();
  if (!stripeConfiguration) {
    return jsonError(
      503,
      "STRIPE_NOT_CONFIGURED",
      "Le webhook Stripe n’est pas configuré.",
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonError(400, "MISSING_SIGNATURE", "Signature Stripe manquante.");
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Événement Stripe trop volumineux.");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Événement Stripe trop volumineux.");
  }

  let event: Stripe.Event;
  try {
    event = stripeConfiguration.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeConfiguration.webhookSecret,
    );
  } catch {
    return jsonError(400, "INVALID_SIGNATURE", "Signature Stripe invalide.");
  }

  if (!claimEvent(event.id)) {
    return noStoreJson({ received: true, duplicate: true });
  }

  try {
    await handleVerifiedEvent(event);
    markEventProcessed(event.id);
    return noStoreJson({ received: true, duplicate: false });
  } catch (error) {
    eventCache.delete(event.id);
    console.error("Stripe webhook handling failed", {
      eventId: event.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      500,
      "WEBHOOK_PROCESSING_FAILED",
      "L’événement Stripe n’a pas pu être traité.",
    );
  }
}
