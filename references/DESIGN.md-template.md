# DESIGN.md template

The persistence format for a design hypothesis. This is the **Google Stitch /
`awesome-design-md` convention**: a plain markdown file that any agent — or a human —
reads to know how the product should look. Do not invent a new format.

**Where it goes**

| Situation | Where |
|---|---|
| Product already has a `DESIGN.md` | **Extend it.** Never start a parallel one. |
| Project root is a real product | `<projectRoot>/DESIGN.md` |
| baoyu-design portable design system | `design-system/<slug>/MASTER.md` (see `ui-ux-pro-max --persist`) |
| Monorepo with several products | one per app, plus a shared `DESIGN.md` at the root for cross-cutting rules |

---

```markdown
# DESIGN.md — <Product name>

Status: <binding | draft>          # "binding" means: do not introduce a new visual
                                   # language without changing this file first
Owner:  <who maintains it>
Last revised: <YYYY-MM-DD>

## 1. Product and users

<What it is. Who uses it. How often. What a mistake costs. The primary job, in one
sentence. Roles and permissions. The domain conventions this product must respect.>

## 2. Design hypothesis

<Exactly the output of `design-director.md`. Product character · trust level · density ·
typography personality · geometry · surface strategy · colour strategy · navigation
character · component philosophy · interaction personality · motion character ·
anti-patterns · signature.>

## 3. Colour

Strategy: <one line — "neutral dominant + one restrained accent">

| Role | Token | Value | Contrast note |
|---|---|---|---|
| canvas | `--canvas` | | |
| surface | `--surface` | | |
| surface-subtle | | | |
| surface-raised | | | |
| text-primary | | | ≥ 4.5:1 on surface |
| text-secondary | | | |
| text-muted | | | |
| border-subtle / default / strong | | | |
| accent-primary / hover / muted | | | ≤ N% of any screen |
| success / warning / danger / info | | | never hue alone — pair with icon or label |

Chart series ramp: <tokens, derived for both themes>
Dark mode: <derived from the same roles; not an inversion>

## 4. Typography

Families: <one, or a clearly distinct pair>
Numeric behaviour: <tabular figures where columns of numbers appear>

| Role | Size / line-height | Weight | Tracking | Max line length |
|---|---|---|---|---|
| display | | | | |
| page-title | | | | |
| section-title | | | | |
| subheading | | | | |
| body | | | | |
| label | | | | |
| small | | | | |
| meta | | | | |

## 5. Spacing

Base step: <4 | 8>px

Relationships (declare once — these are what make it feel designed):

| Relationship | Value |
|---|---|
| icon ↔ label | |
| label ↔ helper | |
| control internal padding | |
| field ↔ field | |
| component group padding | |
| section internal | |
| section ↔ section | |
| page region | |

## 6. Geometry

Radius family: xs <n> · sm <n> · md <n> · lg <n>

| Component role | Radius |
|---|---|
| button / input | |
| menu / popover | |
| card | |
| dialog / sheet | |
| badge | |
| tooltip | |

Pills allowed for: <…>. Banned for: <…>.
Circles reserved for: <avatars, icon buttons, status dots, radio>.

## 7. Surfaces and elevation

Primary hierarchy mechanism: <borders | surface tone | spacing | elevation | separators>
Surface ladder: canvas → <…> → <…> (lightness deltas stated)
Elevation set: <0–3 named levels, and what each is for>
A card is used only when: grouping · interaction · containment · elevation · repeatable unit.

## 8. Density

Mode: <comfortable | standard | compact | operations>

| | value |
|---|---|
| control height | |
| table row | |
| nav row | |
| body type | |
| container padding | |
| page region gap | |

## 9. Components

Source of truth, in order: <project components → Storybook → registry → custom>
Existing primitives: <list the ones that must be reused>
Component principles: <what a table looks like here; what a form looks like here;
where modals are and are not allowed>

## 10. Motion

Durations: fast <n> · base <n> · slow <n>   Easing: <…>
Motion is used for: state change · spatial relationship · hierarchy · confirmation
Reduced motion: <how it degrades>

## 11. Responsive

Breakpoints: 375 · 768 · 1024 · 1440
| Region | <375 | 768 | 1024+ |
|---|---|---|---|
| primary nav | | | |
| data table | | | |
| side panel | | | |
| secondary actions | | | |

## 12. Anti-patterns

Explicit list of things that violate this system. This is the reviewer's checklist
and the thing that stops drift on page 8.

- <…>

## 13. Change policy

- New colour, radius, spacing step, font size, shadow, control height or icon family is
  a **system-level decision**. It is made here, with a reason, and then used everywhere.
- A local override that "works for this one component" is drift, not a decision.
- Extending this file is a normal part of the work. Bypassing it is not.
```

---

## Rules

1. **Binding sections.** Once the foundational screens are agreed, sections 3–10 are
   locked. Changing them is allowed; changing them *silently in a component* is not.
2. **Every value has a token.** A `DESIGN.md` that lists hex codes but no semantic role
   names is a palette, not a system.
3. **Anti-patterns are mandatory.** An empty section 12 is an unfinished `DESIGN.md`.
4. **Contrast is measured, not estimated.** Cite the ratio.
5. **One `DESIGN.md` per product.** Cross-package rules belong in a root one.
6. **When a human keeps changing one pattern,** the system is probably wrong — fix it
   here rather than accumulating local overrides.
