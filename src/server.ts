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
