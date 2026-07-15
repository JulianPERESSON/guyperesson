export type InventoryStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "UNAVAILABLE" | "COMING_SOON";

export interface InventoryItem {
  readonly productId: string;
  readonly name: string;
  readonly reference: string;
  readonly unitPriceCents: number;
  readonly quantity: number;
  readonly status: InventoryStatus;
  readonly isUnique: boolean;
}

export interface RequestedOrderLine {
  readonly productId: string;
  readonly quantity: number;
}

export interface OrderLineSnapshot {
  readonly productId: string;
  readonly productName: string;
  readonly productReference: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly lineTotalCents: number;
}

export interface PreparedOrder {
  readonly orderNumber: string;
  readonly idempotencyKey: string;
  readonly lines: readonly OrderLineSnapshot[];
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
}

export interface OrderPlacement {
  readonly order: PreparedOrder;
  readonly inventory: readonly InventoryItem[];
}

export class StockConflictError extends Error {
  override readonly name = "StockConflictError";

  constructor(
    message: string,
    readonly code:
      | "INVALID_ORDER"
      | "PRODUCT_NOT_FOUND"
      | "PRODUCT_UNAVAILABLE"
      | "OUT_OF_STOCK",
    readonly productId?: string,
  ) {
    super(message);
  }
}

function assertNonNegativeCents(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new StockConflictError(`${field} doit être un entier positif exprimé en centimes.`, "INVALID_ORDER");
  }
}

function consolidateLines(lines: readonly RequestedOrderLine[]): Map<string, number> {
  if (lines.length === 0) {
    throw new StockConflictError("Une commande doit contenir au moins un objet.", "INVALID_ORDER");
  }

  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (!line.productId || !Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new StockConflictError("Chaque ligne doit contenir un produit et une quantité valide.", "INVALID_ORDER");
    }
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  return quantities;
}

/**
 * Prépare la commande et le nouvel état de stock sans mutation.
 * En production, l'appel doit être enveloppé par une transaction SQL et des
 * mises à jour conditionnelles afin de rendre la réservation réellement atomique.
 */
export function placeOrder(input: {
  readonly inventory: readonly InventoryItem[];
  readonly lines: readonly RequestedOrderLine[];
  readonly orderNumber: string;
  readonly idempotencyKey: string;
  readonly shippingCents?: number;
  readonly discountCents?: number;
}): OrderPlacement {
  if (!input.orderNumber.trim() || !input.idempotencyKey.trim()) {
    throw new StockConflictError("Le numéro de commande et la clé d'idempotence sont requis.", "INVALID_ORDER");
  }

  const shippingCents = input.shippingCents ?? 0;
  const requestedDiscount = input.discountCents ?? 0;
  assertNonNegativeCents(shippingCents, "Les frais de livraison");
  assertNonNegativeCents(requestedDiscount, "La remise");
  const quantities = consolidateLines(input.lines);
  const inventoryById = new Map(input.inventory.map((item) => [item.productId, item] as const));
  if (inventoryById.size !== input.inventory.length) {
    throw new StockConflictError("Le stock contient des identifiants de produit en double.", "INVALID_ORDER");
  }
  const orderLines: OrderLineSnapshot[] = [];

  for (const [productId, quantity] of quantities) {
    const item = inventoryById.get(productId);
    if (!item) {
      throw new StockConflictError("Le produit demandé n'existe plus.", "PRODUCT_NOT_FOUND", productId);
    }
    assertNonNegativeCents(item.unitPriceCents, "Le prix unitaire");
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 0 || (item.isUnique && item.quantity > 1)) {
      throw new StockConflictError("Le stock enregistré pour ce produit est incohérent.", "INVALID_ORDER", productId);
    }
    if (item.status !== "AVAILABLE") {
      throw new StockConflictError("Le produit n'est plus disponible.", "PRODUCT_UNAVAILABLE", productId);
    }
    if (item.isUnique && quantity !== 1) {
      throw new StockConflictError("Un objet unique ne peut être commandé qu'en un exemplaire.", "OUT_OF_STOCK", productId);
    }
    if (quantity > item.quantity) {
      throw new StockConflictError("Le stock a changé avant la validation de la commande.", "OUT_OF_STOCK", productId);
    }

    orderLines.push({
      productId,
      productName: item.name,
      productReference: item.reference,
      quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.unitPriceCents * quantity,
    });
  }

  const nextInventory = input.inventory.map((item) => {
    const requested = quantities.get(item.productId);
    if (requested === undefined) return item;
    const quantity = item.quantity - requested;
    return {
      ...item,
      quantity,
      status: quantity === 0 ? "SOLD" : item.status,
    } satisfies InventoryItem;
  });
  const subtotalCents = orderLines.reduce((total, line) => total + line.lineTotalCents, 0);
  const discountCents = Math.min(requestedDiscount, subtotalCents + shippingCents);

  return {
    order: {
      orderNumber: input.orderNumber,
      idempotencyKey: input.idempotencyKey,
      lines: orderLines,
      subtotalCents,
      shippingCents,
      discountCents,
      totalCents: subtotalCents + shippingCents - discountCents,
    },
    inventory: nextInventory,
  };
}
