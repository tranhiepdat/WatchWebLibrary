#!/usr/bin/env node
// Sync the watch library (Catalog/catalog.csv + images) to Shopify.
// Idempotent upsert keyed by SKU/handle: re-running only updates, never duplicates.
// Images are served straight from this GitHub repo via the jsDelivr CDN (no upload).
//
// Required env (set as GitHub Secrets, see WEB-SYNC.md):
//   SHOPIFY_STORE        e.g. my-watch-shop.myshopify.com
//   SHOPIFY_ADMIN_TOKEN  Admin API access token (custom app, scope: write_products)
// Optional env (auto-set inside GitHub Actions):
//   GITHUB_REPOSITORY    owner/repo   GIT_REF  branch (default main)
//   ONLY_SKUS            comma list to sync just some watches (for testing)
//   PUBLISH              "true" -> status ACTIVE, else DRAFT (safe default)

import { readFileSync, readdirSync } from "node:fs";

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const REPO  = process.env.GITHUB_REPOSITORY || "tranhiepdat/watchweblibrary";
const REF   = process.env.GIT_REF || "main";
const API   = "2025-01";
const STATUS = process.env.PUBLISH === "true" ? "ACTIVE" : "DRAFT";
const only = (process.env.ONLY_SKUS || "").split(",").map(s => s.trim()).filter(Boolean);

if (!STORE || !TOKEN) { console.error("Missing SHOPIFY_STORE / SHOPIFY_ADMIN_TOKEN"); process.exit(1); }

// ---- tiny CSV parser (handles quoted fields) ----
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

const enc = p => p.split("/").map(encodeURIComponent).join("/");
const jsdelivr = relPath => `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${enc(relPath)}`;

// catalog + tags are split into Catalog/_catalog/{catalog,tags}_NN.csv parts
const CATDIR = "Catalog/_catalog";
function readParts(prefix) {
  let rows = [];
  try {
    for (const f of readdirSync(CATDIR).filter(n => n.startsWith(prefix) && n.endsWith(".csv")).sort())
      rows = rows.concat(parseCSV(readFileSync(`${CATDIR}/${f}`, "utf8")));
  } catch { /* optional */ }
  return rows;
}
const tagsByFolder = {};
for (const t of readParts("tags_")) tagsByFolder[t.folder] = t.all_tags;

// ---- build image URLs for a watch from its folder ----
function imageUrls(folder) {
  let files = [];
  try { files = readdirSync(`Catalog/${folder}`); } catch { return []; }
  return files
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .map(f => jsdelivr(`Catalog/${folder}/${f}`));
}

// ---- Shopify Admin GraphQL with throttle-retry ----
async function gql(query, variables) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${STORE}/admin/api/${API}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    const throttled = json.errors?.some(e => e.extensions?.code === "THROTTLED");
    if (res.status === 429 || throttled) { await sleep(2000 * (attempt + 1)); continue; }
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findProductIdByHandle(handle) {
  const d = await gql(`query($q:String!){ products(first:1, query:$q){ nodes{ id } } }`,
    { q: `handle:${handle}` });
  return d.products.nodes[0]?.id || null;
}

const PRODUCT_SET = `
mutation productSet($input: ProductSetInput!) {
  productSet(synchronous: true, input: $input) {
    product { id handle }
    userErrors { field message }
  }
}`;

async function upsert(w) {
  const handle = w.sku.toLowerCase();
  const images = imageUrls(w.folder);
  const tags = (tagsByFolder[w.folder] || `${w.brand};${w.model}`).split(";").map(t => t.trim()).filter(Boolean);
  const desc = [w.brand, w.model, w.dial_color && `${w.dial_color} dial`,
    w.case_material, w.bracelet_strap, w.gender].filter(Boolean).join(" · ");

  const input = {
    handle,
    title: w.watch_name,
    descriptionHtml: desc,
    vendor: w.brand,
    productType: w.model || "Watch",
    tags,
    status: STATUS,
    files: images.map(originalSource => ({ originalSource, contentType: "IMAGE" })),
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [{
      optionValues: [{ optionName: "Title", name: "Default Title" }],
      sku: w.sku,
      // price: "0.00",   // <-- set your price column / logic here
    }],
  };
  const existing = await findProductIdByHandle(handle);
  if (existing) input.id = existing;

  const d = await gql(PRODUCT_SET, { input });
  const errs = d.productSet.userErrors;
  if (errs.length) throw new Error(errs.map(e => `${e.field}: ${e.message}`).join("; "));
  return { handle, action: existing ? "updated" : "created", images: images.length };
}

// ---- main ----
// Only sync web-ready watches; watches with status=need_photos (<=2 photos, in
// NeedMorePhotos/) are held back so incomplete listings never reach the store.
const all = readParts("catalog_").filter(w => w.status === "web_ready");
const watches = only.length ? all.filter(w => only.includes(w.sku)) : all;
console.log(`Syncing ${watches.length} web-ready watches to ${STORE} (status=${STATUS}); need_photos held back.`);

let ok = 0, fail = 0;
for (const w of watches) {
  try {
    const r = await upsert(w);
    ok++; console.log(`  ✓ ${w.sku} ${r.action} (${r.images} imgs) — ${w.watch_name}`);
  } catch (e) {
    fail++; console.error(`  ✗ ${w.sku} FAILED: ${e.message}`);
  }
  await sleep(300); // gentle on the API
}
console.log(`Done. ${ok} ok, ${fail} failed.`);
process.exit(fail ? 1 : 0);
