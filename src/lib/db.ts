import "server-only";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const localDir = path.join(process.cwd(), ".data", "pglite");

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

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(run: () => Promise<T>): Promise<T> {
  const next = queue.then(run, run);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function pool() {
  cache.pool ??= new pg.Pool({
    connectionString: databaseUrl,
    max: 8,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 20000,
  });
  return cache.pool;
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    return (await pool().query(text, params)).rows as T[];
  }
  const db = await localDb();
  return enqueue(async () => (await db.query<T>(text, params)).rows);
}

export async function transaction<T>(fn: (query: Query) => Promise<T>): Promise<T> {
  if (databaseUrl !== "") {
    const client = await pool().connect();
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
  return enqueue(() =>
    db.transaction(async (tx) => {
      const query: Query = async (text, params = []) =>
        (await tx.query(text, params)).rows as never;
      return fn(query);
    }),
  );
}

async function localDb(): Promise<PGlite> {
  cache.local ??= startLocal().catch((error: unknown) => {
    cache.local = undefined;
    throw error;
  });
  return cache.local;
}

async function startLocal(): Promise<PGlite> {
  await mkdir(localDir, { recursive: true });
  const db = new PGlite(localDir);
  await db.exec(`create table if not exists schema_migrations (id text primary key)`);
  const files = (await readdir("migrations").catch(() => []))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const applied = await db.query<{ id: string }>(`select id from schema_migrations where id = $1`, [file]);
    if (applied.rows.length > 0) continue;
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
    await db.query(`insert into schema_migrations (id) values ($1)`, [file]);
  }
  return db;
}
