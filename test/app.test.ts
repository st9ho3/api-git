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
        listEvents: async () => []
      }
    });

    const response = await request(app).get("/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [] });
  });
});
