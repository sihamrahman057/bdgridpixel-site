import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

type Cache = {
  pool?: pg.Pool;
  local?: Promise<PGlite>;
};

const globalForDb = globalThis as unknown as { eventRegisterDb?: Cache };
const cache: Cache = (globalForDb.eventRegisterDb ??= {});

export type Query = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    cache.pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await cache.pool.query(text, params)).rows as T[];
  }
  const db = await localDb();
  return (await db.query<T>(text, params)).rows;
}

export async function transaction<T>(fn: (query: Query) => Promise<T>): Promise<T> {
  if (databaseUrl !== "") {
    cache.pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    const client = await cache.pool.connect();
    try {
      await client.query("begin");
      const query: Query = async (text, params = []) =>
        (await client.query(text, params)).rows as never;
      const result = await fn(query);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  const db = await localDb();
  return db.transaction(async (tx) => {
    const query: Query = async (text, params = []) =>
      (await tx.query(text, params)).rows as never;
    return fn(query);
  });
}

async function localDb(): Promise<PGlite> {
  cache.local ??= startLocal().catch((error: unknown) => {
    cache.local = undefined;
    throw error;
  });
  return cache.local;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => []))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
