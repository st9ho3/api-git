import { Pool } from "pg";
import type { EventsRepository, WebhookEvent } from "./events-repository.js";

type WebhookEventRow = {
  id: string;
  event_name: string;
  delivery_id: string;
  repository_full_name: string;
  created_at: Date;
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
}
