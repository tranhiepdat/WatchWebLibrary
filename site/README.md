# Catalog site (`site/`)

A private, **browse-only** catalog website generated from this repo's watch data.
No cart, no checkout — buyers browse; you handle sales manually. Runs **in parallel**
with the existing Shopify sync (which is untouched).

- **Framework:** Astro + Tailwind (static HTML, near-zero JS).
- **Data:** the CSVs in `Catalog/_catalog/` (only `status = web_ready` watches are shown).
- **Images:** served free from this repo via **jsDelivr**, resized for mobile on the fly
  by **wsrv.nl** — the build never touches the multi-GB image tree.
- **Hosting:** Cloudflare Pages, gated by **Cloudflare Access** (private link).

---

## Run it locally

```bash
cd site
npm install
npm run dev      # http://localhost:4321
```

Images load from the public CDN, so you see the real photos with no local image files.
`npm run build` outputs the static site to `site/dist/`; `npm run preview` serves it.

---

## Everyday editing (the workflow)

Everything is edited in the GitHub web UI on the `main` branch. Each push
auto-builds and redeploys in ~1–2 minutes (GitHub Actions → Cloudflare Pages).

| To… | Edit | Notes |
|-----|------|-------|
| Fix a name / specs / tags | `Catalog/_catalog/catalog_0N.csv` or `tags_0N.csv` | Set `status = web_ready` once a watch has ≥3 photos to make it appear. |
| Set / change a price | `Catalog/_catalog/pricing.csv` | Add `SKU,"$X - $Y"` or `Brand/Model,"…"` or `Brand,"From $…"`. Blank ⇒ shows **Contact**. |
| Add photos to a watch | upload `<Watch name> - NN.jpg` into `Catalog/<Brand>/<Model>/<Watch name>/`, bump `num_photos`, then regenerate the image manifest (below) | |

### Pricing (`Catalog/_catalog/pricing.csv`)
Matching is **most-specific-wins**: exact `SKU` → `Brand/Model` → `Brand` → else **Contact**.
Start broad (`Rolex,"From $8,000"`) and refine per collection or SKU over time.
Everything is "Contact" until you fill this in.

### Image manifest (`Catalog/_catalog/images.csv`)
The deploy build runs from a lightweight checkout that has the CSVs but **not** the
images, so it can't list photo files itself. This manifest lists the exact filenames
(handling folders that mix `.jpg` and `.png`). Regenerate it whenever you add/remove photos:

```bash
cd site
npm run manifest     # rewrites Catalog/_catalog/images.csv from the photos on disk
```

Commit the updated `images.csv` together with the new photos.

---

## One-time setup (Cloudflare) — checklist

Do this once. Steps in **your** Cloudflare dashboard are marked 👤.

1. **👤 Cloudflare account + API token.** Create a token with permission
   **Account → Cloudflare Pages → Edit**. Note your **Account ID** (Workers & Pages overview).
2. **GitHub secrets** (repo → Settings → Secrets and variables → Actions → *New repository secret*):
   - `CLOUDFLARE_API_TOKEN` = the token above
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID
   - *(optional variable)* `SITE_URL` = your custom domain, e.g. `https://catalog.example.com`
3. **First deploy.** Run the **Deploy catalog site** workflow (Actions tab → Run workflow), or
   push any change under `site/`. It creates the Cloudflare Pages project **`watch-catalog`** and
   publishes it — note the exact URL Cloudflare prints (it may add a suffix, e.g.
   `watch-catalog-c0c.pages.dev`). Use that URL below.
4. **👤 Gate it with Cloudflare Access** (Zero Trust → Access → Applications → *Add* → Self-hosted):
   - Application domains: add **both** your `*.pages.dev` URL **and** your custom domain.
   - Policy = **Allow**, Include = the buyer **emails** (or "emails ending in …"). Buyers get a
     one-time PIN by email. Session ~30 days.
5. **👤 Custom domain** (Pages project → Custom domains → *Set up a domain*): add
   `catalog.<yourdomain>`. Cloudflare creates the DNS record + TLS automatically. Then make sure
   the Access application (step 4) lists this hostname too.
6. **Verify.** In an incognito window, open the custom domain → you should hit the **Access
   login** first, then the catalog. Now share the link with buyers.

The site sends `noindex` and is gated by Access, so it never appears in Google.

---

## How it fits the repo

```
Catalog/_catalog/*.csv   ← source of truth (shared with the Shopify sync)
        │  (push to main)
        ▼
GitHub Actions (deploy-catalog.yml)  → build site/  → Cloudflare Pages → Access-gated link
        ▲
   site/  (this folder: Astro app)
```

The Shopify pipeline (`scripts/sync-shopify.mjs`, `sync-shopify.yml`, `WEB-SYNC.md`) is separate
and unaffected.
