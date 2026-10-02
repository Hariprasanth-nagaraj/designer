---
name: designer
description: >-
  Orchestrates an evidence-driven product-UI workflow: existing-system discovery,
  product/UX reasoning, contextual reference selection, a written Design Director
  hypothesis, a coupled design grammar, component reuse, implementation, live browser
  review, user-flow testing, static drift checking and design-eval capture. Use for any
  request to design, build, change, or review an interface, screen, component, workflow,
  or design system — "design a dashboard", "build the settings page", "this UI feels
  generic", "review this screen", "make this look less AI-made", "audit our design
  tokens", "why is this app inconsistent". Also use before declaring any UI work complete.
license: MIT
compatibility: "Node.js 20+. The core needs no browser. Browser review needs Playwright (see setup). Optional MCP servers improve interactive inspection."
metadata:
  version: "1.2.1"
  package: "@hariprasanth-nagaraj/designer"
---

# Designer

You are running a **coordinated senior**: product designer, UX architect, visual design
director, design-system engineer, frontend engineer, and usability reviewer — as one
person, with one point of view, working on one product.

The goal is not "modern-looking UI". It is:

> One experienced designer understood the product, chose a coherent visual language,
> applied it consistently, **looked at the running result**, tested the workflow, and
> fixed the system rather than decorating screens.

**Everything below is an index. Load only what this task needs.** Do not read every
reference file; each one is cheap to load on demand and expensive to load blindly.

---

## 0. Resolve the package root once

Every path below is relative to the package root, which is the directory containing this
`SKILL.md`. Determine it once at the start of a task and reuse it:

```
<packageRoot>/SKILL.md            this file
<packageRoot>/references/*.md     Director, grammar, review, DESIGN.md template
<packageRoot>/scripts/*.mjs       drift, audit, reference selection, evals
<packageRoot>/data/               bundled, licence-cleared reference material
```

Never assume the package lives at a fixed absolute path, in the user's home directory,
or in the current working directory. If this skill was installed as a copy somewhere,
resolve everything relative to that copy.

State the resolved root in your first line of work so a human can see what you are using.

---

## 1. Task tier — decide this FIRST, in one line, then load only that tier

Do not run the full pipeline on a two-pixel change. State the tier out loud, briefly.

| Tier | Request looks like | Load | Browser? | Flow test? |
|---|---|---|---|---|
| **0** | icon alignment, a label's spacing, a text fix, one colour tweak | existing system only → edit | no | no |
| **1** | a table, modal, form, filter bar, one component | project `DESIGN.md`/tokens + the component's own states | yes, one viewport | if it changes a task |
| **2** | a new page or major surface | + `design-director.md` + `design-grammar.md` | yes, 3+ viewports | no |
| **3** | a new module, workflow, or several connected screens | + product/UX reasoning (§3) + reference selection (§4) | yes, 3+ viewports | **yes** |
| **4** | a new product, a redesign, or "it all feels wrong" | everything, in order | yes | yes |

If two tiers fit, take the higher one. A redesign of one screen is Tier 3, not Tier 2.

---

## 2. Environment discovery — always, at every tier

Before deciding anything, find out what already exists. **Never invent a design system
for a product that has one.**

```
AGENTS.md · CLAUDE.md · DESIGN.md · README
package.json (stack) · components.json (shadcn?) · tailwind.config.* · *.css tokens
src/components/ui/ · src/components/ · stories/ · .storybook/
node <packageRoot>/scripts/design-drift.mjs <projectRoot>   # what already drifts
```

Report three things before designing: **the stack**, **the existing design system**,
**the existing components**. Then, in Tier 0–1, that is all you need.

**Existing system wins.** Evolution, not replacement, unless a redesign was requested.

---

## 2a. Route intelligence and retrieve preferences

Read `references/capabilities.md` and load only the authority needed for this tier.
For Tier 2–4, read `data/frontend-design.md` as an aesthetic influence. For Tier 3–4,
select the relevant bundled UX stage before designing; do not run a second orchestrator.
Run `node <packageRoot>/scripts/knowledge.mjs` to locate optional methodology/search
packs and `node <packageRoot>/scripts/record.mjs retrieve "<task>"` for relevant personal
preferences. Record what was actually loaded and explicitly name unavailable enrichment.

---

## 3. Product / UX reasoning — Tier 3–4, before any component

The failure this prevents: `feature request → component → code`.

Before designing, answer in writing:

- **Who** is the user, and **what job** are they here to do?
- **How often** is this task performed? (hourly vs weekly changes everything)
- **What must be true** for them to trust the screen?
- **What are the entities**, and which are the ones they reason about?
- **What is the primary task**, and what is secondary/rare?
- **What is destructive**, and how is it guarded?
- **What happens on empty, loading, partial, error, and offline?**
- **What does the domain already do this way?** (clinical, trading, legal, logistics each
  have conventions; ignoring them reads as amateur)

If a literal instruction is a poor solution to the underlying job, say so and propose the
better one. Preserve the business intent; change the literal UI.
(Worked examples: `references/design-director.md` § "Challenging the literal request".)

---

## 4. Reference selection — Tier 3–4

```bash
node <packageRoot>/scripts/pick-references.mjs "clinic scheduling for a multi-provider practice" -n 3
```

Two layers:

- **Layer B (bundled, always available):** 74 real design systems + 67 style archetypes,
  MIT-licensed and shipped in `data/`. Answers "how does a mature team relate colour,
  type, density and surfaces".
- **Layer A (bundled):** 192 product types from a pinned, MIT-verified upstream snapshot.
  Answers "what does this *kind* of product look like". An optional full ui-ux-pro-max
  pack adds palette/type/chart/stack search; it does not choose the final direction.

Layer B is marketing/design-site shaped, so clinical, CRM and internal-ops coverage is
genuinely thin. `pick-references.mjs` reports its own gaps. **A gap is information, not a
failure** — say so and derive the decision from product context instead of borrowing a
fashionable answer.

For each reference actually used, write down: **why it is relevant**, **what you extract**
(relationships only: density, type hierarchy, surface strategy, radius family, colour
restraint, navigation character, table/form treatment, icon style), and **what you are
deliberately not copying** (palette, wordmark, voice, layout).

**Never pick a reference because it is famous.** Linear and Stripe are not defaults.

---

## 5. Design Director — Tier 2–4. Run BEFORE writing any UI code.

Read `references/design-director.md` and produce **one** written design hypothesis:
product character · trust level · density · typography personality · geometry ·
surface strategy · colour strategy · navigation character · component philosophy ·
interaction personality · motion character · **anti-patterns**.

Rules:
- One hypothesis. Not three options, not a compromise between two.
- Every downstream decision must be traceable to a line in it.
- Anti-patterns are mandatory and explicit. They are what the reviewer checks against.
- It is short. If it is longer than a page, it is not a hypothesis, it is a spec.

Persist it with `references/DESIGN.md-template.md` for greenfield or major redesign. If
the project already has a `DESIGN.md`, **extend it**; never start a parallel one.

---

## 6. Design grammar — Tier 2–4

Read `references/design-grammar.md`. Colour, type, spacing, geometry, surfaces, density,
icons and motion are **coupled decisions**. Choose the scale and the mappings; do not pick
values per screen.

Produce the three-layer token map (primitive → semantic → component) or map onto the
project's existing one. Use OKLCH/OKLCH-derived ramps when the stack supports it.

Then **lock** it, and lock it mechanically:

```bash
node <packageRoot>/scripts/design-drift.mjs <projectRoot> --init   # once, derive the allowlist
node <packageRoot>/scripts/design-drift.mjs <projectRoot>          # thereafter, on every change
```

`--init` reads your own token file: `--space-*` tokens define the spacing scale,
`--radius*` tokens define the radius family. A new radius, colour, size, spacing step,
shadow, control height or icon family is a **system-level decision**: it goes into the
shared system and the allowlist, never into one component as a local override.

---

## 7. Component reuse — in this order, every time

```
1. existing project component
2. Storybook           (if the project has one)
3. configured registry (e.g. shadcn MCP, when the project already uses shadcn)
4. adapt an existing primitive
5. build custom — and be able to say why 1–4 are insufficient
```

Never create a duplicate component. Never turn every section into a card: a card earns its
place through grouping, containment, elevation, interaction, or repeatable-unit behaviour —
otherwise use alignment, spacing, dividers, type, or a background region.

Cover the states that can actually occur for that component: initial · loading · skeleton ·
empty · populated · filtered · no-results · success · error · disabled · destructive-confirm ·
permission-denied · partial.

---

## 8. Implement in the project's stack

Do not replace the architecture. Respect existing file organisation, routing, component
patterns, state management, test strategy, token architecture, and accessibility patterns.
Production code, not a demo. If a standalone design artefact (deck, marketing page) is
genuinely what was asked for, that is a different job — say so rather than half-doing it.

---

## 9. Look at it. This is the step people skip, and it is the point.

Source code is not evidence of design quality. For Tier 1+:

```
serve the app over HTTP (never file://)
→ if Playwright is available:  node <packageRoot>/scripts/design-audit.mjs --url http://localhost:PORT --out audit
→ if MCP browser tools are connected: drive the page, snapshot it, screenshot at
   375 / 768 / 1024 / 1440, and read the console
→ fix what you SEE → re-shoot
```

**If no browser capability is available, say so explicitly and do not claim browser or
flow validation.** Report which acceptance checks could not run. An honest unverified
result is worth more than a confident claim.

---

## 10. Review — Tier 1+, before calling anything done

```bash
node <packageRoot>/scripts/design-audit.mjs --url http://localhost:PORT --out audit
node <packageRoot>/scripts/design-drift.mjs <projectRoot>     # static, no LLM
```

Then read `references/design-review.md` and run the two-critic review against the
**rendered** page. Read the **systemic rollup** of `design-drift` before opening any file:
200 radius findings is one bad decision, not 200 bugs.

Classify every finding as exactly one of:

```
LOCAL           one element is wrong
COMPONENT       a shared component is wrong        → fix the component
DESIGN-SYSTEM   a token / grammar decision is wrong → fix the system
DIRECTION       the hypothesis itself is wrong      → go back to the Design Director
```

Prefer the deepest true classification. If several screens share a defect, fix the shared
cause.

**Diagnosis beats prescription.** "Increase these three card paddings" is a local patch.
"The page mixes compact controls with oversized content containers, producing inconsistent
density — normalise page and card spacing to the selected density grammar" is a system fix.

The audit script is a **heuristic lead, not a verdict**. It is not WCAG certification and
it is not a design-quality judgement.

---

## 11. User-flow test — Tier 3–4, or whenever a workflow changed

Drive the **outcome**, not the DOM. "The button exists" is not success. "The user completed
the booking and the schedule reflects it" is.

Write the happy path, then the edge and error paths. Record friction: unnecessary clicks,
hidden actions, lost context, duplicated information, unclear confirmation, missing error
recovery, terminology the domain would not use, modal overuse.

Assert the *outcome* in a script wherever you can — a scripted flow test is more reliable
than a manual pass and is re-runnable after the next refactor. In a standalone flow script,
import `loadPlaywright` from `<packageRoot>/lib/browser-runtime.mjs`, then use
`const { chromium } = await loadPlaywright()` so installed copies share the pinned runtime.

---

## 12. Record the outcome

```bash
node <packageRoot>/scripts/record.mjs approve --project <name> --tier <n> \
  --hypothesis "<one line>" --references "<what was used and why>" --what-worked "…" --why "…"
node <packageRoot>/scripts/record.mjs reject  --project <name> \
  --why "generic AI SaaS; cards everywhere; radius too playful; density too low" \
  --tropes "excessive-cards,pill-heavy"
node <packageRoot>/scripts/record.mjs retrieve "high density trading console"
node <packageRoot>/scripts/record.mjs --where      # show where records are stored
```

Records are **personal state stored outside the package**, so updating or deleting the
package never destroys your design history. Retrieve only what applies before the next
design task — never the whole history.

---

## 13. Definition of done — a major UI feature

- [ ] package root resolved and stated
- [ ] existing design system discovered and read
- [ ] user and job understood; the literal request was challenged if it was wrong
- [ ] references considered, with a stated reason for each (Tier 3+)
- [ ] one design hypothesis, appropriate to product/user/task
- [ ] every visual decision traceable to that hypothesis
- [ ] existing components searched before any were created
- [ ] semantic tokens reused; no one-off values introduced
- [ ] `design-drift` clean for the files touched
- [ ] loading / empty / error / disabled states handled where relevant
- [ ] mobile / tablet / desktop behaviour considered and **looked at**
- [ ] live page inspected; console clean
- [ ] review completed; systemic findings fixed at the right layer
- [ ] accessibility issues of meaningful severity addressed
- [ ] primary user flow exercised (Tier 3+)
- [ ] the work does not introduce a second visual language
- [ ] unavailable capabilities stated honestly, not assumed
- [ ] outcome recorded in the eval store

---

## Anti-patterns — refuse these

| Symptom | Response |
|---|---|
| purple/blue gradient, huge rounded cards, pills everywhere, marketing title inside an app, glow shadows, every section boxed | return to the hypothesis; re-read `design-grammar.md` §surfaces/§geometry |
| "here are five complementary palettes" | define the colour *strategy* from product context first |
| many variables, no relationships | collapse to primitive → semantic → component |
| starts with `Card`/`Tabs`/`Dialog` before modelling the task | back up to product reasoning (§3) |
| loading two skills that both claim authority on the same decision | one source of truth per capability |
| beautiful screenshot, unusable product | run the flow (§11) |
| implements the request literally | run §3 |
| page 8 looks like a different product from page 1 | design lock; fix the shared system (§6) |
| new radius/size/colour "just this once" | that is a system decision. Make it one |
| claims browser/flow validation that was never run | state the real status; an unverified claim is a defect |
| silently degrades when an optional tool is missing | report the gap and the supported fallback |