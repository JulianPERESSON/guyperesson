import { describe, expect, it } from "vitest";

import {
  placeOrder,
  StockConflictError,
  type InventoryItem,
} from "@/lib/domain/order";

const inventory = [
  {
    productId: "vase-unique",
    name: "Vase de Vallauris",
    reference: "CER-001",
    unitPriceCents: 14_500,
    quantity: 1,
    status: "AVAILABLE",
    isUnique: true,
  },
  {
    productId: "revue",
    name: "Revue automobile",
    reference: "REV-001",
    unitPriceCents: 1_200,
    quantity: 3,
    status: "AVAILABLE",
    isUnique: false,
  },
] satisfies readonly InventoryItem[];

describe("commande et stock", () => {
  it("crée les instantanés de commande et décrémente le stock de façon immuable", () => {
    const placement = placeOrder({
      inventory,
      lines: [
        { productId: "vase-unique", quantity: 1 },
        { productId: "revue", quantity: 2 },
      ],
      orderNumber: "CMD-2026-0001",
      idempotencyKey: "checkout-session-1",
      shippingCents: 1_500,
      discountCents: 500,
    });

    expect(placement.order).toMatchObject({
      subtotalCents: 16_900,
      shippingCents: 1_500,
      discountCents: 500,
      totalCents: 17_900,
    });
    expect(placement.order.lines[0]).toMatchObject({
      productName: "Vase de Vallauris",
      productReference: "CER-001",
      lineTotalCents: 14_500,
    });
    expect(placement.inventory).toEqual([
      { ...inventory[0], quantity: 0, status: "SOLD" },
      { ...inventory[1], quantity: 1 },
    ]);
    expect(inventory[0].quantity).toBe(1);
  });

  it("empêche un second achat du même objet unique", () => {
    const first = placeOrder({
      inventory,
      lines: [{ productId: "vase-unique", quantity: 1 }],
      orderNumber: "CMD-2026-0002",
      idempotencyKey: "checkout-session-2",
    });

    expect(() =>
      placeOrder({
        inventory: first.inventory,
        lines: [{ productId: "vase-unique", quantity: 1 }],
        orderNumber: "CMD-2026-0003",
        idempotencyKey: "checkout-session-3",
      }),
    ).toThrowError(expect.objectContaining({ code: "PRODUCT_UNAVAILABLE", productId: "vase-unique" }));
  });

  it("consolide les doublons avant le contrôle de stock", () => {
    expect(() =>
      placeOrder({
        inventory,
        lines: [
          { productId: "vase-unique", quantity: 1 },
          { productId: "vase-unique", quantity: 1 },
        ],
        orderNumber: "CMD-2026-0004",
        idempotencyKey: "checkout-session-4",
      }),
    ).toThrowError(StockConflictError);
  });

  it("refuse un inventaire incohérent avant de créer la commande", () => {
    expect(() =>
      placeOrder({
        inventory: [{ ...inventory[0], quantity: 2 }],
        lines: [{ productId: "vase-unique", quantity: 1 }],
        orderNumber: "CMD-2026-0005",
        idempotencyKey: "checkout-session-5",
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ORDER" }));
  });
});
