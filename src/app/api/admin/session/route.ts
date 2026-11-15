import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { createOwner, countOwners, verifyLogin } from "@/lib/event-store";

const COOKIE = "er_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

function pepper() {
  return process.env.SESSION_SECRET?.trim() || "dev-only-session-pepper";
}

function hashToken(token: string) {
  return createHash("sha256").update(pepper()).update(token).digest("hex");
}

function adminUrl(request: Request, path: string) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) return new URL(path, `${proto}://${host}`);
  // Prefer loopback over 0.0.0.0 when the tip binds all interfaces.
  return new URL(path, request.url.replace("://0.0.0.0", "://127.0.0.1"));
}

function attachSession(response: NextResponse, token: string) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  return response;
}

async function openSessionToken(staffId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MS);
  await sql(`delete from sessions where expires_at <= now()`);
  await sql(`insert into sessions (id_hash, staff_id, expires_at) values ($1, $2, $3)`, [
    hashToken(token),
    staffId,
    expires.toISOString(),
  ]);
  return token;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "login");

  if (intent === "logout") {
    const token = request.headers.get("cookie")?.match(/(?:^|;\s*)er_session=([^;]+)/)?.[1];
    if (token) await sql(`delete from sessions where id_hash = $1`, [hashToken(decodeURIComponent(token))]);
    const response = NextResponse.redirect(adminUrl(request, "/admin"), 303);
    response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  }

  if (intent === "setup") {
    const owners = await countOwners();
    if (owners > 0) {
      return NextResponse.redirect(adminUrl(request, "/admin"), 303);
    }
    const error = await createOwner(
      String(form.get("name") ?? ""),
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );
    if (error) {
      const url = adminUrl(request, "/admin");
      url.searchParams.set("error", error);
      return NextResponse.redirect(url, 303);
    }
    const staff = await verifyLogin(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    if (!staff) {
      const url = adminUrl(request, "/admin");
      url.searchParams.set("error", "The owner account was created, but sign-in failed. Try signing in.");
      return NextResponse.redirect(url, 303);
    }
    const token = await openSessionToken(staff.id);
    return attachSession(NextResponse.redirect(adminUrl(request, "/admin/registrations"), 303), token);
  }

  const staff = await verifyLogin(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!staff) {
    const url = adminUrl(request, "/admin");
    url.searchParams.set("error", "That email and password do not match a staff account.");
    return NextResponse.redirect(url, 303);
  }
  const token = await openSessionToken(staff.id);
  return attachSession(NextResponse.redirect(adminUrl(request, "/admin/registrations"), 303), token);
}
