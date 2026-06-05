# CLAUDE.md

## Project Overview
**Deckprint** is a Magic: The Gathering deck profiler that aggregates stats
across a user's full deck library to produce a unified deckbuilder profile.
Users provide Moxfield and/or Archidekt username(s); the app fetches their
public decklists, normalizes the data, and renders an analytics dashboard
with the option to export a shareable report card.

For current project state, active phase, and phase specs, see `/docs/roadmap.md`.

---

## Tech Stack
- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts (D3 for complex visualizations only)
- **Backend:** Next.js API routes (Node.js)
- **Caching:** Upstash Redis
- **Deployment:** Vercel
- **Testing:** Vitest

---

## Project Structure
```
/app
  /api              → Next.js API routes
  /dashboard        → Dashboard page and dashboard-specific components
  /report           → Report card page and report-specific components
  /components       → Shared UI components
/lib
  /fetchers         → Raw API fetch functions (Moxfield, Archidekt)
  /normalizers      → Raw API responses → internal data model
  /aggregators      → Pure aggregation functions
  /cache            → Upstash Redis wrappers
  userDecks.ts      → Orchestrates fetch + normalize + cache per platform
  labelGenerator.ts → Pure fn: ProfileStats → deckbuilder label string
/types
  core.ts           → Deck, CardEntry, UserProfile, Platform, etc.
  errors.ts         → FetchError, FetchErrorReason
  stats.ts          → ProfileStats and all sub-types
/docs               → data-model.md, api-reference.md, audit-prompt.md,
                      spec-template.md
/tests              → Vitest unit tests (mirrors /lib structure)
CLAUDE.md           → This file — conventions, architecture, rules
ROADMAP.md          → Project state, active phase, phase specs
```

---

## Data Flow
```
User input (username + platform)
  → API route
  → Fetcher (raw API call)
  → Normalizer (raw → internal model)
  → Redis cache
  → Aggregator (internal model → stats)
  → Dashboard (stats → charts)
```

---

## TypeScript Conventions
- **Moderate strict mode:** `strict: true` in tsconfig; well-justified `as`
  casts are acceptable with an inline comment explaining why.
- No `any` without an explicit `// eslint-disable` comment and justification.
- All internal data structures must be typed via interfaces in `/types`.
- External API response shapes must be typed separately from internal types
  (e.g. `MoxfieldDeckResponse` vs `Deck`).

---

## Coding Conventions
- **Fetchers** are pure functions: take parameters, return typed raw responses,
  nothing else. No business logic in fetchers.
- **Normalizers** are pure functions: take raw API types, return internal model
  types. No API calls in normalizers.
- **Aggregators** are pure functions: take internal model types, return stats
  objects. No API calls or normalization in aggregators.
- Layer separation is a hard rule — it makes testing and auditing
  straightforward. Do not put logic in the wrong layer.
- Use named exports throughout. No default exports except for Next.js pages.
- Prefer `const` arrow functions for utilities; use `function` declarations for
  React components.
- Async API routes must handle errors explicitly — no unhandled promise
  rejections.

---

## External API Notes
- Moxfield and Archidekt APIs are community-documented, not officially
  supported. Treat them as potentially unstable. All fetchers must fail
  gracefully.
- **Moxfield is currently blocked by a Cloudflare WAF (403/auth_required).**
  This is a known issue. See `/docs/api-reference.md` for full details.
- Do not hardcode API base URLs outside of `/lib/fetchers`. Use constants.

---

## What Claude Should Do
- Follow the data flow and layer separation above strictly.
- Reference `/types` before creating any new data structures.
- Reference `/docs/data-model.md` before writing normalizers or aggregators.
- Write a Vitest unit test for every aggregator function.
- Fetcher tests must mock HTTP responses and cover: success, empty result,
  404, 429, and network failure.
- Normalizer tests must cover: well-formed input, missing optional fields, and
  unknown enum values (e.g. unknown format → `'other'`).
- When in doubt about a type shape, ask rather than assume.

## What Claude Should NOT Do
- Do not modify `/types` without noting the change explicitly.
- Do not write aggregation logic inside API routes or React components.
- Do not use `any` as a shortcut — define the type or ask for clarification.
- Do not generate placeholder/lorem ipsum UI content. Use realistic MTG data
  in examples.

---

## Git Workflow
Follows the global conventions in `~/.claude/CLAUDE.md` (Conventional Commits,
branch naming, PR size target). Project-specific note:

- Use `scope` to identify the layer being touched:
  `feat(fetchers):`, `fix(normalizers):`, `test(aggregators):`, etc.

---

## Checkpoint Audits
Before opening a PR at the end of any phase, prompt for a checkpoint audit.
The standing audit prompt and all phase-specific additions are in
`/docs/audit-prompt.md`. The audit schedule is in `ROADMAP.md`.