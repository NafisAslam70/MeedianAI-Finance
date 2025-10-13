import { defineConfig } from "drizzle-kit";
import path from 'node:path';
import dotenv from 'dotenv';

// Load root env to access FINANCE_DATABASE_URL locally
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const financeUrl = process.env.FINANCE_DATABASE_URL || process.env.DATABASE_URL;
if (!financeUrl) {
  throw new Error("FINANCE_DATABASE_URL or DATABASE_URL must be set for migrations");
}

export default defineConfig({
  out: "./migrations",
  // Only push Finance tables to the Finance DB
  schema: "./shared/finance-only.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: financeUrl,
  },
});
