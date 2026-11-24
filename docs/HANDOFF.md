# Handoff: Sangyo perfume theme

## Update 2026-11-25: hero floating tiles + hover notes

- Owner picked hero idea 2 (floating tiles) of 10, plus hover notes.
- **Moving images** (setting id `float_tiles`, default on): the tiles never move,
  so the grid stays perfectly aligned (owner, 2026-11-25: no misalignment). Only the
  image inside moves, on the `translate` / `scale` properties: cut-outs drift ±4px,
  full-bleed photos zoom 1 → 1.05 slowly. Pauses while the grid is hovered/focused;
  off under reduced motion. (The first version moved the tiles; removed.)
- **Hover notes**: new tile setting "Notes shown on hover" (perfume tiles, up to 3,
  comma-separated). Hovering/focusing a perfume tile fades the scent tiles
  (`.phh-tile--scent`: tiles not linking to a product) and wipes its notes into
  random free cells of the 4 x 3 grid (scent cells + empty cells). Note visual,
  **real photos only (owner: no icons)**: the tile's own "Note 1/2/3 photo" upload,
  else the bundled cut-out (lemon, cinnamon, vanilla, iris, lavender, orange, rose,
  cardamom), else the licensed Unsplash photo from `perfume-note-art` (captured and
  asked for at 600 x 780 instead of 240), else the note's name large on its colour. Full-bleed photos get a paper chip
  behind the label. Bergamot and amber cut-outs weren't clean, so they stay uncut.
  No free-licence photo exists yet for patchouli, ambrette or sage (searched
  2026-11-25); upload one in the tile settings to use them.
- Home page notes, checked 2026-11-25, picked from each perfume's published list so
  every note has a real photo (owner asked for photos, not icons): Sauvage EDP
  bergamot, Sichuan pepper, vanilla (dior.com names bergamot, Sichuan pepper,
  vanilla); Dior Homme Intense iris, lavender, cedar (dior.com: iris, cedar;
  lavender from the published pyramid); Stronger With You Intensely pink pepper,
  lavender, vanilla (Sephora key notes); The One EDP orange, tobacco, amber (D&G:
  orange; John Lewis base notes tobacco, amber, cedarwood). Patchouli, ambrette and
  sage were dropped for lack of photos; add them back with uploads if wanted.

## Update 2026-11-25: renamed Samyo → Sangyó

- The owner has the name **Sangyó** registered with the DTI, so every customer-facing
  name in the theme, docs and dev previews now says Sangyó / sangyó (logo text,
  footer wordmark "eau de sangyó", Why Sangyó, ring text, FAQ and delivery copy,
  setting labels). Plain "Sangyo" in code comments.
- **Kept on purpose (technical IDs, never shown as the brand):** image file names
  `samyo-*.webp` (Shopify Files referenced by name in templates), metafield namespace
  `samyo.*` (`retailer`, `price_checked`, `affiliate_offers`), setting ids
  `show_samyo` / `samyo_note`, CSS class `pwb__row--samyo`, JS global
  `SamyoShipping`, localStorage keys `samyo-*`, the repo name and the owner's local
  folder `~/Samyo/feeds`. Renaming any of these breaks saved data or image links;
  images could still be renamed before their first upload.
- Placeholder contact email `hello@samyo.shop` is unchanged until the owner confirms
  the new address/domain.
- Copy that leaned on the old meaning ("to breathe in a scent"): the footer slogan
  "breathe it in" and the Why seal's breathing centre. Check they still fit Sangyó.

## Update 2026-11-25: Why Sangyó, Seal layout

- `perfume-why` has a new **Layout** setting: Seal (new default, used on the home
  page) or Grid (the previous design, unchanged). Owner picked idea 6 of 10.
- Seal: heading centred; a round seal (an open ring of text around a dark
  centre with a word or logo; no hairline circles, owner removed them); promises either side, first half left, rest
  right, on shared rows via `grid-template-rows: subgrid` so pairs line up. Phones:
  seal on top, promises in one left-aligned column.
- Motion (transform/opacity only): ring turns into place and the centre grows in on
  reveal, then promises move out from the seal; centre "breathes" (scale 1→1.035);
  ring motion setting: spins (40s) and turns further with scroll (default) / slow
  spin / scroll only / still.
  Breathing pauses on hover and focus-within. **The ring keeps spinning on hover:
  the owner asked for no interruption (2026-11-25), an exception to the "moving
  content pauses on hover" rule; it still stops under reduced motion.** All motion
  is off under reduced motion.
  Hovering or focusing a promise swaps the centre to that promise's icon.
- Promises (Seal layout): icon on a small disc matching the centre; optional small
  label above each title (new block setting, both layouts); hovering/focusing one
  leans it toward the seal and nudges its link arrow (the others don't fade:
  owner removed that, 2026-11-25)
  (inner `.pw__pt-in`, so it never fights the reveal on the `<li>`). Phones: seal
  on top, promises in a 2 x 2 grid (subgrid rows). Home page links: Authenticity
  (`/pages/authenticity`, create it per SETUP.md), shipping policy, scent guide,
  Find your scent. Delivery line shortened (same meaning).
- Brand pass: stagger 90ms (brand range 60–90ms), colour defaults now the tokens'
  stone `#E8E4DC` / ink `#292521`. Each promise is a flex column with its link
  pushed to the bottom, so links line up across a row (desktop pairs and the phone
  2 x 2 grid).
- Background (both layouts, owner picked ideas 5 + 9 of 10): pastel tiles (hero
  colours, opacity pulse), paper grain (inline SVG noise data URI, no remote asset)
  and 10 faint botanical line drawings (`snippets/perfume-why-botanical.liquid`)
  floating 9s; each a checkbox. Tiles and drawings pause on hover/focus-within and
  stay still under reduced motion; phones show fewer, fainter ones.
- Centre style setting: Embossed (default; lit disc, raised word/logo/icons via
  gradient, inset shadows, text-shadow and drop-shadow) or Flat.
- New settings: ring text (upcased, a " · " joiner is added), centre word, centre
  logo (image), ring motion. Big faint word is now Grid layout only.
- The ring text is deliberately open (owner's choice): natural 0.34em spacing, so it
  stops short and leaves a gap as it orbits; Liquid shrinks long text so it never
  overlaps itself.
- New files: `assets/perfume-why.js` (icon swap, scroll ring),
  `snippets/perfume-why-icon.liquid` (icons shared by promises and the centre).
- Checked in Chromium at 1440 / 900 / 390 px, reduced motion and JS off, with a
  hand-mirrored test page (liquidjs wasn't available to run `dev/render-preview.mjs`).
  Re-run the preview renderer locally to refresh `dev/home.html`.

## Update 2026-11-23: Basic plan and reload persistence

- Calculator now defaults the monthly Shopify Basic cost to ₱1,550, from
  https://www.shopify.com/ph/pricing checked 2026-11-23. Annual billing is shown
  as ₱1,350/month equivalent / ₱16,200 yearly; no subscription was purchased.
  Existing nonblank plan costs are preserved. Cost remains editable for invoice
  taxes/charges; the existing 2% third-party Shopify fee stays separate.
- Fixed-overhead section shows the plan's own cost per order even while apps
  and other fixed costs remain unknown. Unknown overhead still blocks full
  operating profit; enter 0 explicitly if a cost does not apply.
- Local storage now restores the selected set and scent IDs as well as existing
  costs, confirmed flags, tester choice, destination and discount settings.
  Query-string versions of the same page share this browser/origin's saved data.
  A status line reports successful saving or storage failure. No cloud sync.
- Validation: syntax and default-cost migration checks pass; browser reloads
  restore a selected trio, chosen scents, peso/percentage discount, destination
  and edited costs across query-string variants, including `?v=delivery`.
  Existing input values were restored after the persistence check. Basic cost
  displays ₱1,550 / 40 orders = ₱38.75 per order; unknown app/other overhead
  stays unset and is not silently treated as zero.

## Update 2026-11-23: clearer expense labels

- Selected-set breakdown now separates Payment processing fee (percentage plus
  fixed payment fee), Shopify transaction fee, Refund & replacement reserve,
  Delivery we cover, and Item protection (estimate). Fee descriptions show their
  bases; both payment percentages include customer-paid delivery. Delivery we
  cover includes the optional extra subsidy, separately from protection.
- Delivery example also separates customer delivery, merchant delivery and
  protection. Cost input labels use matching plain language. Calculations,
  default rates and profit stay unchanged; this is a presentation breakdown.
- Updated calculation notes to explain payment totals, refund reserves,
  merchant delivery and protection separately. Expense rows reconcile with the
  existing cost calculation across 36 scenarios (discounts, threshold boundaries,
  zero totals and extra subsidies). Syntax/whitespace checks pass. Desktop and
  390px browser checks show the new rows with unchanged profit and no breakdown
  overflow; delivery example shows ₱85 delivery / ₱95 protection separately at
  the NCR ₱10,000 threshold.

## Update 2026-11-23: customer-paid delivery display

- Removed the customer delivery charge row from the selected-set profit/cost
  breakdown in `dev/decant-pricing.html`; it remains in the customer's payment
  summary. Customer-paid courier delivery below ₱10,000 was already excluded
  from merchant costs, so contribution calculations stay unchanged. Merchant
  protection, payment fees on shipping and seller-funded delivery still apply.
- Owner requested no cash labour charge: filling and packing default to ₱0,
  including a one-time migration of existing saved labour inputs. Later manual
  edits remain editable/persistent. Zero labour is omitted from the materials
  breakdown labels; vials, labels and box costs remain. Recommendations re-solve
  using the lower costs, so recommended prices can fall as well as costs.

## Update 2026-11-22: selected-set discount simulator

- `dev/decant-pricing.html#try-set` now has a saved additional-discount value
  and Percentage / Fixed amount (₱) selector beside Try a set. Default is 0.
  Applies after the existing set discount, rounds to cents, caps at the item
  total and recalculates fees, protection, delivery eligibility, contribution,
  margin and contribution after ads for the selected example only. Recommended
  vial prices and the other comparison tables remain the baseline.
- The tray separates item revenue, buyer delivery and total before tax. Profit
  breakdown compares contribution before/after the extra discount. Invalid
  entries show an error and preserve scent choices; zero item revenue shows an
  undefined margin and a loss, while retaining the parcel's delivery charge.
- Verified percentage/fixed discounts, stacking, unchanged perfume costs,
  free-delivery threshold crossing, oversized discounts and zero totals with
  calculation checks; browser checked 10%, ₱50, negative and >100% inputs,
  persisted settings and 390px controls (44px high). No live discount created.

## Update 2026-11-22: delivery policy and calculator

- Local implementation: buyer pays standard delivery below ₱10,000; free standard
  delivery from **₱10,000 after discounts**, before shipping/tax. Affiliate
  retailer purchases are excluded. No commit, push or live checkout change made.
- New global **Sangyó delivery** settings control the origin, threshold, four
  estimated rates and explanatory copy. Working assumption: Metro Manila origin;
  owner has not confirmed dispatch city. Rates: NCR ₱85, Other Luzon ₱178,
  Visayas ₱212, Mindanao ₱234, based on GoGo Xpress's small-pouch pricing plus fuel.
  Confirm route, parcel size and perfume-decant acceptance with the courier.
- `snippets/perfume-delivery-rates.liquid` / `assets/perfume-shipping.css` show
  the policy in the cart drawer, homepage FAQ and product delivery disclosure.
  Minimal Dawn change: one render in `sections/main-cart-footer.liquid`.
  Header announcement and Why copy match; drawer progress uses discounted
  `cart.total_price` and only shows the PHP goal for PHP carts.
- `assets/perfume-shipping.js` supplies cent-based quote calculations to
  `dev/decant-pricing.html`. The calculator has editable rates, destination,
  threshold and item-protection assumptions. Merchant pays estimated protection
  on all orders (1% of value above ₱500); buyer-paid delivery is a pass-through,
  with payment fees on it still expensed. At ₱10,000 the estimated merchant
  delivery/protection expense is ₱180 / ₱273 / ₱307 / ₱329 respectively.
  Protection guidance differs between courier pages: verify the final quote.
- Recommendations and order margins include these expenses already; never
  subtract them twice. The separate ₱10,000 example illustrates a 45–50% margin
  **before** delivery costs. Ads, fixed overhead and taxes remain separate.
  Blank/invalid required inputs now hide dependent figures instead of using zero.
  Existing per-bottle estimates still allocate costs across fractional orders;
  do not treat them as a whole-bottle cash-flow forecast.
- Theme settings and calculator inputs are separate editable settings: update
  both when rates change. Actual checkout rates must also be configured in
  Shopify Shipping and delivery; theme copy cannot enforce them. PHP store
  currency must be correct. See `docs/prompts/delivery-rates-claude.md` for the
  complete implementation/admin handoff and sources.
- Validation: renderer and schema checks pass, theme check retains 14 baseline
  findings. Quote checks cover all regions around the exact threshold, empty
  carts and invalid input. Browser checked NCR/Mindanao at ₱10,000, paid delivery
  at ₱9,999.99, invalid order count hiding results and restoring them, all priced
  set combinations inside 45–50%, homepage FAQ and cart delivery display.

Last updated 2026-11-21, from a Claude Code session. Paths are from the repo root (the theme). Continue from "Next tasks".

## The brief, in short

A premium Shopify store selling authentic designer perfume in the Philippines, which
also helps people research a scent before buying. Design direction:

- **NOHO** (https://noho.ink): calm editorial layout, warm stone colours, split hero
  with a staggered grid of colour-block tiles, a burger menu, a preloader and
  line-by-line text reveals.
- **High Spirits** (the user's own theme, `/Users/angelomiguel/GitHub/High-Spirits`;
  the live store is password-locked): oversized product centre stage, big background
  type, a script accent, product switcher. See `sections/homegrown-brands.liquid`,
  `sections/product-lineup.liquid`, `sections/main-product-hs.liquid` and
  `docs/product-page.md` there.
- Typography: Cormorant Garamond (Hermès-like display serif), Instrument Sans (body),
  Mrs Saint Delafield (signature script, sparingly). All OFL, via Google Fonts.
- Store name first chosen: **Samyo** (Filipino: to breathe in a scent), renamed to **Sangyó** on 2026-11-25 (see the top update). samyo.com is taken;
  samyo.shop / .store / .net were available on 2026-11-20 (not registered; no
  trademark check done).

## What is built

| Area | Files | State |
|---|---|---|
| Design system | `snippets/perfume-head.liquid`, `assets/perfume-tokens.css` | Done. Render the snippet in `<head>`. |
| Header (NOHO nav) | `sections/perfume-header.liquid`, `assets/perfume-header.{css,js}` | Done, previewed desktop + phone. |
| Hero (NOHO hero) | `sections/perfume-hero.liquid`, `assets/perfume-hero.{css,js}` | Done, previewed desktop + phone. |
| Featured showcase | `sections/perfume-showcase.liquid`, `assets/perfume-showcase.{css,js}` | Done, previewed desktop + phone. |
| Scent illustrations | `snippets/perfume-note-art.liquid` (19 SVGs) | Used by the showcase. |
| Placeholder bottles | `snippets/perfume-bottle-art.liquid` | Showcase only, until real photos. The user dislikes these; replace with real product photos. |
| Sample cut-outs | `assets/sample-bottle-{amber,clear,blue,red}.webp`, `assets/sample-scent-{lemon,cinnamon,vanilla}.webp`, `snippets/perfume-sample-image.liquid` | Unsplash photos, background removed. Used by hero tiles and the header's phone menu cards. |

### Header behaviour (recreated from NOHO, own code)

- Desktop ≥990px: logo top-left; Bag box (live count) and burger box top-right. The
  burger unrolls a white bar of links leftwards (`clip-path`), items stagger in,
  burger morphs to X, link text rolls up on hover.
- <990px: row of white boxes (logo / Bag / burger). Burger drops a panel: two product
  cards (blocks, transparent images) then the links as rows.
- `inert` when closed, Escape and outside click close it, closes on breakpoint change.
  Bag count follows Dawn's `PUB_SUB_EVENTS.cartUpdate` or a `cart:updated` event.
- Floats over the hero on the home page (setting), sticky elsewhere.

### Hero behaviour

- Desktop: left half paper, oversized serif heading (one line per textarea line),
  script accent, slogan at the bottom. Right half stone, 7 tiles in NOHO's 2-3-2
  stagger running off the right edge: **4 perfume bottles + 3 scents (lemon,
  cinnamon, vanilla)**, each on its own pastel. Hover lifts the image and shows a
  label ("Top note / Lemon").
- Intro: preloader once per browser session (paper cover, charcoal bar rises, cover
  lifts) → heading lines slide up out of masks → tiles wipe in one by one with the
  image settling from a zoom → accent, slogan, header fade in. Reduced motion skips
  all of it. Inline script adds `.is-pre` before paint; 4s fallback removes it.
- Dot cursor follows the mouse over the hero, grows with a label over linked tiles.
- Phone: stacked (heading, accent, slogan, then the grid at 30vw tiles).

### Showcase behaviour

Four presets (Dior Sauvage, Terre d'Hermès, YSL Libre, Versace Eros) with four notes
each, around a large bottle; colour field changes per perfume; tabs / arrows / swipe /
keyboard; optional autoplay with pause. Notes in the presets are from memory of the
brands' published lists: **verify before launch**.

## Update 2026-11-21: real product images

- Four FragranceX product shots (box + bottle), backgrounds removed:
  `dev/shop-images/samyo-*.webp`. Originals: `dev/source-photos/fragrancex/`.
  Usage conditions: `docs/CREDITS.md` (affiliate terms must allow it).
- `templates/index.json` is the home page: hero + showcase using those images as
  `shopify://shop_images/samyo-*.webp`. **Upload the four .webp files in Shopify
  Settings > Files with the same names** or those image slots will be empty.
- Hero: the 4 bottle tiles are Dior Sauvage, Armani Stronger With You Intensely,
  D&G The One, Dior Homme Intense, each with its own pose (corner position, tilt,
  size, cropping at the tile edge). The 3 scent tiles (lemon, cinnamon, vanilla) use
  the new "Fill the tile" fit. New tile settings: Image fit, Image position, Image
  tilt; Image size now goes to 140%.
- Showcase: the four perfumes above (preset and template), new block settings Image
  tilt and Image horizontal shift; template sets section Bottle scale to 75% so the
  wide box shots leave room for the notes. New note art: iris, grapefruit, cardamom,
  tobacco. Notes used (verify against official lists before launch):
  - Sauvage EDT: bergamot, Sichuan pepper, lavender, ambroxan
  - Dior Homme Intense: lavender, iris, vetiver, cedar
  - The One EDT: grapefruit, cardamom, tobacco, amber
  - Stronger With You Intensely: pink pepper, cinnamon, vanilla, tonka bean
- Buttons still say "Shop fragrance" and fall back to the collection. When the CJ
  feed arrives, set the primary link to the CJ tracking URL and the label to "Buy at
  FragranceX" (and show the affiliate disclosure).
- Source images are small (750px; Armani 397px). Ask CJ's product feed for larger
  images if they look soft on big screens.

## Update 2026-11-21 (later): bottle-only photos, four framings

- Home page now uses bottle-only shots (`dev/shop-images/samyo-*.webp`, see
  CREDITS for the list and the rights caveat). Box versions moved to
  `dev/shop-images/with-box/`.
- Hero bottle tiles each have a different framing (user's request):
  1. Sauvage EDP: close-up (Fill the tile, 125%)
  3. Armani: whole bottle, centred
  5. Dior Homme Intense: half, peeking in from the left, tilted -9°
  7. D&G The One: half, rising from the bottom edge
  New positions: `half-bottom`, `half-left`, `half-right`; Image size now up to 200%.
- Sauvage slide is now the **Eau de Parfum** (notes bergamot, Sichuan pepper,
  lavender, vanilla). The One's concentration is blank until the owner confirms EDT
  or EDP (the new photo's label doesn't say).
- D&G source image is only 173x266: replace with a larger one.

## Update 2026-11-21 (final): everything centred

The owner preferred all bottles centred and upright. Hero bottle tiles: Image fit
"Whole image", position Centre, size 80%, tilt 0. Showcase slides: tilt 0, shift 0
(preset and template). Dior Homme Intense moved to the 4th hero tile and cinnamon to
the 5th (the one that runs off the right edge), so all four bottles are fully
visible. The pose options (positions incl. half, tilt, size to 200%) stay in the
theme editor but are not used.

## Update 2026-11-21: showcase rebuilt as a High Spirits-style carousel + Add to bag

`sections/perfume-showcase.liquid` + `assets/perfume-showcase.{css,js}` now follow
the High Spirits "Homegrown brands" carousel (`/Users/angelomiguel/GitHub/High-Spirits`
`sections/homegrown-brands.liquid`, `styles/sections/_section.homegrown_brands.scss`,
`js/main.js` `HomegrownBrands`), compact:

- Every bottle stands on one floor; its place comes from `data-offset` (distance from
  the chosen one): -1 slips away left and fades, 0 large, 1 at 62%, 2 at 30% and
  higher, 3 hidden. Same emphasized easing, `--ps-dur` (default 800ms). Choose with
  the tabs, a click on a waiting bottle, drag/swipe on the stage, phone arrows,
  keyboard, autoplay. Phone stops keep the next bottle beside the chosen one.
- Floating notes were replaced by illustrated note chips in the panel ("Smells like").
- **Add to bag in place**: blocks with a product and no Primary link render the native
  `{% form 'product' %}` with size pills (variants, price per size, sold-out sizes
  disabled), a button "Add to bag | ₱price", a spritz-mist + fill while adding,
  "Added to bag" after, an aria-live status line, and `cart:updated` /
  Dawn `PUB_SUB_EVENTS.cartUpdate` so the header Bag count updates. Setting a
  Primary link (e.g. a CJ affiliate URL) turns the button into that link instead.
- Removed settings: rail counter, next preview, next label. New: Add to bag on/off,
  price on button, size / add / adding / added labels. Stage height (desktop 500,
  phone 320) replaces bottle height.
- Preview only: `dev/preview-products.json` (placeholder products and prices), a
  `{% form %}` stub and a fake `/cart/add.js` in `dev/render-preview.mjs`.

Queued by the owner, not built yet (items 2–3 done below):
1. NOHO-style 3D product section (two halves, `<model-viewer>`, drag-to-rotate
   cursor "‹ ›", "+" buttons). Owner will send the 3D models (.glb).
2. NOHO-style footer.
3. "The sections we need" for the home page (to agree with the owner).

## Update 2026-11-21: footer, brands strip, scent families

- `sections/perfume-footer.liquid` (+ css/js), footer group: NOHO footer. Sand
  background; full-width email bar = the newsletter (Shopify customer form, tag
  `newsletter`, success / error messages); columns from blocks (menu or text);
  Back to top; giant wordmark ("breathe it in", fills the width; letters rise in);
  legal menu, payment icons, credit line. Reveal: content settles up as the footer
  scrolls in. No separate newsletter section (it would duplicate the footer's bar).
- `sections/perfume-brands.liquid` (+ css): marquee of brand names in the serif
  (names as text; optional logo only with permission), pauses on hover/focus and
  with a Pause toggle (CSS-only checkbox), static under reduced motion.
- `sections/perfume-families.liquid` (+ css): "What do you like to smell like?"
  tiles: Fresh & citrus (lemon), Warm & spicy (cinnamon), Sweet & creamy (vanilla),
  plus a dark "not sure? Find your scent" tile. Wipe-in reveal.
- `assets/perfume-reveal.js` + reveal rules in `perfume-tokens.css`: shared
  `[data-pf-reveal="rise|wipe"]` → `.is-in` on scroll (hidden only once JS ran).
- `templates/index.json` order: hero, showcase, families, brands.
  `sections/header-group.json` (perfume-header; phone menu cards use the Sauvage and
  Armani shop images) and `sections/footer-group.json` (perfume-footer).
- Renderer renders the groups too; link_list settings get sample menus.

## Update 2026-11-21: now a complete Shopify theme

- The repo root is the theme: Shopify Dawn v16.2.0 (downloaded with the owner's OK,
  commit `dd98c2b` = untouched baseline) + the Sangyo files merged in. The old
  `perfume-theme/` subfolder is gone; every path in these docs is now from the root.
- Wiring: `layout/theme.liquid` renders `perfume-head` before `</head>` (fonts, tokens,
  and Dawn's font variables mapped to Cormorant / Instrument Sans so Dawn's own pages
  match); `config/settings_data.json` scheme-1 = Sangyo paper/ink; our
  `templates/index.json`, `sections/header-group.json`, `sections/footer-group.json`
  replace Dawn's. Sangyo CSS sizes switched from rem to px (Dawn's 1rem = 10px) and
  Sangyo sections reset Dawn's global heading colour/letter-spacing.
- Showcase: the chosen bottle is now centred on the stage (was left of centre);
  waiting bottles line up to its right; name and caption centred.
- Lint: `bash dev/check.sh` runs theme check on the whole theme with
  `.theme-check.yml` (MatchingTranslations off: Dawn's locales report ~35k on the
  untouched baseline too) and `scripts/check-schema.js`. Expected 12 findings
  (Dawn 9 + our 3 font warnings).
- Go-live steps: `docs/SETUP.md`. Metafield/metaobject definitions:
  `docs/METAFIELDS.md`.

Next tasks now: (1) connect a store and run `shopify theme dev` (SETUP.md);
(2) product page (`main-product-perfume`) + fragrance profile/story/where-to-buy
sections reading the metafields; (3) NOHO 3D section once the owner sends .glb files;
(4) self-host fonts.

## Fix 2026-11-21: scent-family tiles never appeared

The wipe reveal put `clip-path: inset(100% …)` on the observed tile itself; Chrome's
IntersectionObserver treats a fully clipped target as having no visible area, so it
never fired and the tiles stayed hidden. Now the clip is on the tile's children
(`[data-pf-reveal='wipe'] > *`), and `perfume-reveal.js` also shows anything already
on screen or scrolled past (on load and after scrolling settles). Rule: never put the
hiding clip/transform that a reveal undoes on the element being observed.
Preview renderer now versions asset URLs (`?v=mtime`) like Shopify, so stale cached
CSS/JS can't hide a fix.

## Update 2026-11-21: showcase centred, no tabs, blurred name, smoother drag, spray

- Desktop: the stage spans the whole section behind the text (`grid-area: 1 / 1 / 3 / 3`),
  so the chosen bottle is on the page's centre line (measured: 712 vs 713 px).
  `--ps-slot-w: 24%`, origin `50% - slot/2`.
- Tabs row off by default (`show_tabs`); arrows + "01 —— 04" counter (bar shows
  progress / autoplay) in the stage's bottom-right on desktop, centred on phones.
  Panels become `role="group"` slides when tabs are off; the stage takes ←/→ keys.
- Background name: up to 1.6× the size setting, crops at the page edges for long
  names, centred, `filter: blur(var(--ps-blur))` (new setting, default 6px).
- Drag: bottles follow the pointer per frame (75%, resistance past one step) via the
  independent `translate` property; release past 22% of a step or a flick moves on;
  the offset eases out with the same duration/easing as the glide.
- Spray: JS spawns a cone of droplets + a mist cloud from the button's left
  (pulses while adding, bigger burst when added); off with reduced motion.
- Header/footer text-roll hover fixed (the clipping window no longer moves; only the
  inner line does). Footer wordmark default is now "eau de samyo".
- Phones: caption hidden; arrows get their own row under the bottle.

## Update 2026-11-21: wordmark fix, "sangyó", hero ideas 1–6

- Footer wordmark default "eau de sangyó"; header logo default "sangyó". The wordmark's
  per-letter masks are now larger than the glyphs (padding + negative margin), so
  descenders, the accent and tight letters are never clipped; size 250vw/len.
- Hero gained settings (all **off in templates/index.json** until the owner picks):
  Button + second link (idea 1), Intro speed normal/fast (idea 4, `--phh-k`),
  Always show tile labels on phones/touch (idea 5), Trust points textarea (idea 6).
  Ideas 2 (tile links) and 3 (larger photos) are content, not code.
- Preview: `dev/hero-ideas.html` frames `dev/hero-now.html` and
  `dev/hero-idea-{1,2,4,4-now,5,6}.html` (generated by `dev/render-preview.mjs`).
  Idea 6's trust points are sample text: only use claims that are true.

## Update 2026-11-21: hero ideas switched on

`templates/index.json` hero now has: buttons "Shop fragrances" / "Find your scent";
the original preloader and normal-speed intro (owner chose the longer intro back
after trying the fast one); labels always on phones/touch (with a soft tile-coloured
backing); headline "Find the perfume / that smells / like you"; slogan "Designer
fragrances, delivered across the Philippines"; trust points: "100% authentic designer
fragrances", "Secure checkout", "Scent notes for every perfume, before you buy"
(chosen because they follow from the brief; add COD / delivery times only if true).
Tile links: bottles → `/products/dior-sauvage-eau-de-parfum`,
`/products/emporio-armani-stronger-with-you-intensely`, `/products/dior-homme-intense`,
`/products/dolce-gabbana-the-one` (**create the products with exactly these handles**);
scents → `/collections/fresh-citrus`, `/collections/warm-spicy`,
`/collections/sweet-creamy` (same links on the scent-family tiles).
Idea 3 (sharper photos) is still open: the D&G image is 173×266 px.

## Update 2026-11-21: showcase polish, hero labels, header extras, cart drawer

Idea pages and a Codex prompt for every idea: `docs/prompts/` (README lists what
is built). Previews: `dev/*-ideas.html`, `dev/note-icons.html`.

- **Showcase** (`perfume-showcase`):
  - heading "The Sangyó edit" (kicker "Featured fragrances") replaces "Smell it
    before you buy it";
  - bold-caps brand above a big serif name;
  - the stage fills the top-right and the left column is wider;
  - rolling Add to bag label (default; Spritz is an option);
  - prototypes for rating, compare, mini bag and affiliate (all off on the
    homepage).
- **Scroll entrance** copied from High Spirits:
  - the section pins (sticky inside a `::after` spacer; padding doesn't count
    for sticky) while the bottle grows, the blur clears and the panel rises;
  - auto-plays if already in view; any interaction finishes it;
  - no pin on phones;
  - on desktop the bottle rises from the section's real bottom edge (the screen's
    bottom edge while pinned), not from the stage's bottom, so it is never cut
    mid-air (`.is-rise-free`, `--ps-rise-from` set by JS). Phones keep the stage
    clip so the bottle never passes over the text below it.
- **Buttons are 36px** (the height of a note chip): Add to bag, sizes, arrows,
  pause, close. On touch screens an invisible `::after` adds a 4px margin around
  each, so the 36px buttons get a 44px tap area.
- **Note icons redrawn**: all 23 are now fine ink lines on a pale disc in the note's
  colour, on a 48px grid. `orange_blossom` was in the select but had no drawing;
  it has one now. To change one, edit its `<svg>` in
  `snippets/perfume-note-art.liquid` (one per `when`).
- **Handwritten script lines** (showcase caption, hero accent, taglines, guide and
  quiz script, `.pf-script`) have 0.3em/0.45em padding with matching negative
  margins: Safari clips a moving element's text to its box, which cut the
  script's loops ("fresh, spicy & smooth").
- **Hero tiles**:
  - vertical "spine" labels (`label_style: spine`), coloured per tile (lighten or
    darken the tile colour);
  - shown on hover on desktop, always on touch screens and phones;
  - the cursor says "View" only on tiles linking to a product; scent tiles show
    the plain dot.
- **Header** (`perfume-header`), new settings:
  - Link hover "Glide": a charcoal block slides under the hovered link, using
    transform only.
  - Mega menu: any menu item with child links (Online Store > Navigation) opens a
    wide white panel under the bar on hover, keyboard focus, or a first tap on
    touch screens. Children without their own links show as an A–Z list (Brands);
    children with links show as columns (Shop > Scent families > Fresh & citrus…).
    A "View all" link (`mega_all_label`, [menu] = item name) sits on top.
    - It only appears after the bar has unrolled (`is-settled` removes the bar's
      clip). 2026-11-21 fix: the "over dark sections" colour transition had
      replaced the panel's clip-path transition, so `is-settled` never came and
      the Brands panel never opened. That rule now only touches the boxes, and a
      timer backs up the transitionend.
    - **Menu feature** blocks (menu item name, image, background, caption, link)
      add a picture: one for Brands and one for Shop in `header-group.json`.
    - Escape closes the open mega menu (then the bar).
  - Phones: the menu is a full-height sheet under the boxes (page scroll locked
    while open): a search field on top, large serif rows, a + button that opens a
    mega item's links in place, the two picture cards, Log in at the bottom.
  - Menus: the owner kept the original items (Shop all, Brands, Scent notes,
    Journal, About; 2026-11-22). The Shop columns mega menu and its Menu feature
    block were removed with that; the code still supports columns if a menu item
    gets third-level links. `docs/SETUP.md` ("Navigation") lists the menu.
  - Search opens inside the bar with suggestion links (settings: Search field text,
    Suggestions). Escape or Cancel closes it. Without JS it is a link to /search.
  - **Create the Brands child links in Navigation** when the store exists.
- **Cart drawer**:
  - Files: `snippets/perfume-cart-drawer.liquid`, `assets/perfume-cart-drawer.css/js`.
  - It is rendered by the header (Cart drawer settings) and moves itself to the
    end of `<body>`.
  - It opens from the Bag and after Add to bag in the showcase. The showcase
    setting is After adding = "Open the cart drawer", the new default, used on
    the homepage.
  - It reads `/cart.js` and changes quantities via `/cart/change.js`. After each
    change it publishes Dawn's `cartUpdate` and fires `cart:updated`, so the Bag
    count follows.
  - Accessibility: focus moves in and is trapped; Escape and the backdrop close
    it.
  - Not wired yet: Dawn's own product page (`main-product`) still redirects to
    /cart after adding. Hook its product form to `perfume:cart-open` when the
    product page is built.
- **Preview renderer**:
  - The fake cart now keeps items and supports `/cart/change.js`.
  - Brands has demo child links.
  - Snippets can see the globals (`routes`, `cart`), as on Shopify.

## Update 2026-11-21: product page, collection page, scent guide

Templates now use Sangyo sections (Dawn's originals stay in the theme, unused;
Dawn's old templates are not kept in git history yet because nothing is committed).

- **Product page** (`templates/product.json`):
  - `main-product-perfume`, laid out like the High Spirits product page:
    - breadcrumbs;
    - an info column (brand, name, concentration, stock, price, real-only rating,
      excerpt, Smells like chips, sizes, quantity, rolling Add to bag that opens the
      cart drawer, a trust line);
    - a carousel of bottles on the perfume's tint: the chosen one large, the others
      faded to its right, the big blurred name behind, the tagline under it.
  - Slides are the variants when two or more variants have their own image (picking
    a bottle picks its variant); otherwise the product images. Sizes update the
    price, stock, form and `?variant=` on the page, without waiting for Dawn's
    section update. Files: `assets/perfume-product.css/js`.
  - `perfume-product-notes` ("Scent story"):
    - the wear timeline: Top, then Heart, then Base, with note drawings and
      descriptions from the `fragrance_note` metaobjects, and a line that draws
      across;
    - "How it wears" meters (longevity, projection, sillage, Philippine heat) with
      their source;
    - "Its character" accord bars;
    - "When to wear it": seasons and occasions, plus "Our take (opinion)";
    - Details accordion blocks.
    - Missing data says "Not assessed yet".
  - `perfume-product-rail` ("More to smell"): Shopify recommendations, loaded after
    the page. It is also usable with a collection anywhere, e.g. Best sellers on the
    homepage.
- **Collection page** (`templates/collection.json`):
  - `main-collection-perfume`: big title with the count, the description, and a
    toolbar (Filter drawer, removable active-filter chips, Sort).
  - Then the grid of `perfume-product-card`: tile tint, box photo on hover,
    brand, name, concentration, "from" price, quick Add.
  - Serif pagination.
  - Filters are Shopify's storefront filters: **set them up in the Search &
    Discovery app** (brand, size, price, availability, scent family via the
    `fragrance.fragrance_family` metafield).
- **Scent guide** (`templates/page.scent-guide.json`, section `perfume-scent-guide`):
  - "How to read a perfume", with five parts:
    - an interactive pyramid;
    - the concentration scale;
    - wear words with drawings;
    - a colour wheel of families;
    - tips for Philippine heat.
  - All texts are blocks. Create a page in Shopify and choose the template
    "scent-guide".
- **Shop by scent** (`perfume-families`): no more 01/02 numbers. Under 750px it is
  a carousel: swipe, mouse drag, arrows and dots (`assets/perfume-families.js`).
- New metafields: `fragrance.tagline`, `fragrance.tile_color`, `fragrance.our_take`
  (docs/METAFIELDS.md).
- Previews: `dev/product.html` (Dior Homme Intense, demo prices; notes are the four
  the homepage already shows, performance left empty on purpose),
  `dev/collection.html`, `dev/scent-guide.html`, `dev/sections-needed.html`.
- Product descriptions: the owner chose FragranceX's **CJ product feed** (not
  copying their website). Feed products become **affiliate listings**:
  - a "Buy at FragranceX" tracking link per size, the retailer's price with its
    check date, a disclosure, no Add to bag;
  - built with `scripts/cj-feed-to-shopify.mjs`; full steps in `docs/CJ-FEED.md`;
  - preview: `dev/product-affiliate.html`.
  - Still to do by the owner: download the feed from their CJ account, check the
    programme's licence terms, create the 3 `samyo.*` metafield definitions, then
    import.

## Update 2026-11-21: lineup, testimonials, linked pages, no Pause buttons

- **Bottle lineup** (`perfume-lineup`, `assets/perfume-lineup.css/js`):
  - After High Spirits' Product Lineup, smaller: serif capitals with a handwritten
    line that writes in, then an endless row of overlapping bottles.
  - It drifts slowly, stops while hovered, touched or keyboard-focused, drags with
    mouse or finger, and glides to a stop. Transform only; copies are hidden from
    screen readers.
  - On the product page ("Keep exploring") and the collection page ("More to
    discover").
- **Testimonials** (`perfume-testimonials`, `assets/perfume-reviews.css`):
  - Anchor `#reviews`. Real reviews only: Review blocks copied from customers, or a
    reviews app block. Hidden from shoppers when empty.
  - Product page order: product, Scent story, Testimonials, "You might also like"
    (recommendations), Bottle lineup. The preview shows marked placeholders only.
- **Drawers**: the cart drawer and filter drawer now slide in from the right
  (transform), no longer unroll.
- **No Pause buttons** (owner's choice): removed from the brands strip, the lineup
  and the showcase. Moving content pauses on hover and keyboard focus and stops
  under reduced motion (AGENTS.md updated).
- **Links**: "Find your scent" (hero button and the scent-families tile) now goes
  to `/pages/scent-guide`. **Create the page with the handle `scent-guide`** and the
  template `page.scent-guide`. All previews link to each other (home, collection,
  product, guide).
- Ideas: `dev/navigation-ideas.html` (20 desktop + 20 mobile navigation ideas,
  with what's already built listed at the top).

## Update 2026-11-21: Hermès-inspired cart drawer

The cart drawer gained:

- **A free-delivery progress line under the title**: "₱1,100.00 away from free
  delivery", a dot travelling to a van, then "Free delivery unlocked".
  - Setting: Perfume header › Free delivery from (₱), set to **10000** in
    `header-group.json`; 0 or empty hides it.
  - **The store must really ship free above ₱10,000**: add a free rate with a
    minimum order of ₱10,000 in Settings › Shipping and delivery, or change or
    clear the setting.
- **"Add a gift message"**: saved as the order note through `/cart/update.js`.
- **A bottom strip with three reassurances and an optional help line.**
  - Default text: "Delivered across the Philippines", "100% authentic
    fragrances", "Secure checkout". Keep only what's true.
- **A Hermès-style empty state**: bag drawing, "Your bag is empty", dark
  Continue shopping button.

## Update 2026-11-21: announcement, dark header, sticky buy, Find your scent quiz

- **Announcement line** (Perfume header › Announcement line): a charcoal line above
  the header.
  - One message per line; several roll every 4.5 s and stop while hovered.
  - × hides it for the visit; a changed message shows again.
  - The default messages include "Free delivery on orders over ₱10,000": keep only
    if true.
- **Header over dark sections** (Turn charcoal over dark sections, on): JS reads
  the background colour under the Bag box on scroll; when it's dark, the white boxes
  turn charcoal.
- **Sticky buy** (Perfume product › Show the perfume and Add to bag…):
  - Once the real Add to bag has scrolled away, a white bar shows thumbnail, name,
    size, price and Add to bag. On desktop it sits in the header's row; on phones
    it's at the bottom.
  - Its button submits the real form, so variant and quantity follow. Affiliate
    listings get a "Buy at FragranceX" link instead.
- **Find your scent quiz** (`perfume-quiz`, `templates/page.find-your-scent.json`,
  `assets/perfume-quiz.css/js`):
  - Five questions, one at a time, with a Hermès-like step line, a colour per
    question, Back and Skip.
  - Results: every perfume in the chosen collection (default all, up to 100) scores
    one point per answer whose tags it has, shown with the answers it matched. No
    percentages.
  - **Tag the products** with the answer tags: fresh, citrus, spicy, warm, sweet,
    gourmand, woody, floral, powdery, aromatic / day, night / soft, moderate,
    strong / hot, cool / men, women, unisex. A "scent:" prefix is fine.
  - Create the page with the handle **find-your-scent** and the template
    `page.find-your-scent`.
  - The hero's "Find your scent" button and the families tile now link there.
- Previews: `dev/find-your-scent.html` (example tags on the demo perfumes, labelled
  as such).

## Update 2026-11-21: blending header, real note photos, discovery plan

- **Blending header** (Perfume header › Header background follows the page, on):
  on inner pages the sticky bar takes the colour of the section under it (the
  product's tint, then paper…), so there is no band above the product.
- **Real note photos:** `snippets/perfume-note-art.liquid` renders a transparent
  photo on a disc in the note's colour when one exists (lemon, cinnamon, vanilla so
  far, the Unsplash cut-outs), and the drawing otherwise. Pass `style: 'drawing'` to
  force drawings.
  - To add a photo: put `note-<key>.webp` in assets/ (make the cut-out with the
    Image pipeline below) and add a `when` line to the snippet.
  - A `fragrance_note` metaobject's own image still wins on product pages.
- **Fragrance discovery page:** proposal in `docs/DISCOVERY-PLAN.md`, waiting for
  the owner's decisions (canonical page, score basis, who fills the data) before
  Phase 1.

## Update 2026-11-21: fragrance discovery, Phase 1 (approved plan)

Plan: `docs/DISCOVERY-PLAN.md`. The owner approved:
- the product page is canonical when Sangyó sells the perfume, otherwise the profile
  page;
- Scent DNA uses Sangyó's own 1–5 assessment, labelled;
- the team fills in the data.

Data model: `docs/METAFIELDS.md` › Fragrance profiles (`fragrance_profile`,
`scent_score`, `source_reference`; product `fragrance.profile`).

New sections (all in `assets/perfume-discovery.css/js`):

| Section | What |
|---|---|
| `perfume-fragrance-hero` | Profile pages: full-screen, two-colour background, bottle leans toward the cursor, oversized blurred name, 3 characteristics, tagline, scroll cue |
| `perfume-discovery-nav` | Sticky link row under the header; smooth scroll, current section underlined and kept centred, links to missing sections hidden; when the links don't fit it is a small carousel (faded edges, arrows on the side with more, mouse drag, swipe); sets `--pd-offset` for anchors |
| `perfume-scent-dna` | SVG "scent flower": translucent petals sized by score (no %); choose a petal or a name to see what it adds and its notes; basis and scale shown; tags when unscored |
| `perfume-journey` | Opening → Heart → Dry-down as tabs on a line with three even dots (the line ends at the last dot); the background changes; notes as **real photos**; long lists show 10 then "Show all n notes"; swipe on phones |
| `perfume-performance-lab` | Longevity range on a 0–12h scale. Projection: a silhouette inside three soft concentric scent rings labelled Intimate (in a hug), Moderate (arm's length), Strong (across a room); rings up to the level fill, the level's ring breathes and a ripple spreads to it. Sillage: the same silhouette with ribbons of scent flowing behind and fading (Soft 1 short, Moderate 2, Heavy 3 long). Level buttons preview each level, this perfume's is marked "This perfume"; captions, ring labels and the scent colour are settings. Motion is transform/opacity only, pauses on hover and keyboard focus, none under reduced motion. Basis chip per metric, "Not yet evaluated" when empty |
| `perfume-wear-guide` | When to wear it: day↔night line, four Philippine situations (hot day, office, rain, evening) rated Great/Good/Careful, six occasions |
| `perfume-where-to-buy` | Sangyó sizes, ₱ and Add to bag first; brand site; retailer offers and CJ offers with "Affiliate link" labels, rel="sponsored" and a disclosure |
| `perfume-details` | Fold-out rows: description, observations, sources, pages |

Also in this update:

- **Templates:**
  - `templates/product.json`: product, nav, DNA, journey, lab, when to wear,
    reviews, where to buy, details, related, lineup.
  - New `templates/metaobject/fragrance_profile.json` (turn on web pages for the
    metaobject).
- **Canonical tag (Dawn edit):** `layout/theme.liquid` points a profile page to its
  product when the profile lists one.
- **"Smells like" block:** a "See all [count] notes ↓" link scrolls to `#notes`.
  Notes, concentration and tagline now come from the profile first.
- **Note photos:** every note shows a real photo:
  - Unsplash photos linked from Unsplash's CDN (ids in `docs/CREDITS.md`);
  - lemon, cinnamon and vanilla use the existing cut-outs;
  - patchouli and tonka still have drawings (no suitable free photo found).
- **Old Scent story (`perfume-product-notes`):** no longer on the product page. Its
  line now ends at the last dot and its dots are even.
- **Previews:**
  - `dev/product.html`: honest. Dior Homme Intense with only its four homepage
    notes; everything else reads "not yet evaluated".
  - `dev/fragrance.html`: an invented "Example Fragrance", every value made up and
    labelled, to show every visual and a 13-note list.
- **Next:** Phase 2 (climate selector, occasions panels, similar fragrances), then
  Phase 3 (compare, personal fit).

## Update 2026-11-21: fragrance discovery, Phase 2

- **When to wear it** (`perfume-wear-guide`) is now interactive.
  - **"Made for your climate?":** a selector (Hot day · Office · Rainy day ·
    Evening). Each shows a verdict (Great / Good / Careful, colour-coded), why, what
    helps, how to apply, and when it may feel too much.
  - **Occasions:** six cards that open their verdict and reason.
  - Rich data comes from the `climate_fit` / `occasion_fit` metaobjects
    (`profile.climate`, `profile.occasion_fits`). The Phase 1 simple ratings still
    work. Shared tabs element: `<perfume-tabs>` in `assets/perfume-discovery.js`.
- **Similar fragrances** (`perfume-similar`):
  - Scored in Liquid against a collection (default all, up to 60): 3 per shared
    note, 2 for the same family, 1 per shared characteristic, 1 per shared occasion.
  - The method is printed under the cards, and each card says what it shares.
  - Manual `related` picks come first as "Our pick".
  - CSS `order` ranks the cards without JS; JS keeps the best 4 and adds "Show
    more".
  - It replaces the Shopify-recommendations rail on the product page (the
    `perfume-product-rail` section still exists).
- Templates (product page and profile page) gained Similar after When to wear it,
  and the section nav gained a "Similar" link.
- Previews:
  - `dev/fragrance.html`: example climate and occasion data, all marked as
    examples.
  - `dev/product.html`: Homme Intense matches Sauvage on lavender, using the notes
    the homepage already shows.
- **Next:** Phase 3 (compare two fragrances plus A vs B pages, personal fit quiz).

## Update 2026-11-21: fragrance discovery, Phase 3, and a new Scent DNA

- **Scent DNA redesigned** (the owner didn't like the petal flower):
  - a "scent aura" of blurred colour clouds, one per characteristic, sized by
    score, drifting and blending; it stays alongside the list on desktop;
  - beside it, a ranked editorial list (strongest first): name, "4 of 5 ·
    prominent", a colour bar, and the explanation and real note photos on demand;
  - choosing a row makes its cloud glow.
- **Compare** (`perfume-compare` + `snippets/perfume-compare-col.liquid`):
  - two columns whose rows line up with CSS subgrid: family, main notes,
    character, longevity, projection, sillage, Philippine weather, best for,
    where to buy;
  - equal rows get a "Same" tag;
  - product and profile pages: "Compare with…" any perfume with a profile in the
    chosen collection (up to 12, all in the HTML);
  - **A vs B pages:** the `fragrance_comparison` metaobject (title, a, b, verdict)
    with web pages on, template `templates/metaobject/fragrance_comparison.json`
    (H1 "A vs B", our verdict, the spread), for searches like "Eros vs Sauvage".
- **Is it for you?** (`perfume-fit`):
  - four questions (fresh or warm, subtle or noticeable, everyday or occasions,
    favourite family), compared with the profile's own data;
  - each answer is Yes / Partly / No / Can't tell, with the reason;
  - the verdict is qualitative: Made for you, A good match, Could work with one
    difference, Probably not your style, or We can't tell yet. No percentages.
  - After a "No", a link to Similar appears.
- **Templates and nav:** product and profile pages now run: Scent DNA → Notes →
  Performance → When to wear it → Is it for you? → Similar → Compare →
  (Reviews) → Where to buy → Details. The nav gained "For you" and "Compare".
- **Previews:** `dev/fragrance.html` (all sections) and `dev/compare.html` (A vs
  B), both made-up and labelled.
- The fragrance discovery plan is complete. Still for the owner: create the
  metaobject definitions in Shopify (docs/METAFIELDS.md) and fill profiles.

## Update 2026-11-21: homepage sections + Journal

Homepage order (`templates/index.json`): hero, showcase, families, **Shop by brand**,
**Why Sangyó**, **Journal**, **FAQ**. The old brands marquee (`perfume-brands`) is kept
but switched off (`"disabled": true`); turn it back on in the editor if wanted.

| Section | What it does |
|---|---|
| `perfume-shop-brands` | Brand tiles: the name large on a tint and the count; on hover the brand's bottle rises in. Each block picks the brand **collection** (name, link, count, picture = block image › collection image › first product photo); no collection → `/collections/<name>`. Phones: swipe row. Homepage blocks: 10 brands, pictures only for the 3 we have photos of. |
| `perfume-why` | "Why Sangyó": heading + text + link, then a hairline grid of promises (line icon that draws in, title, line, optional link) and a faint large "sangyó" behind. Defaults only repeat true things (announcement claims, site features). |
| `perfume-journal` | Homepage Journal: newest article as a feature, the next ones as rows; blog picker (falls back to `blogs.journal`); hidden when empty. |
| `perfume-faq` | Accordion on native `<details>` (works without JS; "one open at a time" via `name`), sticky intro + contact link, optional FAQPage JSON-LD. Default answers point to checkout/policies for store-specific facts. |
| `perfume-main-blog` | Blog page (`templates/blog.json`): big title, intro, tag chips (current marked), feature + 3-column grid, paginated. |
| `perfume-main-article` | Article page (`templates/article.json`): back link, tag, title, date · reading time, hero image, readable column (serif headings, drop cap, quotes), Copy link / Facebook / X / Pinterest, "More from the journal". |

Shared card: `snippets/perfume-article-card.liquid`; styles `assets/perfume-journal.css`.
Preview: `dev/journal.html`, `dev/article.html` with **example articles made up for the
preview** (`DEMO_ARTICLES` in `dev/render-preview.mjs`, banner says so); the store writes
its own. Comments on articles are not shown yet.

## Update 2026-11-22: the "eau de sangyó" logo (idea 5, "The spray")

- Header (`perfume-header`, no logo image set, `logo_style: spray`): a small italic
  prefix (`logo_prefix`, "eau de") + the name in **Italiana** + a fine resting mist of
  dots by the last letter (the ó's accent). On hover/keyboard focus, and once ~0.9s
  after load, it sprays: a soft cloud blooms and 16 droplets fan out to the right and
  fade, then the resting mist settles back (`.is-spraying`, transform/opacity only;
  none under reduced motion). `logo_size` default now 34px. `logo_style: text` gives
  the old plain serif.
- Footer giant wordmark (`wordmark_style: logo`): the prefix small and italic, the
  last word in Italiana, letters still rising in.
- Italiana is loaded with the other Google Fonts in `snippets/perfume-head.liquid`.
- Ideas page: `dev/logo-ideas.html` (10 concepts). `dev/name-ideas.html` is unused
  (the owner kept the name).

## Update 2026-11-22: Sangyó edit heading and entrance

- "Featured fragrances / The Sangyó edit" now sits centred across the top of the
  showcase (desktop: its own grid row; the stage is row 2). Heading size defaults
  48px desktop / 36px phone.
- Background perfume name about 20% smaller (`--ps-bgname` × 1.3, cap 220vw/len).
  New setting "Background name style": **Crisp** (default; sharp letters in the
  perfume's colour fading toward the bottom with a mask, no blur — the blur made it
  look low-resolution), **Outline** (fine outlined letters) or **Soft blur** (old look,
  uses "Background name blur").
- Entrance no longer pins the page (the pinned version showed an empty screen for a
  screen of scrolling). It plays by itself (~2.6s) once the section's top passes 70%
  of the screen: "The Sangyó edit" appears large in the centre and glides up to the
  top centre, shrinking (`--h-dx/--h-dy/--h-s`); the bottle rises, the kicker and
  details fade in; last, after a short pause, the perfume's background name appears
  in the centre and drifts up to its resting place a little above centre (`top: 24%`
  of the stage) (`--n-*`). ~3.4s in all. Interaction ends it early;
  reduced motion and the theme editor skip it.

## Update 2026-11-22: Sangyó edit panel (notes line, price by the name)

- Notes: new setting "Notes style", default **One line**: the note photos overlap in
  a row beside one italic line ("bergamot, Sichuan pepper, lavender & vanilla").
  The line is built from the notes (first letters lower-cased) unless the perfume
  block's "Notes line" is filled in (used for Sauvage to keep "Sichuan"). "Chips"
  keeps the old labelled chips. Screen readers hear "Smells like: …".
- Price: shown beside the name with the chosen size ("₱6,200.00 · 60 ml") and
  updated when the size changes (`show_price_name`, on); the Add to bag button no
  longer carries the price (`show_price` now off) and ends with a small bag icon
  that lifts on hover.
- Entrance order: heading (centre → top), bottle, details, then after a short pause
  the background name (~3.4s in all).
- Switching: "Switching controls" setting, default **Dots** (one per perfume, made
  by the script with the perfume name as label; the current one stretches; drag,
  swipe and arrow keys still work). "Arrows with a counter" keeps the old controls.
- Button ideas page: `dev/button-ideas.html` (20 working buttons).
- Switching text motion (smooth, small distances, `--ps-dur` based): the new
  background name writes itself in from the left (clip-path) while drifting 1.5%
  into place; the old one fades while drifting on (`.is-leaving`, set by `go()`);
  the perfume name rises out of a mask; the other panel parts keep their 50ms
  stagger; the handwritten caption writes in left to right after the name. Reduced
  motion: no wipes or drifts.
- Add to bag animation, new default **drop** (`add_animation`): the label rolls
  Adding… → Added ✓, a tiny bottle falls into the bag icon (which wobbles), and a
  light spray (the spritz at 0.45 strength) puffs from the button. "Rolling label"
  and "Spritz" remain options. Reduced motion: no animation (section rule).
- Note photos: vanilla and cinnamon now use real Unsplash photos (ids in
  CREDITS.md) instead of the small cut-outs, so every note in the notes line is a
  photo. Tonka and patchouli keep their drawings: no fitting free photo exists.

## Update 2026-11-22: brand + note masonry ideas, note cut-outs

- Ideas: `dev/brand-section-ideas.html` (10 layouts + 10 Webflow-style animations;
  design 2 = masonry with scent-note photo tiles and Load more) and
  `dev/brand-notes-variants.html` (10 variants with bare cut-out notes; the owner
  loves **8, notes breaking the grid**). Phones: notes a third wide, three per row.
- New transparent note cut-outs in `assets/`: lavender, rose, orange, iris,
  cardamom (sources and ids in CREDITS.md). Recipe: cutout.m → trim alpha 2px
  (erode + slight blur, raw pixels so alpha survives) → to-webp 700.
- **Built** (owner: "build 8"): `perfume-shop-brands` has a new **Layout** setting,
  default **Masonry with scent notes** ("Even grid" keeps the old tiles). Brand
  blocks get a **Size** (normal / big / wide / tall); new **Scent note** blocks
  (name, built-in cut-out lavender/rose/iris/orange/lemon/vanilla/cinnamon/
  cardamom or own transparent image, link, size) show as bare cut-outs, 112% of
  their spot so they spill past it. Tiles unveil with a staggered curtain wipe +
  picture settle when the grid comes into view (`assets/perfume-shop-brands.js`);
  "Tiles shown before Load more" (13) and "Tiles added per Load more" (6). Phones:
  6 columns, brands half (big/wide full), notes a third grouped under the first
  brand. No JS: all tiles show; theme editor: all tiles show; reduced motion: no
  wipe/zoom. Homepage: 10 brands + 8 notes in the variant-8 order, kicker "Shop by
  brand & note".
- Bottle groups in the masonry are bigger and close together (flex row, slight
  overlap, middle bottle taller in front). Brand option **"Bottles break out of the
  tile"** (`spill`) lets them rise above the tile's top edge (on for Dior, Hermès,
  Tom Ford, Versace, Jo Malone on the homepage).

## Decisions to respect

- Stock bottles are unbranded stand-ins for the hero and menu cards only. Do not put
  them in the branded showcase slides.
- No GSAP / Lenis / jQuery (NOHO uses them); everything is CSS transitions + small
  custom elements.
- No smooth-scroll hijacking (accessibility and Core Web Vitals).
- Fragrance data must separate manufacturer facts from community or wear-test
  opinions; no fabricated ratings (see ARCHITECTURE.md → Data model).

## Next tasks (in order)

1. **Pick the real theme.** Create or choose a Dawn-based theme repo (suggested:
   `~/GitHub/samyo-theme`, `shopify theme init` or a Dawn clone), copy this package in,
   add `{% render 'perfume-head' %}` to `layout/theme.liquid`, put `perfume-header`
   in `sections/header-group.json` (replacing Dawn's header), and build
   `templates/index.json` with `perfume-hero` then `perfume-showcase`.
2. **Connect a store** (Shopify CLI `shopify theme dev`) and test in the theme editor:
   block select in the editor, cart count after Add to cart, real menu.
3. **Product page** (`sections/main-product-perfume.liquid`): large bottle, name,
   brand, concentration, size selector via native product form + variants, PHP price,
   stock, Add to cart, shipping note, "Explore fragrance profile" link
   (`#fragrance-profile`). High Spirits PDP is the layout reference.
4. **Fragrance discovery**: `fragrance-profile` (accord bars, notes pyramid,
   performance with sources), `fragrance-story`; metafields/metaobjects per
   ARCHITECTURE.md.
5. **Where to buy**: `retailer_offer` metaobjects; disclosure only when an approved
   affiliate URL exists.
6. **SEO + performance**: Product + BreadcrumbList JSON-LD, breadcrumbs, self-host the
   fonts (removes the 3 RemoteAsset warnings), check LCP with the preloader on.
7. Open polish items:
   - NOHO's quote section (big centred statement with small inline images in the
     words) and its numbered "advantages" cards are natural next homepage sections.
   - Smooth scrolling of the showcase's phone tab strip is unverified (the preview
     pane didn't animate it).
   - Hero tiles have no links in the preset; add collection links so the cursor's
     "View" state shows.

## Image pipeline

Source photos (Unsplash License) are in `dev/source-photos/`.

```sh
# 1. Cut out (Apple Vision subject lifting). Objective-C on purpose: this Mac's
#    Command Line Tools Swift is broken (duplicate SwiftBridging module map).
clang -fobjc-arc -framework Foundation -framework Vision -framework CoreImage \
  -framework CoreVideo -framework CoreGraphics dev/tools/cutout.m -o /tmp/cutout
/tmp/cutout dev/source-photos/bottle-amber.jpg assets/sample-bottle-amber.png 1200 25
#   args: in, out.png, max height, % of subject height to trim off the bottom
#   (25 removes the amber bottle's mirror reflection)

# 2. PNG -> WebP with alpha (sips can't write WebP; borrow sharp from a local project)
SHARP=/Users/angelomiguel/GitHub/brochure-shop/node_modules/sharp node dev/tools/to-webp.mjs
```

Retailer photos on pure white (box + bottle) cut out better with the white-background
flood fill than with Vision (clear glass confuses Vision):

```sh
SHARP=/Users/angelomiguel/GitHub/brochure-shop/node_modules/sharp \
  node dev/tools/whitebg-cutout.mjs <in.png> dev/shop-images/samyo-<name>.png 0,0,1,1 244
#   region x0,y0,x1,y1 (fractions; e.g. 0,0,1,0.918 trims a mirror reflection), white threshold
SHARP=... node dev/tools/to-webp.mjs dev/shop-images 900 900
```

If you add or resize a sample, update the width/height in
`snippets/perfume-sample-image.liquid` and the table in `docs/CREDITS.md`.

## Where this folder lives

It was created in a Claude Code session's temporary workspace. Move it to a permanent
folder (and into git) before relying on it; deleting that session deletes the folder.

## Update 2026-11-21: approved palette, rounded lineup, brand bottle groups, design choices

- Applied the owner's approved palette: ivory `#F7F5F0`, stone `#E8E4DC`,
  taupe `#D8D1C5`, espresso `#292521`, olive script `#686A54`. Tokens,
  hero neutral defaults, header/footer and collection defaults are aligned.
  Small Dawn change: scheme-1 values in `config/settings_data.json` match it.
- Header colours are editable. 2026-11-22: the owner asked for the original look
  back: the header bar is **transparent** (no band, no line) on every page and only
  its white boxes float; the menu icon unrolls the boxed links. "Box colour"
  (`background_color`, white) colours the boxes and panels; "Header background
  follows the page" (blend) is on again so inner pages show no band (the header
  takes the colour of the section under it); no bottom line.
  Dark adaptation is off in the group to keep this palette stable; both existing
  adaptive options remain available.
- Bottle lineup: smaller heading, script separated from capitals, 5% overlap,
  bottom corners 40px desktop / 28px phone and a soft offset shadow. Background,
  script colour, surrounding colour, radii, shadow toggle and phone bottle width
  are editable. `pl-surround` provides the taupe behind the curved corners.
- Shop by brand: three editable image pickers per tile, with optional fallback
  to the collection's first three product photos. Groups stay visible on desktop
  and phone. The home template references 30 Shopify Files images.
- Brand cut-outs rechecked after the owner spotted box fragments: use standalone
  bottle shots where packaging overlaps; remove detached packaging strips in
  `dev/tools/prepare-brand-tiles.mjs`. No product labels have been regenerated.
  Original photos, selected alternatives and crop rectangles are in
  `dev/source-photos/brand-tiles/sources.json`; images/rights: CREDITS.md.
- The owner requested **10 compact notes ideas** and **10 Why Sangyó ideas**.
  Previews: `dev/notes-ideas.html` and `dev/why-ideas.html`, linked to each other;
  Desktop/Phone toggles and working tabs/accordions. The selected idea is in the
  URL hash. These are proposals: the existing journey and Why section are still
  the live theme versions until the owner picks an option.
- Build choices after rendering: `python3 dev/tools/build-design-ideas.py`. It
  reads the current Why copy and the current product preview's notes; no new
  fragrance-note or performance claims were introduced.
- Validation: static preview rendered; all 20 design layouts checked at desktop
  and 390px, with no horizontal overflow or broken images. Whole-theme lint
  remains the documented 14 baseline findings; schemas pass.

## Fix 2026-11-22: first sync to the live store (eau-de-s-a-m-y-o.myshopify.com)

The store is connected to GitHub (AngeloMig/eud-de-samyo, branch `main`) through
Online Store → Themes → Connect from GitHub. The first sync rejected 9 files: Shopify
allows **at most 50 characters in a select option's label**, and perfume-header
(`logo_style`), perfume-hero (`label_style`), perfume-showcase (`notes_style`) and
perfume-footer (`wordmark_style`) had longer ones. Those four sections failed, and with
them `header-group.json`, `footer-group.json` and `templates/index.json`, which refer to
them, so the homepage showed a 404. The labels are shortened, and
`scripts/check-schema.js` now fails on any plain option label over 50 characters.
Sync errors are under the theme's GitHub chip → View logs.

## Update 2026-11-22: Webflow-inspired perfume footer

- GitHub connection verified: origin is `AngeloMig/eud-de-samyo`; local `main`
  matched GitHub `main` at `1f2d657` before this work. GitHub's default branch is
  still `angelo/samyo-theme` (at `80ff089`), distinct from the Shopify-connected
  `main` branch. No remote settings were changed.
- New local branch: `codex/perfume-footer-redesign`. These changes have not been
  committed or pushed, so they have not triggered Shopify's GitHub sync.
- `perfume-footer` now offers **Scent blotters** and **Original** designs. The
  footer group selects Scent blotters. New invitation/newsletter copy is editable.
- The new layout pairs large editorial type and three ingredient sampling papers
  on the left with the newsletter and menu columns on the right. Three `scent`
  blocks expose the label, collection URL, tint, bundled ingredient and optional
  image. Bundled lemon/cinnamon/vanilla use the existing credited cut-outs.
- Native Shopify customer/newsletter form, error/success output, dynamic menus,
  payment types and Back to top remain. Added invalid-email interception and fixed
  duplicate accessible names from rolling text. No fake signup-success state.
- On phones, Shop/Help use native details/summary disclosures; the editor can turn
  collapsing off. Without JS the menus remain open. All phone links/buttons meet
  44px targets. New layout avoids the old under-page reveal and keeps the wordmark
  visible if JS fails. Original retains its reveal option.
- Review: `dev/footer-new.html` and `dev/footer-original.html`, generated by
  `dev/render-preview.mjs`, link to each other. Home/collection/product previews
  also use the new footer.
- Inspiration research (layout references only; no template code or photos copied):
  https://webflow.com/made-in-webflow/footer
  https://webflow.com/templates/html/scent-beauty-website-template
  https://webflow.com/made-in-webflow/website/willey-fragrance-117c29e2ec57384aa0230d
- Validation: static renderer and schema rules pass; theme check retains the
  documented 14 baseline findings. Desktop, tablet and 320/390px overflow/touch
  checks pass. Native invalid-email handling and Back to top focus were checked.
  Real Shopify newsletter submission still needs a store preview check.

## Update 2026-11-22: remove footer scent strips

- Owner rejected the three scent-family papers in the footer. Removed their
  rendered markup, schema blocks, preset/group entries and CSS. The new footer
  design is labelled Editorial; invitation, scent finder, newsletter, menus and
  large `eau de sangyó` wordmark remain.
- Owner asked for 10 animation ideas specifically for the footer wordmark. Ideas
  are advisory pending a choice; no new wordmark animation has been selected.
- This checkout was already on `angelo/rose-centre` with other changes in progress;
  unrelated brand-grid and homepage changes were preserved.

## Update 2026-11-22: ten footer wordmark animation previews

- `dev/footer-motion.html` compares the 10 requested ideas: spritz reveal, letter
  rise, gentle breath, scroll unveil, prefix first, accent flourish, centre outward,
  perspective tilt, magnetic hover and outline to ink.
- Uses the actual rendered footer wordmark/fonts. Controls: replay, wordmark-only
  or full-footer context, desktop/390px phone sizing, and reduced-motion simulation.
  Normal playback also honours the OS reduced-motion preference. All entrances
  are finite; the magnetic option additionally follows a mouse pointer.
- Everything for these studies is under `dev/`; no animation has been selected or
  added to the Shopify footer. No libraries, new photos or generated logos.
- `dev/tools/build-footer-motion.mjs` generates the gallery and its 10 pages from
  `dev/footer-new.html`; it also runs automatically in `dev/render-preview.mjs`.
  Standalone rebuild: `node dev/tools/build-footer-motion.mjs` after rendering.
- Validation: all ten played/settled on desktop and 390px without overflow or
  hidden final lettering; all ten stayed static under reduced-motion simulation.
  Replay, full-footer scroll entrance and actual magnetic pointer response checked.
  Extra space preserves the wordmark's descender and accent. JS syntax checks pass.

## Update 2026-11-22: selected signature and perfume hover

- Owner chose footer animation **5, Prefix first**, then requested a recessed 3D
  hover and a perfume-related treatment. The local footer now uses #5 once on
  entering view. Hover blends the ink into a debossed finish, with one short,
  upward-drifting atomiser mist. Moving away restores the ink. No continuous loop.
- Theme editor settings control entrance, engraved finish, engraving depth and
  perfume mist. The decorative duplicate lettering is inside the existing
  aria-hidden wordmark. Default text stays visible without JS; reduced motion
  skips entrance/mist and changes the hover finish without movement.
- `dev/footer-signature.html` previews the selected production code; Replay and
  Preview perfume hover are local-only controls, including for touch review.
  `dev/footer-new.html` shows it in the full footer. The original ten studies turn
  off production effects to avoid double playback. Renderer rebuilds all pages.
- Validation: renderer, JS syntax and section schemas pass; theme check retains
  the same 14 findings. The 320px and 390px previews fit without horizontal
  overflow; entrance, engraved finish, reset and temporary mist cleanup checked.
- Still local on `angelo/rose-centre`; no commit, push or Shopify sync performed.

## Update 2026-11-22: ten perfume hover directions

- Owner requested 10 perfume-related hover ideas for the footer signature.
  `dev/footer-hover.html` compares atomiser engraving, scent trails, evaporation,
  amber infusion, bottle-glass refraction, blotter impression, fragrance ripples,
  top/heart/base impressions, liquid signature and accent spritz.
- Each study retains entrance #5. Try hover supports touch/keyboard review;
  pointer hover, entrance replay, full-footer context, phone sizing and reduced
  motion simulation are available. Effects are finite and clear on exit/reset.
- All new directions live under `dev/`; the selected production treatment stays
  unchanged. No new product images, fragrance claims or animation libraries.
- `dev/tools/build-footer-hover.mjs` generates the gallery and its 10 pages from
  the actual rendered footer. It runs inside `dev/render-preview.mjs`.
- Validation: all ten play and reset with visible lettering and no leftover
  decorative nodes; all ten fit the 390px preview; reduced-motion simulation
  creates no animations or temporary artwork. Renderer, JS syntax and schemas pass.
