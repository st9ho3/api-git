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
