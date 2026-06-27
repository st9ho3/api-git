import { createApp } from "./app.js";
import { createPool } from "./db.js";
import { PostgresEventsRepository } from "./postgres-events-repository.js";

const port = Number(process.env.PORT ?? 3000);
const pool = createPool();
const app = createApp({
  eventsRepository: new PostgresEventsRepository(pool)
});

app.listen(port, () => {
  console.log(`learning-api listening on port ${port}`);
});
