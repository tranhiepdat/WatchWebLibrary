import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Directory holding the split catalog metadata, relative to this file.
const HERE = dirname(fileURLToPath(import.meta.url));
export const CATALOG_DIR = resolve(HERE, "../../../Catalog/_catalog");

/** Minimal CSV parser with quoted-field support (mirrors scripts/sync-shopify.mjs). */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const head = rows.shift() ?? [];
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

/** Read + concatenate the numbered CSV parts sharing a prefix (e.g. "catalog_"). */
export function readParts(prefix: string): Record<string, string>[] {
  let rows: Record<string, string>[] = [];
  try {
    const files = readdirSync(CATALOG_DIR)
      .filter((n) => n.startsWith(prefix) && n.endsWith(".csv"))
      .sort();
    for (const f of files) rows = rows.concat(parseCSV(readFileSync(resolve(CATALOG_DIR, f), "utf8")));
  } catch {
    /* optional */
  }
  return rows;
}

/** Read a single optional CSV file from the catalog dir. */
export function readOne(name: string): Record<string, string>[] {
  try {
    return parseCSV(readFileSync(resolve(CATALOG_DIR, name), "utf8"));
  } catch {
    return [];
  }
}
