import express from "express";
import type {
  EventsRepository,
  SaveWebhookEventInput
} from "./events-repository.js";
import { verifyGitHubWebhookSignature as defaultVerifyGitHubWebhookSignature } from "./github-webhook-signature.js";

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

type GitHubWebhookVerifier = (input: {
  rawBody: Buffer;
  secret: string;
  signatureHeader: string;
}) => boolean;

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
