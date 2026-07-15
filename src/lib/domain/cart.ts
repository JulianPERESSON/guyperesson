export interface CartProduct {
  readonly id: string;
  readonly unitPriceCents: number;
  readonly shippingPriceCents: number;
  readonly availableQuantity: number;
  readonly isUnique: boolean;
}

export interface CartLine {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  /** Frais appliqués une fois à la ligne, quel que soit le nombre d'unités. */
  readonly shippingPriceCents: number;
  readonly availableQuantity: number;
  readonly isUnique: boolean;
}

export interface CartTotals {
  readonly itemCount: number;
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
}

export class CartError extends Error {
  override readonly name = "CartError";

  constructor(
    message: string,
    readonly code: "INVALID_QUANTITY" | "OUT_OF_STOCK" | "INVALID_AMOUNT",
  ) {
    super(message);
  }
}

function assertMoney(amount: number, field: string): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new CartError(`${field} doit être un entier positif exprimé en centimes.`, "INVALID_AMOUNT");
  }
}

function allowedQuantity(product: CartProduct): number {
  return product.isUnique ? Math.min(product.availableQuantity, 1) : product.availableQuantity;
}

function assertQuantity(quantity: number, maximum: number): void {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new CartError("La quantité doit être un entier strictement positif.", "INVALID_QUANTITY");
  }
  if (quantity > maximum) {
    throw new CartError("La quantité demandée dépasse le stock disponible.", "OUT_OF_STOCK");
  }
}

export function addCartItem(
  lines: readonly CartLine[],
  product: CartProduct,
  quantity = 1,
): CartLine[] {
  assertMoney(product.unitPriceCents, "Le prix unitaire");
  assertMoney(product.shippingPriceCents, "Les frais de livraison");
  assertQuantity(quantity, allowedQuantity(product));
  const existing = lines.find((line) => line.productId === product.id);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  assertQuantity(nextQuantity, allowedQuantity(product));

  const nextLine: CartLine = {
    productId: product.id,
    quantity: nextQuantity,
    unitPriceCents: product.unitPriceCents,
    shippingPriceCents: product.shippingPriceCents,
    availableQuantity: product.availableQuantity,
    isUnique: product.isUnique,
  };

  return existing
    ? lines.map((line) => (line.productId === product.id ? nextLine : line))
    : [...lines, nextLine];
}

export function updateCartItemQuantity(
  lines: readonly CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  if (quantity === 0) return removeCartItem(lines, productId);
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return [...lines];
  const maximum = existing.isUnique
    ? Math.min(existing.availableQuantity, 1)
    : existing.availableQuantity;
  assertQuantity(quantity, maximum);
  return lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
}

export function removeCartItem(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}

export function calculateCartTotals(
  lines: readonly CartLine[],
  discountCents = 0,
): CartTotals {
  assertMoney(discountCents, "La remise");

  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotalCents = lines.reduce((total, line) => {
    assertMoney(line.unitPriceCents, "Le prix unitaire");
    assertQuantity(
      line.quantity,
      line.isUnique ? Math.min(line.availableQuantity, 1) : line.availableQuantity,
    );
    return total + line.unitPriceCents * line.quantity;
  }, 0);
  const shippingCents = lines.reduce((total, line) => {
    assertMoney(line.shippingPriceCents, "Les frais de livraison");
    return total + line.shippingPriceCents;
  }, 0);
  const appliedDiscount = Math.min(discountCents, subtotalCents + shippingCents);

  return {
    itemCount,
    subtotalCents,
    shippingCents,
    discountCents: appliedDiscount,
    totalCents: subtotalCents + shippingCents - appliedDiscount,
  };
}
