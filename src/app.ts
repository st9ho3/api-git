import express from "express";
import type { EventsRepository } from "./events-repository.js";

type CreateAppOptions = {
  eventsRepository?: EventsRepository;
};

const emptyEventsRepository: EventsRepository = {
  async listEvents() {
    return [];
  }
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const eventsRepository = options.eventsRepository ?? emptyEventsRepository;

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

  return app;
}
