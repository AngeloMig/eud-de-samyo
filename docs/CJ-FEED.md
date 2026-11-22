# FragranceX products from the CJ feed

Samyo can list FragranceX perfumes as **affiliate listings**. The product page shows
the perfume in Samyo's design (notes, Scent story), and its button says
**"Buy at FragranceX"**. The button goes to your CJ tracking link, so you earn a
commission. Samyo does not sell these items: there is no Add to bag, and the price
shown is FragranceX's, with its currency and the date it was checked.

Your own stock stays normal products, with Add to bag. You can have both in one store.

## Read the licence first

A CJ product feed is licensed to **promote the advertiser's products and send
shoppers to them**. It is not licensed for selling the products yourself. Before
importing, check two things:

- the FragranceX programme terms in CJ (images, descriptions, prices, how often
  prices must be refreshed, use of brand names);
- CJ's publisher service agreement.

If the terms don't allow showing their descriptions or images on your site, import
without them and write your own descriptions instead.

## 1. Get the feed from CJ

You need to be signed in to your own CJ account; nobody else should do this for you.
The menu names below may differ slightly in CJ's current dashboard.

1. In CJ Account Manager, go to **Advertisers**, find **FragranceX**, and check
   that your relationship is **Active**.
2. Open **Links → Product Catalogs** (or **Tools → Product Feeds**).
3. Subscribe to FragranceX's catalogue and choose a **CSV** or tab-delimited
   download (not XML).
4. CJ either offers a download or delivers the file by HTTP or FTP. If CJ asks for
   delivery details or a personal access token, set that up yourself and keep it
   private. Never put it in this repo.
5. Save the file somewhere outside the theme, for example
   `~/Samyo/feeds/fragrancex.csv`. The feed changes often, so download a fresh copy
   before each import.

## 2. Convert it

The script keeps only what you ask for (there are thousands of products), groups
the sizes of each perfume into one product, and skips testers and gift sets unless
you include them:

```sh
node scripts/cj-feed-to-shopify.mjs \
  --in ~/Samyo/feeds/fragrancex.csv \
  --out ~/Samyo/feeds/shopify-import.csv \
  --brands "Christian Dior,Chanel,Hermes,Yves Saint Laurent,Dolce & Gabbana,Giorgio Armani" \
  --brand-map "Christian Dior=Dior,Giorgio Armani=Armani,Yves Saint Laurent=YSL" \
  --in-stock --limit 150
```

| Option | Use |
|---|---|
| `--brands` | Only these brands, written as the feed writes them |
| `--match` | Only titles containing one of these words, e.g. `"sauvage,bleu de chanel"` |
| `--brand-map` | Rename brands to how Samyo shows them |
| `--include-testers` / `--include-sets` | Keep testers / gift sets (skipped by default) |
| `--in-stock` | Drop rows the feed marks out of stock |
| `--limit` | At most this many products |
| `--status active` | Publish on import (default: **draft**, so you can review first) |
| `--retailer` | Shop name on the button (default FragranceX) |

Each product gets:

- the feed's title, description and first image;
- one size option per row, with the size converted from oz to ml (3.4 oz becomes
  100 ml);
- `fragrance.concentration` (Eau de Parfum…), when the title says it;
- `samyo.affiliate_offers`: for each size, the tracking link, price, stock and SKU;
- `samyo.retailer` and `samyo.price_checked` (the day you ran the script);
- the tags `affiliate`, `fragrancex` and the gender, plus Shopify price ₱0 (it
  isn't sold here).

Test run on a fake file: `dev/cj-feed-sample.csv` → `dev/cj-import-sample.csv`.

## 3. Create the metafields once (before the first import)

In Shopify admin, go to **Settings → Custom data → Products → Add definition**:

| Name | Namespace and key | Type |
|---|---|---|
| Affiliate offers | `samyo.affiliate_offers` | JSON |
| Retailer | `samyo.retailer` | Single line text |
| Price checked | `samyo.price_checked` | Date |
| Concentration | `fragrance.concentration` | Single line text (see METAFIELDS.md) |

## 4. Import

1. Go to **Products → Import** and upload `shopify-import.csv`.
2. Leave "Overwrite products with matching handles" on when refreshing.
3. The products arrive as **drafts**. Review them, add notes (`fragrance.top_notes`
   …) where you know the brand's official notes, then set them to Active.
4. Put them in collections. The cards show "At FragranceX" and the retailer's price,
   with no quick Add.

## Keep prices honest

Prices and stock in the feed change. Re-run the script and re-import at least as
often as the programme terms ask; weekly is a sensible minimum. Every page shows
"price checked <date>", so shoppers know it may have changed.

## Where it lives in the theme

- `sections/main-product-perfume.liquid`: when there are affiliate offers, the price,
  stock and button come from the offer for the chosen size. The button has
  `rel="sponsored nofollow"` and opens in a new tab. The disclosure text is set in
  the Add to bag block. No structured data is output (so Google never sees a ₱0
  offer).
- `assets/perfume-product.js`: switches the link, price and stock when the size
  changes.
- `snippets/perfume-product-card.liquid`: "At FragranceX" badge, retailer price, no
  quick Add.
- Preview: `dev/product-affiliate.html` (example.com links, made-up prices).
