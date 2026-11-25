# Menu bar: 10 ideas

Preview: `dev/nav-ideas.html` (serve the repo root, see AGENTS.md). The owner picked 2, 5, 6 and 7 (7 as the cart drawer); they are built.

Rules for every prompt (from AGENTS.md): read `AGENTS.md` and `docs/HANDOFF.md` first; prefer new `perfume-*` files over editing Dawn; every setting editable in the theme editor, no hardcoded products; px sizes (Dawn sets 1rem = 10px); motion with transform / opacity / clip-path only plus a `prefers-reduced-motion` path; content never hidden if JS fails; real buttons, `aria-expanded`, visible focus, 44px touch targets on phones; never invent notes, ratings, longevity or claims (empty data shows nothing or "not assessed yet"). Finish with `bash dev/check.sh` (expect 12 findings, "Schemas OK") and re-render the preview (`node dev/render-preview.mjs`, see AGENTS.md).

| # | Idea | Status |
|---|---|---|
| 1 | Shop links apart from utilities | Open |
| 2 | Brands mega panel | Done: Show sub-menus as a panel + Menu feature block. Child links come from Online Store > Navigation. |
| 3 | Scent notes dropdown in family colours | Open |
| 4 | An image peeks out under each link | Open |
| 5 | A dark block glides between links | Done: Link hover = Glide (default). |
| 6 | Search opens inside the bar | Done: Search field text + Suggestions settings. |
| 7 | Peek into the bag | Done as the cart drawer (snippets/perfume-cart-drawer.liquid), opened by a click. |
| 8 | Small index numbers | Open |
| 9 | Serif italic shop links | Open |
| 10 | Hides on scroll down, returns on scroll up | Open |

## 1. Shop links apart from utilities

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Shop links apart from utilities" from dev/nav-ideas.html.
What it does: Shop links in one bar; Search and Account become 36px icon boxes next to the Bag, after a small gap.
Keep text labels for screen readers (visually hidden).
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 2. Brands mega panel

**Status:** Done: Show sub-menus as a panel + Menu feature block. Child links come from Online Store > Navigation.

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Brands mega panel" from dev/nav-ideas.html.
What it does: Hovering a menu item with child links opens a white panel under the bar, A–Z with letter marks, plus an optional featured image.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 3. Scent notes dropdown in family colours

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Scent notes dropdown in family colours" from dev/nav-ideas.html.
What it does: Hovering Scent notes lists the families with a colour dot and the product count of each collection.
Reuse the sub-menu panel; colour from a new color setting per family (or collection metafield); counts from collection.products_count.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 4. An image peeks out under each link

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "An image peeks out under each link" from dev/nav-ideas.html.
What it does: Hovering a link wipes in a small picture under it.
One image picker per link via blocks keyed by menu item title (like the Menu feature block).
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 5. A dark block glides between links

**Status:** Done: Link hover = Glide (default).

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "A dark block glides between links" from dev/nav-ideas.html.
What it does: A charcoal block slides from link to link on hover; text turns white.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 6. Search opens inside the bar

**Status:** Done: Search field text + Suggestions settings.

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Search opens inside the bar" from dev/nav-ideas.html.
What it does: Search turns the bar into a serif search field with suggestion links.
Next step if wanted: live results from /search/suggest.json (predictive search).
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 7. Peek into the bag

**Status:** Done as the cart drawer (snippets/perfume-cart-drawer.liquid), opened by a click.

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Peek into the bag" from dev/nav-ideas.html.
What it does: Bag shows the items, subtotal and Checkout.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 8. Small index numbers

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Small index numbers" from dev/nav-ideas.html.
What it does: Tiny 01, 02, 03 before each shop link.
CSS counter only, a checkbox setting.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 9. Serif italic shop links

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Serif italic shop links" from dev/nav-ideas.html.
What it does: Shop links in Cormorant italic, utilities small and grey.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 10. Hides on scroll down, returns on scroll up

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-header.liquid, assets/perfume-header.css/js). Build idea "Hides on scroll down, returns on scroll up" from dev/nav-ideas.html.
What it does: Header slides away while reading down, back on any scroll up.
Only for the sticky (non-overlay) header; transform only; never hide while the menu or drawer is open.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```
