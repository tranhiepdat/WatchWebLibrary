# Watch Library — Catalog (PILOT)

This is a **pilot sample** demonstrating the proposed organization for the watch
warehouse photo library, before processing all ~790 source files in `WebWatch/`.

## Folder convention

```
Catalog/
  <Brand>/                e.g. Rolex, Richard Mille, Cartier
    <Model line>/         e.g. GMT-Master II, Nautilus, Santos
      <Watch name>/       one folder per individual watch
        <Watch name> - 01.jpg, - 02.jpg, ...   (multi-angle shoots)
        <Watch name> - video.mp4                (if a clip exists)
        <Watch name>.jpg                        (single-photo catalog items)
```

- **Watch name** = nickname / color / material / common name (no reference codes),
  e.g. `Submariner Date Green Bezel Black Dial`,
  `RM 035 Americas Rose Gold Skeleton - Black Rubber`.
- Names are **ASCII, no diacritics**, web-upload friendly.
- Image files are renamed tidily and numbered in shot order.

## catalog.csv

Structured metadata for every watch — ready to drive **tags** on the website
(brand, model, dial/case color, material, bezel, bracelet/strap, gender,
estimated size, photo count, source file IDs, confidence, notes).

## Notes on the source data (important)

The source dump has **two kinds** of material mixed together:

1. **Detailed shoots** — one watch with ~10–15 angle photos + a video
   (e.g. the Richard Mille items here).
2. **Catalog dumps** — many different watches with **only 1 photo each**
   (e.g. the 6 single-photo items here all came from one consecutive run).

Filenames are encoded (Apple Photos export IDs, hashes) and do **not** indicate
the watch — and a single filename "burst" often contains many different watches.
So grouping must be done **visually**, image by image. The total number of
distinct watches is therefore much larger than a first glance suggests.

`est_size_mm` is an approximation (case size is rarely printed on the watch).
`confidence` flags how sure the model/identification is.
