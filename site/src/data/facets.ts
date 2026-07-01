import type { Watch, FacetGroup } from "./types";

const low = (s: string) => (s ?? "").trim().toLowerCase();
export const titleCase = (s: string) =>
  (s ?? "").replace(/\w[^\s/-]*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

// ---- Dial colour (normalize the raw dial_color column to a clean display set) ----
const DIAL_MAP: Record<string, string> = {
  grey: "Gray", gray: "Gray", "steel grey": "Gray", "rhodium grey": "Gray", slate: "Gray", anthracite: "Gray",
  "ice blue": "Ice Blue", "light blue": "Light Blue", "baby blue": "Light Blue",
  turquoise: "Turquoise", teal: "Turquoise",
  "mother of pearl": "Mother of Pearl", mop: "Mother of Pearl", "white mother of pearl": "Mother of Pearl",
  meteorite: "Meteorite", champagne: "Champagne", silver: "Silver", white: "White", black: "Black",
  blue: "Blue", green: "Green", brown: "Brown", chocolate: "Brown", purple: "Purple", pink: "Pink",
  rose: "Pink", salmon: "Salmon", red: "Red", burgundy: "Burgundy", yellow: "Yellow", orange: "Orange",
  gold: "Gold", bronze: "Bronze", cream: "Cream", rhodium: "Gray",
};
const NOT_A_COLOR = new Set(["", "?", "n/a", "skeleton", "openworked", "open worked", "transparent", "none", "two-tone", "multi", "multicolor", "mixed", "assorted", "various"]);
export function normDialColor(raw: string): string | null {
  const l = low(raw);
  if (NOT_A_COLOR.has(l)) return null;
  if (DIAL_MAP[l]) return DIAL_MAP[l];
  for (const k of Object.keys(DIAL_MAP)) if (l.includes(k)) return DIAL_MAP[k];
  return titleCase(raw) || null;
}

// ---- Case material(s) (a watch may be two-tone => multiple) ----
// Handles spaced ("yellow gold"), concatenated ("yellowgold") and hyphenated
// ("steel-whitegold") variants by matching against a compacted string.
export function normMaterials(raw: string): string[] {
  const l = low(raw);
  if (!l || l === "?") return [];
  const c = l.replace(/[\s\-_]/g, ""); // compact
  const out: string[] = [];
  if (c.includes("steel")) out.push("Stainless Steel");
  if (c.includes("rosegold") || c.includes("everose")) out.push("Rose Gold");
  if (c.includes("yellowgold")) out.push("Yellow Gold");
  if (c.includes("whitegold")) out.push("White Gold");
  if (c.includes("platinum")) out.push("Platinum");
  if (c.includes("titanium")) out.push("Titanium");
  if (c.includes("ceramic")) out.push("Ceramic");
  if (c.includes("carbon")) out.push("Carbon");
  if (c.includes("sapphire")) out.push("Sapphire");
  if (l === "gold") out.push("Gold");
  const hasGold = c.includes("gold");
  if ((c.includes("steel") && hasGold) || c.includes("twotone") || c.includes("rolesor")) out.push("Two-Tone");
  const uniq = [...new Set(out)];
  return uniq.length ? uniq : raw.trim() ? [titleCase(raw)] : [];
}

// ---- Strap vs bracelet (top-level type from the bracelet_strap column) ----
export function normStrapType(raw: string): string | null {
  const l = low(raw);
  if (!l || l === "?") return null;
  if (/oysterflex|strap|leather|rubber|fabric|canvas|nato|textile|velcro|denim/.test(l)) return "Strap";
  if (/bracelet|oyster|jubilee|president|pearlmaster|integrated|link|beads|milanese/.test(l)) return "Bracelet";
  return null;
}

// ---- Size bucket ----
export function sizeBucket(mm: string): string | null {
  const n = parseFloat(String(mm).replace(/[^0-9.]/g, ""));
  if (!n || n <= 0) return null;
  if (n < 33) return "Ladies (<33mm)";
  if (n < 37) return "Mid (33-36mm)";
  if (n <= 40) return "Standard (37-40mm)";
  if (n <= 43) return "Large (41-43mm)";
  return "Oversized (44mm+)";
}

// ---- Complications / styles (intersect the watch's normalized tags) ----
const COMPLICATIONS = ["Chronograph", "GMT/World Time", "Date", "Day-Date", "Moonphase", "Tourbillon", "Skeleton", "Diver/Sport", "Diamond-Set"];
export function extractComplications(tags: string[]): string[] {
  const set = new Set(tags);
  return COMPLICATIONS.filter((c) => set.has(c));
}

// ---- Facet groups shown as filters (order matters) ----
export const FACET_ORDER: { key: string; label: string; get: (w: Watch) => string[] }[] = [
  { key: "brand", label: "Brand", get: (w) => (w.brand ? [w.brand] : []) },
  { key: "model", label: "Collection", get: (w) => (w.model ? [w.model] : []) },
  { key: "gender", label: "Gender", get: (w) => (w.gender ? [w.gender] : []) },
  { key: "dialColor", label: "Dial Colour", get: (w) => (w.dialColor ? [w.dialColor] : []) },
  { key: "material", label: "Case Material", get: (w) => w.materials },
  { key: "sizeBucket", label: "Size", get: (w) => (w.sizeBucket ? [w.sizeBucket] : []) },
  { key: "complication", label: "Complication", get: (w) => w.complications },
  { key: "strapType", label: "Strap", get: (w) => (w.strapType ? [w.strapType] : []) },
];

const SIZE_RANK = ["Ladies (<33mm)", "Mid (33-36mm)", "Standard (37-40mm)", "Large (41-43mm)", "Oversized (44mm+)"];

/** Aggregate distinct facet values + counts across the given watches. */
export function buildFacetIndex(watches: Watch[]): FacetGroup[] {
  return FACET_ORDER.map(({ key, label, get }) => {
    const counts = new Map<string, number>();
    for (const w of watches) for (const v of get(w)) counts.set(v, (counts.get(v) ?? 0) + 1);
    let values = [...counts.entries()].map(([value, count]) => ({ value, count }));
    if (key === "sizeBucket") values.sort((a, b) => SIZE_RANK.indexOf(a.value) - SIZE_RANK.indexOf(b.value));
    else values.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    return { key, label, values };
  }).filter((g) => g.values.length > 1 || g.key === "brand");
}

/** The per-watch facet map shipped to the client for filtering. */
export function watchFacetValues(w: Watch): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const { key, get } of FACET_ORDER) out[key] = get(w);
  return out;
}
