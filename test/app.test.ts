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
});
