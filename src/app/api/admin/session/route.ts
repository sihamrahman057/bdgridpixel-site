import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { createOwner, countOwners, verifyLogin } from "@/lib/event-store";
import { clientIp, isLimited, takeToken } from "@/lib/rate-limit";
import { requireSetupSecret, sessionPepper } from "@/lib/session-secret";

const COOKIE = "er_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(sessionPepper()).update(token).digest("hex");
}

function adminUrl(request: Request, path: string) {
  const url = new URL(request.url);
  const host = request.headers.get("host")?.trim() ?? "";
  if (/^[A-Za-z0-9.\-:[\]]+$/.test(host)) url.host = host;
  url.pathname = path;
  url.search = "";
  return url;
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

  const limitKey = `staff-auth:${ip}`;
  if (isLimited(limitKey, 12, 15 * 60 * 1000)) {
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
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  let staff: Awaited<ReturnType<typeof verifyLogin>>;
  try {
    staff = await verifyLogin(email, password);
  } catch {
    return redirectError(request, "Sign-in could not reach the account list. Try again in a moment.", portal);
  }
  if (!staff) {
    takeToken(limitKey, 12, 15 * 60 * 1000);
    return redirectError(
      request,
      portal === "admin"
        ? "That email and password do not match the admin account. Leave the switch on Admin (left)."
        : "That email and password do not match a moderator account. Slide the switch right only for a moderator.",
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
