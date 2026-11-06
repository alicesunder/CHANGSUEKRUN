# CHANGSUEK RUN — Design System v1 ("Royal Purple Tropical Dusk")

Source of truth: the `DESIGN SYSTEM v1` block at the end of `src/index.css`.
Direction (from the ChatGPT art-direction review, 6 Nov 2026): cinematic hero + friendly 2D illustration for the
activities, joined by one purple-and-gold UI language.

## Colour tokens
| Token | Hex | Use |
|---|---|---|
| `--ds-midnight` | #21113F | darkest sections (concert stage) |
| `--ds-deep` | #2A1450 | ink, text on light, dark sections |
| `--ds-royal` | #4B1FA8 | secondary violet |
| `--ds-accent` | #7C3AED | links, accents |
| `--ds-gold` | #FFC928 | primary buttons, highlights |
| `--ds-gold-soft` | #FFE268 | light gold |
| `--ds-sunset` | #FF8A3D | small accents only |
| `--ds-lavender` | #EDE7F6 | light section background |
| `--ds-line` | #D9C9EF | card borders on light backgrounds |
| `--ds-warm` | #FFFCF7 | warm-white section background |
| `--ds-text` / `--ds-muted` | #281A3B / #766A85 | body / secondary text |

Tailwind names exist too: `bg-ds-deep`, `text-ds-gold`, `border-ds-line`, ...

## Shared classes
- `.ds-card` — soft card on light backgrounds (1px lavender border, 20px radius, soft shadow). `.ds-card-hover` adds a lift.
- `.ds-frame-dark` — frame of a dark section/panel (gold hairline, deep shadow). `.ds-tile-on-dark` — white tile sitting on it.
- `.sticker` — now the same soft look (28px radius), used by the dog health check and dog contest sections.
- `.ds-bg-lavender`, `.ds-bg-warm`, `.ds-bg-dark` — section backgrounds; alternate dark and light down the page.

## Rules
- Fonts: Mitr for headings and numbers; keep the current body font (no extra font files).
- Buttons stay as they are: gold, dark-purple outline, pill shape.
- No 3–6px purple outlines with hard offset shadows on cards; use `.ds-card` / `.ds-frame-dark`.
- Illustrations: hero = cinematic painting; activities = polished 2D with purple and gold accessories, transparent PNG, no text.

## Done in v1
Race Pack frame and tiles, concert frame, shop station cards and dark info panels, route/schedule cards, top status banner,
dog health check, dog contest, winners section.

## Still to do (v2)
Modals (registration, login, payment, ticket e-mail preview, runner hub), FAQ/hotel/sponsor/transport sections' own cards,
the shop's small inner chips, the countdown band's old morning artwork, ticket-card artwork, Facebook follow banner.
