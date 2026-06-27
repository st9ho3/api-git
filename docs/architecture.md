# Architecture

This project is a learning-first API that grows in small phases:

- Phase 1 establishes the local TypeScript and Express server shape.
- Phase 2 replaces the hardcoded events response with a Neon/Postgres-backed repository.
- Phase 3 adds GitHub webhook ingestion with signature verification, persisted writes, and Railway deployment.
- Phase 4 exposes a protected remote MCP endpoint for reading stored webhook events.

## Current System Shape

- [README.md](/Users/panagiotisstachoulis/Desktop/API/README.md) explains the current developer flow.
- [src/app.ts](/Users/panagiotisstachoulis/Desktop/API/src/app.ts) defines the HTTP routes and accepts injected dependencies.
- [src/mcp.ts](/Users/panagiotisstachoulis/Desktop/API/src/mcp.ts) defines the MCP server and read-only tools.
- [src/app.ts](/Users/panagiotisstachoulis/Desktop/API/src/app.ts) mounts the protected `/mcp` endpoint alongside the REST routes.
- [src/server.ts](/Users/panagiotisstachoulis/Desktop/API/src/server.ts) is the runtime entrypoint.
- [src/db.ts](/Users/panagiotisstachoulis/Desktop/API/src/db.ts) creates the Postgres connection pool from `DATABASE_URL`.
- [src/postgres-events-repository.ts](/Users/panagiotisstachoulis/Desktop/API/src/postgres-events-repository.ts) reads and writes persisted webhook events.
- [sql/webhook_events.sql](/Users/panagiotisstachoulis/Desktop/API/sql/webhook_events.sql) defines the current database schema.
- [README.md](/Users/panagiotisstachoulis/Desktop/API/README.md) documents the local and Railway deployment flow.

## Detailed Design Docs

- [Phase 1 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-1-design.md)
- [Phase 2 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-2-design.md)
- [Phase 3 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-3-design.md)
- [Phase 4 MCP Design](docs/superpowers/specs/2026-06-27-learning-api-phase-4-mcp-design.md)

## Intended Evolution

The architecture is intentionally simple:

- REST API first.
- Database persistence second.
- Webhook ingestion third.
- Railway deployment is part of the Phase 3 runtime story.
- MCP exposure fourth, as a protected read-only transport over the existing repository boundary.

That sequence keeps each concept visible while avoiding unnecessary abstraction early.
