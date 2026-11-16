import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { sessionPepper } from "@/lib/session-secret";
import type { Role, Staff } from "@/lib/types";
import { isRole } from "@/lib/types";

const COOKIE = "er_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(sessionPepper()).update(token).digest("hex");
}

export async function getCurrentStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql<{ id: string; name: string; email: string; role: string }>(
    `select staff.id, staff.name, staff.email, staff.role
     from sessions
     join staff on staff.id = sessions.staff_id
     where sessions.id_hash = $1 and sessions.expires_at > now()`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row || !isRole(row.role)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function openSession(staffId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MS);
  await sql(`delete from sessions where expires_at <= now()`);
  await sql(
    `insert into sessions (id_hash, staff_id, expires_at) values ($1, $2, $3)`,
    [hashToken(token), staffId, expires.toISOString()],
  );
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function closeSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sql(`delete from sessions where id_hash = $1`, [hashToken(token)]);
  jar.delete(COOKIE);
}

export async function denyUnless(roles: Role[]) {
  const staff = await getCurrentStaff();
  if (!staff) return { staff: null, error: "You need to sign in again." };
  if (!roles.includes(staff.role)) return { staff, error: "You don't have access to that." };
  return { staff, error: null };
}
