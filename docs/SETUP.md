# Getting the Sangyo theme live on Shopify

This repo is a complete Shopify theme: Dawn v16.2.0 (Shopify's free theme) with the
Sangyo sections on top. Git history: the first commit is untouched Dawn, so `git diff`
against it shows everything Sangyo changed.

## 0. What you need

- A Shopify store (a development store from the Partner dashboard is fine to start).
- Shopify CLI (already installed here: `shopify version`).
- Staff access to the store's Online Store (themes) and Settings.

## 1. Preview it on the store (nothing goes live)

```sh
cd ~/GitHub/samyo-theme
shopify theme dev --store YOUR-STORE.myshopify.com
```

Sign in when the browser asks. The CLI prints a local preview URL
(http://127.0.0.1:9292) and a link to the theme editor. Changes to files reload live.

## 2. Upload it as an unpublished theme

```sh
shopify theme push --unpublished --store YOUR-STORE.myshopify.com
```

It appears under Online Store > Themes as a new draft. Publish it only when ready.
`.shopifyignore` keeps `dev/`, `docs/`, `scripts/` and agent files out of the upload.

## 3. Content the home page expects

| What | Where in Shopify admin | Notes |
|---|---|---|
| Product images `samyo-dior-sauvage-edp.webp`, `samyo-dior-homme-intense.webp`, `samyo-dg-the-one.webp`, `samyo-armani-stronger-with-you-intensely.webp` | Content > Files > Upload | Exact names. From `dev/shop-images/`. Confirm you may use them (`docs/CREDITS.md`). |
| Menu `main-menu` | Content > Menus | Header and the "Shop" footer column. See "Navigation" below. |
| Menu `footer` | Content > Menus | "Help" column and legal row. See "Navigation" below. |
| Products | Products | One per perfume; **variants = bottle sizes** (option name "Size": 50 ml, 100 ml…). Price in PHP. |
| Collections | Products > Collections | Per brand (Dior…) and per scent family (Fresh & citrus, Warm & spicy, Sweet & creamy). |
| Policies | Settings > Policies | Refund, privacy, terms, shipping. Link them in the `footer` menu. |
| Currency | Settings > Store details / Markets | PHP. |

### Navigation (Content > Menus)

Menus live in the store, not the theme, so create them by hand. Nested items (drag
an item under another) become the mega menu: a list A–Z, or columns when the
second level has its own links. The preview (`dev/*.html`) shows exactly this.

`main-menu`:

- **Shop all** → `/collections/all`
- **Brands** → `/collections` (or a brands page)
  - one item per brand collection: Armani, Chanel, Dior, Dolce & Gabbana, Hermès…
    (this nesting makes the Brands mega menu)
- **Scent notes** → `/pages/scent-guide`
- **Journal** → `/blogs/journal` (create the blog "Journal" in Online Store > Blog posts)
- **About** → `/pages/about`

The Find your scent quiz (`/pages/find-your-scent`) is linked from the homepage hero,
the scent families and Why Sangyó; add it to the menu too if you like.

`footer`: Shipping & delivery, Returns, Authenticity, About us, Contact, Privacy
policy, Terms of service (policies from Settings > Policies; About, Authenticity
and Contact are pages).

Pages to create (Online Store > Pages) with their template: "Find your scent"
(`page.find-your-scent`), "Scent guide" (`page.scent-guide`), "Contact"
(`page.contact`), "About us" and "Authenticity" (default `page`). Fragrance
profiles and "A vs B" comparisons get their own pages from their metaobjects
(`docs/METAFIELDS.md`); link a few popular comparisons from the Journal or a page.

### One sample product per brand (`dev/sample-products.csv`)

Products > Import. Ten **draft** products, one per brand in the menu (Armani,
Chanel, Dior, Dolce & Gabbana, Hermès, Jo Malone, Tom Ford, Valentino, Versace,
YSL), each tagged with its brand name and `sample`, with one size and the
concentration. Before publishing, add for each: the price, the official
description, notes from the brand's official list, and **a photo you are allowed
to use** (your own, the supplier's, or the CJ feed's image URL; never copied from
brand sites). Make a brand collection per brand ("Tag is equal to Dior") and link
it in the Brands menu: the mega menu then shows that brand's photo on hover
automatically (collection image, else its first product's photo).

## 4. Connect the sections to real data (theme editor)

Online Store > Themes > Customize (on the Sangyo theme):

- **Perfume showcase**: in each Perfume block pick the **Product**. With a product
  and no Primary button link, the block gets size pills and Add to bag in place.
  For an affiliate perfume (bought at FragranceX), leave the product empty and put
  the CJ tracking URL in Primary button link, label "Buy at FragranceX".
- **Perfume hero**: set each tile's Link (product or collection).
- **Shop by scent family**: set each tile's Link to its collection.
- **Brands strip**: set each brand's Link to its collection.
- **Header** (Header group): menu `main-menu`; the two phone-menu cards can link to
  collections (New arrivals, Best sellers).
- **Footer** (Footer group): menus, contact text, credit line.

## 5. Fragrance data (metafields)

Create the definitions in `docs/METAFIELDS.md` (Settings > Custom data > Products),
then fill them per product. The showcase already reads `fragrance.concentration`;
the product page sections (next to build) read the rest.

## 6. Before publishing

- [ ] Notes in the showcase match each brand's official list (`docs/HANDOFF.md`).
- [ ] The One: confirm EDT or EDP and set Concentration.
- [ ] Image rights confirmed (`docs/CREDITS.md`); D&G image replaced with a larger one.
- [ ] Newsletter: Settings > Customer accounts / Notifications as you like; signups
      arrive as customers tagged `newsletter`.
- [ ] Self-host the three Google Fonts (removes the RemoteAsset warnings) — optional.
- [ ] `bash dev/check.sh` passes (expected: Dawn's 9 findings + 3 font warnings).
- [ ] Test Add to bag, cart, checkout on a phone.

## Brand tile groups (local preview added 2026-11-21)

The home page's Shop by brand blocks each have three image pickers. The local
preview uses `dev/shop-images/samyo-brand-*.webp` (30 files). Check the reuse and
editing permissions in `docs/CREDITS.md` before launch; these online retailer photos
are currently design references. Upload approved files under those exact names,
or select approved supplier/own/CJ photos in the block image pickers.

Alternatively, select each brand collection and enable "Group bottles from the
collection" to use the first three real product photos. Clear the custom image
pickers to use that automatic fallback.

For the approved rounded Bottle lineup, "Behind the rounded corners" should match
the footer background (`#D8D1C5` by default). Desktop/phone radii and the shadow
can be adjusted in the Bottle lineup section.
