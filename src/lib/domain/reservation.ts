import type { InventoryStatus } from "@/lib/domain/order";

export type ReservationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";
export type ReservationCommand = "ACCEPT" | "REJECT" | "CANCEL" | "EXPIRE";

export interface ReservableProduct {
  readonly productId: string;
  readonly status: InventoryStatus;
  readonly quantity: number;
  readonly reservable: boolean;
}

export interface Reservation {
  readonly id: string;
  readonly productId: string;
  readonly status: ReservationStatus;
  readonly requestedAt: Date;
  readonly expiresAt: Date | null;
}

export interface ReservationAggregate {
  readonly reservation: Reservation;
  readonly product: ReservableProduct;
}

export class ReservationTransitionError extends Error {
  override readonly name = "ReservationTransitionError";

  constructor(
    message: string,
    readonly code: "NOT_RESERVABLE" | "INVALID_TRANSITION" | "NOT_EXPIRED",
  ) {
    super(message);
  }
}

export function requestReservation(input: {
  readonly reservationId: string;
  readonly product: ReservableProduct;
  readonly now: Date;
}): ReservationAggregate {
  if (
    !input.product.reservable ||
    input.product.status !== "AVAILABLE" ||
    input.product.quantity <= 0
  ) {
    throw new ReservationTransitionError("Cet objet ne peut pas être réservé.", "NOT_RESERVABLE");
  }

  return {
    reservation: {
      id: input.reservationId,
      productId: input.product.productId,
      status: "PENDING",
      requestedAt: new Date(input.now),
      expiresAt: null,
    },
    product: { ...input.product },
  };
}

function reopenReservedProduct(product: ReservableProduct): ReservableProduct {
  return product.status === "RESERVED" ? { ...product, status: "AVAILABLE" } : product;
}

export function transitionReservation(
  aggregate: ReservationAggregate,
  command: ReservationCommand,
  options: { readonly now: Date; readonly holdDurationMs?: number },
): ReservationAggregate {
  const { reservation, product } = aggregate;

  if (command === "ACCEPT") {
    if (reservation.status !== "PENDING" || product.status !== "AVAILABLE" || product.quantity <= 0) {
      throw new ReservationTransitionError("La demande ne peut plus être acceptée.", "INVALID_TRANSITION");
    }
    const holdDurationMs = options.holdDurationMs ?? 48 * 60 * 60 * 1_000;
    if (!Number.isSafeInteger(holdDurationMs) || holdDurationMs <= 0) {
      throw new ReservationTransitionError("La durée de réservation est invalide.", "INVALID_TRANSITION");
    }
    return {
      reservation: {
        ...reservation,
        status: "ACCEPTED",
        expiresAt: new Date(options.now.getTime() + holdDurationMs),
      },
      product: { ...product, status: "RESERVED" },
    };
  }

  if (command === "REJECT") {
    if (reservation.status !== "PENDING") {
      throw new ReservationTransitionError("Seule une demande en attente peut être refusée.", "INVALID_TRANSITION");
    }
    return {
      reservation: { ...reservation, status: "REJECTED", expiresAt: null },
      product,
    };
  }

  if (command === "CANCEL") {
    if (reservation.status !== "PENDING" && reservation.status !== "ACCEPTED") {
      throw new ReservationTransitionError("Cette réservation est déjà terminée.", "INVALID_TRANSITION");
    }
    return {
      reservation: { ...reservation, status: "CANCELLED", expiresAt: null },
      product: reservation.status === "ACCEPTED" ? reopenReservedProduct(product) : product,
    };
  }

  if (reservation.status !== "ACCEPTED" || !reservation.expiresAt) {
    throw new ReservationTransitionError("Seule une réservation acceptée peut expirer.", "INVALID_TRANSITION");
  }
  if (options.now.getTime() < reservation.expiresAt.getTime()) {
    throw new ReservationTransitionError("La réservation n'est pas encore arrivée à échéance.", "NOT_EXPIRED");
  }
  return {
    reservation: { ...reservation, status: "EXPIRED" },
    product: reopenReservedProduct(product),
  };
}
