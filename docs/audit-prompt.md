# Audit Prompt

Use this prompt at each phase checkpoint. Paste it at the start of a new Claude
Code session, followed by the phase-specific instructions below.

---

## Standing Audit Prompt

```
You are performing a checkpoint audit for Deckprint at the end of [PHASE
NAME]. Your job is not to build anything — only to review, assess, and report.

Review the codebase against the following sources of truth in order of priority:
1. /CLAUDE.md — conventions, layer separation rules, what Claude should/shouldn't do
2. /docs/data-model.md — internal types and aggregation output types
3. /docs/api-reference.md — external API shapes and error handling expectations

Produce a structured audit report with the following sections:

## Convention Violations
List any code that deviates from the rules in CLAUDE.md. For each violation,
cite the file, line, and the specific rule it breaks.

## Data Model Drift
List any type definitions or usages that deviate from or are inconsistent with
/docs/data-model.md. Flag any fields that are missing, renamed, or typed
differently than specified.

## Layer Separation Violations
List any cases where logic appears in the wrong layer — e.g. aggregation logic
inside an API route, normalization logic inside a component, API calls inside
an aggregator.

## Error Handling Gaps
List any fetchers, API routes, or async functions that do not handle errors per
the expectations in /docs/api-reference.md.

## Test Coverage Gaps
List any aggregator functions that do not have a corresponding Vitest test.
Note any tests that exist but do not cover edge cases (empty deck list, missing
fields, single deck, decks from multiple platforms).

## Unresolved TODOs
List all TODO and FIXME comments in the codebase. Flag any that should be
resolved before the next phase begins.

## Open Questions
List anything ambiguous, underdocumented, or that required an assumption during
this audit. These should be resolved before the next phase begins.

## Summary
A brief overall assessment: is the project in good shape to proceed to the next
phase? If not, what must be resolved first?
```

---

## Phase-Specific Additions

Append the relevant block below to the standing prompt for each checkpoint.

---

### Checkpoint 1 — End of Phase 1 (Foundation)
```
Additional focus for this audit:

- Does the project structure match the folder layout defined in CLAUDE.md?
- Are TypeScript compiler options set correctly (strict mode, no implicit any)?
- Is the Vercel deployment functional and connected to the main branch?
- Are the types in /types consistent with the definitions in
  /docs/data-model.md? Flag any that are missing or not yet scaffolded.
- Does /docs/api-reference.md reflect what was actually observed during API
  exploration? Flag any discrepancies.
```

### Checkpoint 2 — End of Phase 2 (Data Layer)
```
Additional focus for this audit:

- Do all fetchers handle pagination completely before returning?
- Do all fetchers use the correct canonical identifier (Scryfall ID)?
- Do all normalizers map exclusively to internal types from /docs/data-model.md?
- Is the Redis caching layer applied consistently across all fetchers?
- Are Moxfield and Archidekt normalizers independently testable (no shared
  mutable state)?
- Test the following edge cases manually and confirm they are handled:
    - Username with zero public decks
    - Username that does not exist
    - Deck with no commanders (non-Commander format)
    - Deck with a companion
```

### Checkpoint 3 — End of Phase 3 (Aggregation Engine)
```
Additional focus for this audit:

- Does every aggregator function have a Vitest unit test?
- Are the following edge cases covered by tests:
    - Empty deck list (zero decks included)
    - Single deck included
    - All decks excluded via includedInProfile: false
    - Decks from both Moxfield and Archidekt in the same profile
    - A card appearing in every deck (staple)
    - A card appearing in exactly one deck (pet card)
- Do aggregators return the correct output types from /docs/data-model.md?
- Is includedInProfile filtering applied before aggregation, not inside it?
```

### Checkpoint 4 — End of Phase 4 (Dashboard UI)
```
Additional focus for this audit:

- Does every chart component handle loading, error, and empty states?
- Are prop types explicitly defined for every component?
- Is aggregation logic absent from all React components and API routes?
- Does the deck selector correctly toggle includedInProfile and trigger
  re-aggregation?
- Does the multi-site input correctly merge decks from both platforms into
  a single UserProfile?
- Test with a real Moxfield username and confirm the dashboard renders
  correctly end-to-end.
```

### Checkpoint 5 — End of Phase 5 (Report Card)
```
Additional focus for this audit:

- Does the shareable URL correctly encode and restore profile state?
- Does the export produce a clean, correctly formatted output (image or PDF)?
- Does the deckbuilder label generator handle edge cases:
    - User with only one deck
    - User with decks across many formats
    - User with a perfectly even color distribution
- Is report card generation stateless and reproducible from the same input?
```

### Checkpoint 6 — Pre-Launch (End of Phase 6)
```
Additional focus for this audit:

- Full end-to-end walkthrough: enter a real username, load a profile, toggle
  decks, view all charts, generate and export a report card, load a shared URL.
- Are there any console errors or warnings in production mode?
- Is there any dead code, unused imports, or commented-out blocks remaining?
- Are all TODO and FIXME comments resolved or explicitly deferred to post-launch?
- Is the landing page accurate — does it correctly describe what the app does?
- Are error states user-facing and human-readable (no raw error objects in UI)?
- Is the app usable on a mobile screen (basic responsiveness check)?
```
