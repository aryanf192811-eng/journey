// apps/api/src/infrastructure/db.ts
// Thin pg pool wrapper. No ORM in V1 — schema is simple enough for raw
// SQL (see docs/DB.md) and this keeps the dependency surface small for
// a student-run, no-paid-services project (see CLAUDE.md).

import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/travel_intelligence',
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}
