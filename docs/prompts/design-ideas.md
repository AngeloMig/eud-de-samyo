# Site design: 20 ideas

Preview: `dev/design-ideas.html` (serve the repo root, see AGENTS.md). Site-wide ideas (not only the product section).

Rules for every prompt (from AGENTS.md): read `AGENTS.md` and `docs/HANDOFF.md` first; prefer new `perfume-*` files over editing Dawn; every setting editable in the theme editor, no hardcoded products; px sizes (Dawn sets 1rem = 10px); motion with transform / opacity / clip-path only plus a `prefers-reduced-motion` path; content never hidden if JS fails; real buttons, `aria-expanded`, visible focus, 44px touch targets on phones; never invent notes, ratings, longevity or claims (empty data shows nothing or "not assessed yet"). Finish with `bash dev/check.sh` (expect 12 findings, "Schemas OK") and re-render the preview (`node dev/render-preview.mjs`, see AGENTS.md).

| # | Idea | Status |
|---|---|---|
| 1 | Sticky buy bar | Open |
| 2 | One colour per scent family | Open |
| 3 | "What does it smell like?" note tips | Open |
| 4 | Subtle paper texture | Open |
| 5 | Big statement with images in the words | Open |
| 6 | Numbered "Why Samyó" cards | Open |
| 7 | Draggable best-sellers rail | Open |
| 8 | Accord bars on product pages | Open |
| 9 | Second image on hover | Open |
| 10 | The dot cursor everywhere | Partly done (hero; dot without View on non-product tiles) |
| 11 | Page-change wipe | Open |
| 12 | Gift option at Add to bag | Open |
| 13 | "Pairs well with" | Open |
| 14 | Reviews in the signature hand | Open |
| 15 | Notes marquee | Open |
| 16 | Seasonal edits for the Philippines | Open |
| 17 | Thumb-friendly bottom bar on phones | Open |
| 18 | Floating "Find your scent" bubble | Open |
| 19 | Refined prices and numbers | Open |
| 20 | A dark "evening" section | Open |

## 1. Sticky buy bar

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Sticky buy bar" from dev/design-ideas.html.
What it does: A slim bar with bottle, name and Add to bag when the main button scrolls away on product pages.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 2. One colour per scent family

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "One colour per scent family" from dev/design-ideas.html.
What it does: Family colours used on tiles, chips and collection pages.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 3. "What does it smell like?" note tips

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea ""What does it smell like?" note tips" from dev/design-ideas.html.
What it does: One plain sentence per note on hover/tap, from the note metaobject.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 4. Subtle paper texture

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Subtle paper texture" from dev/design-ideas.html.
What it does: A very light SVG grain over paper backgrounds.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 5. Big statement with images in the words

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Big statement with images in the words" from dev/design-ideas.html.
What it does: NOHO-style large sentence with small pictures inline.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 6. Numbered "Why Samyó" cards

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Numbered "Why Samyó" cards" from dev/design-ideas.html.
What it does: Three or four numbered promises; only true claims.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 7. Draggable best-sellers rail

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Draggable best-sellers rail" from dev/design-ideas.html.
What it does: A drag/swipe row of product cards with a progress line.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 8. Accord bars on product pages

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Accord bars on product pages" from dev/design-ideas.html.
What it does: Scent-profile bars labelled with their source.
Never invent values.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 9. Second image on hover

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Second image on hover" from dev/design-ideas.html.
What it does: Bottle, then bottle with box on hover.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 10. The dot cursor everywhere

**Status:** Partly done (hero; dot without View on non-product tiles)

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "The dot cursor everywhere" from dev/design-ideas.html.
What it does: Hero cursor on cards (View) and carousels (Drag).
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 11. Page-change wipe

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Page-change wipe" from dev/design-ideas.html.
What it does: A quick charcoal wipe between pages.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 12. Gift option at Add to bag

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Gift option at Add to bag" from dev/design-ideas.html.
What it does: Gift wrap + note toggle.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 13. "Pairs well with"

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea ""Pairs well with"" from dev/design-ideas.html.
What it does: Perfumes that share notes.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 14. Reviews in the signature hand

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Reviews in the signature hand" from dev/design-ideas.html.
What it does: One verified review line in the script font.
Verified reviews only.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 15. Notes marquee

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Notes marquee" from dev/design-ideas.html.
What it does: A slow ribbon of note names with a pause control.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 16. Seasonal edits for the Philippines

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Seasonal edits for the Philippines" from dev/design-ideas.html.
What it does: Tabs such as Summer heat, Rainy season, Night out.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 17. Thumb-friendly bottom bar on phones

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Thumb-friendly bottom bar on phones" from dev/design-ideas.html.
What it does: Shop, Notes, Search and Bag at the bottom on phones.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 18. Floating "Find your scent" bubble

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Floating "Find your scent" bubble" from dev/design-ideas.html.
What it does: A floating quiz button that hides on scroll down.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 19. Refined prices and numbers

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "Refined prices and numbers" from dev/design-ideas.html.
What it does: Serif tabular prices with a small PHP mark.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 20. A dark "evening" section

**Status:** Open

Prompt for Codex:

```text
Samyo theme (new perfume-* sections/snippets as needed). Build idea "A dark "evening" section" from dev/design-ideas.html.
What it does: One near-black section for night and oud perfumes.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```
