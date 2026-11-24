# Hero tile labels: 10 ideas

Preview: `dev/tile-label-ideas.html` (serve the repo root, see AGENTS.md). The owner chose 4 (vertical spine label), shown on hover on desktop and always on phones, coloured per tile.

Rules for every prompt (from AGENTS.md): read `AGENTS.md` and `docs/HANDOFF.md` first; prefer new `perfume-*` files over editing Dawn; every setting editable in the theme editor, no hardcoded products; px sizes (Dawn sets 1rem = 10px); motion with transform / opacity / clip-path only plus a `prefers-reduced-motion` path; content never hidden if JS fails; real buttons, `aria-expanded`, visible focus, 44px touch targets on phones; never invent notes, ratings, longevity or claims (empty data shows nothing or "not assessed yet"). Finish with `bash dev/check.sh` (expect 12 findings, "Schemas OK") and re-render the preview (`node dev/render-preview.mjs`, see AGENTS.md).

| # | Idea | Status |
|---|---|---|
| 1 | Caption under the tile | Open (label style option) |
| 2 | Kicker top-left, name below | Open |
| 3 | White pill in the corner | Open |
| 4 | Vertical label on the edge | Done (Label style = Spine) |
| 5 | Panel slides up on hover | Open |
| 6 | Number + name, sans | Open |
| 7 | Handwritten note | Open |
| 8 | Sticker tag | Open |
| 9 | One shared caption | Open |
| 10 | Frosted bar | Open |

## 1. Caption under the tile

**Status:** Open (label style option)

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Caption under the tile" from dev/tile-label-ideas.html.
What it does: Text under the image on the stone background.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 2. Kicker top-left, name below

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Kicker top-left, name below" from dev/tile-label-ideas.html.
What it does: Small kicker in the empty top corner.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 3. White pill in the corner

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "White pill in the corner" from dev/tile-label-ideas.html.
What it does: One short word on a white pill.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 4. Vertical label on the edge

**Status:** Done (Label style = Spine)

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Vertical label on the edge" from dev/tile-label-ideas.html.
What it does: Small capitals up the tile's right edge.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 5. Panel slides up on hover

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Panel slides up on hover" from dev/tile-label-ideas.html.
What it does: A paper panel slides up with kicker and name.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 6. Number + name, sans

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Number + name, sans" from dev/tile-label-ideas.html.
What it does: 01 Sauvage under each tile.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 7. Handwritten note

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Handwritten note" from dev/tile-label-ideas.html.
What it does: One script word in the empty corner.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 8. Sticker tag

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Sticker tag" from dev/tile-label-ideas.html.
What it does: A small rotated dark tag.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 9. One shared caption

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "One shared caption" from dev/tile-label-ideas.html.
What it does: One caption line under the grid for the hovered tile.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```

## 10. Frosted bar

**Status:** Open

Prompt for Codex:

```text
Sangyo theme (sections/perfume-hero.liquid, assets/perfume-hero.css). Build idea "Frosted bar" from dev/tile-label-ideas.html.
What it does: A frosted strip with name and View.
Make it a theme-editor setting (default off unless the owner chose it) and follow the rules in AGENTS.md.
Done when: it matches the preview card, works with keyboard and on a 375px phone, has a reduced-motion path, dev/check.sh passes and docs/HANDOFF.md notes the change.
```
