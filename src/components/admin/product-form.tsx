"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { validateProductForm } from "@/lib/domain/validation";
import type {
  MainCategorySlug,
  ProductCondition,
  ProductStatus,
} from "@/types/catalog";

type CreatedProduct = {
  readonly name: string;
  readonly slug: string;
  readonly reference: string;
};

type ApiErrorBody = {
  readonly error?: {
    readonly message?: string;
    readonly details?: unknown;
  };
};

const categoryOptions: ReadonlyArray<{
  value: MainCategorySlug;
  label: string;
}> = [
  { value: "ceramique", label: "Céramique" },
  { value: "revues-auto-moto", label: "Revues auto et moto" },
  { value: "cartes-postales", label: "Cartes postales" },
];

const statusOptions: ReadonlyArray<{
  value: ProductStatus;
  label: string;
}> = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "RESERVED", label: "Réservé" },
  { value: "SOLD", label: "Vendu" },
  { value: "UNAVAILABLE", label: "Indisponible" },
  { value: "COMING_SOON", label: "Bientôt disponible" },
];

const conditionOptions: ReadonlyArray<{
  value: ProductCondition;
  label: string;
}> = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "VERY_GOOD", label: "Très bon" },
  { value: "GOOD", label: "Bon" },
  { value: "FAIR", label: "Correct" },
  { value: "POOR", label: "État d’usage" },
];

export function ProductForm() {
  const router = useRouter();
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const quantity = numberValue(formData, "quantity") ?? 0;
    const price = numberValue(formData, "price") ?? Number.NaN;
    const categorySlug = textValue(formData, "categorySlug") as MainCategorySlug;
    const status = textValue(formData, "status") as ProductStatus;
    const description = textValue(formData, "description");
    const name = textValue(formData, "name");
    const slug = textValue(formData, "slug") || slugify(name);

    const localValidation = validateProductForm({
      name,
      slug,
      reference: textValue(formData, "reference"),
      categoryId: categorySlug,
      description,
      price,
      quantity,
      status,
      isUnique: quantity <= 1,
    });

    if (!localValidation.success) {
      setError(
        Object.values(localValidation.errors)
          .flat()
          .join(" "),
      );
      return;
    }

    const previousPrice = numberValue(formData, "previousPrice");
    const estimatedYear = integerValue(formData, "estimatedYear");
    const subcategory = textValue(formData, "subcategory");

    if (previousPrice !== undefined && previousPrice <= price) {
      setError("L’ancien prix doit être supérieur au prix actuel.");
      return;
    }
    if (status === "AVAILABLE" && quantity < 1) {
      setError("Un objet disponible doit avoir au moins un exemplaire.");
      return;
    }
    if (status === "SOLD" && quantity !== 0) {
      setError("Un objet vendu doit avoir une quantité égale à zéro.");
      return;
    }

    const payload = {
      name: localValidation.data.name,
      reference: localValidation.data.reference,
      slug: localValidation.data.slug,
      categorySlug,
      subcategory,
      subcategorySlug: slugify(subcategory),
      shortDescription: textValue(formData, "shortDescription"),
      description: localValidation.data.description,
      defects: textValue(formData, "defects"),
      price: localValidation.data.price,
      ...(previousPrice === undefined ? {} : { previousPrice }),
      quantity: localValidation.data.quantity,
      status,
      condition: textValue(formData, "condition") as ProductCondition,
      rarity: "COMMON" as const,
      ...(estimatedYear === undefined ? {} : { estimatedYear }),
      period: textValue(formData, "period") || "Date inconnue",
      country: textValue(formData, "country") || "France",
      region: textValue(formData, "region"),
      city: textValue(formData, "city"),
      dimensions:
        textValue(formData, "dimensions") || "Dimensions non renseignées",
      color: textValue(formData, "color") || "Non renseignée",
      published: true,
      newArrival: true,
      reservable: status === "AVAILABLE",
      isUnique: quantity <= 1,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = body as ApiErrorBody | null;
        throw new Error(apiErrorMessage(apiError));
      }

      if (!isCreatedProductResponse(body)) {
        throw new Error("La réponse du serveur est incomplète.");
      }

      setCreatedProduct(body.product);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Une erreur inattendue est survenue.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (createdProduct) {
    return (
      <div className="surface p-10 text-center" role="status">
        <CheckCircle2 className="mx-auto text-emerald-700" size={40} />
        <h2 className="mt-5 text-3xl">Annonce publiée</h2>
        <p className="mt-3 text-sm text-stone-600">
          {createdProduct.name} est enregistrée dans le catalogue local de cette
          démonstration.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            className="btn-primary"
            href={`/produits/${createdProduct.slug}`}
          >
            Voir l’annonce
          </Link>
          <Link className="btn-secondary" href="/catalogue?sort=new">
            Ouvrir le catalogue
          </Link>
          <Link className="btn-ghost" href="/admin/produits">
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={submitProduct}>
      {error && (
        <div
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      <FormBlock title="Identification">
        <Field id="name" label="Nom de l’objet" required maxLength={180} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="reference"
            label="Référence interne"
            required
            maxLength={100}
            pattern="[A-Za-z0-9][A-Za-z0-9._/-]*"
          />
          <Field
            id="slug"
            label="Adresse de l’annonce (facultatif)"
            maxLength={160}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            hint="Laissez vide pour la générer automatiquement."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="categorySlug"
            label="Catégorie"
            options={categoryOptions}
          />
          <Field
            id="subcategory"
            label="Sous-catégorie"
            required
            maxLength={120}
          />
        </div>
      </FormBlock>

      <FormBlock title="Description">
        <Field
          id="shortDescription"
          label="Titre court"
          required
          minLength={10}
          maxLength={280}
        />
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold"
            htmlFor="description"
          >
            Description complète
          </label>
          <textarea
            className="field min-h-40"
            id="description"
            name="description"
            required
            minLength={20}
            maxLength={10_000}
          />
        </div>
        <Field
          id="defects"
          label="Défauts visibles"
          required
          maxLength={2_000}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="dimensions" label="Dimensions" maxLength={160} />
          <Field id="color" label="Couleur" maxLength={120} />
        </div>
      </FormBlock>

      <FormBlock title="Prix, stock et statut">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="price"
            label="Prix (€)"
            type="number"
            required
            min="0.01"
            step="0.01"
          />
          <Field
            id="previousPrice"
            label="Ancien prix (€)"
            type="number"
            min="0"
            step="0.01"
          />
          <Field
            id="quantity"
            label="Quantité"
            type="number"
            required
            min="0"
            step="1"
            defaultValue="1"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="status" label="Statut" options={statusOptions} />
          <Select
            id="condition"
            label="État"
            options={conditionOptions}
          />
        </div>
      </FormBlock>

      <FormBlock title="Datation et origine">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="estimatedYear"
            label="Année estimée"
            type="number"
            min="1000"
            max={String(new Date().getFullYear() + 1)}
            step="1"
          />
          <Field id="period" label="Période" maxLength={100} />
          <Field
            id="country"
            label="Pays"
            defaultValue="France"
            maxLength={100}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="region" label="Région" maxLength={120} />
          <Field id="city" label="Ville" maxLength={120} />
        </div>
      </FormBlock>

      <FormBlock title="Photographies">
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
          <p className="font-semibold text-stone-700">
            Illustration de démonstration automatique
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-5">
            L’annonce utilise pour le moment le visuel générique de sa catégorie.
            Le téléversement de fichiers nécessitera le raccordement du stockage
            d’images en production.
          </p>
        </div>
      </FormBlock>

      <div className="flex justify-end gap-3">
        <Link className="btn-secondary" href="/admin/produits">
          Annuler
        </Link>
        <button className="btn-primary" disabled={submitting}>
          {submitting ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Save size={17} />
          )}
          {submitting ? "Enregistrement…" : "Enregistrer le produit"}
        </button>
      </div>
    </form>
  );
}

function FormBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="surface grid gap-4 p-6">
      <legend className="px-2 font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
  maxLength?: number;
  minLength?: number;
  min?: string;
  max?: string;
  step?: string;
  pattern?: string;
};

function Field({
  id,
  label,
  type = "text",
  required = false,
  hint,
  ...inputProps
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        className="field"
        id={id}
        name={id}
        type={type}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {hint && (
        <p className="mt-1 text-[11px] text-stone-500" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Select<T extends string>({
  id,
  label,
  options,
}: {
  id: string;
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <select className="field" id={id} name={id}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function textValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(formData: FormData, name: string): number | undefined {
  const value = textValue(formData, name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function integerValue(formData: FormData, name: string): number | undefined {
  const parsed = numberValue(formData, name);
  return parsed !== undefined && Number.isSafeInteger(parsed) ? parsed : undefined;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isCreatedProductResponse(
  value: unknown,
): value is { readonly product: CreatedProduct } {
  if (!value || typeof value !== "object" || !("product" in value)) {
    return false;
  }
  const product = value.product;
  return (
    product !== null &&
    typeof product === "object" &&
    "name" in product &&
    typeof product.name === "string" &&
    "slug" in product &&
    typeof product.slug === "string" &&
    "reference" in product &&
    typeof product.reference === "string"
  );
}

function apiErrorMessage(body: ApiErrorBody | null): string {
  const fallback = "L’annonce n’a pas pu être enregistrée. Réessayez.";
  const message = body?.error?.message ?? fallback;
  const details = body?.error?.details;

  if (!Array.isArray(details)) return message;

  const issueMessages = details.flatMap((detail) => {
    if (
      detail &&
      typeof detail === "object" &&
      "message" in detail &&
      typeof detail.message === "string"
    ) {
      return [detail.message];
    }
    return [];
  });

  return issueMessages.length > 0
    ? `${message} ${issueMessages.join(" ")}`
    : message;
}
