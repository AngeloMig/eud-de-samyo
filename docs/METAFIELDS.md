# Fragrance data: metafield and metaobject definitions

Create these in Shopify admin > Settings > Custom data. Namespace and key must match
exactly; the theme reads them by these names. Keep facts (from the brand) separate
from opinions (community or our own wear tests), and leave a field empty rather than
guess: the theme shows "not assessed yet" for empty performance data.

## Product metafields (namespace `fragrance`)

| Name | Namespace.key | Type | Used by |
|---|---|---|---|
| Concentration | `fragrance.concentration` | Single line text, choices: Eau de Cologne, Eau de Toilette, Eau de Parfum, Parfum, Extrait de Parfum | Showcase (now), product page |
| Fragrance family | `fragrance.fragrance_family` | Single line text, choices: Fresh, Citrus, Floral, Woody, Amber, Gourmand, Aromatic, Spicy, Musky | Product page, filters |
| Top notes | `fragrance.top_notes` | **List of single line text** (live store, 2026-11-26) or list of metaobject references → `fragrance_note` | Product page, builder pop-up |
| Heart notes | `fragrance.middle_notes` | same | Product page, builder pop-up |
| Base notes | `fragrance.base_notes` | same | Product page, builder pop-up |

The live store uses plain text lists: type each note as the brand names it ("Calabrian
bergamot", "Pink pepper"). The theme picks the note picture from the name
(snippets/perfume-note-art.liquid matches words like bergamot, pepper, cedar); a note with
no matching picture shows its first letter in the builder. The metaobject version still
works if you ever switch (name, art, image, description per note).
| Scent profile | `fragrance.scent_profile` | Metaobject reference → `scent_profile` | Product page |
| Performance | `fragrance.performance` | Metaobject reference → `fragrance_performance` | Product page |
| Best seasons | `fragrance.best_seasons` | List of single line text (Dry season, Rainy season, All year) | Product page |
| Best occasions | `fragrance.best_occasions` | List of single line text | Product page |
| Where to buy | `fragrance.retailers` | List of metaobject references → `retailer_offer` | Where to buy section |
| Tagline | `fragrance.tagline` | Single line text, your own words (e.g. "powdery iris, dark woods") | Product page, handwritten under the bottle |
| Tile colour | `fragrance.tile_color` | Color | Product page background, product cards |
| Our take | `fragrance.our_take` | Multi-line text: your opinion, shown labelled "Our take (opinion)" | Scent story section |
| Affiliate offers | `samyo.affiliate_offers` | JSON: list of `{size, url, price, in_stock, sku}`; written by scripts/cj-feed-to-shopify.mjs | Affiliate listings (docs/CJ-FEED.md) |
| Retailer | `samyo.retailer` | Single line text (e.g. FragranceX) | Affiliate listings |
| Price checked | `samyo.price_checked` | Date | Affiliate listings |

## Metaobjects

### `fragrance_note` (one per note, shared by every perfume)

| Field | Key | Type |
|---|---|---|
| Name | `name` | Single line text (required) |
| Illustration preset | `art` | Single line text: one of the theme's note art keys (lemon, orange, bergamot, mint, apple, lavender, rose, jasmine, orange_blossom, vanilla, cinnamon, pepper, cedar, vetiver, patchouli, musk, amber, tonka, mineral, iris, grapefruit, cardamom, tobacco) |
| Image | `image` | File (image), optional transparent cut-out |
| Description | `description` | Multi-line text |

### `scent_profile`

Integer 0–5 per accord: `citrus`, `woody`, `musky`, `floral`, `fresh`, `sweet`,
`spicy`, `amber`, `aromatic`; plus `source` (single line text, choices:
Manufacturer, Community, Sangyo wear test) and `source_note` (multi-line text).

### `fragrance_performance`

| Field | Key | Type |
|---|---|---|
| Longevity | `longevity` | Single line text, choices: Weak (<2h), Moderate (2–4h), Long (4–8h), Very long (8h+) |
| Projection | `projection` | Single line text, choices: Intimate, Moderate, Strong |
| Sillage | `sillage` | Single line text, choices: Soft, Moderate, Heavy |
| Hot & humid (PH) suitability | `humid_weather` | Single line text, choices: Great, OK, Better for cool evenings |
| Source | `source` | Single line text, choices: Community, Sangyo wear test |
| Tested on | `tested_on` | Date |

### `retailer_offer`

| Field | Key | Type |
|---|---|---|
| Merchant | `merchant` | Single line text |
| Logo | `logo` | File (image), only if authorised |
| URL | `url` | URL |
| Affiliate URL | `affiliate_url` | URL (CJ tracking link) |
| Approved affiliate | `is_affiliate_approved` | True or false |
| Price (verified) | `price` | Money |
| Availability (verified) | `availability` | Single line text |
| Verified on | `verified_on` | Date |

The disclosure ("We may earn a commission") shows only when `is_affiliate_approved`
is true and `affiliate_url` is set; otherwise `url` is used with no commission wording.

## Fragrance profiles (discovery pages): the canonical data

Approved plan: `docs/DISCOVERY-PLAN.md`. A **fragrance profile** is a metaobject, so a
perfume can have a research page even when Sangyó doesn't sell it. Products point to
their profile; when a product exists, the product page is the canonical page and the
profile page links to it (canonical tag in `layout/theme.liquid`).

### `fragrance_profile` (Settings › Custom data › Metaobjects; turn on **Web pages**, template `fragrance_profile`)

| Field | Key | Type |
|---|---|---|
| Name | `name` | Single line text (required; display name) |
| Brand | `brand` | Single line text |
| Concentration | `concentration` | Single line text (same choices as the product field) |
| Fragrance family | `family` | Single line text |
| Description | `description` | Multi-line text (2–3 sentences, our own words) |
| Tagline | `tagline` | Single line text (the handwritten line) |
| Colour A / Colour B | `palette_a`, `palette_b` | Color (page background gradient) |
| Bottle image | `hero_image` | File (transparent PNG/WebP) |
| Characteristics | `characteristics` | List of metaobject references → `scent_score` |
| Characteristics basis | `characteristics_basis` | Single line text, choices: Sangyó editorial assessment, Licensed data, Community estimate |
| Top / Heart / Base notes | `top_notes`, `middle_notes`, `base_notes` | List of metaobject references → `fragrance_note` |
| Opening / Heart / Dry-down text | `opening_text`, `heart_text`, `drydown_text` | Multi-line text (what you smell at each stage) |
| Longevity, from / to (hours) | `longevity_min_h`, `longevity_max_h` | Integer (leave empty if not evaluated) |
| Longevity basis | `longevity_basis` | Single line text, choices: Brand information, Editorial wear test, Community-reported estimate, Not yet evaluated |
| Projection | `projection` | Single line text, choices: Intimate, Moderate, Strong |
| Projection basis | `projection_basis` | as Longevity basis |
| Sillage | `sillage` | Single line text, choices: Soft, Moderate, Heavy |
| Sillage basis | `sillage_basis` | as Longevity basis |
| Day or night | `day_night` | Single line text, choices: Day, Day and night, Night |
| Hot, humid day / Air-conditioned office / Rainy day / Warm evening | `climate_hot_day`, `climate_office`, `climate_rainy`, `climate_evening` | Single line text, choices: Great, Good, Careful |
| Occasions | `occasions` | List of single line text, choices: Everyday, Office, Date night, Formal, Casual, Special occasions |
| Wear basis / note | `wear_basis`, `wear_note` | Single line text (e.g. Sangyó editorial assessment) / Multi-line text |
| Climate details (Phase 2) | `climate` | List of metaobject references → `climate_fit` (richer than the four simple ratings; wins when set) |
| Occasion details (Phase 2) | `occasion_fits` | List of metaobject references → `occasion_fit` (wins over `occasions` when set) |
| Related (manual picks) | `related` | List of metaobject references → `fragrance_profile` (shown first in Similar fragrances, as "Our pick") |
| Editorial observations | `observations` | Rich text |
| Sources | `sources` | List of metaobject references → `source_reference` |
| Products | `products` | List of product references (where Sangyó sells it) |
| Brand website | `brand_url` | URL |
| Brand affiliate link | `brand_affiliate_url` | URL (only if an approved programme) |
| Retailer offers | `offers` | List of metaobject references → `retailer_offer` (above) |

### `scent_score` (one per characteristic of one perfume)

| Field | Key | Type |
|---|---|---|
| Characteristic | `accord` | Single line text, choices: Fresh, Citrus, Aromatic, Floral, Powdery, Fruity, Green, Aquatic, Spicy, Sweet, Gourmand, Amber, Woody, Musky, Leather |
| Score | `score` | Integer 1–5 |
| What it adds | `explanation` | Multi-line text (one or two sentences) |
| Notes behind it | `notes` | List of metaobject references → `fragrance_note` |

**Score scale** (shown on every page, never as a percentage): 1 a trace · 2 noticeable ·
3 clear · 4 prominent · 5 dominant. Score from an actual smelling session, write the
basis in `characteristics_basis`, and leave a perfume unscored rather than guess.

### `source_reference`

| Field | Key | Type |
|---|---|---|
| Title | `title` | Single line text |
| URL | `url` | URL |
| Type | `type` | Single line text, choices: Brand, Editorial wear test, Community, Press |
| Checked on | `accessed` | Date |

### Product

| Name | Namespace.key | Type |
|---|---|---|
| Fragrance profile | `fragrance.profile` | Metaobject reference → `fragrance_profile` |

The discovery sections read the profile first and fall back to the older product
fields (`fragrance.top_notes`…) so nothing breaks while migrating.

### `climate_fit` (one per situation, per perfume; editorial)

| Field | Key | Type |
|---|---|---|
| Situation | `scenario` | Single line text, choices: Hot day, Office, Rainy day, Evening |
| Suitability | `suitability` | Single line text, choices: Great, Good, Careful |
| Why | `why` | Multi-line text |
| Characteristics that help | `helps` | Single line text (e.g. "Fresh, citrus, light woods") |
| How to apply | `apply` | Multi-line text (e.g. "One spray to the chest under clothing") |
| May feel overwhelming when | `watch_out` | Multi-line text |

### `occasion_fit`

| Field | Key | Type |
|---|---|---|
| Occasion | `occasion` | Single line text, choices: Everyday, Office, Date night, Formal, Casual, Special occasions |
| Fit | `fit` | Single line text, choices: Great, Good, Not ideal |
| Why | `why` | Multi-line text |

### Similar fragrances: how matching works (shown on the page)

For each perfume in the chosen collection that has a profile: **3 points per shared
note**, **2 for the same family**, **1 per shared characteristic** (Scent DNA accord)
and **1 per shared occasion**. Highest first; ties keep the collection order. Each
card says what it shares. Manual picks in `related` come first, marked "Our pick".

### `fragrance_comparison` ("A vs B" pages; turn on **Web pages**, template `fragrance_comparison`)

For searches like "Versace Eros vs Dior Sauvage": a crawlable page with the two side by
side and Sangyó's own verdict.

| Field | Key | Type |
|---|---|---|
| Title | `title` | Single line text (e.g. "Versace Eros vs Dior Sauvage"; empty = "A vs B") |
| Fragrance A / B | `a`, `b` | Metaobject reference → `fragrance_profile` |
| Verdict | `verdict` | Rich text (who should pick which, in our words) |

Set the web page's SEO title and description in the metaobject entry. Link to these
pages from the profiles' Details or from the Journal so they're found.
