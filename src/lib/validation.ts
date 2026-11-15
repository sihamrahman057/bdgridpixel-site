import type { FormField } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELDS = 30;

export function cleanText(value: string, max: number) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#") && /^#[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed.slice(0, 300);
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function validateAnswers(
  fields: FormField[],
  raw: Record<string, unknown>,
): { ok: true; answers: Record<string, string> } | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const answers: Record<string, string> = {};

  for (const field of fields) {
    const incoming = raw[field.id];
    const value = typeof incoming === "string" ? incoming : "";
    const error = validateField(field, value);
    if (error) {
      fieldErrors[field.id] = error;
      continue;
    }
    answers[field.id] = normalizeField(field, value);
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, answers };
}

function validateField(field: FormField, value: string) {
  const trimmed = value.trim();
  if (field.fieldType === "boolean") {
    if (!trimmed && field.required) return "Choose yes or no.";
    if (trimmed && trimmed !== "yes" && trimmed !== "no") return "Choose yes or no.";
    return null;
  }
  if (!trimmed) return field.required ? "This field is required." : null;
  if (field.fieldType === "email") {
    if (trimmed.length > 200 || !EMAIL.test(trimmed)) return "Enter a valid email address.";
    return null;
  }
  if (field.fieldType === "phone") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return "Enter a phone number with 7 to 15 digits.";
    return null;
  }
  if (field.fieldType === "select") {
    if (!field.options.includes(trimmed)) return "Choose one of the listed options.";
    return null;
  }
  if (field.fieldType === "textarea") {
    if (trimmed.length > 2000) return "Use 2000 characters or fewer.";
    return null;
  }
  if (trimmed.length > 200) return "Use 200 characters or fewer.";
  return null;
}

function normalizeField(field: FormField, value: string) {
  const trimmed = value.replace(/\u0000/g, "").trim();
  if (field.fieldType === "boolean") return trimmed === "yes" ? "yes" : "no";
  if (field.fieldType === "email") return trimmed.toLowerCase();
  if (field.fieldType === "textarea") return trimmed.slice(0, 2000);
  return trimmed.slice(0, 200);
}

export function parseOptions(value: string) {
  const options = value
    .split("\n")
    .map((line) => cleanText(line, 80))
    .filter(Boolean);
  const unique = [...new Set(options)];
  if (unique.length > 30) return { error: "Use 30 options or fewer." as const, options: unique.slice(0, 30) };
  return { error: null, options: unique };
}

export function fieldLimitReached(count: number) {
  return count >= MAX_FIELDS;
}

export const FIELD_LIMIT = MAX_FIELDS;
