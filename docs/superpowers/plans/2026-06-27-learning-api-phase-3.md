# Learning API Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub webhook ingestion route that verifies signatures, stores accepted deliveries in Postgres, and keeps `GET /events` as the read path for inspecting stored data.

**Architecture:** Add a small signature utility, extend the existing repository boundary with a write method, and keep webhook HTTP logic in `createApp()`. The route should accept the raw JSON body, validate required GitHub headers, verify `X-Hub-Signature-256`, persist the event through the repository, and return `202 { ok: true }` for both first-time and duplicate deliveries.

**Tech Stack:** TypeScript, Express, Vitest, Supertest, Node `crypto`, PostgreSQL via `pg`

---

## File Structure

- Create: `src/github-webhook-signature.ts`
  Responsibility: verify the GitHub HMAC SHA-256 signature against the raw request body.
- Create: `test/github-webhook-signature.test.ts`
  Responsibility: focused tests for valid and invalid GitHub signatures.
- Modify: `src/events-repository.ts`
  Responsibility: extend the repository contract with a write-side input type and duplicate-aware save result.
- Modify: `src/app.ts`
  Responsibility: add `POST /webhooks/github`, keep request parsing and response behavior in the HTTP layer, and allow verifier/secret injection for tests.
- Modify: `src/postgres-events-repository.ts`
  Responsibility: insert accepted webhook deliveries and translate unique-constraint collisions on `delivery_id` into a duplicate result.
- Modify: `src/server.ts`
  Responsibility: wire the real webhook secret and signature verifier into `createApp()`.
- Modify: `test/app.test.ts`
  Responsibility: route-level coverage for successful ingestion, invalid signatures, and duplicate deliveries using fakes instead of a live database.
- Create: `test/postgres-events-repository.test.ts`
  Responsibility: verify stored and duplicate save results without needing a real Postgres instance.
- Keep unchanged: `sql/webhook_events.sql`
  Responsibility: the current schema already has `payload jsonb` and a unique `delivery_id`, so no SQL change is required for this phase.

### Task 1: Add the GitHub Signature Utility

**Files:**
- Create: `src/github-webhook-signature.ts`
- Test: `test/github-webhook-signature.test.ts`

- [ ] **Step 1: Write the failing signature tests**

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGitHubWebhookSignature } from "../src/github-webhook-signature.js";

describe("verifyGitHubWebhookSignature", () => {
  it("returns true for a matching GitHub SHA-256 signature", () => {
    const rawBody = Buffer.from(JSON.stringify({ zen: "ship it" }));
    const signatureHeader = `sha256=${createHmac("sha256", "topsecret")
      .update(rawBody)
      .digest("hex")}`;

    const result = verifyGitHubWebhookSignature({
      rawBody,
      secret: "topsecret",
      signatureHeader
    });

    expect(result).toBe(true);
  });

  it("returns false for a non-matching signature", () => {
    const rawBody = Buffer.from(JSON.stringify({ zen: "ship it" }));

    const result = verifyGitHubWebhookSignature({
      rawBody,
      secret: "topsecret",
      signatureHeader: "sha256=definitely-wrong"
    });

    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- test/github-webhook-signature.test.ts`
Expected: FAIL with `Cannot find module '../src/github-webhook-signature.js'` or `no exported member 'verifyGitHubWebhookSignature'`

- [ ] **Step 3: Write the minimal signature implementation**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

type VerifyGitHubWebhookSignatureInput = {
  rawBody: Buffer;
  secret: string;
  signatureHeader: string;
};

export function verifyGitHubWebhookSignature({
  rawBody,
  secret,
  signatureHeader
}: VerifyGitHubWebhookSignatureInput): boolean {
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`
  );
  const actual = Buffer.from(signatureHeader);

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- test/github-webhook-signature.test.ts`
Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/github-webhook-signature.ts test/github-webhook-signature.test.ts
git commit -m "test: add GitHub webhook signature verifier"
```

### Task 2: Add the Webhook Route and Write-Side Repository Contract

**Files:**
- Modify: `src/events-repository.ts`
- Modify: `src/app.ts`
- Test: `test/app.test.ts`

- [ ] **Step 1: Write the failing happy-path route test**

```ts
it("accepts a valid GitHub webhook and stores the event", async () => {
  let savedEvent:
    | {
        eventName: string;
        deliveryId: string;
        repositoryFullName: string;
        payload: unknown;
      }
    | undefined;

  const app = createApp({
    githubWebhookSecret: "topsecret",
    verifyGitHubWebhookSignature: () => true,
    eventsRepository: {
      listEvents: async () => [],
      saveEvent: async (input) => {
        savedEvent = input;
        return "stored";
      }
    }
  });

  const payload = {
    action: "opened",
    repository: { full_name: "octo/example" }
  };

  const response = await request(app)
    .post("/webhooks/github")
    .set("X-GitHub-Event", "issues")
    .set("X-GitHub-Delivery", "delivery_123")
    .set("X-Hub-Signature-256", "sha256=test")
    .set("Content-Type", "application/json")
    .send(JSON.stringify(payload));

  expect(response.status).toBe(202);
  expect(response.body).toEqual({ ok: true });
  expect(savedEvent).toEqual({
    eventName: "issues",
    deliveryId: "delivery_123",
    repositoryFullName: "octo/example",
    payload
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- test/app.test.ts`
Expected: FAIL with a TypeScript error for missing `saveEvent`, or an HTTP assertion failure because `POST /webhooks/github` returns `404`

- [ ] **Step 3: Add the route and repository contract**

`src/events-repository.ts`

```ts
export type WebhookEvent = {
  id: string;
  eventName: string;
  deliveryId: string;
  repositoryFullName: string;
  createdAt: string;
};

export type SaveWebhookEventInput = {
  eventName: string;
  deliveryId: string;
  repositoryFullName: string;
  payload: unknown;
};

export type SaveWebhookEventResult = "stored" | "duplicate";

export type EventsRepository = {
  listEvents(): Promise<WebhookEvent[]>;
  saveEvent(input: SaveWebhookEventInput): Promise<SaveWebhookEventResult>;
};
```

`src/app.ts`

```ts
import express from "express";
import type {
  EventsRepository,
  SaveWebhookEventInput
} from "./events-repository.js";
import { verifyGitHubWebhookSignature as defaultVerifyGitHubWebhookSignature } from "./github-webhook-signature.js";

type GitHubWebhookVerifier = (input: {
  rawBody: Buffer;
  secret: string;
  signatureHeader: string;
}) => boolean;

type CreateAppOptions = {
  eventsRepository?: EventsRepository;
  githubWebhookSecret?: string;
  verifyGitHubWebhookSignature?: GitHubWebhookVerifier;
};

const emptyEventsRepository: EventsRepository = {
  async listEvents() {
    return [];
  },
  async saveEvent() {
    return "stored";
  }
};

function isRepositoryPayload(
  value: unknown
): value is { repository?: { full_name?: string } } {
  return typeof value === "object" && value !== null;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const eventsRepository = options.eventsRepository ?? emptyEventsRepository;
  const githubWebhookSecret = options.githubWebhookSecret;
  const verifyGitHubWebhookSignature =
    options.verifyGitHubWebhookSignature ??
    defaultVerifyGitHubWebhookSignature;

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "learning-api" });
  });

  app.get("/events", async (_request, response, next) => {
    try {
      const events = await eventsRepository.listEvents();

      response.json({ events });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/webhooks/github",
    express.raw({ type: "application/json" }),
    async (request, response, next) => {
      try {
        if (!githubWebhookSecret) {
          response
            .status(500)
            .json({ error: "GitHub webhook secret is not configured" });
          return;
        }

        const eventName = request.get("X-GitHub-Event");
        const deliveryId = request.get("X-GitHub-Delivery");
        const signatureHeader = request.get("X-Hub-Signature-256");

        if (!eventName || !deliveryId || !signatureHeader) {
          response.status(400).json({ error: "Missing GitHub webhook headers" });
          return;
        }

        const rawBody = Buffer.isBuffer(request.body)
          ? request.body
          : Buffer.from("");

        if (
          !verifyGitHubWebhookSignature({
            rawBody,
            secret: githubWebhookSecret,
            signatureHeader
          })
        ) {
          response.status(401).json({ error: "Invalid GitHub signature" });
          return;
        }

        const payload = JSON.parse(rawBody.toString("utf8")) as unknown;

        if (!isRepositoryPayload(payload) || !payload.repository?.full_name) {
          response.status(400).json({ error: "Missing repository.full_name" });
          return;
        }

        const saveInput: SaveWebhookEventInput = {
          eventName,
          deliveryId,
          repositoryFullName: payload.repository.full_name,
          payload
        };

        await eventsRepository.saveEvent(saveInput);

        response.status(202).json({ ok: true });
      } catch (error) {
        next(error);
      }
    }
  );

  return app;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- test/app.test.ts`
Expected: PASS with the new webhook happy-path test green alongside the existing route tests

- [ ] **Step 5: Commit**

```bash
git add src/events-repository.ts src/app.ts test/app.test.ts
git commit -m "feat: accept GitHub webhook deliveries"
```

### Task 3: Handle Invalid Signatures, Duplicates, and Runtime Wiring

**Files:**
- Modify: `src/postgres-events-repository.ts`
- Modify: `src/server.ts`
- Modify: `test/app.test.ts`
- Create: `test/postgres-events-repository.test.ts`

- [ ] **Step 1: Write the failing invalid-signature and repository tests**

Add this route test to `test/app.test.ts`:

```ts
it("rejects a webhook with an invalid signature", async () => {
  const app = createApp({
    githubWebhookSecret: "topsecret",
    verifyGitHubWebhookSignature: () => false,
    eventsRepository: {
      listEvents: async () => [],
      saveEvent: async () => {
        throw new Error("saveEvent should not be called");
      }
    }
  });

  const response = await request(app)
    .post("/webhooks/github")
    .set("X-GitHub-Event", "issues")
    .set("X-GitHub-Delivery", "delivery_456")
    .set("X-Hub-Signature-256", "sha256=bad")
    .set("Content-Type", "application/json")
    .send(
      JSON.stringify({
        action: "opened",
        repository: { full_name: "octo/example" }
      })
    );

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ error: "Invalid GitHub signature" });
});
```

Create `test/postgres-events-repository.test.ts` with:

```ts
import { describe, expect, it, vi } from "vitest";
import { PostgresEventsRepository } from "../src/postgres-events-repository.js";

describe("PostgresEventsRepository.saveEvent", () => {
  it("returns stored when the insert succeeds", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] })
    };
    const repository = new PostgresEventsRepository(pool as never);

    const result = await repository.saveEvent({
      eventName: "issues",
      deliveryId: "delivery_123",
      repositoryFullName: "octo/example",
      payload: { action: "opened" }
    });

    expect(result).toBe("stored");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("returns duplicate when Postgres reports a unique violation", async () => {
    const pool = {
      query: vi.fn().mockRejectedValue({ code: "23505" })
    };
    const repository = new PostgresEventsRepository(pool as never);

    const result = await repository.saveEvent({
      eventName: "issues",
      deliveryId: "delivery_123",
      repositoryFullName: "octo/example",
      payload: { action: "opened" }
    });

    expect(result).toBe("duplicate");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- test/app.test.ts test/postgres-events-repository.test.ts`
Expected: FAIL with `Property 'saveEvent' does not exist on type 'PostgresEventsRepository'` or a route assertion failure for the invalid-signature case

- [ ] **Step 3: Implement duplicate-aware persistence and runtime wiring**

`src/postgres-events-repository.ts`

```ts
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type {
  EventsRepository,
  SaveWebhookEventInput,
  SaveWebhookEventResult,
  WebhookEvent
} from "./events-repository.js";

type WebhookEventRow = {
  id: string;
  event_name: string;
  delivery_id: string;
  repository_full_name: string;
  created_at: Date;
};

type PostgresError = Error & {
  code?: string;
};

export class PostgresEventsRepository implements EventsRepository {
  constructor(private readonly pool: Pool) {}

  async listEvents(): Promise<WebhookEvent[]> {
    const result = await this.pool.query<WebhookEventRow>(
      `
        select id, event_name, delivery_id, repository_full_name, created_at
        from webhook_events
        order by created_at desc
      `
    );

    return result.rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      deliveryId: row.delivery_id,
      repositoryFullName: row.repository_full_name,
      createdAt: row.created_at.toISOString()
    }));
  }

  async saveEvent(
    input: SaveWebhookEventInput
  ): Promise<SaveWebhookEventResult> {
    try {
      await this.pool.query(
        `
          insert into webhook_events (
            id,
            event_name,
            delivery_id,
            repository_full_name,
            payload
          )
          values ($1, $2, $3, $4, $5::jsonb)
        `,
        [
          randomUUID(),
          input.eventName,
          input.deliveryId,
          input.repositoryFullName,
          JSON.stringify(input.payload)
        ]
      );

      return "stored";
    } catch (error) {
      const postgresError = error as PostgresError;

      if (postgresError.code === "23505") {
        return "duplicate";
      }

      throw error;
    }
  }
}
```

`src/server.ts`

```ts
import { createApp } from "./app.js";
import { getRequiredEnv } from "./config.js";
import { createPool } from "./db.js";
import { verifyGitHubWebhookSignature } from "./github-webhook-signature.js";
import { PostgresEventsRepository } from "./postgres-events-repository.js";

const port = Number(process.env.PORT ?? 3000);
const pool = createPool();
const app = createApp({
  eventsRepository: new PostgresEventsRepository(pool),
  githubWebhookSecret: getRequiredEnv("GITHUB_WEBHOOK_SECRET"),
  verifyGitHubWebhookSignature
});

app.listen(port, () => {
  console.log(`learning-api listening on port ${port}`);
});
```

After the repository can return `"duplicate"`, add this route test to `test/app.test.ts`:

```ts
it("acknowledges a duplicate GitHub delivery without failing", async () => {
  const app = createApp({
    githubWebhookSecret: "topsecret",
    verifyGitHubWebhookSignature: () => true,
    eventsRepository: {
      listEvents: async () => [],
      saveEvent: async () => "duplicate"
    }
  });

  const response = await request(app)
    .post("/webhooks/github")
    .set("X-GitHub-Event", "issues")
    .set("X-GitHub-Delivery", "delivery_789")
    .set("X-Hub-Signature-256", "sha256=test")
    .set("Content-Type", "application/json")
    .send(
      JSON.stringify({
        action: "opened",
        repository: { full_name: "octo/example" }
      })
    );

  expect(response.status).toBe(202);
  expect(response.body).toEqual({ ok: true });
});
```

If `src/app.ts` branches on the save result, keep the success response identical for both outcomes:

```ts
const saveResult = await eventsRepository.saveEvent(saveInput);

if (saveResult !== "stored" && saveResult !== "duplicate") {
  throw new Error(`Unexpected save result: ${saveResult}`);
}

response.status(202).json({ ok: true });
```

- [ ] **Step 4: Run the tests and build to verify the phase passes**

Run: `npm test`
Expected: PASS with the signature utility tests and all route tests green

Run: `npm run build`
Expected: PASS with `tsc` exiting successfully and no output

- [ ] **Step 5: Commit**

```bash
git add src/postgres-events-repository.ts src/server.ts test/app.test.ts test/postgres-events-repository.test.ts
git commit -m "feat: store verified GitHub webhook events"
```

## Self-Review

- Spec coverage:
  - Raw body handling and signature verification are covered in Task 1 and Task 2.
  - Repository persistence and duplicate handling are covered in Task 2 and Task 3.
  - Local testability without live Neon is covered by the injected fake tests in Task 2 and Task 3.
  - Runtime secret wiring is covered in Task 3.
- Placeholder scan:
  - No `TODO`, `TBD`, or “implement later” placeholders remain.
  - Each code-changing step includes concrete TypeScript or shell commands.
- Type consistency:
  - The plan consistently uses `saveEvent`, `SaveWebhookEventInput`, `SaveWebhookEventResult`, and `verifyGitHubWebhookSignature`.
