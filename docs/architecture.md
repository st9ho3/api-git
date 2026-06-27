# Architecture

This project is a learning-first API that grows in small phases:

- Phase 1 establishes the local TypeScript and Express server shape.
- Phase 2 replaces the hardcoded events response with a Neon/Postgres-backed repository.
- Later phases will add webhook ingestion, deployment, and an MCP server.

## Current System Shape

- [README.md](/Users/panagiotisstachoulis/Desktop/API/README.md) explains the current developer flow.
- [src/app.ts](/Users/panagiotisstachoulis/Desktop/API/src/app.ts) defines the HTTP routes and accepts injected dependencies.
- [src/server.ts](/Users/panagiotisstachoulis/Desktop/API/src/server.ts) is the runtime entrypoint.
- [src/db.ts](/Users/panagiotisstachoulis/Desktop/API/src/db.ts) creates the Postgres connection pool from `DATABASE_URL`.
- [src/postgres-events-repository.ts](/Users/panagiotisstachoulis/Desktop/API/src/postgres-events-repository.ts) loads persisted webhook events.
- [sql/webhook_events.sql](/Users/panagiotisstachoulis/Desktop/API/sql/webhook_events.sql) defines the current database schema.

## Detailed Design Docs

- [Phase 1 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-1-design.md)
- [Phase 2 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-2-design.md)

## Intended Evolution

The architecture is intentionally simple:

- REST API first.
- Database persistence second.
- Webhook ingestion next.
- MCP exposure after the API behavior is already clear and testable.

That sequence keeps each concept visible while avoiding unnecessary abstraction early.
