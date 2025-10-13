# MeedianAI-Finance — Architecture & Integration Guide

This document explains the structure, key modules, environment setup, and how MeedianAI-Finance integrates with the main MeedianAI‑Flow stack. It’s intended for quick onboarding and day‑to‑day reference.

## Overview

- Stack: Express (Node ESM) + Vite/React client + Drizzle ORM (Postgres/Neon).
- Purpose: Finance operations (fee structures, student fees, payments, transport fees, reports) sharing the same Postgres database as MeedianAI‑Flow.
- Location: `MeedianAI-Finance/` (pasted from Replit project and aligned to run within the repo).

## Directory Layout

- `server/`
  - `index.ts`: Express app bootstrap, routes registration, vite/static serving, error handling.
  - `db.ts`: Database connection via `@neondatabase/serverless` + Drizzle initialization. Loads env explicitly from the repo root `.env.local`.
  - `routes/`: API route registration (mounted by `registerRoutes`).
  - `storage.ts`: Data access utilities using Neon SQL client and Drizzle helpers.
- `client/`
  - `index.html`, `src/`: React client served by Vite.
  - `src/components/layout/Sidebar.tsx`: Sidebar navigation; includes a “Flow” button that opens Flow app in a new tab.
- `shared/`
  - `schema.ts`: Drizzle schema combining Flow’s base tables (users/classes/students) and Finance‑specific tables (fee structures, student fees, payments, transport fees, reports, excel imports).
- `drizzle.config.ts`: Drizzle‑kit config, loads env from root.
- `vite.config.ts`: Vite config, aliases, Replit plugins, and a `define` for Flow URL fallback.
- `replit.md`, `.replit`: Replit deployment setup.

## Environment & Running

- Root env is single source of truth. Finance app loads `../.env.local` explicitly in code.
- Required env:
  - `DATABASE_URL`: Neon Postgres URL used by both Flow and Finance.
  - Optional: `PORT` (defaults to 5000; Finance dev script provides `5002`).
- Scripts (run from `MeedianAI-Finance/`):
  - `npm run dev`: Start dev server (uses `../.env.local`).
  - `npm run dev:rootenv`: Same as dev, with explicit dotenv load (kept for convenience).
  - `npm run dev:rootenv:5002`: Same but binds to port 5002 to avoid conflicts with Flow.
  - `npm run db:push`: Push schema to DB with drizzle‑kit (run with root env).

Example commands:

```
cd MeedianAI-Finance
PORT=5002 npm run dev    # or npm run dev:rootenv:5002

# Push finance tables into shared DB
NODE_OPTIONS='-r dotenv/config' dotenv_config_path=../.env.local npm run db:push
```

## Database Schema

Located in `shared/schema.ts`. Key parts:

- Reused enums and tables:
  - `roleEnum`, `teamManagerTypeEnum`, `userTypeEnum`, `memberScopeEnum`
  - `users`, `Classes`/`classes`, `Students`/`students`
- Finance‑specific tables:
  - `feeStructures`: per‑class fee breakdown by type and academic year.
  - `studentFees`: individual student fee account with due/paid/pending and status.
  - `payments`: payment records with method, status, verifier, and receipt URL.
  - `transportFees`: monthly transport fees per student and route.
  - `financialReports`: aggregated data snapshots.
  - `excelImports`: import runs with counts and error logs.

Types are exported using Drizzle inference and Zod insert schemas for request validation.

## Server Bootstrap

- `server/index.ts`:
  - Loads env from `../.env.local` using `dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') })`.
  - Sets up JSON/urlencoded parsing, API logging middleware, route registration, error handler.
  - Dev uses Vite middleware; prod serves static bundle.
  - Listens on `process.env.PORT || 5000`.

- `server/db.ts`:
  - Loads env from repo root.
  - Uses `@neondatabase/serverless` with WS and `drizzle-orm/neon-serverless`.
  - Exports `pool` and `db` with `schema` for typed queries.

- `server/storage.ts`:
  - Contains helper functions using `neon(process.env.DATABASE_URL!)` for SQL calls, and Drizzle imports (`eq`, `sum`, etc.).

## Client App

- Built with Vite + React. Root at `client/`.
- `src/components/layout/Sidebar.tsx`:
  - Maintains local navigation entries.
  - “Flow” button opens Flow in a new tab:
    - Uses `import.meta.env.VITE_FLOW_URL`, else `__FLOW_URL` defined in Vite config, else default `https://meedian-ai-flow-v1.vercel.app/`.

### Fee Structure UI (Frontend-only)

- Location: `client/src/components/fee-management/FeeStructureEditor.tsx` (embedded inside the Fee Management page).
- Purpose: Mirror Excel fee structure for 2024–2025 and allow editing from the UI only.
- Features:
  - Respects the page-level academic year selector (and can create new years that get merged into that dropdown).
  - Hosteller / Day Scholar toggle.
  - Grid for classes NUR, LKG, UKG, I–VIII.
  - Fields: Admission, Monthly, School Fees Total, Uniform, Copy, Book, Extra, Grand Total (computed).
  - Prefilled with the provided Excel numbers for 2024–2025.
- Save to `localStorage` under `fee-structures/<year>`.
- Export/Import JSON for portability and later backend ingestion.
- Add a new academic year (clones the current grid for quick edits) and syncs it with the top-level selector.
- Push the current year to the database via `/api/fee-structures/bulk-upsert` (maps classes automatically and stores the full breakdown in `description`).

Excel Mapping:
- Hosteller rows include: Admission, Monthly (school), School Fees Total, Uniform, Copy, Book, Extra, Total.
- Day Scholar rows include: Admission, Monthly (school), School Fees Total, Uniform, Book, Extra, Total (Copy is often omitted).
- The UI computes totals and validates them against the provided “TOTAL”.

Later, these JSON exports can be ingested server-side to populate `fee_structures` with a breakdown stored in JSON.

- `vite.config.ts`:
  - Provides path aliases: `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.
  - Defines `__FLOW_URL` from `process.env.NEXT_PUBLIC_FLOW_URL` with a sensible default for prod.

## Integration With MeedianAI‑Flow

- Shared DB and base tables ensure consistent user/class/student references.
- Finance can be run alongside Flow; use `PORT=5002` locally to avoid clashes.
- Cross‑app navigation: Finance sidebar “Flow” opens deployed Flow app in a new tab; can be customized via env (`NEXT_PUBLIC_FLOW_URL` or `VITE_FLOW_URL`).
- If the Flow UI needs Finance APIs, enable CORS in `server/index.ts` and configure origins (`http://localhost:3000`, deployed domains).

## Common Tasks

- Update schema and push:
  1) Edit `shared/schema.ts`.
  2) `NODE_OPTIONS='-r dotenv/config' dotenv_config_path=../.env.local npm run db:push`.

- Change ports:
  - Temp: `PORT=5002 npm run dev`.
  - Script: `npm run dev:rootenv:5002`.

- Change Flow URL target:
  - Set `NEXT_PUBLIC_FLOW_URL` in repo root `.env.local` (used by Vite define), or
  - Set `VITE_FLOW_URL` for Finance client.

## Data Migration Plan (from Excel to App)

1) Fee Structures (this UI)
- Confirm 2024–2025 fee structures per class and type using the Fee Structure editor.
- Save and export JSON for archival/import later.

2) Students (current session)
- Update Students list to reflect only active students for this session with correct type (Hosteller/Day Scholar) and class.
- Optionally provide a CSV/Excel importer to update statuses and class promotion.

3) Payments (historical to August)
- Insert payment history per student up to August (from Excel class sheets). September onward will be recorded in this app.
- Transport (Van): configure routes and monthly fees; insert payments from VAN sheet.

4) Validation
- Compare monthly totals and summary against Excel’s Summary/Expect sheets.
- Adjust discrepancies and lock in the initial state for this academic year.

## Notes & Conventions

- Single source of env at repo root; Finance code explicitly loads `../.env.local` to avoid duplication.
- Do not commit secrets; `.env.local` is environment‑specific and excluded from VCS.
- Stick to minimal, focused changes to keep alignment with Flow.
