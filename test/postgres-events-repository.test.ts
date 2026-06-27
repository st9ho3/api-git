import { describe, expect, it, vi } from "vitest";
import { PostgresEventsRepository } from "../src/postgres-events-repository.js";

describe("PostgresEventsRepository.saveEvent", () => {
  it("returns stored when the insert succeeds", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] })
    };
    const repository = new PostgresEventsRepository(pool as never);

    const result = await repository.saveEvent({
      eventName: "issues",
      deliveryId: "delivery_123",
      repositoryFullName: "octo/example",
      payload: { action: "opened" }
    });

    expect(result).toBe("stored");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("returns duplicate when Postgres reports a unique violation", async () => {
    const pool = {
      query: vi.fn().mockRejectedValue({ code: "23505" })
    };
    const repository = new PostgresEventsRepository(pool as never);

    const result = await repository.saveEvent({
      eventName: "issues",
      deliveryId: "delivery_123",
      repositoryFullName: "octo/example",
      payload: { action: "opened" }
    });

    expect(result).toBe("duplicate");
  });
});
