import { describe, expect, it } from "vitest";

import {
  addCartItem,
  calculateCartTotals,
  CartError,
  removeCartItem,
  updateCartItemQuantity,
  type CartProduct,
} from "@/lib/domain/cart";

const uniqueVase: CartProduct = {
  id: "vase-unique",
  unitPriceCents: 14_500,
  shippingPriceCents: 1_200,
  availableQuantity: 1,
  isUnique: true,
};

const postcards: CartProduct = {
  id: "lot-cartes",
  unitPriceCents: 800,
  shippingPriceCents: 400,
  availableQuantity: 5,
  isUnique: false,
};

describe("panier", () => {
  it("ajoute, met à jour et retire des lignes sans muter le panier initial", () => {
    const empty = [] as const;
    const withVase = addCartItem(empty, uniqueVase);
    const withBoth = addCartItem(withVase, postcards, 2);
    const updated = updateCartItemQuantity(withBoth, "lot-cartes", 3);
    const removed = removeCartItem(updated, "vase-unique");

    expect(empty).toHaveLength(0);
    expect(updated.find(({ productId }) => productId === "lot-cartes")?.quantity).toBe(3);
    expect(removed.map(({ productId }) => productId)).toEqual(["lot-cartes"]);
  });

  it("calcule sous-total, livraison, remise et total en centimes", () => {
    const lines = addCartItem(addCartItem([], uniqueVase), postcards, 2);

    expect(calculateCartTotals(lines, 1_000)).toEqual({
      itemCount: 3,
      subtotalCents: 16_100,
      shippingCents: 1_600,
      discountCents: 1_000,
      totalCents: 16_700,
    });
  });

  it("plafonne la remise et n'autorise jamais deux exemplaires d'un objet unique", () => {
    const line = addCartItem([], uniqueVase);
    expect(calculateCartTotals(line, 99_999).totalCents).toBe(0);
    expect(() => addCartItem(line, uniqueVase)).toThrowError(CartError);
    expect(() => addCartItem(line, uniqueVase, -1)).toThrowError(
      expect.objectContaining({ code: "INVALID_QUANTITY" }),
    );
    expect(() => updateCartItemQuantity(line, uniqueVase.id, 2)).toThrowError(
      expect.objectContaining({ code: "OUT_OF_STOCK" }),
    );
  });
});
