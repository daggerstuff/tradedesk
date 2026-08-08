import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query<T = Record<string, unknown>>(text: string, params?: (string | number | boolean | null | Date)[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(text: string, params?: (string | number | boolean | null | Date)[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function queryMany<T = Record<string, unknown>>(text: string, params?: (string | number | boolean | null | Date)[]): Promise<T[]> {
  return query<T>(text, params);
}

export { pool };
