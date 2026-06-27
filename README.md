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
POST /webhooks/github
/mcp
```

## Phase 2: Neon Database

Phase 2 makes `GET /events` read from a real Postgres table in Neon.

Create a `.env` file with:

```sh
DATABASE_URL=postgresql://...
```

Create the table in Neon with the SQL from [sql/webhook_events.sql](/Users/panagiotisstachoulis/Desktop/API/sql/webhook_events.sql).

`GET /events` reads and returns rows ordered by newest first, including GitHub webhook deliveries accepted by the Phase 3 route.

## Phase 3: GitHub Webhook Ingestion

Phase 3 includes `POST /webhooks/github`.

That route:

- read the raw GitHub request body,
- verify `X-Hub-Signature-256` with `GITHUB_WEBHOOK_SECRET`,
- store accepted deliveries in `webhook_events`,
- return a minimal acknowledgement on success.

In this phase, the source of truth for accepted webhook data is the database row, not the POST response. After a successful webhook delivery, use `GET /events` to inspect what was stored.

Add this to `.env`:

```sh
GITHUB_WEBHOOK_SECRET=your-shared-secret
MCP_API_TOKEN=long-random-secret
```

The local testing flow for this phase is:

1. Run the API locally.
2. Expose it with a tunnel such as ngrok.
3. Configure the GitHub webhook URL to point at `/webhooks/github`.
4. Send a test delivery from GitHub.
5. Confirm receipt with `GET /events`.

## Phase 4: Remote MCP Read Surface

Phase 4 exposes stored webhook events to MCP clients through the existing API service.

The MCP endpoint is:

```txt
/mcp
```

It uses the current MCP Streamable HTTP transport and requires a bearer token:

```txt
Authorization: Bearer <MCP_API_TOKEN>
```

The first read-only tool is:

```txt
list_webhook_events
```

That tool returns the same event summaries as `GET /events`. The token belongs in an HTTP `Authorization` header, not an OAuth field such as `client_id`.

## Deployment

The Phase 3 API is deployed on Railway.

Production uses the compiled server entrypoint from `npm start`, which runs `dist/server.js` after a build.

Railway should provide the production runtime variables:

```sh
DATABASE_URL=postgresql://...
GITHUB_WEBHOOK_SECRET=your-shared-secret
MCP_API_TOKEN=long-random-secret
```

`PORT` is set by the hosting platform, while `DATABASE_URL`, `GITHUB_WEBHOOK_SECRET`, and `MCP_API_TOKEN` must be configured for the deployed service.

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
