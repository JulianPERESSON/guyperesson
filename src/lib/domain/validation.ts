export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: FieldErrors };

export interface ReservationFormInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly message: string;
  readonly productId: string;
  readonly productReference: string;
}

export interface ValidReservationForm {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly message: string;
  readonly productId: string;
  readonly productReference: string;
}

export interface ProductFormInput {
  readonly name: string;
  readonly slug: string;
  readonly reference: string;
  readonly categoryId: string;
  readonly description: string;
  readonly price: number;
  readonly quantity: number;
  readonly status: string;
  readonly isUnique: boolean;
}

export interface ValidProductForm extends ProductFormInput {
  readonly name: string;
  readonly slug: string;
  readonly reference: string;
  readonly categoryId: string;
  readonly description: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d .()-]{6,24}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const productStatuses = new Set(["AVAILABLE", "RESERVED", "SOLD", "UNAVAILABLE", "COMING_SOON"]);

function addError(errors: Record<string, string[]>, field: string, message: string): void {
  (errors[field] ??= []).push(message);
}

function requiredText(
  value: string,
  field: string,
  label: string,
  errors: Record<string, string[]>,
  maximumLength: number,
): string {
  const trimmed = value.trim();
  if (!trimmed) addError(errors, field, `${label} est requis.`);
  if (trimmed.length > maximumLength) {
    addError(errors, field, `${label} ne doit pas dépasser ${maximumLength} caractères.`);
  }
  return trimmed;
}

export function validateReservationForm(input: ReservationFormInput): ValidationResult<ValidReservationForm> {
  const errors: Record<string, string[]> = {};
  const firstName = requiredText(input.firstName, "firstName", "Le prénom", errors, 80);
  const lastName = requiredText(input.lastName, "lastName", "Le nom", errors, 80);
  const email = requiredText(input.email, "email", "L'adresse e-mail", errors, 254).toLocaleLowerCase("fr-FR");
  const message = requiredText(input.message, "message", "Le message", errors, 2_000);
  const productId = requiredText(input.productId, "productId", "L'objet", errors, 100);
  const productReference = requiredText(
    input.productReference,
    "productReference",
    "La référence",
    errors,
    100,
  );
  const phone = input.phone?.trim() || undefined;

  if (email && !emailPattern.test(email)) {
    addError(errors, "email", "L'adresse e-mail n'est pas valide.");
  }
  if (phone && !phonePattern.test(phone)) {
    addError(errors, "phone", "Le numéro de téléphone n'est pas valide.");
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: { firstName, lastName, email, phone, message, productId, productReference },
  };
}

export function validateProductForm(input: ProductFormInput): ValidationResult<ValidProductForm> {
  const errors: Record<string, string[]> = {};
  const name = requiredText(input.name, "name", "Le nom", errors, 180);
  const slug = requiredText(input.slug, "slug", "Le slug", errors, 180);
  const reference = requiredText(input.reference, "reference", "La référence", errors, 100);
  const categoryId = requiredText(input.categoryId, "categoryId", "La catégorie", errors, 100);
  const description = requiredText(input.description, "description", "La description", errors, 10_000);

  if (slug && !slugPattern.test(slug)) {
    addError(errors, "slug", "Le slug doit contenir uniquement des minuscules, chiffres et tirets.");
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    addError(errors, "price", "Le prix doit être un nombre positif.");
  }
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 0) {
    addError(errors, "quantity", "La quantité doit être un entier positif.");
  }
  if (input.isUnique && input.quantity > 1) {
    addError(errors, "quantity", "Un objet unique ne peut avoir qu'un exemplaire.");
  }
  if (!productStatuses.has(input.status)) {
    addError(errors, "status", "Le statut du produit n'est pas reconnu.");
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: { ...input, name, slug, reference, categoryId, description },
  };
}
