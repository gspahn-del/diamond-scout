import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL environment variable is required');
  return new Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
}

const globalForDb = global as typeof globalThis & { _pgPool?: Pool };
if (!globalForDb._pgPool) globalForDb._pgPool = createPool();

export const pool = globalForDb._pgPool;
export const db = drizzle(pool, { schema });
export type DB = typeof db;
