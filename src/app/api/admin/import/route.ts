import { z } from "zod";
import { type NextRequest } from "next/server";
import { authorizeAdmin } from "@/lib/server/admin";
import { parseCsv } from "@/lib/server/csv";
import {
  isSameOriginRequest,
  jsonError,
  noStoreJson,
} from "@/lib/server/http";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_PRODUCTS = 500;

const moneyFromCsv = z.preprocess(
  (value) =>
    typeof value === "string"
      ? Number(value.trim().replace(",", "."))
      : value,
  z.number().finite().nonnegative().max(1_000_000),
);
const integerFromCsv = z.preprocess(
  (value) => (typeof value === "string" ? Number(value.trim()) : value),
  z.number().int().nonnegative().max(1_000_000),
);

const importRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  reference: z.string().trim().min(1).max(100),
  categorySlug: z.enum(["ceramique", "revues-auto-moto", "cartes-postales"]),
  price: moneyFromCsv,
  quantity: integerFromCsv,
  status: z
    .enum(["AVAILABLE", "RESERVED", "SOLD", "UNAVAILABLE", "COMING_SOON"])
    .default("AVAILABLE"),
  condition: z
    .enum(["MINT", "EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "POOR"])
    .optional(),
  period: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
});

function normalizeHeader(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

const HEADER_ALIASES: Readonly<Record<string, string>> = {
  name: "name",
  nom: "name",
  reference: "reference",
  categoryslug: "categorySlug",
  categorie: "categorySlug",
  price: "price",
  prix: "price",
  quantity: "quantity",
  quantite: "quantity",
  stock: "quantity",
  status: "status",
  statut: "status",
  condition: "condition",
  etat: "condition",
  period: "period",
  periode: "period",
  country: "country",
  pays: "country",
};

async function readCsv(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_BYTES) {
    return { error: jsonError(413, "PAYLOAD_TOO_LARGE", "Le fichier CSV dépasse 2 Mo.") };
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return { error: jsonError(422, "FILE_REQUIRED", "Ajoutez un fichier CSV.") };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { error: jsonError(413, "PAYLOAD_TOO_LARGE", "Le fichier CSV dépasse 2 Mo.") };
    }
    return { text: await file.text() };
  }

  if (
    !contentType.includes("text/csv") &&
    !contentType.includes("application/csv") &&
    !contentType.includes("application/vnd.ms-excel")
  ) {
    return {
      error: jsonError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Envoyez un fichier CSV ou un corps text/csv.",
      ),
    };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES) {
    return { error: jsonError(413, "PAYLOAD_TOO_LARGE", "Le fichier CSV dépasse 2 Mo.") };
  }
  return { text };
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) return authorization.response;

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  }

  const body = await readCsv(request);
  if ("error" in body) return body.error;

  let rows: string[][];
  try {
    rows = parseCsv(body.text, MAX_PRODUCTS + 1);
  } catch (error) {
    return jsonError(
      422,
      "INVALID_CSV",
      error instanceof Error ? error.message : "Le fichier CSV est invalide.",
    );
  }

  if (rows.length < 2) {
    return jsonError(422, "EMPTY_CSV", "Le fichier ne contient aucun produit.");
  }

  const [rawHeaders, ...dataRows] = rows;
  const headers = rawHeaders.map(
    (header) => HEADER_ALIASES[normalizeHeader(header)] ?? null,
  );
  const requiredHeaders = ["name", "reference", "categorySlug", "price", "quantity"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return jsonError(
      422,
      "MISSING_COLUMNS",
      "Des colonnes obligatoires sont absentes.",
      { missing: missingHeaders },
    );
  }

  const accepted: Array<z.infer<typeof importRowSchema>> = [];
  const rejected: Array<{ row: number; issues: string[] }> = [];
  const references = new Set<string>();

  dataRows.forEach((values, index) => {
    const record: Record<string, string> = {};
    headers.forEach((header, columnIndex) => {
      if (header) record[header] = values[columnIndex] ?? "";
    });

    const parsed = importRowSchema.safeParse(record);
    const normalizedReference = record.reference?.trim().toLowerCase();
    if (parsed.success && normalizedReference && !references.has(normalizedReference)) {
      accepted.push(parsed.data);
      references.add(normalizedReference);
      return;
    }

    rejected.push({
      row: index + 2,
      issues: parsed.success
        ? ["Référence dupliquée dans le fichier."]
        : parsed.error.issues.map((issue) =>
            `${issue.path.join(".") || "ligne"}: ${issue.message}`,
          ),
    });
  });

  // This endpoint deliberately validates and previews while no transactional
  // product repository is configured. A production importer should upsert the
  // accepted rows in one database transaction after an explicit confirmation.
  return noStoreJson({
    mode: "preview",
    persisted: false,
    summary: {
      totalRows: dataRows.length,
      acceptedRows: accepted.length,
      rejectedRows: rejected.length,
    },
    preview: accepted.slice(0, 20),
    errors: rejected.slice(0, 100),
  });
}
