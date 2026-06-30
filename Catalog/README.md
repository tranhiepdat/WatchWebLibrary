# Watch Library — Catalog

Organized warehouse photo library, ready for the web.

## Structure
```
Catalog/
  <Brand>/<Model>/<Watch name>/<Watch name> - NN.jpg     # web-ready (>=3 photos)
  _ToCheck/                                               # needs your review:
      Non-Rolex/<Brand> - <name>/...                      #   non-Rolex mixed into a Rolex batch
      _Random/...                                         #   non-watch (box / QC paper / etc.)
  _catalog/                                               # machine-readable metadata (split for git push)
      catalog_00..NN.csv      # one row per watch: sku, brand, model, name, colours, status, folder
      tags_00..NN.csv         # sku, status, folder, all_tags (for web filters)
      tags_vocabulary.md      # every distinct tag with counts
NeedMorePhotos/
  <Brand>/<Model>/<Watch name>/...                        # watches with only 1-2 photos (NOT web-ready)
```

## Web-ready vs needs-more
- **`Catalog/`** = watches with **>=3 photos** → ready to publish. (`status = web_ready`)
- **`NeedMorePhotos/`** = watches with **<=2 photos** → held back so the web team never
  publishes incomplete listings. (`status = need_photos`) Shoot more angles, then move
  the folder into `Catalog/`.
- **`_ToCheck/`** = images that were mixed in and need a human decision.

## Metadata is split
`catalog.csv`/`tags.csv` would be too large for this environment's git push limit, so
they live as numbered parts under `Catalog/_catalog/`. Concatenate the parts (same
header) to get the full table.

## Notes
- Videos and HEIC are not kept (web can't display them).
- Watch names are derived from the photos (brand + model + dial colour + material +
  bezel/bracelet); names are best-effort and easy to correct.
- `.classify/` (repo root) is a classification cache used to (re)build this catalog
  without re-running image recognition — safe to delete.
