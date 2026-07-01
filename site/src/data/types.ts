export interface Watch {
  sku: string;
  brand: string;
  model: string;        // collection
  name: string;         // watch_name
  folder: string;       // repo path under Catalog/ (no leading Catalog/)

  gender: string;       // Men | Women | Unisex | ""
  dialColor: string | null;   // normalized display color (null = not a color / unknown)
  materials: string[];  // normalized case materials (may be >1 for two-tone)
  sizeMm: string;       // raw est size
  sizeBucket: string | null;  // Ladies (<33mm) ... Oversized (44mm+)
  strapType: string | null;   // Bracelet | Strap
  bezel: string;
  strapMaterial: string;
  complications: string[];    // Chronograph, GMT/World Time, Date, ...

  tags: string[];       // full all_tags list (for keyword search)
  photos: string[];     // ordered image filenames (jpg/png)
  numPhotos: number;
  price: string | null; // resolved price range, or null => "Contact"
}

export interface FacetValue {
  value: string;
  count: number;
}
export interface FacetGroup {
  key: string;
  label: string;
  values: FacetValue[];
}
