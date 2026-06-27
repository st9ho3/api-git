# Learning API

This project is a step-by-step learning lab for seeing how an API becomes a deployed service.

Start with the docs funnel in [docs/map.md](/Users/panagiotisstachoulis/Desktop/API/docs/map.md). That file tells you which doc to read next and which code file to touch for a given change.

## Phase 1: Local API

Phase 1 teaches the smallest useful API loop:

1. Start a local HTTP server.
2. Call routes from a client.
3. Test route behavior.
4. Build TypeScript into JavaScript.
5. Run the compiled server the same way a host like Railway will.

## Routes

```txt
GET /health
GET /events
```

## Phase 2: Neon Database

Phase 2 makes `GET /events` read from a real Postgres table in Neon.

Create a `.env` file with:

```sh
DATABASE_URL=postgresql://...
```

Create the table in Neon with the SQL from [sql/webhook_events.sql](/Users/panagiotisstachoulis/Desktop/API/sql/webhook_events.sql).

For now, `GET /events` reads and returns rows ordered by newest first. Writing webhook rows comes in Phase 3.

## Commands

Install dependencies:

```sh
npm install
```

Run tests:

```sh
npm test
```

Run locally:

```sh
npm run dev
```

Build TypeScript:

```sh
npm run build
```

Run compiled output:

```sh
npm start
```

## Try It

With `npm run dev` running:

```sh
curl http://localhost:3000/health
curl http://localhost:3000/events
```
