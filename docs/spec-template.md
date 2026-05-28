# Spec Template

Use this template when handing a task to Claude Code. Fill in every section
before starting a session. Incomplete specs produce inconsistent output.

---

## Template

```markdown
## Task
[One sentence describing what this task produces or accomplishes.]

## Phase
[Which phase this task belongs to — e.g. "Phase 2 — Data Layer"]

## Context
[What Claude needs to know before starting. Reference relevant docs, types, or
prior work. Example: "The Deck and CardEntry types are defined in /types/deck.ts
per /docs/data-model.md. The raw Moxfield response shape is in
/docs/api-reference.md."]

## Inputs
[What this task receives. Be explicit about types and where they come from.]

## Outputs
[What this task produces. Be explicit about types, file locations, and any
side effects (e.g. writes to Redis).]

## Acceptance Criteria
[ ] [Criterion 1 — specific and verifiable]
[ ] [Criterion 2]
[ ] [Criterion 3]

## Layer Constraints
[Remind Claude which layer this belongs to and what it must not do. Example:
"This is a fetcher. It must not normalize data or contain business logic."]

## Edge Cases to Handle
- [Edge case 1]
- [Edge case 2]

## Do Not
- [Explicit prohibition 1 — repeat anything from CLAUDE.md that is especially
  relevant to this task]
- [Explicit prohibition 2]

## Tests Required
[List the Vitest tests that must be written as part of this task, if any.
For aggregators, list specific cases. For fetchers, note that tests should
mock HTTP responses.]
```

---

## Example: Moxfield Deck List Fetcher

```markdown
## Task
Build the Moxfield deck list fetcher that retrieves all public decks for a
given username, handling pagination automatically.

## Phase
Phase 2 — Data Layer

## Context
The raw response type MoxfieldDeckListResponse is documented in
/docs/api-reference.md. This fetcher should live in
/lib/fetchers/moxfield.ts. The FetchError type is defined in
/docs/api-reference.md and should be implemented in /types/errors.ts.

## Inputs
- username: string

## Outputs
- Promise<MoxfieldDeckSummary[]> — all pages assembled into a single array
- Throws FetchError on network error, 429, or unexpected status code

## Acceptance Criteria
[ ] Fetches all pages before returning (does not stop at page 1)
[ ] Returns empty array if user has no public decks
[ ] Throws typed FetchError for network errors and non-200 responses
[ ] Uses the MOXFIELD_BASE_URL constant, not a hardcoded string
[ ] Does not normalize data — returns raw MoxfieldDeckSummary[]

## Layer Constraints
This is a fetcher. It must not normalize, aggregate, or contain any business
logic. It must not reference internal types from /docs/data-model.md.

## Edge Cases to Handle
- Username not found (404) → return empty array, do not throw
- Rate limited (429) → throw FetchError with reason: 'rate_limited'
- Network failure → throw FetchError with reason: 'network_error'
- User has more than 100 decks (multiple pages)

## Do Not
- Do not use the card-level id field as a canonical identifier
- Do not import or reference types from /types/deck.ts
- Do not add caching logic — that is handled in /lib/cache

## Tests Required
- Returns all decks across multiple pages (mock paginated responses)
- Returns empty array for a user with no decks (mock 200 with empty data)
- Throws FetchError on 429
- Throws FetchError on network failure
- Does not throw on 404 — returns empty array
```
