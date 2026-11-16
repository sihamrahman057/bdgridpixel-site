import "server-only";
import { randomBytes } from "node:crypto";
import { closeSync, mkdirSync, openSync, readFileSync, writeSync } from "node:fs";
import path from "node:path";

const pepperGlobal = globalThis as { eventRegisterDevPepper?: string };

/**
 * Session hashing pepper. Production must set SESSION_SECRET (bound as an app secret).
 * Local development keeps one secret in .data so every server bundle accepts the same login cookie.
 */
export function sessionPepper(): string {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  return devPepper();
}

function devPepper() {
  if (pepperGlobal.eventRegisterDevPepper) return pepperGlobal.eventRegisterDevPepper;
  const file = path.join(process.cwd(), ".data", "dev-session-secret");
  mkdirSync(path.dirname(file), { recursive: true });
  try {
    const existing = readFileSync(file, "utf8").trim();
    if (existing.length >= 32) {
      pepperGlobal.eventRegisterDevPepper = existing;
      return existing;
    }
  } catch {
    // The file is created below.
  }
  const secret = randomBytes(32).toString("hex");
  try {
    const fd = openSync(file, "wx", 0o600);
    writeSync(fd, secret);
    closeSync(fd);
    pepperGlobal.eventRegisterDevPepper = secret;
    return secret;
  } catch {
    const existing = readFileSync(file, "utf8").trim();
    pepperGlobal.eventRegisterDevPepper = existing;
    return existing;
  }
}

/** One-time admin bootstrap gate for public/production deploys. */
export function requireSetupSecret(provided: string): string | null {
  const expected = process.env.ADMIN_SETUP_SECRET?.trim();
  if (process.env.NODE_ENV !== "production") {
    // Tip: allow first owner without a setup secret.
    return null;
  }
  if (!expected) {
    return "Admin setup is locked. Add ADMIN_SETUP_SECRET for this app, then try again.";
  }
  if (provided.trim() !== expected) {
    return "Wrong setup secret.";
  }
  return null;
}

export function setupSecretRequired() {
  return process.env.NODE_ENV === "production";
}
