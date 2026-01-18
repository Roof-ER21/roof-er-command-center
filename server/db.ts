import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

// Create typed database connection - supports both Neon and local PostgreSQL
type DbType = NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;
let db: DbType;

if (isNeon) {
  // Use Neon serverless driver for Neon databases
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql, { schema });
} else {
  // Use postgres.js for local PostgreSQL
  const sql = postgres(process.env.DATABASE_URL);
  db = drizzlePostgres(sql, { schema });
}

export { db, schema };

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Use a simple select to test connection
    await db.select().from(schema.users).limit(1);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
