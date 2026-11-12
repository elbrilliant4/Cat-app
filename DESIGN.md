# Mochi: design

The look of the app's screens and controls. Made 2026-11-12 from the app as
it was (Merlin: keep our look, no template). The 3D rooms and Mochi follow
`TEAM-INSTRUCTIONS.md`. All values live as CSS variables at the top of
`dist/style.css`; change them there, not here first.

## Feel
Warm, soft and quiet: a cosy room seen through frosted glass. The room and
the cat are the show; controls sit at the edges, small, and get out of
her way. Short friendly words, no exclamation spam, no coins or nagging.

## Colours
| Token | Day | Night | Use |
|---|---|---|---|
| `--bg` | #f7f1ea | #1c1612 | Page |
| `--ink` / `--ink-2` / `--muted` | #2c2520 / #5d5148 / #998c80 | #f6eee4 / #d9cbbb / #a8988a | Text, strong to faint |
| `--card` / `--card-solid` | cream glass / #fffaf5 | dark glass / #2e241d | Cards, sheets |
| `--accent` | #f07b4f | same | Links, focus ring, badges |
| Needs | food #f28c5b, joy #f2689a, water #5b8def, energy #e9ad2f, fluff #3fb3c9 | same | Each need's ring and button tint |
| Love | #e2557a | same | Hearts, friendship level |
| Low need | #e2554f | same | A ring under 35% |
Main button gradient: #ffa36c to #f0657e.

## Type
Rounded system font (`ui-rounded`, SF Pro Rounded, Nunito, then system).
Weights 650 to 850. Sizes: sheet title 25, card title 17, her name 19
(16 on phones), body 14, small labels 11 to 12.5. Never below 11.

## Shape and depth
Corners: stage 28 (24 on phones), cards 24, sheets 28, buttons 14 to 19,
chips fully round. Glass = blurred cream with a white hairline border.
Shadows are warm brown, soft and low (`--shadow`, `--shadow-lg`).

## Spacing
Page sides 14 px on phones, up to 44 on wide screens. Gaps 6 to 10 inside
controls, 16 to 22 between cards. Touch targets at least 40 px.

## Parts
- **Top bar**: her name and mood on the left; small round buttons on the
  right (level, day/night, sound, More). Preview builds add a build chip.
- **Stage**: the 3D room in a rounded frame. Over it: the View button (top
  right) and the care dock (bottom).
- **Care dock**: five tinted icon buttons with a word under each.
- **Needs**: five rings with an icon inside and the number under.
- **Sheets** (dialogs): on phones they rise from the bottom, full width,
  rounded top; on wide screens a centred card. Eyebrow (small caps, accent)
  over a big title.
- **Menus** (View, sound): a small glass card under its button; closes on
  a tap elsewhere.
- **Toast**: dark pill at the bottom for short news.

## Phone layout
Phones (up to 720 px wide, at least 560 tall) get one screen with no page
scrolling: top bar, the stage filling the middle, the needs row at the
bottom. Shorter or wider screens scroll as a page.

## Words
Touch words on touch screens ("tap", "pinch"), mouse words on computers.
Her own name, not "your kitten", wherever she's meant.
