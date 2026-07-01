#!/usr/bin/env node
// Generate Catalog/_catalog/images.csv — the exact image filename manifest.
//
// WHY: the site is built in CI from a sparse checkout that contains ONLY the
// CSVs (not the 2 GB of images), so the build cannot list image files. A few
// web-ready folders also interleave .png with .jpg at arbitrary indices, so
// filenames can't be reconstructed from num_photos. This script runs where the
// images DO exist (locally), lists them, and commits the result so the
// image-less build can emit correct URLs.
//
// Re-run whenever photos are added/removed:  npm run manifest   (from site/)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");            // repo root
const CATDIR = resolve(ROOT, "Catalog/_catalog");
const IMG_RE = /\.(jpe?g|png|webp)$/i;

// --- tiny CSV parser (quoted fields), mirrors scripts/sync-shopify.mjs ---
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
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
  const head = rows.shift();
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
function readParts(prefix) {
  let rows = [];
  for (const f of readdirSync(CATDIR).filter(n => n.startsWith(prefix) && n.endsWith(".csv")).sort())
    rows = rows.concat(parseCSV(readFileSync(resolve(CATDIR, f), "utf8")));
  return rows;
}
const cell = v => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const watches = readParts("catalog_").filter(w => w.status === "web_ready");
let out = "sku,files\n";
let total = 0, missing = 0;
for (const w of watches) {
  let files = [];
  try {
    files = readdirSync(resolve(ROOT, "Catalog", w.folder)).filter(f => IMG_RE.test(f)).sort();
  } catch { missing++; }
  total += files.length;
  out += `${cell(w.sku)},${cell(files.join(";"))}\n`;
}
writeFileSync(resolve(CATDIR, "images.csv"), out);
console.log(`images.csv: ${watches.length} web-ready watches, ${total} image files` +
  (missing ? `, ${missing} folders missing on disk` : ""));
