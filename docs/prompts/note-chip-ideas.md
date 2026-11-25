# "Smells like" chips: 10 ideas

Preview: `dev/note-chip-ideas.html` (serve the repo root, see AGENTS.md). The owner asked first for better icons: all 23 were redrawn (before/after in dev/note-icons.html).

Rules for every prompt (from AGENTS.md): read `AGENTS.md` and `docs/HANDOFF.md` first; prefer new `perfume-*` files over editing Dawn; every setting editable in the theme editor, no hardcoded products; px sizes (Dawn sets 1rem = 10px); motion with transform / opacity / clip-path only plus a `prefers-reduced-motion` path; content never hidden if JS fails; real buttons, `aria-expanded`, visible focus, 44px touch targets on phones; never invent notes, ratings, longevity or claims (empty data shows nothing or "not assessed yet"). Finish with `bash dev/check.sh` (expect 12 findings, "Schemas OK") and re-render the preview (`node dev/render-preview.mjs`, see AGENTS.md).

| # | Idea | Status |
|---|---|---|
| 1 | Grouped as a pyramid | Open |
| 2 | Strength dots | Open |
| 3 | Real ingredient photos | Open (note_N_image already exists and wins over the drawing) |
| 4 | Coloured by scent family | Open |
| 5 | Tap a note to learn it | Open |
| 6 | Big illustrated tiles | Open (best on the product page) |
| 7 | One sentence instead of chips | Open |
| 8 | On a wear timeline | Open |
| 9 | Hairline, text only | Open |
| 10 | "Also in…" on hover | Open |

## 1. Grouped as a pyramid

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Grouped as a pyramid" from dev/note-chip-ideas.html.
What it does: Top / Heart / Base rows.
Needs a tier per note: add note_N_tier select (top/heart/base) to the showcase block; only group when tiers are set.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 2. Strength dots

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Strength dots" from dev/note-chip-ideas.html.
What it does: Three dots per note for prominence.
Only from a real source; empty = no dots.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 3. Real ingredient photos

**Status:** Open (note_N_image already exists and wins over the drawing)

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Real ingredient photos" from dev/note-chip-ideas.html.
What it does: Small round photos instead of drawings.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 4. Coloured by scent family

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Coloured by scent family" from dev/note-chip-ideas.html.
What it does: Each chip takes its family colour.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 5. Tap a note to learn it

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Tap a note to learn it" from dev/note-chip-ideas.html.
What it does: Chips become buttons; one plain sentence shows under the row.
Sentences come from a note metaobject or block text, never generated.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 6. Big illustrated tiles

**Status:** Open (best on the product page)

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Big illustrated tiles" from dev/note-chip-ideas.html.
What it does: Square tiles with large drawings.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 7. One sentence instead of chips

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "One sentence instead of chips" from dev/note-chip-ideas.html.
What it does: An editorial sentence with underlined notes.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 8. On a wear timeline

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "On a wear timeline" from dev/note-chip-ideas.html.
What it does: Notes on a Spray / 1 hour / 3 hours+ line.
Label the times as typical, not measured.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 9. Hairline, text only

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea "Hairline, text only" from dev/note-chip-ideas.html.
What it does: Outlined pills, italic name only.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 10. "Also in…" on hover

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-showcase.liquid, assets/perfume-showcase.css, snippets/perfume-note-art.liquid). Build idea ""Also in…" on hover" from dev/note-chip-ideas.html.
What it does: Other store perfumes with the same note.
Match on note handles across the showcase blocks or a metaobject reference.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```
