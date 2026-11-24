# Samyo perfume theme: agent instructions (Codex, Claude Code, others)

Read `docs/HANDOFF.md` first: current status, decisions already made, and the next
tasks in order. Going live: `docs/SETUP.md`. Fragrance data model:
`docs/METAFIELDS.md`. Design and architecture: `docs/ARCHITECTURE.md`. Image sources
and usage conditions: `docs/CREDITS.md`.

## Facts

- What: the Shopify theme for **Samyo**, a premium multi-brand perfume store
  (Dior, Hermès, Chanel, YSL…) for the Philippines (PHP prices).
- This repo root **is the theme**: Shopify **Dawn v16.2.0** plus the Samyo sections.
  Git: commit `dd98c2b` is untouched Dawn, so `git diff dd98c2b` shows every Samyo
  change. Samyo files are prefixed `perfume-` (sections, snippets, assets) plus
  `templates/index.json`, `sections/header-group.json`, `sections/footer-group.json`,
  the `render 'perfume-head'` line in `layout/theme.liquid` and the scheme-1 colours
  in `config/settings_data.json`.
- Local only (not uploaded, see `.shopifyignore`): `dev/` (previews, image tools,
  source photos, product cut-outs for Shopify Files), `docs/`, `scripts/`.
- No store connected yet. Plain Liquid + CSS + vanilla JS; no build step, no
  animation libraries.

## Commands

```sh
# Real store preview (needs a store):
shopify theme dev --store YOUR-STORE.myshopify.com

# Static preview without a store: renders the Samyo sections from templates/index.json
# and the header/footer groups into dev/home.html (+ dev/preview.html = showcase).
# liquidjs is borrowed from another local project's node_modules.
LIQUIDJS=/Users/angelomiguel/GitHub/High-Spirits/node_modules/liquidjs node dev/render-preview.mjs
python3 -m http.server 4320 --bind 127.0.0.1   # from the repo root; 4173/4319 are taken here
#   open http://127.0.0.1:4320/dev/home.html   (demo products/prices: preview only)

# Lint: theme check on the whole theme + save-time schema rules (scripts/check-schema.js).
# Expected: 14 findings = Dawn's own 9 (identical on the baseline) + 3 RemoteAsset
# (Google Fonts in snippets/perfume-head.liquid) + 1 RemoteAsset (Unsplash note photos
# in snippets/perfume-note-art.liquid) + 1 RemoteAsset false positive (the profile
# canonical <link> in layout/theme.liquid); "Schemas OK".
bash dev/check.sh
```

Image tools (new cut-outs): `docs/HANDOFF.md` → "Image pipeline".

## Rules

- Prefer adding `perfume-*` files over editing Dawn's; when you must edit a Dawn
  file, keep the change small and note it in `docs/HANDOFF.md`.
- Every section setting must stay editable in the theme editor; no hardcoded products.
- Section schemas: range defaults on a step, at most 101 steps, `unit` at most 3
  characters; one `link_list` (and one `page`) per settings list in header/footer
  groups; filters can't take filtered arguments (assign first); render-tag arguments
  can't use filters either. JSON templates/groups must only use existing blocks and
  valid setting values.
- Sizes in Samyo CSS are px: Dawn sets `html { font-size: 62.5% }` (1rem = 10px).
- Motion: transform / opacity / clip-path only; always a `prefers-reduced-motion`
  path; never leave content hidden if JS fails (hero: 4s fallback; reveals only hide
  under `html.pf-js`).
- Accessibility: real buttons, `aria-expanded`, `inert` on closed panels, visible
  focus, 44px touch targets on phones. Moving content pauses on hover and keyboard
  focus and stops under reduced motion; the owner chose no visible Pause buttons
  (2026-11-21), so don't add them back.
  Exception: the Why Samyó seal ring keeps spinning on hover (owner, 2026-11-25);
  it still stops under reduced motion.
- **Never** label an unbranded stock bottle as a real brand's perfume, and never copy
  brand photos from brand websites yourself. Product photos come from the owner
  (see `docs/CREDITS.md` for the conditions on the current ones).
- **Never** invent fragrance notes, ratings, longevity or performance claims. Notes
  must match the brand's official list; empty data shows "not assessed yet".
- Demo products and prices exist only in `dev/preview-products.json` for previews.

## Danger zones

- `assets/sample-*.webp` and `dev/shop-images/*.webp`: generated; regenerate with the
  pipeline instead of editing.
- The inline `<script>` at the bottom of `sections/perfume-hero.liquid` sets the intro
  start state before first paint; keep it tiny and keep its fallback timeout.
- `perfume-header` must stay in the header group, `perfume-footer` in the footer group.
- `templates/index.json` references Shopify Files by name (`shopify://shop_images/…`);
  renaming an image means re-uploading it under the new name.
