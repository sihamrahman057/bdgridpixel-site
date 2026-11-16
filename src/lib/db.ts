import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const localDir = path.join(process.cwd(), ".data", "pglite");

/** Fixed owner. The password is stored only as a scrypt hash. */
const FIXED_OWNER_EMAIL = "musfik057@gmail.com";
const FIXED_OWNER_NAME = "Musfik";
const FIXED_OWNER_HASH =
  "840bbcce37e8ef387111353949b8b6c5:64de6d4ec11e80d95fb22983085c4778087fdce97475cae996884e9ede1f726587131c6ab3525c300dfbd4ec64eae021c4ab8384e431d2e255cb17889b7e715c";

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

let postgresReady: Promise<void> | null = null;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    await ensurePostgres();
    cache.pool ??= new pg.Pool({
      connectionString: databaseUrl,
      max: 8,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 20000,
    });
    return (await cache.pool.query(text, params)).rows as T[];
  }
  const db = await localDb();
  return enqueue(async () => (await db.query<T>(text, params)).rows);
}

export async function transaction<T>(fn: (query: Query) => Promise<T>): Promise<T> {
  if (databaseUrl !== "") {
    await ensurePostgres();
    cache.pool ??= new pg.Pool({
      connectionString: databaseUrl,
      max: 8,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 20000,
    });
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
  await ensureFixedOwner(async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows,
  );
  return db;
}

async function ensurePostgres() {
  postgresReady ??= seedPostgres().catch((error: unknown) => {
    postgresReady = null;
    throw error;
  });
  await postgresReady;
}

async function seedPostgres() {
  cache.pool ??= new pg.Pool({
    connectionString: databaseUrl,
    max: 8,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 20000,
  });
  await ensureFixedOwner(async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => {
    const result = await cache.pool!.query(text, params);
    return result.rows as T[];
  });
}

async function ensureFixedOwner(query: Query) {
  await query(`delete from staff where lower(email) = $1 and role <> 'owner'`, [FIXED_OWNER_EMAIL]);
  const updated = await query<{ id: string }>(
    `update staff set name = $1, email = $2, password_hash = $3 where role = 'owner' returning id`,
    [FIXED_OWNER_NAME, FIXED_OWNER_EMAIL, FIXED_OWNER_HASH],
  );
  if (updated.length > 0) return;
  await query(
    `insert into staff (id, name, email, password_hash, role) values ($1, $2, $3, $4, 'owner')`,
    [randomUUID(), FIXED_OWNER_NAME, FIXED_OWNER_EMAIL, FIXED_OWNER_HASH],
  );
}
