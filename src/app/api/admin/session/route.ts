import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { createOwner, countOwners, verifyLogin } from "@/lib/event-store";
import { clientIp, takeToken } from "@/lib/rate-limit";
import { requireSetupSecret, sessionPepper } from "@/lib/session-secret";

const COOKIE = "er_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(sessionPepper()).update(token).digest("hex");
}

function adminUrl(request: Request, path: string) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) return new URL(path, `${proto}://${host}`);
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

function redirectError(request: Request, message: string, portal = "admin") {
  const url = adminUrl(request, "/admin");
  url.searchParams.set("error", message);
  url.searchParams.set("portal", portal);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "login");
  const ip = clientIp(request.headers);

  if (intent === "logout") {
    const token = request.headers.get("cookie")?.match(/(?:^|;\s*)er_session=([^;]+)/)?.[1];
    if (token) await sql(`delete from sessions where id_hash = $1`, [hashToken(decodeURIComponent(token))]);
    const response = NextResponse.redirect(adminUrl(request, "/admin"), 303);
    response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  }

  if (!takeToken(`staff-auth:${ip}`, 20, 15 * 60 * 1000)) {
    return redirectError(request, "Too many sign-in attempts. Wait a few minutes and try again.");
  }

  if (intent === "setup") {
    const owners = await countOwners();
    if (owners > 0) {
      return NextResponse.redirect(adminUrl(request, "/admin"), 303);
    }
    const setupGate = requireSetupSecret(String(form.get("setupSecret") ?? ""));
    if (setupGate) return redirectError(request, setupGate);

    const error = await createOwner(
      String(form.get("name") ?? ""),
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );
    if (error) return redirectError(request, error);

    const staff = await verifyLogin(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    if (!staff) {
      return redirectError(request, "The owner account was created, but sign-in failed. Try signing in.");
    }
    const token = await openSessionToken(staff.id);
    return attachSession(NextResponse.redirect(adminUrl(request, "/admin/registrations"), 303), token);
  }

  const portalRaw = form.get("portal");
  const portal = portalRaw === "moderator" ? "moderator" : "admin";
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const staff = await verifyLogin(email, password);
  if (!staff) {
    return redirectError(
      request,
      "That email and password do not match an account. Use the exact admin email you created, with the switch on Admin (left).",
      portal,
    );
  }

  const isAdminAccount = staff.role === "owner";
  if (portal === "admin" && !isAdminAccount) {
    return redirectError(request, "That account is a moderator. Slide the switch right to Moderator.", "moderator");
  }
  if (portal === "moderator" && isAdminAccount) {
    return redirectError(request, "That account is the admin. Slide the switch left to Admin.", "admin");
  }

  const token = await openSessionToken(staff.id);
  return attachSession(NextResponse.redirect(adminUrl(request, "/admin/registrations"), 303), token);
}
