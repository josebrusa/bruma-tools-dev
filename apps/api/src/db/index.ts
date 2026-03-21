import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });

export async function checkDbConnection(): Promise<boolean> {
  try {
    const c = await pool.connect();
    c.release();
    return true;
  } catch {
    return false;
  }
}

export { pool };
