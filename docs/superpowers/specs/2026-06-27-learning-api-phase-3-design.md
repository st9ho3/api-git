# Learning API Phase 3 Design

## Goal

Add a GitHub webhook ingestion route that verifies signatures, stores incoming events in Postgres, and keeps the learning path focused on the full local request-to-storage loop.

## Scope

Phase 3 includes:

- `POST /webhooks/github` for GitHub webhook delivery.
- Raw request body handling so signature verification uses the exact bytes GitHub sent.
- `GITHUB_WEBHOOK_SECRET` configuration for local development and later deployment.
- Signature verification using `X-Hub-Signature-256`.
- Persistence of accepted webhook deliveries into `webhook_events`.
- Duplicate delivery handling based on `delivery_id`.
- Tests for successful ingestion, invalid signatures, and duplicate deliveries.
- README guidance for exercising the webhook locally from GitHub.

Phase 3 does not include:

- Background job processing after ingestion.
- Deployment setup in Railway.
- MCP tools or server exposure.
- Rich webhook-specific read endpoints beyond `GET /events`.

## Architecture

The main code touch points for this phase should be:

- `src/app.ts` for the new webhook route and request parsing behavior,
- `src/events-repository.ts` for the write-side repository contract,
- `src/postgres-events-repository.ts` for persisted webhook inserts and duplicate handling,
- `src/server.ts` for wiring the real dependencies,
- `test/app.test.ts` for route-level behavior coverage,
- `sql/webhook_events.sql` if the schema needs small adjustments to support the route cleanly.

`createApp()` should keep HTTP concerns in the route layer while accepting injectable dependencies for webhook verification and event storage. The webhook route should read the raw request body, validate the required GitHub headers, verify the signature with `GITHUB_WEBHOOK_SECRET`, and then persist the delivery through the repository boundary already established in Phase 2.

The success response should stay minimal: `POST /webhooks/github` returns `202 { ok: true }`. The durable record of what happened lives in Postgres, and `GET /events` remains the route for inspecting stored deliveries. This keeps the phase aligned with the learning goal that writes and reads are separate concerns.

The route should treat duplicate `delivery_id` values as safe duplicates rather than a server crash. The implementation can either surface a repository-level duplicate result or catch the database uniqueness conflict and translate it into a non-failing acknowledgement, as long as the route behavior stays explicit and testable.

## Testing

Route tests should cover:

- a valid signed GitHub webhook request that returns `202` and stores the event,
- a request with a missing or invalid signature that is rejected,
- a duplicate delivery that still returns a stable acknowledgement without creating a second durable record.

The route tests should continue using injected fakes so they do not require a live Neon database or a real GitHub webhook delivery.
