const CSV_DELIMITER = ";";

function neutralizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: unknown) {
  const text = neutralizeSpreadsheetFormula(String(value ?? ""));
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCell).join(CSV_DELIMITER))
    .join("\r\n");
}

function detectDelimiter(text: string) {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;

  for (const character of text) {
    if (character === '"') quoted = !quoted;
    if (!quoted && (character === "\n" || character === "\r")) break;
    if (!quoted && character === ",") commas += 1;
    if (!quoted && character === ";") semicolons += 1;
  }

  return semicolons >= commas ? ";" : ",";
}

export function parseCsv(text: string, maxRows = 501) {
  const source = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  function finishRow() {
    row.push(cell);
    cell = "";
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    row = [];

    if (rows.length > maxRows) {
      throw new Error(`Le fichier dépasse la limite de ${maxRows - 1} produits.`);
    }
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      finishRow();
    } else if (character === "\r") {
      if (source[index + 1] === "\n") index += 1;
      finishRow();
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("Une cellule CSV entre guillemets n’est pas terminée.");
  if (cell !== "" || row.length > 0) finishRow();

  return rows;
}
