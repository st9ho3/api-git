# Architecture Decision Records

This file is the decision index for the project. Each phase design acts as a lightweight ADR for the choices made so far.

## Decisions

### ADR 001: Start with a tiny local API

Why:

- The goal of the project is learning the deployment and integration flow step by step.
- A minimal local API makes routing, build, and runtime behavior easy to see before adding infrastructure.

Record:

- [Phase 1 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-1-design.md)

### ADR 002: Add a repository boundary before webhooks

Why:

- `/events` should become database-backed without making route tests depend on a real Neon instance.
- A small repository interface keeps the HTTP layer easy to understand while making the DB integration explicit.

Record:

- [Phase 2 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-2-design.md)

## Next ADRs

Future phases should add a new ADR entry when we decide:

- how webhook payloads are stored,
- how GitHub signatures are verified,
- how Railway deployment is configured,
- how the MCP server exposes tools over the existing API and database model.
