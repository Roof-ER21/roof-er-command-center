import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

// Create database connection - supports both Neon and local PostgreSQL
let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePostgres>;
let sql: ReturnType<typeof neon> | ReturnType<typeof postgres>;

if (isNeon) {
  // Use Neon serverless driver for Neon databases
  sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql as ReturnType<typeof neon>, { schema });
} else {
  // Use postgres.js for local PostgreSQL
  sql = postgres(process.env.DATABASE_URL);
  db = drizzlePostgres(sql as ReturnType<typeof postgres>, { schema });
}

export { db, schema };

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (isNeon) {
      await (sql as ReturnType<typeof neon>)`SELECT 1`;
    } else {
      await (sql as ReturnType<typeof postgres>)`SELECT 1`;
    }
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
