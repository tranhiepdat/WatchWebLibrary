# Watch Library — Catalog

Organized photo library for the watch warehouse, ready for web upload.
All 790 source files from the old flat `WebWatch/` dump have been identified by
image, grouped per individual watch, renamed, and filed by brand and model.

## Folder structure

```
Catalog/
  <Brand>/                 e.g. Rolex, Richard Mille, Cartier ...
    <Model line>/          e.g. Datejust, RM 055, Santos ...
      <Watch name>/        one folder per individual watch
        <Watch name> - 01.jpg, - 02.jpg, ...   (multi-angle shoots)
        <Watch name> - video.mp4                (if a clip exists)
        <Watch name> - live 01.heic             (live-photo companion, if any)
        <Watch name>.jpg                        (when the watch has a single photo)
```

- **Watch name** = model + dial colour + case colour/material + notable bezel/strap
  (nickname / common name, no reference numbers, no size). ASCII, web-friendly.
- One folder per watch, even single-photo items (so each folder = one web listing).

## catalog.csv

One row per watch (277 total) — structured metadata to drive **tags** on the site:

`brand, model, watch_name, dial_color, case_color, case_material, bezel,
bracelet_strap, strap_material, gender, est_size_mm, num_photos, num_videos,
confidence, folder, source_ids`

- `est_size_mm` is an estimate (case size is rarely printed on the watch).
- `confidence` (high / medium / low) flags how sure the identification is —
  scan the `medium`/`low` rows first when reviewing.
- `source_ids` lists the original filenames, so any item can be traced back.

## tags.csv + tags_vocabulary.md  (ready for web tags/filters)

`tags.csv` gives every watch a normalized, deduplicated tag set across facets —
Brand, Collection, Gender, Dial Color, Dial Style, Case Material, Strap Type,
Strap Material, Bezel, Complication/Style, Size — plus an `all_tags` column
(`;`-separated) you can feed straight into a product's tags on the site.

Values are normalized into a controlled vocabulary (e.g. Grey→Gray, "Steel and
Rose Gold"→Two-Tone, "Skeleton" moved from colour to Dial Style) and extra tags
are derived from the model/name (Chronograph, GMT/World Time, Diver, Moonphase,
Skeleton, Tourbillon, Diamond-Set, Integrated Bracelet Sport, ...).

`tags_vocabulary.md` lists every distinct tag per facet with counts — use it to
set up the filter groups / tag taxonomy on the website.

## Inventory (277 watches)

| Brand | Watches |  | Brand | Watches |
|---|---|---|---|---|
| Rolex | 81 | | Audemars Piguet | 14 |
| Richard Mille | 53 | | Vacheron Constantin | 9 |
| Cartier | 26 | | IWC | 8 |
| Omega | 24 | | Breitling | 2 |
| Patek Philippe | 24 | | Piaget | 1 |
| Hublot | 19 | | Franck Muller | 1 |
| Jaeger-LeCoultre | 14 | | Roger Dubuis | 1 |

## _Unsorted/

`_Unsorted/Live & Misc/` holds 13 live-photo (`.HEIC`) and video (`.mp4`) files
whose original filenames gave no reliable link to a specific watch (random
hashes, no orderable sibling). They were kept rather than guessed — place them
manually if you can match them.

## How this was built

Filenames in the source dump were meaningless (Apple Photos export IDs, hashes)
and a single filename "burst" routinely mixed many different watches, so every
image was inspected visually, grouped into runs of the same physical watch, and
named from what is visible. Identifications are best-effort; corrections are easy
to make via `catalog.csv` and folder renames.
