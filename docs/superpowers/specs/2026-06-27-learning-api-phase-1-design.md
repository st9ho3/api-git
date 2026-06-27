# Learning API Phase 1 Design

## Goal

Build the smallest local API that proves how an HTTP server works before adding a database, webhooks, deployment, or MCP.

## Scope

Phase 1 includes:

- `GET /health`, which confirms the API is running.
- `GET /events`, which returns an empty list until Phase 2 adds Neon.
- TypeScript build and start scripts that mirror the future Railway flow.
- A short README that explains how to run and test this phase.

Phase 1 does not include:

- Neon/Postgres.
- GitHub webhooks.
- ngrok.
- Railway deployment.
- MCP.

## Architecture

The app uses Express with a separate `createApp()` function so tests can call the API without starting a real network listener. `src/server.ts` is the runtime entrypoint and only handles the port/listen behavior.

## Testing

Vitest and Supertest verify the two routes. The phase is complete when tests pass, TypeScript builds, and the local server returns the expected JSON.
