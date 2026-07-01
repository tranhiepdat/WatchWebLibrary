// Image URL builders.
//
// Two layers:
//  1) jsDelivr serves the repo's images for free. We pin to the build's commit
//     SHA (not @main) so replacing an image never serves stale bytes.
//  2) wsrv.nl (images.weserv.nl) resizes/re-encodes to WebP on the fly, so the
//     build never touches the 2 GB of full-res originals.
//
// A watch `folder` has NO leading "Catalog/" (that's how the CSV stores it),
// so the repo-relative path is `Catalog/<folder>/<filename>`.

const REPO = process.env.GITHUB_REPOSITORY || process.env.CATALOG_REPO || "tranhiepdat/WatchWebLibrary";
const REF = process.env.GIT_SHA || process.env.GIT_REF || "main";
const WSRV = "https://wsrv.nl/";

/** Encode each path segment (spaces -> %20) while keeping the slashes. */
function encPath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}

/** Public jsDelivr URL for a repo-relative path (SHA-pinned in CI). */
export function jsdelivr(repoRelPath: string): string {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${encPath(repoRelPath)}`;
}

/** Repo-relative path to a watch photo. */
export function photoPath(folder: string, filename: string): string {
  return `Catalog/${folder}/${filename}`;
}

type Fit = "cover" | "inside" | "contain";

/** A resized WebP URL (via wsrv.nl) for a repo-relative image path. */
export function resized(repoRelPath: string, width: number, fit: Fit = "cover"): string {
  const params = new URLSearchParams({
    url: jsdelivr(repoRelPath),
    w: String(width),
    output: "webp",
    q: "80",
    fit,
  });
  return `${WSRV}?${params.toString()}`;
}

/** Build a srcset string for a set of widths. */
export function srcset(repoRelPath: string, widths: number[], fit: Fit = "cover"): string {
  return widths.map((w) => `${resized(repoRelPath, w, fit)} ${w}w`).join(", ");
}

// Standard responsive width sets.
export const CARD_WIDTHS = [400, 600, 800];
export const DETAIL_WIDTHS = [800, 1200, 1600];
