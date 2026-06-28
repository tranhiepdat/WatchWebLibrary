# Sync the watch library to the web (Shopify + Framer)

This repo is the **single source of truth**. Editing `Catalog/catalog.csv` (or
adding images) and pushing to `main` automatically updates the website.

```
GitHub repo (Catalog/ + catalog.csv)
   │  push to main → GitHub Action (sync-shopify.yml)
   ├──────────────► Shopify   (products, tags, images, inventory)
   │                  ▲ images served from the repo via jsDelivr CDN
   └──────────────► Framer    (Shopify plugin, or CMS synced from Shopify)
```

## How it works
- Each watch has a **stable `sku`** (e.g. `ROL-001`) in `catalog.csv`. The sync is
  an **upsert keyed by SKU/handle** — re-running only updates, never duplicates.
  You can rename folders, change tags, swap images: the SKU keeps the link intact.
- **Images are not uploaded** — they are referenced directly from this repo through
  the free **jsDelivr CDN**:
  `https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/Catalog/<path>.jpg`
- **Tags** come from `tags.csv` (`all_tags`), so Shopify smart collections
  (Rolex / Blue dial / Chronograph …) build themselves from tags.

## One-time setup
1. In Shopify: **Settings → Apps → Develop apps → Create an app**, enable Admin API
   scope **`write_products`**, install it, copy the **Admin API access token**.
2. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**:
   - `SHOPIFY_STORE` = `your-shop.myshopify.com`
   - `SHOPIFY_ADMIN_TOKEN` = the token from step 1
3. (Optional) edit `scripts/sync-shopify.mjs` to set price logic.

## Running it
- **Automatic:** push a change to `Catalog/catalog.csv` on `main`.
- **Manual / test:** GitHub → **Actions → Sync catalog to Shopify → Run workflow**.
  - `only_skus`: e.g. `ROL-001,RM-005` to sync just a few first.
  - `publish`: leave **off** to create products as **DRAFT** (safe). Turn on when ready.

> Products are created as **DRAFT** by default so nothing goes live by accident.
> Review them in Shopify, then run with `publish = true` (or flip status in Shopify).

## Framer
Two options:
1. **Shopify plugin (recommended):** in Framer, add the Shopify integration and point it
   at the same store — products/collections appear automatically, you just design.
2. **Framer CMS:** import `Catalog/catalog.csv` (Framer CMS supports CSV import), or
   sync from Shopify. Use the `image_url`/tags columns to drive cards & filters.

## Local dry-run
```bash
SHOPIFY_STORE=xxx.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_xxx \
ONLY_SKUS=ROL-001 node scripts/sync-shopify.mjs
```
