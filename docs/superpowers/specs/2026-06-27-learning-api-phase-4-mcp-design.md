# Learning API Phase 4 MCP Design

## Goal

Expose the stored webhook events through a remote Model Context Protocol endpoint on the existing API service, so MCP clients can inspect the same read model that `GET /events` already returns.

## Scope

Phase 4 includes:

- A remote MCP endpoint mounted on the existing Express app.
- Current MCP Streamable HTTP transport at `/mcp`.
- Simple bearer-token protection for the MCP endpoint.
- `MCP_API_TOKEN` configuration for local development and Railway deployment.
- One read-only MCP tool named `list_webhook_events`.
- Reuse of `EventsRepository.listEvents()` as the MCP tool's data source.
- Tests for successful tool access and rejected unauthenticated access.
- README guidance for configuring MCP clients with an `Authorization` header.

Phase 4 does not include:

- OAuth, Google sign-in, or browser redirect authorization.
- A separate MCP service or second Railway deployment.
- Write-side MCP tools.
- Webhook replay, deletion, filtering, or background processing.
- Legacy split `/sse` and `/messages` MCP endpoints.

## Architecture

The main code touch points for this phase should be:

- `src/app.ts` for mounting the MCP endpoint and enforcing bearer-token auth,
- `src/mcp.ts` for defining the MCP server and tools with injected dependencies,
- `src/server.ts` for wiring the real Postgres-backed repository and `MCP_API_TOKEN`,
- `src/config.ts` only if the existing environment helper needs small reuse,
- `test/app.test.ts` or a focused MCP test file for route and tool behavior,
- `README.md` for local, Railway, and client configuration,
- `docs/map.md`, `docs/architecture.md`, and `docs/adr.md` for the docs funnel and durable decision.

The existing API service remains the only deployed service:

```txt
GET /health
GET /events
POST /webhooks/github
/mcp
```

`GET /events` and the MCP tool should be sibling read surfaces over the same repository boundary:

```txt
GET /events              -> EventsRepository.listEvents()
/mcp tool invocation -> EventsRepository.listEvents()
```

The MCP route should not call the HTTP `GET /events` route internally. Sharing the repository directly keeps the implementation simple, testable, and consistent with the Phase 2 repository decision.

## MCP Endpoint

The remote MCP endpoint should be mounted at `/mcp` using the current MCP Streamable HTTP transport. Tool calls happen through the MCP endpoint, and the server may return normal JSON responses or server-sent event streams according to the MCP SDK and client negotiation. The implementation should protect every MCP method handled at `/mcp`, while keeping the public route shape a single endpoint.

The first tool should be:

```txt
list_webhook_events
```

It takes no arguments in this phase and returns the persisted event summaries:

```json
{
  "events": [
    {
      "id": "evt_1",
      "eventName": "issues",
      "deliveryId": "delivery_1",
      "repositoryFullName": "octo/example",
      "createdAt": "2026-06-27T10:00:00.000Z"
    }
  ]
}
```

The tool should return summaries only. The persisted raw webhook payload stays out of the MCP read surface for now to avoid exposing more data than the current API already shows.

## Authentication

The remote MCP endpoint should require a bearer token from day one because the Railway route is public once deployed.

The server reads:

```sh
MCP_API_TOKEN=long-random-secret
```

Clients send:

```txt
Authorization: Bearer long-random-secret
```

Requests to `/mcp` with a missing or incorrect token should return `401`. The existing public `GET /events` route is unchanged in this phase unless a later decision adds broader API authentication.

OAuth is intentionally deferred. It is useful for multi-user access and third-party authorization, but it would add callback URLs, identity provider setup, token validation, and user authorization rules before this project needs them.

## Configuration

Local development needs:

```sh
DATABASE_URL=postgresql://...
GITHUB_WEBHOOK_SECRET=your-shared-secret
MCP_API_TOKEN=long-random-secret
```

Railway should receive the same `MCP_API_TOKEN` value as a service variable. The value should be generated as a long random secret and treated like any other credential.

## Testing

Tests should cover:

- an MCP request with a valid bearer token can call `list_webhook_events`,
- the tool returns events from an injected fake `EventsRepository`,
- a missing token receives `401`,
- an incorrect token receives `401`,
- existing `/health`, `/events`, and `/webhooks/github` tests continue to pass.

The MCP behavior should be tested with injected fakes where possible, not a live Neon database.

## Client Guidance

Client configuration should point to the deployed MCP URL and send the bearer token as an HTTP header:

```txt
url = "https://your-railway-service.example/mcp"
Authorization = "Bearer <MCP_API_TOKEN>"
```

The token should not be placed in OAuth fields such as `client_id`. Those fields only apply if a later phase implements OAuth.

## Durable Decision

Phase 4 keeps MCP inside the existing API service instead of introducing a separate MCP deployment. This preserves the learning path:

- one deployed service,
- one database connection path,
- one repository boundary,
- one protected MCP read tool.

A separate MCP service can be reconsidered later if MCP grows into a larger product surface with independent scaling, ownership, or authentication requirements.
