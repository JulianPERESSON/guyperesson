import { type NextRequest } from "next/server";
import { authorizeAdmin } from "@/lib/server/admin";
import {
  formatValidationError,
  isSameOriginRequest,
  jsonError,
  noStoreJson,
  readJsonBody,
} from "@/lib/server/http";
import {
  createProduct,
  listAdminProducts,
  ProductConflictError,
  ProductRepositoryUnavailableError,
  ProductStoreBusyError,
  ProductStoreCorruptedError,
} from "@/lib/server/product-repository";
import { productCreateSchema } from "@/lib/server/product-validation";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) return authorization.response;

  try {
    const products = await listAdminProducts();
    return noStoreJson({
      products,
      count: products.length,
      meta: { storage: "fixtures+local-demo" },
    });
  } catch (error) {
    console.error("Admin product listing failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      500,
      "PRODUCT_STORE_ERROR",
      "Le catalogue local ne peut pas être lu pour le moment.",
    );
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) return authorization.response;

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  }

  const rateLimit = checkRateLimit(request, {
    keyPrefix: `admin:products:create:${authorization.session.userId}`,
    limit: 30,
    windowMs: 60 * 60 * 1_000,
  });
  if (!rateLimit.allowed) {
    const response = jsonError(
      429,
      "RATE_LIMITED",
      "Trop de créations successives. Réessayez dans quelques minutes.",
    );
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  }

  const body = await readJsonBody(request, 128 * 1024);
  if (!body.ok) return body.response;

  const parsed = productCreateSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "La fiche produit contient des informations invalides.",
      formatValidationError(parsed.error),
    );
  }

  try {
    const product = await createProduct(parsed.data);
    const response = noStoreJson(
      {
        product,
        meta: { persisted: true, storage: "local-demo" },
      },
      {
        status: 201,
        headers: { Location: `/api/products/${encodeURIComponent(product.slug)}` },
      },
    );
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  } catch (error) {
    if (error instanceof ProductConflictError) {
      return jsonError(
        409,
        "PRODUCT_CONFLICT",
        "Un produit possède déjà ce slug ou cette référence.",
        { fields: error.fields },
      );
    }
    if (error instanceof ProductRepositoryUnavailableError) {
      return jsonError(503, "PRODUCT_STORE_DISABLED", error.message);
    }
    if (error instanceof ProductStoreBusyError) {
      const response = jsonError(503, "PRODUCT_STORE_BUSY", error.message);
      response.headers.set("Retry-After", "1");
      return response;
    }
    if (error instanceof ProductStoreCorruptedError) {
      console.error("Local product store is corrupted");
      return jsonError(
        500,
        "PRODUCT_STORE_CORRUPTED",
        "Le catalogue local est illisible. Aucune donnée n’a été écrasée.",
      );
    }

    console.error("Admin product creation failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      500,
      "PRODUCT_CREATE_FAILED",
      "Le produit n’a pas pu être enregistré.",
    );
  }
}
