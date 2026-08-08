import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(text: string, params?: (string | number | boolean | null)[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(text: string, params?: (string | number | boolean | null)[]): Promise<T | null> {
  const res = await query(text, params);
  return (res.rows[0] as T) ?? null;
}

export async function queryMany<T = Record<string, unknown>>(text: string, params?: (string | number | boolean | null)[]): Promise<T[]> {
  const res = await query(text, params);
  return res.rows as T[];
}

export { pool };
