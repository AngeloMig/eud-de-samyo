# Product section: 20 ideas

Preview: `dev/product-section-ideas.html` (serve the repo root, see AGENTS.md). Built so far in this section: rating, compare, mini bag, FragranceX link, rolling Add to bag, cart drawer, pinned scroll entrance, 36px buttons.

Rules for every prompt (from AGENTS.md): read `AGENTS.md` and `docs/HANDOFF.md` first; prefer new `perfume-*` files over editing Dawn; every setting editable in the theme editor, no hardcoded products; px sizes (Dawn sets 1rem = 10px); motion with transform / opacity / clip-path only plus a `prefers-reduced-motion` path; content never hidden if JS fails; real buttons, `aria-expanded`, visible focus, 44px touch targets on phones; never invent notes, ratings, longevity or claims (empty data shows nothing or "not assessed yet"). Finish with `bash dev/check.sh` (expect 12 findings, "Schemas OK") and re-render the preview (`node dev/render-preview.mjs`, see AGENTS.md).

| # | Idea | Status |
|---|---|---|
| 1 | Size pills show the price per ml | Open |
| 2 | Notes grouped Top · Heart · Base | Open |
| 3 | Scent family tag in its colour | Open |
| 4 | What EDP means, on tap | Open |
| 5 | "Our take", clearly labelled | Open |
| 6 | When to wear it | Open |
| 7 | Try a 5 ml decant first | Open |
| 8 | Delivery and authenticity line | Open |
| 9 | Payment options you accept | Open |
| 10 | Save for later (heart) | Open |
| 11 | Full details drawer | Open |
| 12 | "Similar vibe" link | Open |
| 13 | Names strip under the bottles | Open |
| 14 | Background colour per perfume | Open |
| 15 | Bottle tilts toward the cursor | Open |
| 16 | Loupe on the label | Open |
| 17 | Notes drift out of the bottle | Open |
| 18 | Progress ring on the arrow | Open |
| 19 | "Drag" cursor on the stage | Open |
| 20 | Gift message at Add to bag | Open |

## 1. Size pills show the price per ml

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Size pills show the price per ml" from dev/product-section-ideas.html.
What it does: ₱/ml under each size from the variant price and the ml in its title.
Parse the number before 'ml' in the variant title; skip when absent.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 2. Notes grouped Top · Heart · Base

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Notes grouped Top · Heart · Base" from dev/product-section-ideas.html.
What it does: Chips in three rows.
Same as note-chip idea 1.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 3. Scent family tag in its colour

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Scent family tag in its colour" from dev/product-section-ideas.html.
What it does: A coloured family tag above the name linking to the family.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 4. What EDP means, on tap

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "What EDP means, on tap" from dev/product-section-ideas.html.
What it does: An info button explaining the concentration in one general line.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 5. "Our take", clearly labelled

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea ""Our take", clearly labelled" from dev/product-section-ideas.html.
What it does: One staff sentence in the script font under an OUR TAKE label.
Empty = nothing shows.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 6. When to wear it

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "When to wear it" from dev/product-section-ideas.html.
What it does: Day/Night and weather tags from the owner's own wear notes.
Empty data shows "not assessed yet".
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 7. Try a 5 ml decant first

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Try a 5 ml decant first" from dev/product-section-ideas.html.
What it does: A link to a decant product under Add to bag.
Product picker per block; hidden when empty.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 8. Delivery and authenticity line

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Delivery and authenticity line" from dev/product-section-ideas.html.
What it does: One quiet line of owner-set text under the button.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 9. Payment options you accept

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Payment options you accept" from dev/product-section-ideas.html.
What it does: Payment names/icons from shop.enabled_payment_types.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 10. Save for later (heart)

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Save for later (heart)" from dev/product-section-ideas.html.
What it does: A wishlist heart next to the name.
localStorage wrapped in try/catch, or an app hook.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 11. Full details drawer

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Full details drawer" from dev/product-section-ideas.html.
What it does: A side drawer with description, pyramid and sizes.
Reuse the cart drawer's styles (assets/perfume-cart-drawer.css).
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 12. "Similar vibe" link

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea ""Similar vibe" link" from dev/product-section-ideas.html.
What it does: One editor-picked product link per perfume.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 13. Names strip under the bottles

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Names strip under the bottles" from dev/product-section-ideas.html.
What it does: All perfume names under the stage; click to jump.
Reuse go(index) in perfume-showcase.js.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 14. Background colour per perfume

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Background colour per perfume" from dev/product-section-ideas.html.
What it does: Soft cross-fade of each block's background colour.
Cross-fade with an opacity layer, not a background-color transition.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 15. Bottle tilts toward the cursor

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Bottle tilts toward the cursor" from dev/product-section-ideas.html.
What it does: A few degrees of tilt toward the mouse on desktop.
Pointer: fine only; rAF; reduced motion = off.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 16. Loupe on the label

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Loupe on the label" from dev/product-section-ideas.html.
What it does: Round magnifier over the bottle.
Only with 900px+ images.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 17. Notes drift out of the bottle

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Notes drift out of the bottle" from dev/product-section-ideas.html.
What it does: Note icons float out and settle into the chips when a perfume becomes active.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 18. Progress ring on the arrow

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Progress ring on the arrow" from dev/product-section-ideas.html.
What it does: A thin ring fills around Next during autoplay.
Drive it from the existing autoplay timer.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 19. "Drag" cursor on the stage

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea ""Drag" cursor on the stage" from dev/product-section-ideas.html.
What it does: The dot cursor grows into DRAG over the bottles.
Share the hero's cursor code.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 20. Gift message at Add to bag

**Status:** Open

Prompt for Codex:

```text
Samyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css/js). Build idea "Gift message at Add to bag" from dev/product-section-ideas.html.
What it does: A gift tick that reveals a note field saved as a line item property.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```
