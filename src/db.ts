import { Pool } from "pg";
import { getRequiredEnv } from "./config.js";

export function createPool() {
  return new Pool({
    connectionString: getRequiredEnv("DATABASE_URL")
  });
}
