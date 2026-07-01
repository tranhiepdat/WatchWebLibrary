import { readOne } from "./csv";

// Load pricing.csv once. Keys can be an exact SKU, "Brand/Model", or "Brand".
// Comment lines (key starts with #) and blank prices are ignored.
const table = new Map<string, string>();
for (const r of readOne("pricing.csv")) {
  const key = (r.key ?? "").trim();
  const val = (r.price_range ?? "").trim();
  if (!key || key.startsWith("#") || !val) continue;
  table.set(key, val);
}

/**
 * Resolve a price range for a watch, most-specific-wins:
 *   1) exact SKU   2) Brand/Model   3) Brand   4) null => "Contact"
 */
export function priceFor(w: { sku: string; brand: string; model: string }): string | null {
  return (
    table.get(w.sku) ??
    table.get(`${w.brand}/${w.model}`) ??
    table.get(w.brand) ??
    null
  );
}
