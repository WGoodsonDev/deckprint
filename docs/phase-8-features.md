# Phase 8 — Dashboard UI: Feature List

**Phase ref:** `ROADMAP.md` §Phase 8  
**Status:** 🔄 In Progress — core dashboard shipped, additional UI feature
passes planned before moving to Phase 9. 3 low/medium-priority items remain
`specced` (see "Rethink Format Breakdown Visualization", "Reconsider Pet
Cards Section", "Replace Archetype Fingerprint Chart with Card Type
Composition")

Add feature ideas under the relevant section. Use the template below.
Acceptance criteria are the contract — if a criterion can't be tested,
rewrite it until it can be. Move features to `ROADMAP.md` once specced.

---

## Feature Template

```
### Feature Name

**What:** One sentence: what this does for the user.
**Why:** Why it matters — user value or problem it solves.
**Acceptance criteria:**
- [ ] Specific, testable condition.
- [ ] Another condition.
**Notes:** Constraints, affected components, open questions.
**Priority:** high | medium | low
**Status:** idea | specced | in progress | done
```

---

## Input & Submission

<!-- Features related to the username form, query building, and submit flow. -->

### Dynamic Platform & Username Input

**What:** Show a single username input by default with a platform selector
(radio buttons or dropdown) for choosing Moxfield/Archidekt; if the user has
different usernames per platform, the form expands to show additional
username input fields.
**Why:** Most users only have one deckbuilding platform/username — the
current form may force entering both unnecessarily, adding friction.
**Acceptance criteria:**
- [x] Form renders one username field and one platform selector by default.
- [x] Selecting "both platforms" (or similar) reveals a second username field.
- [x] Submitting with only one platform/username queries only that platform.
**Notes:** Implemented as a 3-option radio group (Moxfield / Archidekt /
Both) defaulting to Archidekt, given Moxfield's known WAF blocker. Selecting
"Both" reveals both username fields; `onSubmit(moxfield, archidekt)`
signature unchanged — empty platforms pass `''`, which `page.tsx` already
omits from the query string. Verified: "Both" mode with only Archidekt
filled queries Archidekt only.
**Priority:** medium
**Status:** done

---

## Source Error Handling

<!-- Features related to SourceErrorBanner and partial-source failure messaging. -->

---

## Identity Layer

<!-- Color pie chart, format breakdown bar chart, color frequency across decks. -->

### Multi-Color Identity Representation

**What:** Replace the current "gold" placeholder for 2+ color decks in the
color identity chart with a visual that reflects the actual color
combination (e.g., a striped fill of the constituent colors).
**Why:** Currently all multicolor decks are lumped into one "gold" category,
hiding meaningful color identity data for the majority of non-mono decks.
**Acceptance criteria:**
- [x] Decks with 2+ colors render with a fill representing their constituent
  colors (e.g., striped or split segments).
- [x] Mono-color decks continue to render with their single representative
  color.
- [x] Legend/labels reflect the actual color combinations present in the data.
**Notes:** Implemented via SVG `<pattern>` definitions (diagonal stripes
cycling through constituent color hexes) referenced as `Cell` fills in
`ColorPieChart.tsx`. Legend swatches render the same patterns.
**Priority:** medium
**Status:** done

### Fix Color Identity Chart Label Overlap

**What:** Resolve the overlap between the color identity chart's data labels
and the chart section/legend labels.
**Why:** Overlapping labels make the chart hard to read and look unpolished.
**Acceptance criteria:**
- [x] No visual overlap between data labels and legend/section labels at
  standard viewport sizes.
- [x] Labels remain legible for small slice percentages.
**Notes:** Removed on-pie percentage labels entirely (with 10 distinct
identity combos possible, on-pie labels collided with each other regardless
of legend position) and moved percentages into the vertical legend on the
right, alongside the swatch and identity name. Verified against a real
Archidekt profile (`Bud_McChud`, 10 distinct color identities) — no overlap.
**Priority:** medium
**Status:** done

### Rethink Format Breakdown Visualization

**What:** Make the format breakdown conditional: if one format dominates the
included decks, show a "Primary Format" stat summary instead of a bar chart;
otherwise show the existing bar chart.
**Why:** For most players, the format breakdown is dominated by a single
format (e.g., Commander), making the current chart visually uninteresting
and low-value. A stat summary is more direct for that common case, while the
bar chart still adds value when format distribution is genuinely mixed.
**Acceptance criteria:**
- [ ] If the primary format's share of included decks is >= 80%, render a
  stat-style summary (format name, deck count, percentage — e.g.
  "Commander: 8/10 decks (80%)") instead of the bar chart.
- [ ] If no format reaches the 80% threshold, render the existing bar chart
  unchanged.
- [ ] The 80% threshold is a named constant.
**Notes:** Threshold may be revisited after seeing real multi-format data.
Affects `FormatBreakdown.tsx` only — `formatProfile` aggregator output is
unchanged.
**Priority:** low
**Status:** specced

---

## Collection Layer

<!-- Staple frequency (3+ decks), pet cards (exactly 1 deck). -->

### Reconsider Pet Cards Section

**What:** Remove the "pet cards" (cards used in exactly one deck) section
from the dashboard. Also raise the "staples" threshold from 2+ decks to 3+
decks to match the original `ROADMAP.md`/`phase-8-features.md` framing
("staple frequency (cards in 3+ decks)").
**Why:** A list of several hundred singleton cards is unlikely to be a
meaningful or readable callout — removing it is simpler than redesigning a
presentation that won't scale. The 2+ threshold for staples was also looser
than originally intended; 3+ decks is a stronger signal of a "go-to" card.
**Acceptance criteria:**
- [ ] Pet cards list/section is removed from `StaplesList.tsx` and the
  dashboard UI.
- [ ] `/lib/aggregators/cardOverlap.ts` classifies a card as a staple only
  when `deckCount >= 3` (currently `> 1`). Cards in exactly 2 decks are no
  longer surfaced as staples or pet cards.
- [ ] Check `/types/stats.ts` and existing tests for `petCards` usage before
  deciding whether to remove the field from `CardOverlapProfile` entirely or
  leave it computed-but-unused (CLAUDE.md "no dead code" — prefer full
  removal if no other consumer exists, but flag the type change explicitly).
- [ ] `/tests/aggregators/cardOverlap.test.ts` updated to cover the new 3+
  threshold (a card in exactly 2 decks should appear in neither list).
**Notes:** This is a type change to `CardOverlapProfile` if `petCards` is
removed — note explicitly per CLAUDE.md `/types` rule. The threshold change
is an aggregator behavior change requiring updated Vitest tests per CLAUDE.md.
**Priority:** low
**Status:** specced

---

## Habit Layer

<!-- Mana curve histogram, average CMC, archetype radar (aggro/control/combo/midrange). -->

### Mana Curve Averaging Across Decks

**What:** Ensure the mana curve histogram correctly averages CMC across all
of the user's included decks, rather than summing raw counts.
**Why:** An unaveraged curve would misrepresent a user's actual playing
habits, especially as deck count grows.
**Acceptance criteria:**
- [x] Mana curve values represent the average CMC distribution per deck, not
  a raw sum.
- [x] Adding/removing decks updates the average correctly.
**Notes:** Verified — `computeCurveProfile` in `/lib/aggregators/curve.ts`
divides `cmcSums` by `decks.length` (line 30), producing a true per-deck
average. All 5 existing aggregator tests pass. No code change needed.
**Priority:** high
**Status:** done

### Deck Toggle Controls on Mana Curve Chart

**What:** Add controls to the mana curve chart allowing individual decks to
be added to or removed from the current view.
**Why:** Lets users explore how individual decks contribute to their overall
mana curve.
**Acceptance criteria:**
- [x] Mana curve chart re-renders when decks are toggled in/out.
- [x] Toggle state is shared with (or driven by) the global Deck Selector.
**Notes:** Already satisfied by the global `DeckSelector` (Blocks 3/4) —
toggling a deck calls `handleDeckToggle`, which refetches `/api/stats` and
updates `statsData`, which `CurveHistogram` consumes directly. No standalone
per-chart control needed; closing as-is.
**Priority:** medium
**Status:** done

### Replace Archetype Fingerprint Chart with Card Type Composition

**What:** Remove the archetype radar chart (aggro/midrange/control/combo)
and replace it with a "Card Type Composition" chart showing the average
per-deck breakdown by `CardType` (Creature, Instant, Sorcery, Enchantment,
Artifact, Planeswalker, Land, Battle, Kindred, Other).
**Why:** The archetype radar skews heavily toward "midrange" for the
majority of users (Commander players), making it visually uninteresting and
low-signal. Card type composition is format-agnostic, shows real
deck-building tendencies (creature-heavy vs. spell-heavy vs.
control-shell-style decks), and works equally well for any format.
**Acceptance criteria:**
- [ ] New aggregator (e.g. `/lib/aggregators/cardTypeProfile.ts`) computes
  the average count per `CardType` across included decks, following the same
  per-deck-then-average pattern as `curveProfile.ts`.
- [ ] New chart component (e.g. `CardTypeComposition.tsx`) renders the
  breakdown (bar chart, consistent with existing chart styling).
- [ ] `ArchetypeRadar.tsx` and `/lib/aggregators/archetypeProfile.ts` are
  removed — first confirm no other consumers (check `/types/stats.ts`,
  `computeProfileStats`, and existing tests).
- [ ] `ArchetypeProfile` is removed from `/types/stats.ts` and replaced with
  a new `CardTypeProfile` type — flag this `/types` change explicitly per
  CLAUDE.md.
- [ ] New aggregator has Vitest tests covering standard cases (empty decks,
  single deck, multiple decks, all card types represented).
**Notes:** This replaces an existing chart and removes an existing
aggregator/type rather than purely adding — larger scope than the other two
"open" items. Should be its own block/PR distinct from the rest of Phase 8
follow-up work.
**Priority:** medium
**Status:** specced

---

## Deck Selector

<!-- Deck list with include/exclude toggle; client-side re-aggregation. -->

### Deck Filtering Controls

**What:** Add filters to the deck selector for format, card count, and color
identity.
**Why:** Lets users narrow down which decks are visible in the deck grid
without scrolling through a long list.
**Acceptance criteria:**
- [x] Filters for format, card count range, and color identity are available.
- [x] Filtering only narrows which decks are shown in the grid — it does not
  change `includedDeckIds` or trigger re-aggregation. The "X of Y decks
  included" count always reflects the full toggle state, not the filtered
  view.
**Notes:** Implemented as new `DeckFilters.tsx`, with filter state owned
locally by `DeckSelector` (the grid owner). Format is a dropdown of formats
present across the user's decks; color identity is a multi-select of color
pips where a deck matches if its identity contains all selected colors; card
count is a min/max numeric range. A "Clear filters" button appears once any
filter is active, and a "(showing N)" suffix appears next to the inclusion
count when the filtered view differs from the full deck list.
**Priority:** medium
**Status:** done

### Enriched Deck Display

**What:** Show additional per-deck info in the deck selector — color
identity, commander (if applicable), and other relevant metadata.
**Why:** Helps users identify decks at a glance without cross-referencing the
source platform.
**Acceptance criteria:**
- [x] Each deck entry displays color identity (e.g., color pips).
- [x] Commander decks display the commander's name.
- [x] Non-commander decks display equivalent relevant info (e.g., format).
**Notes:** New shared `ColorIdentityPips` component (also exports
`SINGLE_COLOR_HEX`, now reused by `ColorPieChart`) renders ordered color
pips from `Deck.colorIdentity`. Every card shows format + card count;
Commander decks additionally show `commanders[].name`.
**Priority:** medium
**Status:** done

### Card/Button Layout for Deck Selector

**What:** Replace the current table-like deck list with a card or
button-based layout.
**Why:** More visually engaging and better suited to displaying enriched
per-deck info (color identity, commander, etc.).
**Acceptance criteria:**
- [x] Decks render as individual cards/buttons rather than table rows.
- [x] Layout remains usable/responsive for users with large numbers of decks.
**Notes:** Implemented together with Enriched Deck Display, as anticipated.
Responsive grid (1/2/3 columns); each card is a toggle button with
`aria-pressed`, fading excluded decks via opacity. Verified against
`Bud_McChud` (12 decks, all formats/commander combos) — toggling updates the
included count and re-aggregation as before.
**Priority:** medium
**Status:** done

### Move Deck Selector to Top of Page

**What:** Relocate the deck selector to the top of the dashboard page.
**Why:** Lets users change which decks are included without scrolling back
and forth between the selector and the charts.
**Acceptance criteria:**
- [x] Deck selector renders above the chart sections in the dashboard layout.
- [x] Selector remains usable/visible without excessive scrolling on smaller
  viewports (consider sticky positioning).
**Notes:** Moved the "Your Decks" section to directly below the username
form/source error banner, before "Identity". Sticky positioning was
considered but not used — the 12-deck card grid is tall enough that pinning
it would eat most of the viewport on smaller screens; a normal scroll
position reads better.
**Priority:** medium
**Status:** done

---

## Loading / Error / Empty States

<!-- Cross-cutting: skeleton states, error boundaries, zero-deck empty states. -->

---

## Backlog

<!-- Unplaced ideas — drop anything here that doesn't fit a section yet. -->
**What:** Add a dark mode and corresponding toggle to the UI.
**Why:** Lets users switch between bright and dark layout themes according to their preference.
**Acceptance criteria:**
- [x] Dark mode selector correctly and quickly switches themes
- [x] Theme persists on reload
**Notes:** Implemented via Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *))`
in `app/globals.css`, toggled by a new `ThemeToggle.tsx` in the dashboard
header that adds/removes a `dark` class on `<html>` and persists the choice
to `localStorage`. An inline script in `app/layout.tsx`'s `<head>` applies
the stored theme (or `prefers-color-scheme` if unset) before paint to avoid a
flash of the wrong theme. All dashboard components, the username form, error
banners, deck selector/filters, and chart components got `dark:` variants.
Chart-specific colors (grid lines, axis text, tooltip background, bar fills)
use new CSS custom properties (`--chart-grid`, `--chart-axis-text`,
`--chart-tooltip-*`, `--chart-bar-primary/secondary`) defined for both themes
in `globals.css` and referenced via `var(...)` in Recharts props. Per Warren's
decision, `SINGLE_COLOR_HEX` mana-color swatches in `ColorIdentityPips.tsx`
stay constant across themes (only their ring color gets a dark variant) since
they represent MTG card colors, not UI chrome.
**Priority:** high
**Status:** done
</content>
