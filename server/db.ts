import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
import { Pool, neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as sharedSchema from "@shared/schema";
import { extendedFinanceSchema } from "@shared/finance-only.schema";

neonConfig.webSocketConstructor = ws;

// Use environment variables only - NO hardcoded credentials for security
const FINANCE_DATABASE_URL = process.env.FINANCE_DATABASE_URL;
const SHARED_DATABASE_URL = process.env.SHARED_DATABASE_URL ?? process.env.DATABASE_URL;

if (!FINANCE_DATABASE_URL) {
  throw new Error(
    "FINANCE_DATABASE_URL must be set to use the Finance database. Add it to .env.local and restart."
  );
}

if (!SHARED_DATABASE_URL) {
  throw new Error(
    "Neither SHARED_DATABASE_URL nor DATABASE_URL is set. Configure a connection string for the shared (students/classes) database in .env.local and restart."
  );
}

if (FINANCE_DATABASE_URL === SHARED_DATABASE_URL) {
  console.warn(
    "[finance] Warning: SHARED_DATABASE_URL resolves to the same database as FINANCE_DATABASE_URL. Students/classes queries will point at the finance schema."
  );
}

const describeDb = (url: string) => {
  try {
    const parsed = new URL(url);
    const dbName = parsed.pathname.replace(/^\//, '') || '<default>';
    return `${parsed.host}/${dbName}`;
  } catch (error) {
    return 'unknown';
  }
};

console.log(`[finance] Shared DB connection -> ${describeDb(SHARED_DATABASE_URL)}`);
console.log(`[finance] Finance DB connection -> ${describeDb(FINANCE_DATABASE_URL)}`);

// Shared DB (users/classes/students)
export const poolShared = new Pool({ connectionString: SHARED_DATABASE_URL });
export const dbShared = drizzle({ client: poolShared, schema: sharedSchema });

// Finance DB (fee structures, payments, transport, etc.)
export const poolFinance = new Pool({ connectionString: FINANCE_DATABASE_URL });
export const dbFinance = drizzle({ client: poolFinance, schema: extendedFinanceSchema });

// For backward compatibility, default `db` to finance DB
export const db = dbFinance;

// Optional: SQL clients when using raw Neon queries
export const sqlShared = () => neon(SHARED_DATABASE_URL!);
export const sqlFinance = () => neon(FINANCE_DATABASE_URL);
