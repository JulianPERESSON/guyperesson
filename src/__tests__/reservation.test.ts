import { describe, expect, it } from "vitest";

import {
  requestReservation,
  ReservationTransitionError,
  transitionReservation,
  type ReservableProduct,
} from "@/lib/domain/reservation";

const product: ReservableProduct = {
  productId: "rare-001",
  status: "AVAILABLE",
  quantity: 1,
  reservable: true,
};
const requestedAt = new Date("2026-07-15T10:00:00.000Z");

describe("cycle de réservation", () => {
  it("passe d'en attente à acceptée, puis expirée en libérant le produit", () => {
    const pending = requestReservation({ reservationId: "res-001", product, now: requestedAt });
    const accepted = transitionReservation(pending, "ACCEPT", {
      now: requestedAt,
      holdDurationMs: 60 * 60 * 1_000,
    });

    expect(accepted.reservation.status).toBe("ACCEPTED");
    expect(accepted.reservation.expiresAt?.toISOString()).toBe("2026-07-15T11:00:00.000Z");
    expect(accepted.product.status).toBe("RESERVED");

    const expired = transitionReservation(accepted, "EXPIRE", {
      now: new Date("2026-07-15T11:00:00.000Z"),
    });
    expect(expired.reservation.status).toBe("EXPIRED");
    expect(expired.product.status).toBe("AVAILABLE");
  });

  it("refuse une expiration anticipée et les transitions depuis un état terminal", () => {
    const pending = requestReservation({ reservationId: "res-002", product, now: requestedAt });
    const accepted = transitionReservation(pending, "ACCEPT", {
      now: requestedAt,
      holdDurationMs: 60 * 60 * 1_000,
    });

    expect(() =>
      transitionReservation(accepted, "EXPIRE", {
        now: new Date("2026-07-15T10:59:59.000Z"),
      }),
    ).toThrowError(expect.objectContaining({ code: "NOT_EXPIRED" }));

    const rejected = transitionReservation(pending, "REJECT", { now: requestedAt });
    expect(() => transitionReservation(rejected, "ACCEPT", { now: requestedAt })).toThrowError(
      ReservationTransitionError,
    );
  });

  it("interdit la réservation d'un produit déjà vendu", () => {
    expect(() =>
      requestReservation({
        reservationId: "res-003",
        product: { ...product, status: "SOLD", quantity: 0 },
        now: requestedAt,
      }),
    ).toThrowError(expect.objectContaining({ code: "NOT_RESERVABLE" }));
  });
});
