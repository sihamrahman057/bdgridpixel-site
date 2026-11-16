import "server-only";
import { randomBytes } from "node:crypto";

let tipOnlyPepper: string | null = null;

/**
 * Session hashing pepper. Production must set SESSION_SECRET (bound as an app secret).
 * Local tip generates an ephemeral random value in memory — never a fixed shipped string.
 */
export function sessionPepper(): string {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  tipOnlyPepper ??= randomBytes(32).toString("hex");
  return tipOnlyPepper;
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
