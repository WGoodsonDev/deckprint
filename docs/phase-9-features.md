# Phase 9 — Report Card: Feature List

**Phase ref:** `ROADMAP.md` §Phase 9  
**Status:** 🔄 In Progress — base scaffold shipped, follow-up feature pass complete. Calibration and PR pending.

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

## Data Sections

<!-- New data sections to add to the report card layout. -->

### Mana Curve Sparkline

**What:** A compact bar chart on the report card showing the user's average
mana curve, alongside their overall avg CMC value.
**Why:** Communicates the speed profile of a user's decks at a glance —
one of the most meaningful deckbuilder signals and currently unused on the
report card.
**Acceptance criteria:**
- [x] A new `CurveSparkline` component renders a compact histogram of
  `curveProfile.averageCurve` (CMC buckets 0–6+).
- [x] Overall avg CMC is displayed inline (e.g. "Avg CMC: 2.9").
- [x] Component is placed in the `ReportCard` layout without overflowing
  the card boundaries.
- [x] Handles the empty case (no curve data) without throwing.
**Notes:** Component lives in `/app/report/components/CurveSparkline.tsx`.
Uses plain CSS bars — no Recharts. 6+ bucket aggregates all CMC values ≥ 6.
**Priority:** medium
**Status:** done

---

### Library Summary Stats

**What:** A single-line callout on the report card showing total included
decks and total unique cards (e.g. "12 decks · 438 unique cards").
**Why:** Gives the card scale and context — rewards a large collection and
immediately signals the scope of the profile being shared.
**Acceptance criteria:**
- [x] Two new fields added to `ProfileStats` in `/types/stats.ts`:
  `deckCount: number` and `uniqueCardCount: number`. Type change flagged
  per `CLAUDE.md`.
- [x] `computeProfileStats` in `/lib/aggregators/index.ts` populates both
  fields. `uniqueCardCount` is the count of distinct `scryfallId` values
  across all included `CardEntry` records (mainboard + commanders).
- [x] The report card renders the values in a single line using the
  "X decks · Y unique cards" format.
- [x] New aggregator logic is covered by a Vitest test: empty deck list
  yields `deckCount: 0, uniqueCardCount: 0`; cards shared across decks are
  counted once.
**Notes:** `/types/stats.ts` modification flagged. Tests in
`/tests/aggregators/index.test.ts`.
**Priority:** medium
**Status:** done

---

### Color Breadth Stat

**What:** Display the number of distinct color identities across the user's
included decks on the report card (e.g. "9 distinct color identities").
**Why:** Differentiates a rainbow brewer from someone committed to one or
two colors — adds personality that the color pips alone don't convey.
**Acceptance criteria:**
- [x] The count is derived from
  `Object.keys(colorProfile.identityDistribution).length` — no new
  aggregator or type change required.
- [x] Renders as a short label on the report card (e.g. "9 distinct color
  identities" or "3 color identities").
- [x] Singular/plural agreement ("1 color identity" vs "2 color
  identities").
**Notes:** Rendered inline in the library summary line (e.g. "12 decks ·
438 unique cards · 9 color identities"). No aggregator or type change.
**Priority:** low
**Status:** done

---

## Label Generator

<!-- Features that expand the vocabulary or logic of `lib/labelGenerator.ts`. -->

### Avg CMC Speed Descriptor

**What:** Add an optional speed component to the deckbuilder label based on
`curveProfile.overallAverageCmc` (e.g. "Sultai Low-Curve Creature-Heavy
Grinder").
**Why:** The speed of a player's decks is one of the most distinctive
deckbuilding traits — adding it to the label makes the generated string
meaningfully more personal.
**Acceptance criteria:**
- [x] `generateDeckbuilderLabel` gains a speed component derived from
  `overallAverageCmc`.
- [x] Avg CMC < `LOW_CURVE_THRESHOLD` (2.5) → component is `"Low-Curve"`.
- [x] Avg CMC > `HIGH_CMC_THRESHOLD` (3.5) → component is `"High-CMC"`.
- [x] Values between the thresholds → component is omitted (no filler
  word).
- [x] Both thresholds are named constants in `labelGenerator.ts`.
- [x] Vitest tests cover: below threshold, above threshold, within range,
  and edge values exactly at each threshold.
**Notes:** `LOW_CURVE_THRESHOLD` is exported (shared with the Pilot tail
word signal). Speed component slots between color and type components.
**Priority:** medium
**Status:** done

---

### Deck Count Descriptor and Tail Word Variety

**What:** Expand the label generator with a deck count descriptor
("Versatile" / "Specialist") and replace the fixed "Grinder" tail with a
word chosen by a priority-ordered combined signal across four stats.
**Why:** Every user currently gets "Grinder" as their closing label word,
which is generic. Varying it based on deckbuilding behavior adds
personality and replay value for users checking their profile over time.
**Acceptance criteria:**
- [x] A deck count descriptor is derived from `profileStats.deckCount`.
  - Many decks (≥ `VERSATILE_THRESHOLD`) → `"Versatile"`
  - Few decks (≤ `SPECIALIST_THRESHOLD` and > 0) → `"Specialist"`
  - Middle range → omitted.
- [x] The tail word is selected via a priority-ordered check against four
  signals. First match wins; `"Grinder"` is the fallback:
  1. **Brewer** — staple rate ≤ `LOW_STAPLE_RATE_THRESHOLD`
  2. **Tactician** — Instant share ≥ `TACTICIAN_INSTANT_THRESHOLD`
  3. **Architect** — Permanent density ≥ `ARCHITECT_PERMANENT_THRESHOLD`
  4. **Pilot** — dominant Creature AND avg CMC ≤ `LOW_CURVE_THRESHOLD`
  5. **Grinder** (fallback)
- [x] `totalNonLandAvg` is local to `labelGenerator.ts`, not exported.
- [x] All thresholds are named constants in `labelGenerator.ts`.
- [x] Vitest tests cover each tail word branch and each deck count branch.
- [x] `uniqueCardCount` sourced from `profileStats.uniqueCardCount`.
**Notes:** Full label shape: `{Color} {Speed} {DeckCount} {Type}-Heavy {Tail}`.
Thresholds are initial values needing calibration against `Bud_McChud`.
**Depends on:** Library Summary Stats (`deckCount`, `uniqueCardCount`).
**Priority:** medium
**Status:** done

---

## Export & Sharing

<!-- Features related to PNG export and the shareable URL flow. -->

### Copy Shareable URL Button

**What:** A "Copy link" button on the report page that copies the current
URL to the clipboard so users can share their report card without manually
copying the address bar.
**Why:** The URL is already the share mechanism (query params encode the
profile), but there is no affordance to copy it — users have to know to
grab it themselves.
**Acceptance criteria:**
- [x] A "Copy link" button appears on the report page alongside the export
  button.
- [x] Clicking it calls `navigator.clipboard.writeText(window.location.href)`.
- [x] Button label changes to "Copied!" for ~2 seconds, then resets.
- [x] If the Clipboard API is unavailable (non-secure context), the button
  is hidden (returns null).
**Notes:** Lives in `/app/report/components/CopyLinkButton.tsx`. Separate
from `ExportButton` to preserve single responsibility.
**Priority:** low
**Status:** done

---

### Export Size Presets

**What:** A toggle on the export button lets users choose the aspect ratio
of the exported PNG before downloading: Square (1:1), Widescreen (16:9),
or Auto (current card dimensions).
**Why:** Different sharing destinations prefer different aspect ratios —
square for most social feeds, widescreen for Twitter/Discord embeds. One
export size doesn't fit all.
**Acceptance criteria:**
- [x] `ExportButton` renders a 3-option toggle (Auto / Square / Widescreen)
  visible before the user clicks "Export as PNG".
- [x] Auto is the default selection.
- [x] For Square and Widescreen, `domToPng` is called with explicit `width`
  and `height` options that enforce the chosen aspect ratio.
- [x] Auto uses the current behavior (no explicit dimensions passed to
  `domToPng`).
- [x] The selected preset persists across export attempts within the same
  page session (i.e. not reset after each export).
**Notes:** Square: 800×800px. Widescreen: 1200×675px. Visual output
should be verified against a real report card before finalizing. Pending
calibration step.
**Priority:** medium
**Status:** done

---

## Backlog

<!-- Deferred to Phase 10 (Polish & Launch) — do not implement in Phase 9. -->

### Color-Keyed Card Background

**What:** The report card background shifts subtly based on the user's
dominant color identity, making the exported PNG feel personalized.
**Why:** Visual personality makes the share image more distinctive.
Deferred because visual polish is Phase 10 scope.
**Status:** deferred to Phase 10

---

### Dark/Light Card Toggle Independent of App Theme

**What:** Let users export the card in dark or light mode regardless of
their browser's current theme.
**Why:** The export goes to someone else's feed; the user should control
its appearance. Deferred because it requires scoping the theme class to
the card node rather than `<html>` — a small architectural shift worth
doing during the polish pass.
**Status:** deferred to Phase 10
