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
