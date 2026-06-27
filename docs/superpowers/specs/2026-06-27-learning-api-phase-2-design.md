# Learning API Phase 2 Design

## Goal

Replace the hardcoded `/events` response with real data from Neon while keeping the app easy to test and understand.

## Scope

Phase 2 includes:

- A Postgres-backed `GET /events`.
- `DATABASE_URL` configuration for local development and Railway later.
- A SQL file that creates `webhook_events`.
- Tests that verify route behavior without requiring a live database.

Phase 2 does not include:

- Writing webhook rows.
- GitHub signature verification.
- ngrok or Railway deployment.
- MCP.

## Architecture

`createApp()` accepts an `eventsRepository` dependency. Tests inject a fake repository, while `src/server.ts` creates the real Postgres repository from `DATABASE_URL`. This keeps the HTTP layer small and makes the DB boundary visible.

## Testing

Route tests verify that `/events` returns repository rows and still handles the empty case. Build verification confirms the new DB code compiles even when no real database is present.
