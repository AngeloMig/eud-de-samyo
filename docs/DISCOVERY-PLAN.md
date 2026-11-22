# Fragrance discovery page: plan

Status: approved 2026-11-21. Phases 1, 2 and 3 are built (Climate and Occasions
live inside When to wear it; Scent DNA became a "scent aura" + ranked list instead
of the petal flower, at the owner's request).

Answers the brief's "before development" list. Nothing in this plan has been built yet.
Once the decisions at the end are agreed, Phase 1 gets built in the order below.

## 1. What already exists and gets reused

| Already built | Becomes |
|---|---|
| `main-product-perfume`: info column, High Spirits bottle carousel, sizes, Add to bag, affiliate mode, sticky buy | the buying part of the hero and of **Where to buy** |
| `perfume-product-notes` "Scent story" (timeline, meters, accords, accordion) | split into **Fragrance journey** and **Performance lab**, then redesigned |
| `snippets/perfume-note-art` (23 note drawings) | note visuals everywhere |
| `perfume-product-card`, `perfume-rail`, `perfume-lineup` | **Similar fragrances**, compare picker |
| `perfume-cart-drawer`, CJ affiliate offers (`samyo.affiliate_offers`) | **Where to buy** |
| `perfume-quiz` (Find your scent) | the logic behind **Who is it for?** |
| `perfume-reveal.js`, tokens, fonts, 36px controls | every section |

## 2. One fragrance, one canonical page

The brief says a fragrance profile must exist even when nothing is for sale. That
needs a **metaobject `fragrance_profile`** as the single source of truth. Shopify
can give each metaobject entry its own web page
(`/pages/fragrance-profile/dior-sauvage`, template `templates/metaobject/fragrance_profile.json`).
Products link to their profile with a metafield `fragrance.profile`.

To avoid two pages competing for the same searches:

- **Not sold here:** the profile page is the page. It holds the full experience, the
  research and the retailer links.
- **Sold here:** the **product page** is the canonical page. It shows the same
  sections (they read the profile through the product), and the profile page
  points its canonical link to the product. That needs a one-line change in
  `layout/theme.liquid`.

The sections are written once and work in both places:
`assign profile = metaobject | default: product.metafields.fragrance.profile.value`.

## 3. Page structure (top to bottom)

Sticky section nav under the header: Overview · Scent DNA · Notes · Performance ·
Climate · Best for · Similar · Compare · Where to buy. It scrolls smoothly to each
section, and the current one is underlined.

| # | Section (new file) | Phase | Content and interaction |
|---|---|---|---|
| 1 | `perfume-fragrance-hero` | 1 | Full-screen. Huge bottle in the centre, oversized name behind it, brand, concentration, a short description, three scent characteristics, a handwritten line, a scroll cue. **Interaction:** the bottle leans slightly toward the cursor (desktop, transform only); entrance like the homepage; background from the profile's two colours. |
| 2 | `perfume-scent-dna` | 1 | **Signature visual:** an SVG "scent flower". Each characteristic is a translucent petal, sized by its score; overlapping petals blend. **Interaction:** tap or hover a petal to highlight it and show a one-line explanation, its notes and how it shapes the scent. **Data rule:** scores only from a documented basis, shown on the page. Without scores: elegant descriptive tags. |
| 3 | `perfume-journey` | 1 | Three selectable stages: Opening, Heart, Dry-down. **Interaction:** choosing one shifts the background, enlarges its notes and shows an editorial line. **Phones:** swipe between stages. **Times:** no durations unless a source gives them. |
| 4 | `perfume-performance-lab` | 1 | **Longevity:** a range bar ("5–8 hours", only if known) plus the caveat. **Projection:** a bottle with soft expanding rings (Intimate / Moderate / Strong), clearly not a measured distance. **Sillage:** an animated trail. A plain-language note on the difference between projection and sillage. **Basis label on every metric:** Brand information, Editorial wear test, Community estimate, or Not yet evaluated. |
| 5 | `perfume-where-to-buy` | 1 | **Samyó:** sizes, ₱ price, stock, Add to bag. **Official brand site:** a link, marked as affiliate only when approved. **Partner retailers:** merchant, verified price and date, availability, link. Affiliate links are labelled and disclosed; ordinary links are not. |
| 6 | `perfume-climate` | 2 | **"Made for your climate?"** Selector: Hot day, Office, Rainy day, Evening. Each shows suitability, the characteristics behind it, how to apply, and when it may overwhelm. Labelled as editorial advice. |
| 7 | `perfume-occasions` | 2 | Six occasions with drawn icons. Tap one to open a panel explaining why it suits (or doesn't). |
| 8 | `perfume-similar` | 2 | **"If you love this, explore these."** Ranked by a published method: shared notes count most, then same family, then shared characteristics, then occasions. Each card says why ("shares bergamot and pepper"). |
| 9 | `perfume-compare` | 3 | Pick a second fragrance and compare side by side: family, main notes, performance (with bases), climate, occasions, prices. **Phones:** stacked or swipeable. **SEO:** "A vs B" pages as `fragrance_comparison` metaobject pages with their own editorial verdict. |
| 10 | Personal fit (inside the hero or after Best for) | 3 | A four-question mini quiz. It gives a qualitative fit ("A good match for fresh, noticeable, everyday"), never a %. Reuses the quiz logic. |

## 4. Data model (Settings › Custom data)

**`fragrance_profile` metaobject** (web pages on). The canonical data:

| Field | Type |
|---|---|
| name, brand, concentration, family | text (brand later a `brand` metaobject) |
| description, editorial_observations | rich text |
| tagline | text (the handwritten line) |
| palette_a, palette_b | color |
| hero_image | file (transparent bottle) |
| characteristics | list of `scent_score` metaobjects: accord (choice), score 1–5, explanation, notes (list of `fragrance_note`) |
| characteristics_basis | choice: Editorial assessment / Licensed data / Community estimate |
| top_notes, middle_notes, base_notes | list of `fragrance_note` (exists) |
| longevity_min_h, longevity_max_h | integer (blank = not evaluated) |
| longevity_basis, projection, projection_basis, sillage, sillage_basis | choice |
| climate | list of `climate_fit`: scenario, suitability (Great / OK / Careful), why, how to apply, watch-out |
| occasions | list of `occasion_fit`: occasion, fit, why |
| sources | list of `source_reference`: title, url, type, accessed date |
| related | list of `fragrance_profile` (optional manual picks; otherwise the method above) |
| products | list of products (where sold here) |
| brand_url, brand_url_affiliate | url, url |
| offers | list of `retailer_offer` (exists) |

**Score scale** (published on the page and in the docs): 1 = a trace, 2 =
noticeable, 3 = clear, 4 = prominent, 5 = dominant. Never shown as percentages.

**Product:** only `fragrance.profile` (one metaobject reference). The current
product metafields stay readable as a fallback while you migrate.

## 5. Mobile behaviour

- Vertical storytelling, one idea per screen. The bottle stays centred with no
  cursor tilt.
- Sticky section nav: a horizontal chip row that scrolls itself to the current
  section.
- Scent DNA: tap petals (no hover). The details panel slides up under the flower.
- Journey: swipe between the three stages, with dots and arrows.
- Performance: the three metrics as stacked cards; rings and trail at half size.
- Climate and Occasions: chip selectors, panels below them.
- Compare: two stacked columns, or swipe between the fragrances.
- Where to buy: Samyó first. Retailers are rows with 44px tap targets. The sticky
  buy bar (already built) stays.
- No horizontal overflow (checked at 375px for every section). Large motion is cut
  down on small screens.

## 6. Performance and accessibility

- Plain Liquid, CSS and small vanilla scripts. The visuals are SVG; no 3D or chart
  libraries.
- All fragrance information is rendered as HTML by Liquid (crawlable, readable
  without JS). JS only adds interaction.
- Motion uses transform, opacity and clip-path, with IntersectionObserver and rAF.
  `prefers-reduced-motion` gets a static version; nothing is hidden behind motion.
- Images: Shopify's responsive `image_tag`. Only the hero bottle is eager-loaded.
- Accessibility: real buttons and tabs, `aria-selected` / `aria-expanded`, visible
  focus, text alternatives for every visual (e.g. "Woody: 4 of 5, editorial
  assessment"), and the 44px phone targets.

## 7. SEO

- One H1 per page ("Dior Sauvage Eau de Parfum"), with section headings that
  answer real searches ("What does Dior Sauvage smell like?", "Longevity and
  projection", "Is it good for Philippine weather?").
- Metaobject SEO title and description fields, breadcrumbs, and canonical links
  as in section 2.
- Structured data: `Product` (only when sold here), `BreadcrumbList`, and
  `Article` for profile pages. No fake reviews or ratings.
- Internal links: notes → note pages later, family → collection, similar → other
  profiles, guide and quiz.

## 8. Build order

- **Phase 1:** the `fragrance_profile` definitions and docs, then Hero + sticky
  nav, Scent DNA, Journey, Performance lab, Where to buy. Previewed with one demo
  profile; empty states shown.
- **Phase 2:** Climate, Occasions, Similar (with the published method).
- **Phase 3:** Compare (and A vs B pages), Personal fit.

## Decisions needed before building

1. **Canonical strategy** (section 2): the product page when sold here, the profile
   page otherwise. Is that OK?
2. **Score basis for Scent DNA:** Samyó's own editorial assessment, on the 1–5
   scale above, labelled on the page. Is that OK, or do you have licensed data?
3. **Who fills the data:** you or the team, per perfume, in Shopify. Pages show
   "not yet evaluated" until filled.
