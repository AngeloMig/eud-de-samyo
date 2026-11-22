# Perfume store theme: architecture and design direction

Status: step 1 (design system), step 2 (homepage featured showcase), the header and
the hero are built. Steps 3–6 are planned below and not built yet. Current status and
next tasks: docs/HANDOFF.md.

## What was reviewed

| Reference | How | What was confirmed |
|---|---|---|
| NOHO (noho.ink) | Live site, desktop | Warm stone paper (`#F1EEE9`, `#E7E2DA`, `#D7D1C7`), charcoal ink `#3C3C3C`, one tight grotesk (Switzer 600, negative tracking ~-0.04em). Split hero: oversized left-aligned statement on the left, a staggered grid of flat pastel tiles (peach, butter, lilac, olive) on the right. Big centered statement blocks, product cards with price + swatches + "Learn more"/"Buy", numbered stat cards (01, 02, 03). Lots of air, no ornament. |
| High Spirits | Your `High-Spirits` theme repo (the storefront is password-locked, so not seen live) | `homegrown-brands`: the chosen bottle large with the next ones smaller and faded, huge heading with an animated line behind. `product-lineup`: bold uppercase heading with a script line over it, overlapping bottles. `featured-products-v3`: sticky text while bottles scale through. PDP (`main-product-hs`, `docs/product-page.md`): breadcrumbs, a 421px info column beside a looping variant carousel (front bottle large, others at 20% opacity), moves only on user action, phones put the bottle on top with a 72px name. |
| Screenshot you attached | Viewed | It is the NOHO hero, with the tile photos circled, not a High Spirits screenshot. I read it as: you like the playful, colour-blocked product tiles. That idea is carried into the per-perfume colour fields and the scent-ingredient illustrations around each bottle. |

Not available: the live High Spirits storefront and its product page (password), and
any existing perfume-store theme (the Shopify connector is not signed in and no local
repo is a perfume store). Nothing below relies on details I could not see.

## Design direction

**NOHO's calm editorial frame + a High Spirits-style stage in the middle.**

- Paper `#F7F5F0`, stone `#E8E4DC`, sand `#D8D1C5`, ink `#292521`. Colour comes from
  each perfume's own pastel field (NOHO's tiles), which the whole showcase fades to.
- Type:
  - Display: **Cormorant Garamond** (OFL). Closest free match to a fashion-house
    serif: high contrast, long elegant serifs, beautiful italic at huge sizes. Bodoni
    Moda was the runner-up (more contrast, but brittle under 24px and very "magazine");
    EB Garamond reads bookish rather than luxury.
  - Script: **Mrs Saint Delafield** (OFL), a signature hand. Used for one caption per
    perfume only (for example "lavender meets vanilla"), never for information.
  - Body / UI: **Instrument Sans** (OFL), a clean grotesk in the spirit of NOHO's
    Switzer.
- Motion: one easing family (`cubic-bezier(.16,1,.3,1)`), transforms and opacity
  only, staggered by 60–90ms. Reduced motion turns every move into a 200ms fade.

## Theme architecture (Online Store 2.0)

```
layout/theme.liquid          + {% render 'perfume-head' %} in <head>
snippets/perfume-head.liquid  fonts (Google Fonts, OFL) + design tokens stylesheet
assets/perfume-tokens.css     design system: colours, type, spacing, buttons, links
sections/perfume-showcase.liquid   step 2: homepage featured perfume stage
assets/perfume-showcase.css / .js  its styles and <perfume-showcase> element
snippets/perfume-note-art.liquid   19 built-in scent illustrations (lemon, cinnamon…)
snippets/perfume-bottle-art.liquid placeholder bottles until real photos are uploaded
sections/perfume-header.liquid     NOHO-style header (header group) + assets/perfume-header.*
sections/perfume-hero.liquid       NOHO-style split hero, 4 bottles + 3 scents + assets/perfume-hero.*
snippets/perfume-sample-image.liquid bundled sample cut-outs (assets/sample-*.webp)
```

Planned for steps 3–6:

```
templates/product.json              uses main-product-perfume + the sections below
sections/main-product-perfume.liquid hero: bottle, name, brand, concentration, size
                                     selector (native product form + variant JSON),
                                     PHP price, stock, Add to cart, shipping note
sections/fragrance-profile.liquid    scent bars, notes pyramid, performance
sections/fragrance-story.liquid      editorial storytelling (metafields)
sections/where-to-buy.liquid         retailers list (metaobjects)
snippets/fragrance-*.liquid          shared bars, note chips, source badges
snippets/product-jsonld.liquid       Product + BreadcrumbList structured data
```

### Data model

Product metafields, namespace `fragrance`:

| Key | Type | Notes |
|---|---|---|
| `concentration` | single_line_text (choices: EDT, EDP, Parfum, Extrait, Cologne) | showcase falls back to it |
| `fragrance_family` | single_line_text | |
| `top_notes`, `middle_notes`, `base_notes` | list.metaobject_reference → `fragrance_note` | so a note has one name, image and description shared by every perfume |
| `scent_profile` | metaobject_reference → `scent_profile` | |
| `performance` | metaobject_reference → `fragrance_performance` | |
| `best_seasons`, `best_occasions` | list.single_line_text | |
| `retailers` | list.metaobject_reference → `retailer_offer` | |

Metaobjects:

- `fragrance_note`: name, illustration (file), art preset (the same list as the
  showcase), short description.
- `scent_profile`: one integer 0–5 per accord (citrus, woody, musky, floral, fresh,
  sweet, spicy, amber, aromatic), plus `source` (manufacturer / community / our wear
  test) and `source_note`.
- `fragrance_performance`: longevity, projection, sillage, humid-weather suitability,
  each with its own `source` and `tested_on` date. Empty means "not assessed yet";
  the page then says so instead of showing a bar. Nothing is ever defaulted.
- `retailer_offer`: merchant name, logo (only if authorised), url, `affiliate_url`,
  `is_affiliate_approved` (boolean), verified price, verified availability,
  `verified_on` date. The disclosure shows when `is_affiliate_approved` is true and an
  `affiliate_url` is set; otherwise the plain url is used and no commission language
  appears.

Because research content lives in metafields/metaobjects, the fragrance profile still
renders when a product is sold out or unavailable.

## Step 2 detail: `perfume-showcase`

- One **Perfume** block per bottle (up to 8). Each block: product (optional), bottle
  image, brand / name / concentration / description overrides (fall back to the
  product's vendor, title, `fragrance.concentration` and description), handwritten
  caption, four scent notes (label + built-in illustration or uploaded cutout),
  background / accent / text / liquid colours, both button labels and links.
- Section settings: kicker, heading (+ h1/h2), autoplay and its interval, transition
  speed, nav layout (names, numbers, thumbnails), vertical pagination, next preview,
  notes and captions on/off, image scale / vertical offset / max height (desktop and
  mobile), heading / name / background-name sizes (desktop and mobile), paddings.
- Desktop: heading top-left, info column left, the bottle centred on a giant italic
  name, notes floating round it, vertical counter + next preview on the right,
  numbered tabs along the bottom. Tablet: two columns, no rail. Phone: its own layout,
  bottle first, then prev/counter/next, info, and a swipeable tab row.
- Accessibility: a real tablist (arrow keys, Home/End), inactive panels are `inert`,
  the illustrations are decorative and the notes are also written out in text,
  autoplay has a pause button and pauses on hover, focus, off-screen and hidden tab.
- Theme editor: selecting a block jumps to it and holds autoplay.

## Installing step 2 into the store's theme

1. Copy `sections/perfume-showcase.liquid`, `snippets/perfume-head.liquid`,
   `snippets/perfume-note-art.liquid`, `snippets/perfume-bottle-art.liquid`,
   `assets/perfume-tokens.css`, `assets/perfume-showcase.css` and
   `assets/perfume-showcase.js` into the theme (a Dawn-based OS 2.0 theme).
2. In `layout/theme.liquid`, inside `<head>`: `{% render 'perfume-head' %}`.
3. Theme editor → Home page → Add section → **Perfume showcase**. It arrives with
   four sample perfumes; link each block to its product and upload a transparent
   bottle photo. Check every note against the brand's official listing.
4. Run `shopify theme check` before pushing.

Preview without a store: `LIQUIDJS=<path to node_modules/liquidjs> node dev/render-preview.mjs`
(add `--autoplay` or `--nav=thumbs|numbers`), then open `dev/preview.html` over a local
server. `dev/` and `docs/` are in `.shopifyignore`.
