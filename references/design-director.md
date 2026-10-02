# Design Director

The layer that converts product context + reference intelligence into **one** design
hypothesis, *before* any code exists. Missing from most agent workflows, and the single
highest-leverage addition: everything downstream becomes a consequence instead of a
series of independent choices.

A workflow, not a model. You are still the same model — you are just not allowed to
start writing markup until this is written down.

---

## What goes in

```
PRODUCT CONTEXT
+ USER / PRIMARY JOB / FREQUENCY
+ DOMAIN CONVENTIONS
+ EXISTING BRAND (the project's own tokens, if any)
+ SELECTED REFERENCES
+ UX KNOWLEDGE
=
ONE DESIGN HYPOTHESIS
```

If the product already has a `DESIGN.md`, **the hypothesis is constrained by it**.
You are evolving, not replacing. Say where you are extending and why.

---

## The eleven decisions

Fill every one. One line each. No adjective soup — pick two or three traits that
would actually change a pixel, and be able to say what each one forbids.

### 1. Product character
`precise · calm · operational · premium · editorial · approachable · technical · high-trust · playful · data-dense`
Not "modern, clean, professional".

### 2. Trust level
What does a mistake cost? This sets contrast, density of confirmation, destructive-action
weight, and how much the interface admits uncertainty.
Low-trust products show "unknown" honestly. High-trust products can be quieter and faster.

### 3. Density
`comfortable · standard · compact · high-density operations console`
Density is *one* decision expressed through six things at once: control height, table
row height, nav row height, type size, container padding, page region spacing. If the
table is compact and the surrounding cards are airy, the product has two densities and
will read as incoherent.

### 4. Typography personality
`compact neo-grotesk · humanist sans · editorial serif + utility sans · technical mono accents · geometric`
One or two families, never one per role. Numeric behaviour matters in data-dense products
(tabular figures, aligned decimals). Line length under ~80ch unless a serif earns more.

### 5. Geometry
`sharp/technical · restrained · soft/approachable · editorial minimal`
Name the radius family and where a pill is *not* allowed.

### 6. Surface strategy — pick ONE primary and commit
`borders over shadows · layered neutral tones · flat canvas with grouped regions · moderate elevation · separators only`
Mixing all five randomly is the most common cause of "AI SaaS" looking. State which one
carries hierarchy; the others may exist but must not compete.

### 7. Colour strategy
`neutral dominant + one restrained accent · warm neutral editorial · high-trust cool neutral · data-first semantic set`
Name the accent's *job* and its maximum share of the screen. Accent is a scarce resource;
if it is everywhere it is decoration.

### 8. Navigation character
`persistent utility rail · top bar + contextual side panel · master-detail · tab-per-work-mode · wizard for a linear task`
Decide what the primary navigation *is*, and what is deliberately NOT navigation.

### 9. Component philosophy
`tables for repetitive structured data · cards only for containment · list-rows over cards for entities · forms as one column · inline disclosure over modals`
Say where a card is banned and what replaces it.

### 10. Interaction personality
`fast and keyboard-friendly · explicit and low-risk · exploratory · touch-first`
Sets whether the primary action is a shortcut or a confirm dialog, and how much the
interface can assume the user knows where they are.

### 11. Motion character
`minimal and functional · one orchestrated entrance · no motion in data views · reduced-motion respected`
Motion communicates state change, spatial relationship, hierarchy, or confirmation.
Decorative motion that slows operational work is a cost, not a flourish.

### 12. Anti-patterns — mandatory
The list of things that would violate this direction, in product-specific terms. This is
the most useful section: it is what the reviewer checks against, and what stops the
model drifting back to its training defaults on page 8.

---

## Output shape

Keep it to one page. It is a hypothesis, not a specification.

```markdown
## Design hypothesis — <Product> · <surface>

**Product**
<what it is, who uses it, how often, what a mistake costs>

**Perception**        precise · professional · fast · trustworthy
**Density**           high (control 32 · row 36 · nav 40 · body 13/1.45)
**Typography**        compact neutral sans, one family, tabular numerals in tables
**Geometry**          restrained — radius 2/4/6, no pills, circles only for avatars
**Surfaces**          borders over shadows. One hairline family, three weights max.
**Colour**            neutral dominant; gold reserved for P&L-positive and nothing else (≤3% of screen)
**Navigation**        persistent left rail; contextual panel only for the selected entity
**Components**        dense prioritised tables; cards only where containment matters
**Interaction**       fast, keyboard-first; destructive actions confirmed inline, never by colour alone
**Motion**            minimal — 120ms state transitions only, nothing on data views

**Anti-patterns**
- gold gradients anywhere other than a single P&L-positive value
- large rounded cards used as section wrappers
- pill-shaped filters and badges
- marketing-scale headings inside the app
- a second elevation style (glow/blur) alongside the hairline system
- empty-state illustrations where a single sentence would do

**Signature**
<the one thing someone will remember — and why it is not decoration>
```

**Signature** matters. Boredom is a failure mode too. Spend boldness in exactly one
place, chosen because it serves the product's job; keep everything else quiet.

---

## Challenging the literal request

The Director's second job. Preserve business intent, improve the interaction.

> **Request:** "Add a permanent Contact Patient button to every card."

Work it through before building:

- How often is *contact* actually used relative to the other actions on the card?
- Are there multiple channels (call / SMS / email)? Then one button is a wrong abstraction.
- Is it a primary action? A rarely-used action given permanent prime real estate will
  outrank the actions that actually matter.
- Does it belong contextually — on the selected patient, not on all 40 cards at once?
- Is the card already overloaded? Adding to an overloaded card is the real defect.

Then propose: keep the intent (patients must be reachable), change the literal UI —
a secondary action revealed on selection, or an action menu in the patient row.

Same move for: "make the dashboard prettier" (which table is the job?), "add a modal
for this" (is this a task or a state?), "use more whitespace" (between what, and does
that fight the density target?).

State the challenge in one or two sentences, then build the better version. If the user
insists on the literal version after hearing it, build it — and note the cost in the
anti-patterns list so it is not mistaken for a system decision.

---

## When to run it

| Tier | Run? |
|---|---|
| 0 tiny visual fix | No. Use the existing system. |
| 1 component | No. Use the existing grammar; check the component still fits the hypothesis. |
| 2 new page | **Yes.** Briefly — density, composition, anything the page introduces that the system does not already answer. |
| 3 module / workflow | **Yes, fully.** |
| 4 new product / redesign | **Yes, fully, first, before any reference or token work.** |

If the project already has a `DESIGN.md` with a hypothesis, **read it and treat it as
binding.** Your job is to extend it, not to re-derive it. Only produce a new hypothesis
when the existing one demonstrably does not cover the surface — and then say exactly
which part failed and why.
