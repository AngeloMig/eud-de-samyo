# Image credits

Sample hero images, from Unsplash under the Unsplash License (free for commercial use,
no attribution required; credited here as a courtesy). Backgrounds removed locally (Apple Vision, `dev/tools/cutout.m`) and saved as WebP (`dev/tools/to-webp.mjs`).

| File | Subject | Photographer | Source |
|---|---|---|---|
| assets/sample-scent-lemon.webp | Lemon halves | Mockup Graphics | https://unsplash.com/photos/sliced-orange-fruit-on-white-background-G693X4i3F2I |
| assets/sample-scent-cinnamon.webp | Cinnamon sticks | Mockup Graphics | https://unsplash.com/photos/four-brown-biscuits-on-white-background-y7iHZ4nY63s |
| assets/sample-scent-vanilla.webp | Vanilla pods | Jocelyn Morales | https://unsplash.com/photos/black-and-white-straight-line-GA6WtJ7DtSo |
| assets/sample-bottle-amber.webp | Amber perfume bottle | Akhilesh Sharma | https://unsplash.com/photos/a-bottle-of-perfume-sitting-on-top-of-a-table-vf6DtLlwjTk |
| assets/sample-bottle-clear.webp | Clear perfume bottle | Muhammad Sulyman | https://unsplash.com/photos/a-clear-glass-bottle-with-a-silver-top-MDMrNFnyFQk |
| assets/sample-bottle-blue.webp | Blue perfume bottle | Vertex Designs | https://unsplash.com/photos/a-blue-bottle-with-a-red-cap-on-a-gray-background--pKgB03U3hY |
| assets/sample-bottle-red.webp | Red perfume bottle | Muhammad Sulyman | https://unsplash.com/photos/a-red-glass-bottle-with-a-red-cap-S6QxcHThViw |

These are unbranded stand-ins. Real product photos of the branded perfumes you sell
should come from your supplier or the brand's media kit.

## Product photos (FragranceX, via the store owner's affiliate account)

Supplied by the store owner on 2026-11-21 as FragranceX product images (FragranceX's
affiliate programme runs on CJ Affiliate). Originals are kept unaltered in
`dev/source-photos/fragrancex/`; the background-removed versions for Shopify Files
are in `dev/shop-images/`.

| File (upload to Settings > Files) | Product |
|---|---|
| samyo-dior-sauvage-edt.webp | Dior Sauvage Eau de Toilette |
| samyo-dior-homme-intense.webp | Dior Homme Intense Eau de Parfum |
| samyo-dg-the-one-edt.webp | Dolce & Gabbana The One Eau de Toilette |
| samyo-armani-stronger-with-you-intensely.webp | Emporio Armani Stronger With You Intensely Eau de Parfum |

Before launch: confirm in CJ (FragranceX → Program Terms) that (1) the images may be
used on this site, (2) removing the white background is allowed, and (3) they are used
only next to "Buy at FragranceX" affiliate links, not for stock sold through this
store's own checkout. If background removal is not allowed, upload the originals
instead (same file names, .png).

## Product photos added in Shopify (FragranceX via CJ, 2026-11-23)

The owner confirmed that the FragranceX program terms on CJ allow these images on
the store, including pages that sell the decants. Added to the products in the
Shopify admin ("Add media from URL"); local copies in `dev/source-photos/fragrancex/`.

| Shopify file | Product | Source | Size |
|---|---|---|---|
| jmwssw.jpg | Jo Malone London Wood Sage & Sea Salt Cologne | FragranceX product image `jmwssw` (img.fragrancex.com) | 750x750, bottle with box |
| yym33ed.jpg | Yves Saint Laurent Y Eau de Parfum | FragranceX product image `yym33ed` (img.fragrancex.com) | 750x750, bottle with box |

The One for Men uses the owner's photo `samyo-dg-the-one.webp` (173x266, small).

## Bottle-only photos (supplied by the store owner, 2026-11-21) — now used on the home page

Source not stated; the Sauvage and Dolce & Gabbana shots look like brand or retailer
website images. **Confirm the right to use each one before launch**, or replace them
with supplier / CJ feed / own photos. Originals: `dev/source-photos/owner-bottles/`.

| File (upload to Settings > Files) | Product | Size |
|---|---|---|
| samyo-dior-sauvage-edp.webp | Dior Sauvage Eau de Parfum | 203x447 |
| samyo-armani-stronger-with-you-intensely.webp | Emporio Armani Stronger With You Intensely | 307x480 |
| samyo-dg-the-one.webp | Dolce & Gabbana The One (concentration not confirmed) | 173x266, too small for big screens |
| samyo-dior-homme-intense.webp | Dior Homme Intense | 504x951 |

The earlier FragranceX box-and-bottle cut-outs are kept in `dev/shop-images/with-box/`
(not used by the template any more).

## Note photos (snippets/perfume-note-art.liquid)

Free photos under the [Unsplash licence](https://unsplash.com/license), shown from
Unsplash's image CDN (`images.unsplash.com`), cropped round. To find a photo's page
and photographer, open `https://unsplash.com/photos/<id>` with the id below.

| Note | Unsplash photo id |
|---|---|
| lavender | photo-1611625105602-42ee06be977e |
| iris | photo-1776372294959-e78a71c2af84 |
| vetiver | photo-1563364664-399838d1394c |
| cedar | photo-1515446134809-993c501ca304 |
| bergamot | photo-1612253167527-0598073d2979 |
| pepper | photo-1652128288742-df890f000a56 |
| rose | photo-1585768750637-ada36319a484 |
| jasmine | photo-1781707533179-9c296c975a04 |
| orange blossom | photo-1651057280467-6fb1f9001c78 |
| cardamom | photo-1763558049571-a6d12a85472e |
| mint | photo-1618130070080-91f4d55a2383 |
| orange | photo-1582979512210-99b6a53386f9 |
| grapefruit | photo-1787551742228-8af769f282d3 |
| apple | photo-1678942946279-c83e37f32304 |
| musk | photo-1705147293352-3e81c1b8ab5b |
| amber | photo-1631624406592-f599694e6b2c |
| mineral | photo-1614759258004-39da973d3268 |
| tobacco | photo-1618843916388-29bb8a13b4fd |

Pepper and tobacco are now transparent cut-outs made on 2026-11-25 from the same
Unsplash photos (ids above; sources in `dev/source-photos/notes/`):
`assets/sample-scent-pepper.webp`, `-tobacco.webp`. **Cedar** is cut from a different
photo: "Isolated slice of tree on white background" by Mockup Graphics,
https://unsplash.com/photos/brown-and-white-round-decor-BAcrUzXyg18
(`photo-1615485021298-2c79b31a0f2b`, free Unsplash License) →
`assets/sample-scent-cedar.webp`. Bergamot and amber keep the uncut photos (no clean
free photo to cut: Unsplash has no real bergamot photo; its amber resin shots aren't
isolated).

Lemon, cinnamon and vanilla use the transparent cut-outs listed above. Patchouli and
tonka still use drawings (no suitable free photo found).

## Brand tile bottle groups (2026-11-21)

At the owner's request, brand tiles now show grouped real product images. Online
reference photos came from Perfume Direct and FragranceX, not the brand websites.
Originals, chosen source URLs, crop rectangles and product names are recorded in
`dev/source-photos/brand-tiles/sources.json`. Three existing owner cut-outs are reused.

These retailer photos are local design references; permission for commercial reuse
and background removal has **not** been confirmed. Before launch, replace them
with approved supplier/CJ feed/own photos or obtain the rights. Public availability
does not grant a licence. Upload approved replacements to Shopify Files using the
same names, or select them in each brand block's three image pickers.

Rebuild the cut-outs with:

```sh
SHARP=/Users/angelomiguel/GitHub/brochure-shop/node_modules/sharp node dev/tools/prepare-brand-tiles.mjs
```

The pipeline uses the existing white-background remover, crops reflections/boxes
and discards detached packaging strips; it does not redraw bottles or labels.

| Shopify Files name | Product shown | Source |
|---|---|---|
| samyo-brand-armani-1.webp | Armani Si Eau de Parfum Women's Perfume Spray (15ml, 30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/armani-si-eau-de-parfum-womens-perfume-spray-50ml) |
| samyo-brand-armani-2.webp | Armani Code Eau de Toilette Men's Aftershave Spray (15ml, 30ml, 50ml, 75ml, 125ml) | [Retailer product page](https://www.perfumedirect.com/products/armani-code-eau-de-toilette-mens-aftershave-spray-15ml-30ml-50ml-75ml) |
| samyo-brand-armani-3.webp | Armani My Way Eau de Parfum Women's Perfume Spray (15ml, 30ml, 50ml, 90ml) | [Retailer product page](https://www.perfumedirect.com/products/armani-my-way-eau-de-parfum-womens-perfume-spray-30ml-50ml) |
| samyo-brand-chanel-1.webp | Chanel No. 5 | [Retailer product page](https://www.fragrancex.com/products/chanel/chanel-no-5-perfume) |
| samyo-brand-chanel-2.webp | Coco Mademoiselle | [Retailer product page](https://www.fragrancex.com/products/chanel/coco-mademoiselle-perfume) |
| samyo-brand-chanel-3.webp | Bleu de Chanel | [Retailer product page](https://www.fragrancex.com/products/chanel/bleu-de-chanel-cologne) |
| samyo-brand-dior-1.webp | Dior Sauvage Eau de Parfum | Owner; see bottle-only photos above |
| samyo-brand-dior-2.webp | Dior J'Adore Eau de Parfum Women's Perfume Spray (30ml, 50ml, 75ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/dior-jadore-eau-de-parfum-womens-perfume-spray-30ml-75ml) |
| samyo-brand-dior-3.webp | Dior Homme Intense | Owner; see bottle-only photos above |
| samyo-brand-dolce-gabbana-1.webp | Dolce & Gabbana Dolce Garden Women's Eau de Parfum Perfume Spray (30ml, 50ml, 75ml) | [Retailer product page](https://www.perfumedirect.com/products/dolce-gabbana-garden-womens-eau-de-toilette-perfume-spray-75ml) |
| samyo-brand-dolce-gabbana-2.webp | Dolce & Gabbana The One Eau de Parfum Women's Perfume Spray (30ml, 50ml, 75ml) | [Retailer product page](https://www.perfumedirect.com/products/dolce-gabbana-the-one-eau-de-parfum-womens-perfume-spray-50ml) |
| samyo-brand-dolce-gabbana-3.webp | Dolce & Gabbana The One | Owner; see bottle-only photos above |
| samyo-brand-hermes-1.webp | Hermes Terre D'Hermes Eau de Toilette Men's Aftershave Spray (15ml, 50ml, 100ml, 200ml) | [Retailer product page](https://www.perfumedirect.com/products/hermes-terre-dhermes-eau-de-toilette-mens-aftershave-spray-50ml-100ml) |
| samyo-brand-hermes-2.webp | Hermes Terre d'Hermes Eau Intense Vetiver Eau de Parfum Men's Aftershave Spray (15ml, 50ml, 100ml, 200ml) | [Retailer product page](https://www.perfumedirect.com/products/hermes-terre-dhermes-eau-intense-vetiver-eau-de-parfum-mens-aftershave-spray-50ml-100ml) |
| samyo-brand-hermes-3.webp | Hermes Eau Des Merveilles Eau de Toilette Women's Perfume Spray (30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/hermes-eau-des-merveilles-eau-de-toilette-womens-perfume-spray-50ml) |
| samyo-brand-jo-malone-1.webp | Jo Malone Peony & Blush Suede Cologne Women's Fragrance Spray (30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/jo-malone-peony-blush-suede-cologne-spray-30ml-100ml) |
| samyo-brand-jo-malone-2.webp | Jo Malone Lime Basil & Mandarin Cologne Spray (30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/jo-malone-lime-basil-mandarin-cologne-spray-30ml-100ml) |
| samyo-brand-jo-malone-3.webp | Jo Malone Pear & Freesia Cologne Spray (30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/jo-malone-pear-freesia-cologne-spray-30ml-100ml) |
| samyo-brand-tom-ford-1.webp | Tom Ford Black Orchid Unisex Eau de Parfum Spray (10ml, 30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/tom-ford-black-orchid-30ml-unisex-perfume) |
| samyo-brand-tom-ford-2.webp | Tom Ford Velvet Orchid Eau de Parfum Women's Perfume Spray (30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/tom-ford-velvet-orchid-eau-de-parfum-womens-perfume-spray-30ml-50ml-100ml) |
| samyo-brand-tom-ford-3.webp | Tom Ford Oud Wood Eau de Parfum Unisex Perfume Spray (10ml, 30ml, 50ml) | [Retailer product page](https://www.perfumedirect.com/products/tom-ford-oud-wood-eau-de-parfum-unisex-perfume-spray-30ml) |
| samyo-brand-valentino-1.webp | Valentino Voce Viva Eau de Parfum Women's Perfume Spray (10ml, 30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/valentino-voce-viva-eau-de-parfum-womens-perfume-spray-30ml-50ml) |
| samyo-brand-valentino-2.webp | Valentino Uomo Born in Roma Eau de Toilette Men's Aftershave Spray (50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/valentino-uomo-born-in-roma-eau-de-toilette-mens-aftershave-spray-100ml) |
| samyo-brand-valentino-3.webp | Valentino Donna Eau de Parfum Women's Perfume Spray (30ml, 50ml, 100ml) | [Retailer product page](https://www.perfumedirect.com/products/valentino-donna-eau-de-parfum-womens-perfume-spray-50ml) |
| samyo-brand-versace-1.webp | Versace Eros | [Retailer product page](https://www.fragrancex.com/products/versace/versace-eros-cologne) |
| samyo-brand-versace-2.webp | Versace Man Eau Fraiche | [Retailer product page](https://www.fragrancex.com/products/versace/versace-man-cologne) |
| samyo-brand-versace-3.webp | Versace Pour Homme Dylan Blue | [Retailer product page](https://www.fragrancex.com/products/versace/versace-pour-homme-dylan-blue-cologne) |
| samyo-brand-ysl-1.webp | YSL Black Opium Eau de Parfum Women's Perfume Spray (30ml, 50ml, 90ml) | [Retailer product page](https://www.perfumedirect.com/products/ysl-black-opium-eau-de-parfum-womens-perfume-spray-30ml-50ml-90ml) |
| samyo-brand-ysl-2.webp | YSL Libre Eau de Parfum Women's Perfume Spray (30ml, 50ml, 90ml) | [Retailer product page](https://www.perfumedirect.com/products/ysl-libre-eau-de-parfum-womens-perfume-spray-30ml) |
| samyo-brand-ysl-3.webp | YSL Mon Paris Eau de Parfum Women's Perfume Spray (30ml, 50ml, 90ml, 150ml) | [Retailer product page](https://www.perfumedirect.com/products/ysl-mon-paris-eau-de-parfum-womens-perfume-spray-50ml-90ml) |

### Note photos added 2026-11-22 (Unsplash licence, hot-linked)

| Note | Unsplash photo id |
|---|---|
| Vanilla (bundle of pods) | photo-1682482198446-4cbf92f85a4b |
| Cinnamon (sticks) | photo-1553499944-e4297a0af1bd |

They replace the vanilla and cinnamon cut-outs in `snippets/perfume-note-art.liquid`
(the cut-outs stay in assets/ for other uses).

### Note cut-outs added 2026-11-22 (Unsplash licence, downloaded with the owner's OK)

Originals in `dev/source-photos/notes/`; background removed with `dev/tools/cutout.m`
(Apple Vision), edge trimmed 2px, WebP at max 700px in `assets/`.

| Asset | Unsplash photo id |
|---|---|
| `sample-scent-lavender.webp` | photo-1528756514091-dee5ecaa3278 |
| `sample-scent-rose.webp` | photo-1609482881146-4d971cf9c0ac |
| `sample-scent-orange.webp` | photo-1587735243615-c03f25aaff15 |
| `sample-scent-iris.webp` | photo-1778170914884-4d3fda87aea6 |
| `sample-scent-cardamom.webp` | photo-1642255486695-a52c59347cfa |


## Decant vials (Unsplash License, downloaded with the owner's OK, 2026-11-22)

Originals in `dev/source-photos/decants/`; cut out with `dev/tools/cutout.m`, cropped,
edges trimmed 2px, WebP at max 700px in `assets/`. Used in `dev/decant-bundles.html`.
All containers are unbranded.

| Asset | Shows | Photographer | Unsplash |
|---|---|---|---|
| sample-decant-square.webp | Small square vial, black cap (shown as 1 ml) | Rae Wallis | https://unsplash.com/photos/clear-glass-bottle-with-orange-liquid-6uNdAlvwf98 |
| sample-decant-clear.webp | Clear glass spray vial (shown as 2 ml) | Fulvio Ciccolo | https://unsplash.com/photos/clear-glass-bottle-on-white-surface-Ecwk9RM_304 |
| sample-decant-amber.webp | Amber glass spray vial (shown as 5 and 10 ml) | Cristina Pop | https://unsplash.com/photos/orange-and-black-pen-on-white-table-MY6pHpbFnUk |
| sample-decant-set.webp | A fan of amber spray vials | Cristina Pop | https://unsplash.com/photos/black-and-brown-pen-on-white-table-XGjh-flFZ3o |

Downloaded but not used: the 10 ml travel atomizer by Macro.jr
(https://unsplash.com/photos/a-close-up-of-a-bottle-b0-MJ8wCQZ8): a lime slice covers it
and it carries an embossed brand name.
