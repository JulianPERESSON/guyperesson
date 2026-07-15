import { describe, expect, it } from "vitest";

import {
  validateProductForm,
  validateReservationForm,
} from "@/lib/domain/validation";

describe("validation des formulaires", () => {
  it("nettoie une demande de réservation valide", () => {
    const result = validateReservationForm({
      firstName: "  Jeanne ",
      lastName: " Martin ",
      email: " JEANNE@EXEMPLE.FR ",
      phone: "+33 6 12 34 56 78",
      message: " Je souhaite réserver cet objet. ",
      productId: " prod-001 ",
      productReference: " CER-001 ",
    });

    expect(result).toEqual({
      success: true,
      data: {
        firstName: "Jeanne",
        lastName: "Martin",
        email: "jeanne@exemple.fr",
        phone: "+33 6 12 34 56 78",
        message: "Je souhaite réserver cet objet.",
        productId: "prod-001",
        productReference: "CER-001",
      },
    });
  });

  it("retourne des erreurs structurées sans accepter les champs blancs", () => {
    const result = validateReservationForm({
      firstName: " ",
      lastName: "Martin",
      email: "adresse-invalide",
      message: " ",
      productId: "prod-001",
      productReference: "CER-001",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty("firstName");
      expect(result.errors).toHaveProperty("email");
      expect(result.errors).toHaveProperty("message");
    }
  });

  it("valide la création d'un produit et les contraintes d'objet unique", () => {
    const base = {
      name: "Vase de Vallauris",
      slug: "vase-de-vallauris",
      reference: "CER-001",
      categoryId: "cat-ceramique",
      description: "Une pièce documentée.",
      price: 145,
      quantity: 1,
      status: "AVAILABLE",
      isUnique: true,
    } as const;

    expect(validateProductForm(base).success).toBe(true);
    const invalid = validateProductForm({
      ...base,
      slug: "Vase avec espaces",
      price: -1,
      quantity: 2,
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.errors).toHaveProperty("slug");
      expect(invalid.errors).toHaveProperty("price");
      expect(invalid.errors).toHaveProperty("quantity");
    }
  });
});
