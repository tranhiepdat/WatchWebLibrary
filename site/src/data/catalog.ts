import type { Watch } from "./types";
import { readParts, readOne } from "./csv";
import { priceFor } from "./pricing";
import { normDialColor, normMaterials, sizeBucket, extractComplications, normStrapType } from "./facets";

function buildWatches(): Watch[] {
  // tags joined by folder (same key convention as scripts/sync-shopify.mjs)
  const tagsByFolder = new Map<string, string>();
  for (const t of readParts("tags_")) tagsByFolder.set(t.folder, t.all_tags ?? "");

  // exact image filenames per sku (manifest built from disk)
  const filesBySku = new Map<string, string[]>();
  for (const r of readOne("images.csv"))
    filesBySku.set(r.sku, (r.files ?? "").split(";").map((s) => s.trim()).filter(Boolean));

  const watches: Watch[] = [];
  for (const r of readParts("catalog_")) {
    if (r.status !== "web_ready") continue; // v1 publishes only web-ready
    const tags = (tagsByFolder.get(r.folder) ?? "").split(";").map((s) => s.trim()).filter(Boolean);
    const photos = filesBySku.get(r.sku) ?? [];
    if (!photos.length) continue; // no images manifested -> skip (defensive)

    watches.push({
      sku: r.sku,
      brand: r.brand.trim(),
      model: (r.model || "Other").trim(),
      name: r.watch_name.trim(),
      folder: r.folder,
      gender: (r.gender || "").trim(),
      dialColor: normDialColor(r.dial_color),
      materials: normMaterials(r.case_material),
      sizeMm: (r.est_size_mm || "").trim(),
      sizeBucket: sizeBucket(r.est_size_mm),
      strapType: normStrapType(r.bracelet_strap),
      bezel: (r.bezel || "").trim(),
      strapMaterial: (r.strap_material || "").trim(),
      complications: extractComplications(tags),
      tags,
      photos,
      numPhotos: photos.length,
      price: priceFor({ sku: r.sku, brand: r.brand.trim(), model: (r.model || "Other").trim() }),
    });
  }
  // stable, human sort: brand, then collection, then name
  watches.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model) || a.name.localeCompare(b.name));
  return watches;
}

export const watches: Watch[] = buildWatches();
export const bySku = new Map(watches.map((w) => [w.sku, w]));

/** Brands sorted by inventory size (biggest first). */
export function brandsByCount(): { brand: string; count: number; cover: Watch }[] {
  const m = new Map<string, Watch[]>();
  for (const w of watches) (m.get(w.brand) ?? m.set(w.brand, []).get(w.brand)!).push(w);
  return [...m.entries()]
    .map(([brand, list]) => ({ brand, count: list.length, cover: list[0] }))
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
}

/** Watches for one brand. */
export function watchesForBrand(brand: string): Watch[] {
  return watches.filter((w) => w.brand === brand);
}

/** Collections (model) within a brand, sorted by size. */
export function collectionsForBrand(brand: string): { model: string; count: number; cover: Watch }[] {
  const m = new Map<string, Watch[]>();
  for (const w of watchesForBrand(brand)) (m.get(w.model) ?? m.set(w.model, []).get(w.model)!).push(w);
  return [...m.entries()]
    .map(([model, list]) => ({ model, count: list.length, cover: list[0] }))
    .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));
}

/** Watches for one brand+collection. */
export function watchesForCollection(brand: string, model: string): Watch[] {
  return watches.filter((w) => w.brand === brand && w.model === model);
}

/** Distinct brand list. */
export const brands = brandsByCount().map((b) => b.brand);
