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

### ADR 003: Keep webhook acknowledgement minimal and persist the real record

Why:

- The learning goal for Phase 3 is to show the full webhook write path from GitHub request to durable storage.
- A minimal `202` response keeps the webhook endpoint focused on accepting deliveries while `GET /events` stays the read surface for inspection.
- Signature verification needs access to the exact raw request body, so the HTTP layer must stay explicit about request parsing before persistence.

Record:

- [Phase 3 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-3-design.md)

### ADR 004: Deploy the Phase 3 API on Railway

Why:

- Railway matches the project goal of showing how the API moves from local development to a real hosted service.
- `npm start` already runs the compiled server the same way the platform expects in production.
- Keeping deployment on the same phase makes the runtime, database, and webhook flow easier to understand as one path.

Record:

- [Phase 3 Design](docs/superpowers/specs/2026-06-27-learning-api-phase-3-design.md)

### ADR 005: Expose webhook events through protected in-process MCP

Why:

- MCP should read through the same repository boundary as `GET /events` instead of calling the HTTP route internally.
- Keeping MCP inside the existing API service avoids a second deployment and keeps the learning path focused.
- A simple bearer token protects the public Railway endpoint without introducing OAuth before there are multiple users or third-party authorization needs.

Record:

- [Phase 4 MCP Design](docs/superpowers/specs/2026-06-27-learning-api-phase-4-mcp-design.md)

## Next ADRs

Future phases should add a new ADR entry when we decide:

- whether the MCP endpoint needs OAuth or another multi-user authorization model.
- whether MCP should split into its own service for independent scaling or ownership.
