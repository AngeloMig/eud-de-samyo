# Add to bag: 10 animation ideas

Preview: `dev/add-to-cart-ideas.html` (serve the repo root, see AGENTS.md). The owner chose the rolling label (Add to bag animation = Rolling label, the default).

Rules for every prompt (from AGENTS.md): read `AGENTS.md` and `docs/HANDOFF.md` first; prefer new `perfume-*` files over editing Dawn; every setting editable in the theme editor, no hardcoded products; px sizes (Dawn sets 1rem = 10px); motion with transform / opacity / clip-path only plus a `prefers-reduced-motion` path; content never hidden if JS fails; real buttons, `aria-expanded`, visible focus, 44px touch targets on phones; never invent notes, ratings, longevity or claims (empty data shows nothing or "not assessed yet"). Finish with `bash dev/check.sh` (expect 12 findings, "Schemas OK") and re-render the preview (`node dev/render-preview.mjs`, see AGENTS.md).

| # | Idea | Status |
|---|---|---|
| 1 | Spritz | Done (option: Spritz) |
| 2 | Bottle to bag | Open |
| 3 | Juice fills the button | Open |
| 4 | Colour bloom | Open |
| 5 | Scent trail | Open |
| 6 | Morph to a ring | Open |
| 7 | Note petals | Open |
| 8 | Cap twist | Open |
| 9 | Rolling label | Done (default) |
| 10 | Shimmer + spring | Open |

## 1. Spritz

**Status:** Done (option: Spritz)

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Spritz" from dev/add-to-cart-ideas.html.
What it does: Droplets and a mist puff from the atomizer side.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 2. Bottle to bag

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Bottle to bag" from dev/add-to-cart-ideas.html.
What it does: A tiny bottle arcs into the header Bag, which bumps.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 3. Juice fills the button

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Juice fills the button" from dev/add-to-cart-ideas.html.
What it does: The button fills with the perfume's colour.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 4. Colour bloom

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Colour bloom" from dev/add-to-cart-ideas.html.
What it does: An accent-colour bloom from the tap point.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 5. Scent trail

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Scent trail" from dev/add-to-cart-ideas.html.
What it does: A handwritten note word writes itself and drifts away.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 6. Morph to a ring

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Morph to a ring" from dev/add-to-cart-ideas.html.
What it does: The button shrinks into a spinning ring, then opens to Added.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 7. Note petals

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Note petals" from dev/add-to-cart-ideas.html.
What it does: Note icons burst out as petals.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 8. Cap twist

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Cap twist" from dev/add-to-cart-ideas.html.
What it does: A tiny bottle twists its cap while adding.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 9. Rolling label

**Status:** Done (default)

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Rolling label" from dev/add-to-cart-ideas.html.
What it does: Adding… then Added ✓ roll up through the label.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 10. Shimmer + spring

**Status:** Open

Prompt for Codex:

```text
Samyo theme (assets/perfume-showcase.css/js (bindCart, spray)). Build idea "Shimmer + spring" from dev/add-to-cart-ideas.html.
What it does: Press in, shimmer, spring back.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```
