import type Stripe from "stripe";
import { type NextRequest } from "next/server";
import { demoProducts } from "@/data/products";
import {
  formatValidationError,
  isSameOriginRequest,
  jsonError,
  noStoreJson,
  readJsonBody,
} from "@/lib/server/http";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/server/rate-limit";
import { getStripeConfiguration } from "@/lib/server/stripe";
import { checkoutSchema } from "@/lib/server/validation";

function getSafeStripeImage(image: string) {
  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function getIdempotencyKey(request: NextRequest) {
  const supplied = request.headers.get("idempotency-key")?.trim();
  if (supplied && /^[A-Za-z0-9._:-]{8,255}$/.test(supplied)) return supplied;
  return `checkout-${globalThis.crypto.randomUUID()}`;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: "checkout",
    limit: 10,
    windowMs: 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonError(
      429,
      "RATE_LIMITED",
      "Trop de tentatives de paiement. Réessayez dans un instant.",
    );
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  }

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = checkoutSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Le panier envoyé est invalide.",
      formatValidationError(parsed.error),
    );
  }

  const uniqueProductIds = new Set(parsed.data.items.map((item) => item.productId));
  if (uniqueProductIds.size !== parsed.data.items.length) {
    return jsonError(
      422,
      "DUPLICATE_CART_LINE",
      "Un objet ne peut apparaître qu’une seule fois dans le panier.",
    );
  }

  const cartLines = parsed.data.items.map((item) => ({
    input: item,
    product: demoProducts.find((candidate) => candidate.id === item.productId),
  }));
  const unavailableLine = cartLines.find(
    ({ input, product }) =>
      !product ||
      product.status !== "AVAILABLE" ||
      !product.published ||
      input.quantity > product.quantity ||
      (product.isUnique && input.quantity !== 1),
  );

  if (unavailableLine) {
    return jsonError(
      409,
      "PRODUCT_UNAVAILABLE",
      "Un objet du panier n’est plus disponible dans la quantité demandée.",
      { productId: unavailableLine.input.productId },
    );
  }

  const products = cartLines.map(({ input, product }) => ({
    input,
    product: product!,
  }));
  const subtotalCents = products.reduce(
    (total, { input, product }) =>
      total + Math.round(product.price * 100) * input.quantity,
    0,
  );
  const shippingCents = Math.max(
    0,
    ...products.map(({ product }) => Math.round(product.shippingPrice * 100)),
  );
  const totalCents = subtotalCents + shippingCents;
  const requestId = globalThis.crypto.randomUUID();
  const stripeConfiguration = getStripeConfiguration();

  if (!stripeConfiguration) {
    const demoSessionId = `demo_${requestId}`;
    const checkoutUrl = new URL("/commande/confirmation", request.nextUrl.origin);
    checkoutUrl.searchParams.set("session_id", demoSessionId);
    checkoutUrl.searchParams.set("mode", "demo");

    const response = noStoreJson({
      mode: "demo",
      paymentCreated: false,
      sessionId: demoSessionId,
      url: checkoutUrl.href,
      checkoutUrl: checkoutUrl.href,
      amount: { subtotalCents, shippingCents, totalCents, currency: "eur" },
    });
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = products.map(
    ({ input, product }) => {
      const image = getSafeStripeImage(product.image);
      return {
        quantity: input.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            description: product.shortDescription.slice(0, 500),
            metadata: { productId: product.id, reference: product.reference },
            ...(image ? { images: [image] } : {}),
          },
        },
      };
    },
  );

  if (shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: shippingCents,
        product_data: { name: "Livraison suivie" },
      },
    });
  }

  try {
    const session = await stripeConfiguration.stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        success_url: `${stripeConfiguration.siteUrl}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${stripeConfiguration.siteUrl}/panier?paiement=annule`,
        billing_address_collection: "required",
        shipping_address_collection: {
          allowed_countries: ["FR", "BE", "DE", "ES", "IT", "LU", "NL", "PT"],
        },
        phone_number_collection: { enabled: true },
        allow_promotion_codes: true,
        locale: "fr",
        ...(parsed.data.customerEmail
          ? { customer_email: parsed.data.customerEmail }
          : {}),
        client_reference_id: requestId,
        metadata: {
          orderDraftId: requestId,
          productIds: products.map(({ product }) => product.id).join(",").slice(0, 500),
        },
      },
      { idempotencyKey: getIdempotencyKey(request) },
    );

    if (!session.url) {
      return jsonError(
        502,
        "CHECKOUT_URL_MISSING",
        "Stripe n’a pas fourni de lien de paiement.",
      );
    }

    const response = noStoreJson({
      mode: "stripe",
      paymentCreated: true,
      sessionId: session.id,
      url: session.url,
      checkoutUrl: session.url,
      amount: { subtotalCents, shippingCents, totalCents, currency: "eur" },
    });
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  } catch (error) {
    console.error("Stripe Checkout creation failed", {
      requestId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      502,
      "CHECKOUT_PROVIDER_ERROR",
      "Le service de paiement est momentanément indisponible.",
    );
  }
}
