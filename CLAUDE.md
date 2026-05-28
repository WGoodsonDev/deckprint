# CLAUDE.md

## Project Overview
This is **Deckprint**, a Magic: The Gathering deck profiler that aggregates
stats across a user's full deck library to produce a unified deckbuilder profile.
Users provide their Moxfield and/or Archidekt username(s), and the app fetches
their public decklists, normalizes the data, and renders an analytics dashboard
with the option to export a shareable report card.

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
  /api          → Next.js API routes (data fetching, normalization)
  /dashboard    → Dashboard pages and layout
  /components   → Shared UI components
/lib
  /fetchers     → Raw API fetch functions (Moxfield, Archidekt)
  /normalizers  → Maps raw API responses → internal data model
  /aggregators  → Aggregation logic (color, curve, overlap, etc.)
  /cache        → Redis cache wrappers
/types          → Shared TypeScript types and interfaces
/docs           → Project specs, data model, API reference, audit prompts
/tests          → Vitest unit tests (mirrors /lib structure)
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
- Use **moderate strict mode**: `strict: true` in tsconfig, but well-justified
  `as` casts are acceptable with an inline comment explaining why.
- No `any` without an explicit `// eslint-disable` comment and justification.
- All internal data structures must be typed via interfaces in `/types`.
- API response shapes from external APIs should be typed separately from
  internal types (e.g. `MoxfieldDeckResponse` vs `Deck`).

---

## Coding Conventions
- **Fetchers** are pure functions: they take parameters, return typed raw
  responses, and do nothing else. No business logic in fetchers.
- **Normalizers** are pure functions: they take raw API types and return
  internal model types. No API calls in normalizers.
- **Aggregators** are pure functions: they take internal model types and return
  stats objects. No API calls or normalization in aggregators.
- Keeping these layers separate is a hard rule — it makes testing and auditing
  straightforward.
- Use named exports throughout. No default exports except for Next.js pages.
- Prefer `const` arrow functions for utilities; use `function` declarations for
  React components.
- Async API routes should always handle errors explicitly — no unhandled promise
  rejections.

---

## External API Notes
- Moxfield and Archidekt APIs are community-documented, not officially supported.
  Treat them as potentially unstable. All fetchers should fail gracefully.
- Full API documentation is in `/docs/api-reference.md`.
- Do not hardcode API base URLs outside of `/lib/fetchers`. Use constants.

---

## What Claude Should Do
- Follow the data flow and layer separation described above strictly.
- Reference `/types` before creating any new data structures.
- Reference `/docs/data-model.md` before writing normalizers or aggregators.
- Write a Vitest unit test for every aggregator function.
- Fetcher tests must mock HTTP responses and cover: success, empty result,
  404, 429, and network failure.
- Normalizer tests must cover: well-formed input, missing optional fields,
  and unknown enum values (e.g. unknown format → 'other').
- When in doubt about a type shape, ask rather than assume.

## What Claude Should NOT Do
- Do not modify the data model in `/types` without noting the change explicitly.
- Do not write aggregation logic inside API routes or React components.
- Do not use `any` as a shortcut when a type is unclear — define the type or
  ask for clarification.
- Do not generate placeholder/lorem ipsum UI content. Use realistic MTG data
  in examples.

---

## Git Workflow

Follows the global conventions in `~/.claude/CLAUDE.md` (Conventional Commits,
branch naming, PR size target). One project-specific note:

- Use `scope` to identify the layer being touched — e.g.
  `feat(fetchers):`, `fix(normalizers):`, `test(aggregators):`.

---

## Checkpoint Audit Instructions
See `/docs/audit-prompt.md` for the standing audit prompt used at each phase
checkpoint.
