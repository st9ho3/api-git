export type WebhookEvent = {
  id: string;
  eventName: string;
  deliveryId: string;
  repositoryFullName: string;
  createdAt: string;
};

export type EventsRepository = {
  listEvents(): Promise<WebhookEvent[]>;
};
