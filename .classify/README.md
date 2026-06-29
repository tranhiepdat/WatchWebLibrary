# Classification cache (Rolex Update batches)

- 4098 watch-photo records classified from Update/Rolex_Batch01-03 (6 CSV parts).
- Loose clustering (drop size) -> ~901 new Rolex variants.
- Used to resume the merge into Catalog/ without re-running vision classification.
- Next step: cluster -> create Catalog/Rolex/<model>/<name>/ folders, <=2 photos -> NeedMorePhotos/.
