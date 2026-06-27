# Docs Map

This repository follows a single-source-of-truth funnel:

`README.md` -> `docs/map.md` -> the specific docs below -> the code files they name.

If you are looking for where to make a change, start here and follow the narrowest relevant path.

## Where To Touch What

### API routes and server startup

- Read: [docs/architecture.md](/Users/panagiotisstachoulis/Desktop/API/docs/architecture.md)
- Touch: [src/app.ts](/Users/panagiotisstachoulis/Desktop/API/src/app.ts), [src/server.ts](/Users/panagiotisstachoulis/Desktop/API/src/server.ts)

### Database connection and persistence

- Read: [docs/architecture.md](/Users/panagiotisstachoulis/Desktop/API/docs/architecture.md)
- Read: [docs/adr.md](/Users/panagiotisstachoulis/Desktop/API/docs/adr.md)
- Touch: [src/db.ts](/Users/panagiotisstachoulis/Desktop/API/src/db.ts), [src/postgres-events-repository.ts](/Users/panagiotisstachoulis/Desktop/API/src/postgres-events-repository.ts), [src/events-repository.ts](/Users/panagiotisstachoulis/Desktop/API/src/events-repository.ts), [sql/webhook_events.sql](/Users/panagiotisstachoulis/Desktop/API/sql/webhook_events.sql)

### Testing behavior

- Read: [docs/architecture.md](/Users/panagiotisstachoulis/Desktop/API/docs/architecture.md)
- Touch: [test/app.test.ts](/Users/panagiotisstachoulis/Desktop/API/test/app.test.ts)

### Developer workflow and commands

- Read: [README.md](/Users/panagiotisstachoulis/Desktop/API/README.md)
- Touch: [README.md](/Users/panagiotisstachoulis/Desktop/API/README.md) when commands or local flow change

### Architectural decisions

- Read: [docs/adr.md](/Users/panagiotisstachoulis/Desktop/API/docs/adr.md)
- Touch: [docs/adr.md](/Users/panagiotisstachoulis/Desktop/API/docs/adr.md) when the repo makes a new durable decision

### Phase-specific implementation details

- Read: [docs/superpowers/specs/2026-06-27-learning-api-phase-1-design.md](/Users/panagiotisstachoulis/Desktop/API/docs/superpowers/specs/2026-06-27-learning-api-phase-1-design.md)
- Read: [docs/superpowers/specs/2026-06-27-learning-api-phase-2-design.md](/Users/panagiotisstachoulis/Desktop/API/docs/superpowers/specs/2026-06-27-learning-api-phase-2-design.md)
- Touch the matching phase spec when the behavior of that phase changes.

### New work entrypoint

When starting a new feature or phase, update these docs in order:

1. [docs/map.md](/Users/panagiotisstachoulis/Desktop/API/docs/map.md)
2. [docs/architecture.md](/Users/panagiotisstachoulis/Desktop/API/docs/architecture.md)
3. [docs/adr.md](/Users/panagiotisstachoulis/Desktop/API/docs/adr.md)
4. The relevant phase spec under [docs/superpowers/specs](/Users/panagiotisstachoulis/Desktop/API/docs/superpowers/specs)
5. [README.md](/Users/panagiotisstachoulis/Desktop/API/README.md) only if the user-facing workflow changed

## Rule Of Thumb

If a change needs code, there should be a docs file that names the code file first.
If a docs file cannot point to the code file yet, the docs are incomplete.
