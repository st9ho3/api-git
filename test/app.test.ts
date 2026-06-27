import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("learning API", () => {
  it("returns health status", async () => {
    const app = createApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, service: "learning-api" });
  });

  it("returns events from the repository", async () => {
    const app = createApp({
      eventsRepository: {
        listEvents: async () => [
          {
            id: "evt_1",
            eventName: "issues",
            deliveryId: "delivery_1",
            repositoryFullName: "octo/example",
            createdAt: "2026-06-27T10:00:00.000Z"
          }
        ]
      }
    });

    const response = await request(app).get("/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      events: [
        {
          id: "evt_1",
          eventName: "issues",
          deliveryId: "delivery_1",
          repositoryFullName: "octo/example",
          createdAt: "2026-06-27T10:00:00.000Z"
        }
      ]
    });
  });

  it("returns an empty list when the repository has no rows", async () => {
    const app = createApp({
      eventsRepository: {
        listEvents: async () => [],
        saveEvent: async () => "stored"
      }
    });

    const response = await request(app).get("/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [] });
  });

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

  it("exposes webhook events through the MCP tool", async () => {
    const app = createApp({
      mcpApiToken: "test-mcp-token",
      eventsRepository: {
        listEvents: async () => [
          {
            id: "evt_1",
            eventName: "issues",
            deliveryId: "delivery_1",
            repositoryFullName: "octo/example",
            createdAt: "2026-06-27T10:00:00.000Z"
          }
        ],
        saveEvent: async () => "stored"
      }
    });

    const server = app.listen(0);
    const address = server.address();

    if (typeof address !== "object" || address === null) {
      throw new Error("Expected test server to listen on a TCP port");
    }

    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );

    const client = new Client({
      name: "learning-api-test-client",
      version: "0.1.0"
    });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}/mcp`),
      {
        requestInit: {
          headers: {
            Authorization: "Bearer test-mcp-token"
          }
        }
      }
    );

    try {
      await client.connect(transport);

      const result = await client.callTool({
        name: "list_webhook_events",
        arguments: {}
      });

      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(
            {
              events: [
                {
                  id: "evt_1",
                  eventName: "issues",
                  deliveryId: "delivery_1",
                  repositoryFullName: "octo/example",
                  createdAt: "2026-06-27T10:00:00.000Z"
                }
              ]
            },
            null,
            2
          )
        }
      ]);
    } finally {
      await client.close();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  it("rejects MCP requests without a bearer token", async () => {
    const app = createApp({
      mcpApiToken: "test-mcp-token",
      eventsRepository: {
        listEvents: async () => [],
        saveEvent: async () => "stored"
      }
    });

    const response = await request(app)
      .post("/mcp")
      .send({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects MCP requests with the wrong bearer token", async () => {
    const app = createApp({
      mcpApiToken: "test-mcp-token",
      eventsRepository: {
        listEvents: async () => [],
        saveEvent: async () => "stored"
      }
    });

    const response = await request(app)
      .post("/mcp")
      .set("Authorization", "Bearer wrong-token")
      .send({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});
