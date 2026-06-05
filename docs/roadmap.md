# Deckprint — Project Roadmap

This document covers project state and phase specs. For conventions, coding
standards, layer rules, and architecture, see `CLAUDE.md`.

**Read before starting any session:**
1. `CLAUDE.md` — conventions and rules
2. This file — current phase and what's built
3. Phase-specific reference files listed in the active phase spec below

---

## Status Legend

- ✅ Complete
- 🔄 In Progress
- ⬜ Pending

---

## Current Status

**Active phase:** Phase 8 — Dashboard UI 🔄
**Tests passing (start of Phase 8):** 129
**Known blocker:** Moxfield blocked by Cloudflare WAF (403/auth_required).
Archidekt fully operational. See `/docs/api-reference.md`.

---

## Confirmed Codebase (end of Phase 6)

```
/types/
  core.ts           → Deck, CardEntry, UserProfile, PlatformSource,
                       Color, Format, CardType, Platform
  errors.ts         → FetchError, FetchErrorReason
  stats.ts          → ProfileStats and all sub-types

/lib/
  fetchers/
    moxfield.ts     → paginated fetch; fails gracefully on WAF 403
    archidekt.ts    → paginated fetch; fully operational
  normalizers/
    moxfield.ts     → MoxfieldDeckResponse → Deck[]
    archidekt.ts    → ArchidektDeckResponse → Deck[]
  aggregators/
    colorProfile.ts
    curveProfile.ts
    formatProfile.ts
    cardOverlap.ts
    archetypeProfile.ts
    index.ts        → computeProfileStats(decks): ProfileStats
  cache/            → Upstash Redis wrappers
  userDecks.ts      → resolveUserDecks(username, platform)

/app/api/
  profile/route.ts  → GET /api/profile?moxfield=X&archidekt=Y
  stats/route.ts    → GET /api/stats?moxfield=X&archidekt=Y

/tests/
  aggregators/      → Vitest tests for all aggregators
  api/
    profile.test.ts → 7 cases (Phase 7 adds more)
    stats.test.ts   → 7 cases (Phase 7 adds more)
```

---

## Phase History

### Phase 0 — Claude Code Setup ✅
Produced `CLAUDE.md`, `ROADMAP.md`, `docs/data-model.md`,
`docs/api-reference.md`, `docs/audit-prompt.md`, `docs/spec-template.md`
before any code.

### Phase 1 — Foundation ✅
Scaffolded Next.js + TypeScript, connected Vercel to main branch,
explored API response shapes, scaffolded all core types in `/types/`.

### Phase 2 — Data Layer ✅
Built fetchers (with full pagination) and normalizers for both platforms.
Added Redis caching and `resolveUserDecks`. Moxfield WAF issue first
identified and documented in `/docs/api-reference.md`.

### Phase 3 — Aggregation Engine ✅
Built all aggregator pure functions. `computeProfileStats` assembles
the full `ProfileStats`. Vitest tests written for every aggregator.

### Phase 4 — API Routes (Single Source) ✅
Introduced `/api/profile` and `/api/stats` routes accepting a single
`?moxfield=X` or `?archidekt=Y` parameter. Initial test suites written.

### Phase 5 — Route Hardening ✅
Added structured error handling, 400 validation, type guards, and
tsc/lint compliance. Test coverage expanded to all error cases.

### Phase 6 — Multi-Source Support ✅
Extended both routes to accept `?moxfield=X&archidekt=Y` simultaneously
using `Promise.all`. Verification revealed any request including Moxfield
returns 403 due to the WAF, making multi-source effectively unusable for
Moxfield callers — direct motivation for Phase 7.

---

## Phase 7 — Partial-Source Resilience ✅

### Reference files
- `CLAUDE.md`
- `/types/core.ts` — to be modified
- `/types/errors.ts` — read-only reference
- `/types/stats.ts` — to be modified
- `/app/api/profile/route.ts` — to be modified
- `/app/api/stats/route.ts` — to be modified
- `/docs/api-reference.md` — Moxfield WAF status

### Problem
Both routes use `Promise.all`. A single source failure rejects the entire
request. Any call including Moxfield currently fails with 403.

### Solution
Replace `Promise.all` with `Promise.allSettled`. Fulfilled sources
contribute to the normal response; rejected sources are collected in a
`sourceErrors` field. Return 200 if at least one source succeeds; return
an error status only if every source fails.

### Type Changes

#### `/types/core.ts` — add `SourceError`, update `UserProfile`

```typescript
export interface SourceError {
  platform: Platform;
  username: string;
  reason: FetchErrorReason;   // import from './errors' — do not redeclare
  message: string;
}

export interface UserProfile {
  sources: PlatformSource[];
  sourceErrors?: SourceError[];  // omit entirely when all sources succeed
  decks: Deck[];
  fetchedAt: string;
}
```

#### `/types/stats.ts` — add `sourceErrors` to `ProfileStats`

```typescript
export interface ProfileStats {
  colorProfile: ColorProfile;
  curveProfile: CurveProfile;
  formatProfile: FormatProfile;
  cardOverlap: CardOverlapProfile;
  archetypeProfile: ArchetypeProfile;
  sourceErrors?: SourceError[];   // import SourceError from './core'
}
```

Optional and omitted when all sources succeed — non-breaking for existing
consumers.

### Core Pattern (apply to both routes)

Replace the `Promise.all` + outer `try/catch` block:

```typescript
const platforms: Array<{ username: string; platform: Platform } | null> = [
  moxfield ? { username: moxfield, platform: 'moxfield' } : null,
  archidekt ? { username: archidekt, platform: 'archidekt' } : null,
];

const results = await Promise.allSettled(
  platforms.map((p) =>
    p ? resolveUserDecks(p.username, p.platform) : Promise.resolve(null)
  )
);

const sources: PlatformSource[] = [];
const allDecks: Deck[] = [];
const sourceErrors: SourceError[] = [];

for (let i = 0; i < platforms.length; i++) {
  const p = platforms[i];
  if (!p) continue;
  const result = results[i];
  if (result.status === 'fulfilled' && result.value) {
    sources.push({
      platform: p.platform,
      username: p.username,
      deckCount: result.value.length,
    });
    allDecks.push(...result.value);
  } else if (result.status === 'rejected') {
    const err = result.reason;
    sourceErrors.push({
      platform: p.platform,
      username: p.username,
      reason: err instanceof FetchError ? err.reason : 'unknown',
      message: err instanceof FetchError ? err.message : 'Unexpected error',
    });
    if (!(err instanceof FetchError)) {
      console.error(`Unexpected error fetching ${p.platform}:`, err);
    }
  }
}

// All sources failed
if (sources.length === 0) {
  const first = sourceErrors[0];
  const status =
    first.reason === 'not_found'     ? 404 :
    first.reason === 'auth_required' ? 403 :
    first.reason === 'rate_limited'  ? 429 : 502;
  return NextResponse.json({ error: first.message }, { status });
}
```

`Promise.allSettled` never rejects — remove the outer `try/catch` entirely.

### `/app/api/profile/route.ts` — final response

```typescript
const profile: UserProfile = {
  sources,
  ...(sourceErrors.length > 0 && { sourceErrors }),
  decks: allDecks,
  fetchedAt: new Date().toISOString(),
};
return NextResponse.json(profile);
```

### `/app/api/stats/route.ts` — final response

```typescript
const stats = computeProfileStats(decks);
return NextResponse.json({
  ...stats,
  ...(sourceErrors.length > 0 && { sourceErrors }),
});
```

`include` filtering on `allDecks` is unchanged and applied before passing
to `computeProfileStats`.

### Tests Required

#### `tests/api/profile.test.ts` — add to existing 7 cases

Mock helper keyed on platform:
```typescript
mockResolveUserDecks.mockImplementation((_username, platform) => {
  if (platform === 'moxfield')
    return Promise.reject(
      new FetchError('moxfield', 'auth_required', 'Cloudflare blocked request')
    );
  return Promise.resolve(archiDecks);
});
```

New cases:
- One source succeeds, one fails (`auth_required`) → 200, one `sources`
  entry, one `sourceErrors` entry with `reason: 'auth_required'`
- One source succeeds, one fails (`not_found`) → 200, partial results
- Both sources fail → 404 (status derived from first error)
- Both sources fail with different reasons → status from first error

#### `tests/api/stats.test.ts` — mirror the same four additions

### No Changes
`/lib/userDecks.ts`, `/lib/fetchers/*`, `/lib/normalizers/*`,
`/lib/aggregators/*`. Request interface (`?moxfield=X&archidekt=Y`).
400 validation (neither param provided).

### Do Not
- Do not modify `FetchErrorReason` in `/types/errors.ts` — reuse it.
- Do not include `sourceErrors: []` — omit the field when empty.
- Do not change `resolveUserDecks` or any fetcher/normalizer.
- Do not silently swallow non-`FetchError` rejections — log with
  `console.error`, map to `reason: 'unknown'`.

### Verification Checklist
- [ ] `npx vitest run` — all 121 existing tests pass plus new cases
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `GET /api/profile?archidekt=X` → 200, one `sources` entry, no `sourceErrors`
- [ ] `GET /api/profile?moxfield=X&archidekt=Y` → 200, one Archidekt source,
      one `sourceErrors` entry with `reason: 'auth_required'`
- [ ] `GET /api/profile?moxfield=X` → 403 (all sources failed)
- [ ] `GET /api/stats?moxfield=X&archidekt=Y` → 200, stats from Archidekt
      only, `sourceErrors` present
- [ ] `GET /api/profile` (no params) → 400

---

## Phase 8 — Dashboard UI 🔄

### Reference files
- `CLAUDE.md`
- `/types/core.ts` — `UserProfile`, `Deck`, `SourceError`
- `/types/stats.ts` — `ProfileStats` and all sub-types
- `/docs/data-model.md` — aggregation output types

### Goal
Build the client-facing analytics dashboard that consumes `/api/stats`.
Users enter platform usernames, the app fetches their data, and renders
the profile across four visualization sections. Deck include/exclude
toggling is managed in client state.

### Sections
**Identity layer** — color identity pie chart, format breakdown bar chart,
color frequency across decks.

**Collection layer** — staple frequency (cards in 3+ decks), pet cards
(cards in exactly one deck).

**Habit layer** — average mana curve histogram, overall average CMC,
archetype fingerprint (aggro/control/combo/midrange radar).

**Deck selector** — list of all fetched decks with include/exclude toggle.
Toggling `includedInProfile` triggers re-aggregation client-side. The
server always returns all decks; filtering happens in the client before
display.

### Multi-site input
Separate username fields for Moxfield and Archidekt (both optional, at
least one required). On submit, calls `/api/stats?moxfield=X&archidekt=Y`
omitting blank params.

If `sourceErrors` is present in the response, surface a non-blocking
warning banner per failed source (e.g. "Moxfield data unavailable —
showing Archidekt decks only").

### Component structure
```
/app/dashboard/
  page.tsx
  /components/
    UsernameForm.tsx
    DeckSelector.tsx
    SourceErrorBanner.tsx
    /charts/
      ColorPieChart.tsx
      CurveHistogram.tsx
      FormatBreakdown.tsx
      ArchetypeRadar.tsx
      StaplesList.tsx        → ranked table, no chart library needed
```

### UI-specific requirements
- Every chart component must handle loading, error, and empty states.
- Aggregation logic must not appear in any component — consume
  `ProfileStats` as props.

### Verification Checklist
- [ ] Every chart handles loading / error / empty states
- [ ] No aggregation logic in any component or API route
- [ ] Deck selector correctly toggles `includedInProfile` and triggers
      re-aggregation
- [ ] `SourceErrorBanner` appears when `sourceErrors` is present
- [ ] Full end-to-end test with a real Archidekt username
- [ ] `npx tsc --noEmit` — no TypeScript errors

---

## Phase 9 — Report Card ⬜

### Reference files
- `CLAUDE.md`
- `/types/stats.ts` — `ProfileStats`
- `/lib/aggregators/index.ts`

### Goal
Generate a shareable deckbuilder profile card from the user's stats —
exportable as PNG and accessible via shareable URL.

### Features

**Report card layout** — single-screen summary including:
- Color identity signature (dominant colors)
- Top 5 most-played cards
- Archetype breakdown
- Primary format
- Generated deckbuilder label (e.g. "Sultai Goodstuff Grinder")

**Label generator** — pure function in `/lib/labelGenerator.ts` that
takes `ProfileStats` and returns a label string. Inputs: `mostPlayedColor`,
`primaryFormat`, dominant `archetypeProfile` score. Edge cases to handle:
one deck only, perfectly even color distribution, all formats equal.
Must have Vitest tests.

**Export** — `html2canvas` captures the report card DOM node → PNG
download. No server-side rendering for v1.

**Shareable URL** — encode profile query params in the URL; on load,
re-fetch and regenerate automatically.

### Component structure
```
/app/report/
  page.tsx
  /components/
    ReportCard.tsx
    DeckbuilderLabel.tsx
    ExportButton.tsx
/lib/
  labelGenerator.ts
```

### Verification Checklist
- [ ] Shareable URL correctly restores state on load
- [ ] Export produces a clean PNG
- [ ] Label generator handles all edge cases (tested)
- [ ] Report card generation is stateless and reproducible from same input
- [ ] `npx tsc --noEmit` — no TypeScript errors

---

## Phase 10 — Polish & Launch ⬜

### Goal
Harden the UX, handle edge cases gracefully, add a landing page, and
prepare for public launch.

### Tasks
- Loading skeletons for all dashboard sections
- User-readable error messages throughout (no raw error objects in UI)
- Empty state designs for users with zero public decks
- Rate limit messaging (429 responses surfaced clearly)
- Mobile responsiveness pass across dashboard and report card
- Landing page at `/` explaining Deckprint and how to use it
- Final dead code pass (unused imports, commented-out blocks, TODOs)

### Verification Checklist
- [ ] Full end-to-end: enter username → load profile → toggle decks →
      view all charts → generate report card → export PNG → load shared URL
- [ ] No console errors or warnings in production mode
- [ ] All TODOs resolved or explicitly deferred post-launch
- [ ] Landing page accurately describes the app
- [ ] All error states are human-readable
- [ ] App is usable on a mobile screen

---

## Checkpoint Audit Schedule

| Phase | Description             | Audit prompt section         |
|-------|-------------------------|------------------------------|
| 1     | Foundation              | `audit-prompt.md` §CP1       |
| 2     | Data Layer              | `audit-prompt.md` §CP2       |
| 3     | Aggregation Engine      | `audit-prompt.md` §CP3       |
| 4–6   | Routes                  | `audit-prompt.md` §CP4       |
| 7     | Partial-Source Resilience | `audit-prompt.md` §CP4     |
| 8     | Dashboard UI            | `audit-prompt.md` §CP4       |
| 9     | Report Card             | `audit-prompt.md` §CP5       |
| 10    | Polish & Launch         | `audit-prompt.md` §CP6       |

Paste the standing audit prompt from `audit-prompt.md`, append the
phase-specific block, and run it in a fresh Claude Code session before
beginning the next phase.