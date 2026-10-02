# Design Grammar

The rules that turn a design hypothesis into coupled values. **The point of this file
is that nothing here is chosen independently.** Colour, type, spacing, geometry,
surfaces, density, icons and motion are one system, derived from one hypothesis.

If the hypothesis is already written (`design-director.md`), this is mechanical
translation. If it is not, write it first.

---

## 1. Colour — semantic roles, not a palette

Never "generate five complementary palettes and pick one". Decide the **strategy**,
then derive roles.

### Roles (a project may rename, but should cover these)

```
canvas
surface            surface-subtle     surface-raised     surface-interactive
text-primary       text-secondary     text-muted         text-disabled
border-subtle      border-default     border-strong
accent-primary     accent-hover       accent-muted       accent-on
success  warning  danger  info            (each: -bg, -fg, -border)
overlay-scrim      chart-series-1..n   data-positive  data-negative
```

### Rules

- **Three layers.** `primitive (blue-600)` → `semantic (action-primary)` →
  `component (button-primary-background)`. A component token that is not traceable to a
  semantic role is a one-off in disguise.
- **OKLCH ramps** where the stack supports it — perceptually even steps, predictable
  lightness. HSL lightness steps lie about perceived contrast.
- **Contrast is structural, not decorative.** Establish the lightness ladder for surfaces
  and for text first, then place the accent. Measure it; do not eyeball it.
- **Accent is scarce.** State its job and its maximum share (e.g. "≤5% of any screen").
  An accent used decoratively stops being an accent.
- **Semantic states stay distinguishable** without relying on hue alone — pair colour
  with an icon, a label, or a shape. Never encode state in red/green only.
- **Charts get their own series ramp**, derived from the surface lightness so it reads on
  both themes — not borrowed from the UI accent.
- **Do not add a colour because a component looks boring.** Boredom is fixed with
  hierarchy, spacing, or type — not with hue.

### Dark mode
Derive from the same roles, not by inverting. Surfaces get their own ladder; pure black
and pure white are both wrong for extended reading. Test both themes; a token that only
works in one is not a token.

---

## 2. Typography — a hierarchy, not a font list

One or two families. A display family plus a body family must be *clearly* distinct, not
two grotesques. Never a different font per component role.

### Roles

```
display        page-title     section-title    subheading
body           label          small            meta
mono / data    (optional — real numbers, ids, code, logs)
```

Declare: family, size, weight, line-height, letter-spacing, and the max line length per
role. Negative tracking on large sizes, positive or neutral on small caps-ish labels,
tabular numerals in any column of numbers.

### Rules
- One scale, roughly a ratio, with **no unique size per component**.
- Body line-height ≥ 1.5 (sans) / ≥ 1.6 (serif). Dense UI may go to 1.4, never below.
- Size creates hierarchy first; weight second; colour third. Using all three at once on
  the same element is a sign the hierarchy is confused.
- Line length ≤ ~80 characters (serif may reach ~90).
- Never uppercase a label just to make it look designed. Never accent a single word in a
  headline — that is the commonest tell of a generated page.
- All-caps is for short labels at ≥ 12px with letter-spacing, or not at all.

---

## 3. Spacing — a scale, plus semantic relationships

A constrained scale (4px base is a safe default; 8px if the density is low). What
actually makes a product feel designed is that the *relationships* are constant:

```
icon ↔ label             label ↔ helper text
control internal padding   related controls (a field + its button)
field ↔ field            form row gap
component group padding   section internal padding
section ↔ section         page region gap
```

State these relationships as numbers once. Then they are not re-decided per screen.

### Rules
- Every padding/margin/gap is a step on the scale. An arbitrary value is drift
  (`design-drift.mjs` will say so).
- Density scales the whole rhythm together — inner padding shrinks *and* gaps shrink.
  A compact table beside airy cards is two products.
- Space is the primary separator before borders. Use the stronger tool only where
  space cannot do the job.

---

## 4. Geometry — one radius family, mapped by role

Small family: `xs · sm · md · lg` (e.g. 2 / 4 / 6 / 10px). Map it:

```
tooltip · badge · button · input · menu · card · popover · dialog · sheet
```

### Rules
- **Nested surfaces have equal or smaller radii than their container.** A 12px card
  inside a 4px panel looks broken.
- One step per role, declared. Not "6 here, 8 there".
- A circle is correct for genuinely circular things: avatars, icon buttons, radio,
  status dots. It is not a default for anything with text.
- Pills are semantic — a filter chip, a status, a segmented control. Never the default
  button shape, and never a badge on every row.
- Sharp/technical systems use 0–2px. Friendly systems use 8–12px. Pick and stay there.

---

## 5. Surfaces — choose one hierarchy mechanism

Decide which of these carries hierarchy, and demote the rest:

```
spacing · surface tone · borders · elevation (shadow) · separators
```

- "Borders over shadows" means shadows are reserved for genuinely floating things
  (menus, popovers, dialogs) and never used for grouping.
- A shadow that encodes a new size is a new system decision — catch it in review.
- Nested surface tone ladders must be declared (canvas → surface → raised), with the
  lightness delta between steps set once.
- Do not use a card as the default wrapper. See §8.

---

## 6. Density — one number, expressed in six places

Pick `comfortable · standard · compact · operations` and set **all** of:

| | comfortable | standard | compact | operations |
|---|---|---|---|---|
| control height | 44 | 40 | 36 | 32 |
| table row | 56 | 48 | 40 | 36 |
| nav row | 48 | 44 | 40 | 36 |
| body type | 16 | 15 | 14 | 13 |
| container padding | 32 | 24 | 20 | 16 |
| page region gap | 64 | 48 | 40 | 32 |

Touch targets stay ≥ 44px even when the *visual* control is 32px — pad the hit area,
not the box.

---

## 7. Iconography — one family, stated once

Pick the family (Lucide, Phosphor, Tabler…) and never mix. Declare: sizes (16/20/24),
stroke weight, whether outline or filled, and the alignment rule.

- No emoji as UI icons. No mixed stroke weights. No icons for things the label already says.
- Decorative icons are `aria-hidden`; icon-only controls need an accessible name.
- Icons mark, they do not decorate. A row of six identical icons carries no information.

---

## 8. Composition — when a card is allowed

A **card** needs at least one of: independent grouping · its own interaction target ·
containment · elevation · repeatable-unit behaviour.

Otherwise use: alignment · spacing · a divider · typographic hierarchy · a background region.

This is the single most reliable fix for "AI SaaS" looking. Ask, per grouping:
*what does putting a border and a background around this communicate?* If the answer is
"that it is a section", the answer is no.

Related: distinguish `component · container · group · section · page region`. They are
not the same and they should not share a treatment.

---

## 9. Motion — communicate, never decorate

Declare: durations (fast 120ms / base 200ms / slow 320ms), easing character, and the
reduced-motion behaviour. Then:

- Motion explains **state change, spatial relationship, hierarchy, or confirmation**.
- One orchestrated moment beats scattered micro-interactions. Entrances on every section
  plus hover transitions on every card is the generic default — cut it.
- Nothing decorative on data views. A trading table that animates is a slower trading table.
- `@media (prefers-reduced-motion: reduce)` is honoured, not decorative.
- No `transition: all` — name the properties. (`design-drift.mjs` flags it.)

---

## 10. The lock

Once the foundational screens are agreed, these are **locked**:

- radius values · colours · font sizes · spacing steps · shadows · control heights · icon family

A new value is a **system-level decision**. It goes into the shared system with a
reason, or it does not go in. A local override that "works for this one component" is how
page 8 stops looking like page 1.

Enforce it: `node "$HOME/.design-system/scripts/design-drift.mjs" <projectRoot>`

---

## Worked coupling example

Hypothesis: *"high-density bullion trading console; precise, trustworthy, fast."*

Derived, not chosen independently:

- **Trust** (high) → contrast must be high, but the product is dark-first; therefore
  lightness ladder is wide, and every number gets a tabular figure and a visible unit.
- **Density** (operations) → control 32, row 36, body 13/1.45, container 16, region 32.
- **Type** (compact neutral sans, one family) → negative tracking at display sizes,
  tabular numerals everywhere, no serif: a serif would read editorial, and this is not editorial.
- **Geometry** (restrained) → radius 2/4/6. Pills banned — a pill filter bar on a
  trading console reads consumer. Circles only for avatars and status dots.
- **Surfaces** (borders over shadows) → three neutral surface tones + one hairline
  family; shadows reserved for menus and dialogs only.
- **Colour** (neutral dominant, gold scarce) → gold marks one thing: positive P&L.
  ≤3% of any screen. Red/green are *data* semantics, never brand, and always paired
  with a sign or arrow for accessibility.
- **Components** → tables, dense and prioritised; cards only where containment matters;
  no card grids.
- **Motion** → minimal; 120ms state changes; nothing on live data.
- **Anti-patterns** → gold gradients, oversized rounded cards, pill filters,
  marketing-scale headings, a second elevation style, empty-state illustrations.
