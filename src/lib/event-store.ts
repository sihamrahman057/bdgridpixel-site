import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { sql, transaction } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { takeToken } from "@/lib/rate-limit";
import type {
  EventSettings,
  FieldType,
  FormField,
  Registration,
  RegisterResult,
  Role,
  SiteNotification,
  Staff,
} from "@/lib/types";
import { isFieldType, isRole } from "@/lib/types";
import {
  FIELD_LIMIT,
  cleanText,
  fieldLimitReached,
  parseOptions,
  safeHref,
  validateAnswers,
} from "@/lib/validation";
import { isRegistrationOpen, parseBangladeshLocal } from "@/lib/time-bd";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = `${"ab".repeat(16)}:${"00".repeat(64)}`;
const IMAGE_LIMIT = Math.floor(1.5 * 1024 * 1024);
const PAGE_SIZE = 25;

type SettingsRow = {
  event_name: string;
  event_date: string;
  event_place: string;
  event_status: string;
  registration_closes_at: Date | string | null;
  banner_eyebrow: string;
  banner_title: string;
  banner_body: string;
  banner_button_label: string;
  banner_button_url: string;
  banner_image_url: string;
  has_banner_image: boolean | string;
  has_site_logo: boolean | string;
  social_discord: string;
  social_instagram: string;
  social_youtube: string;
  social_facebook: string;
  updated_at: Date | string;
};

type FieldRow = {
  id: string;
  label: string;
  field_type: string;
  required: boolean | string;
  placeholder: string;
  options: unknown;
  position: number;
};

export function pageSize() {
  return PAGE_SIZE;
}

export async function getSettings(): Promise<EventSettings> {
  const rows = await sql<SettingsRow>(
    `select event_name, event_date, event_place, event_status, registration_closes_at,
            banner_eyebrow, banner_title, banner_body,
            banner_button_label, banner_button_url, banner_image_url,
            (banner_image is not null) as has_banner_image,
            (site_logo is not null) as has_site_logo,
            social_discord, social_instagram, social_youtube, social_facebook,
            updated_at
     from event_settings where id = 1`,
  );
  const row = rows[0];
  if (!row) throw new Error("Event settings are missing.");
  return mapSettings(row);
}

export async function updateHero(input: {
  eventName: string;
  eventDate: string;
  eventPlace: string;
  eventStatus: string;
  closesAtLocal?: string;
  clearTimer?: boolean;
}) {
  const eventName = cleanText(input.eventName, 80);
  const eventDate = cleanText(input.eventDate, 80);
  const eventPlace = cleanText(input.eventPlace, 80);
  const eventStatus = cleanText(input.eventStatus, 60);
  if (!eventName || !eventDate || !eventPlace || !eventStatus) {
    return "Fill in the event name, date, place, and status.";
  }

  let closesAt: string | null | undefined;
  if (input.clearTimer) {
    closesAt = null;
  } else if (input.closesAtLocal !== undefined) {
    const local = input.closesAtLocal.trim();
    if (!local) {
      closesAt = null;
    } else {
      const parsed = parseBangladeshLocal(local);
      if (!parsed) return "Use a valid Bangladesh date and time for the timer.";
      closesAt = parsed.toISOString();
    }
  }

  if (closesAt !== undefined) {
    await sql(
      `update event_settings
       set event_name = $1, event_date = $2, event_place = $3, event_status = $4,
           registration_closes_at = $5, updated_at = now()
       where id = 1`,
      [eventName, eventDate, eventPlace, eventStatus, closesAt],
    );
  } else {
    await sql(
      `update event_settings
       set event_name = $1, event_date = $2, event_place = $3, event_status = $4, updated_at = now()
       where id = 1`,
      [eventName, eventDate, eventPlace, eventStatus],
    );
  }
  return null;
}

export async function updateBanner(input: {
  eyebrow: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  imageUrl: string;
}) {
  const eyebrow = cleanText(input.eyebrow, 40);
  const title = cleanText(input.title, 80);
  const body = input.body.replace(/\u0000/g, "").trim().slice(0, 400);
  const buttonLabel = cleanText(input.buttonLabel, 40);
  const buttonUrl = input.buttonUrl.trim();
  const imageUrl = input.imageUrl.trim();
  if (!eyebrow || !title || !body) return "The banner needs an eyebrow, a title, and a short text.";
  if ((buttonLabel && !buttonUrl) || (!buttonLabel && buttonUrl)) {
    return "A button needs both a label and a link.";
  }
  if (buttonUrl && !safeHref(buttonUrl)) return "The button link must be a web address, a page path, or #register.";
  if (imageUrl && !isHttpUrl(imageUrl)) return "The image link must start with http:// or https://.";
  await sql(
    `update event_settings
     set banner_eyebrow = $1, banner_title = $2, banner_body = $3,
         banner_button_label = $4, banner_button_url = $5, banner_image_url = $6,
         updated_at = now()
     where id = 1`,
    [eyebrow, title, body, buttonLabel, buttonUrl ? safeHref(buttonUrl) : "", imageUrl.slice(0, 500)],
  );
  return null;
}

export async function setBannerImage(bytes: Uint8Array, type: string) {
  if (bytes.byteLength === 0) return "Choose an image to upload.";
  if (bytes.byteLength > IMAGE_LIMIT) return "Use an image smaller than 1.5 MB.";
  const sniffed = sniffImage(bytes);
  if (!sniffed || sniffed !== type) return "Upload a JPEG, PNG, WEBP, or GIF.";
  await sql(
    `update event_settings
     set banner_image = $1, banner_image_type = $2, updated_at = now()
     where id = 1`,
    [Buffer.from(bytes), sniffed],
  );
  return null;
}

export async function clearBannerImage() {
  await sql(
    `update event_settings
     set banner_image = null, banner_image_type = null, updated_at = now()
     where id = 1`,
  );
}

export async function getBannerImage() {
  const rows = await sql<{ banner_image: unknown; banner_image_type: string | null }>(
    `select banner_image, banner_image_type from event_settings where id = 1`,
  );
  const row = rows[0];
  const bytes = toBytes(row?.banner_image);
  if (!row || !bytes || !row.banner_image_type) return null;
  return { bytes, type: row.banner_image_type };
}

export async function setSiteLogo(bytes: Uint8Array, type: string) {
  if (bytes.byteLength === 0) return "Choose a logo to upload.";
  if (bytes.byteLength > IMAGE_LIMIT) return "Use a logo smaller than 1.5 MB.";
  const sniffed = sniffImage(bytes);
  if (!sniffed || sniffed !== type) return "Upload a JPEG, PNG, WEBP, or GIF.";
  await sql(
    `update event_settings set site_logo = $1, site_logo_type = $2, updated_at = now() where id = 1`,
    [Buffer.from(bytes), sniffed],
  );
  return null;
}

export async function clearSiteLogo() {
  await sql(`update event_settings set site_logo = null, site_logo_type = null, updated_at = now() where id = 1`);
}

export async function getSiteLogo() {
  const rows = await sql<{ site_logo: unknown; site_logo_type: string | null }>(
    `select site_logo, site_logo_type from event_settings where id = 1`,
  );
  const row = rows[0];
  const bytes = toBytes(row?.site_logo);
  if (!row || !bytes || !row.site_logo_type) return null;
  return { bytes, type: row.site_logo_type };
}

export async function updateSocialLinks(input: {
  discord: string;
  instagram: string;
  youtube: string;
  facebook: string;
}) {
  const links = {
    discord: normalizeSocial(input.discord),
    instagram: normalizeSocial(input.instagram),
    youtube: normalizeSocial(input.youtube),
    facebook: normalizeSocial(input.facebook),
  };
  for (const [name, value] of Object.entries(links)) {
    if (value.error) return `${name}: ${value.error}`;
  }
  await sql(
    `update event_settings
     set social_discord = $1, social_instagram = $2, social_youtube = $3, social_facebook = $4, updated_at = now()
     where id = 1`,
    [links.discord.href, links.instagram.href, links.youtube.href, links.facebook.href],
  );
  return null;
}

export async function listNotifications(): Promise<SiteNotification[]> {
  const rows = await sql<{ id: string; title: string; body: string; created_at: Date | string }>(
    `select id, title, body, created_at from notifications order by created_at desc limit 40`,
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: asIso(row.created_at),
  }));
}

export async function createNotification(title: string, body: string) {
  const cleanTitle = cleanText(title, 80);
  const cleanBody = body.replace(/\u0000/g, "").trim().slice(0, 400);
  if (!cleanTitle || !cleanBody) return "Add a title and a short message.";
  await sql(`insert into notifications (id, title, body) values ($1, $2, $3)`, [
    `ntf_${randomBytes(4).toString("hex")}`,
    cleanTitle,
    cleanBody,
  ]);
  return null;
}

export async function deleteNotification(id: string) {
  await sql(`delete from notifications where id = $1`, [id]);
}

function normalizeSocial(value: string): { href: string; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { href: "" };
  if (!isHttpUrl(trimmed)) return { href: "", error: "use an http:// or https:// link." };
  return { href: trimmed.slice(0, 500) };
}

export async function listFields(): Promise<FormField[]> {
  const rows = await sql<FieldRow>(
    `select id, label, field_type, required, placeholder, options, position
     from form_fields order by position asc, created_at asc`,
  );
  return rows.filter((row) => isFieldType(row.field_type)).map(mapField);
}

export async function createField(input: FieldInput) {
  const parsed = parseFieldInput(input);
  if (parsed.error || !parsed.value) return parsed.error ?? "That field could not be saved.";
  const countRows = await sql<{ count: number }>(`select count(*)::int as count from form_fields`);
  if (fieldLimitReached(Number(countRows[0]?.count ?? 0))) {
    return `The form can have up to ${FIELD_LIMIT} fields.`;
  }
  const positionRows = await sql<{ position: number }>(
    `select coalesce(max(position), -1) + 1 as position from form_fields`,
  );
  const id = `fld_${randomBytes(4).toString("hex")}`;
  await sql(
    `insert into form_fields (id, label, field_type, required, placeholder, options, position)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      id,
      parsed.value.label,
      parsed.value.fieldType,
      parsed.value.required,
      parsed.value.placeholder,
      JSON.stringify(parsed.value.options),
      Number(positionRows[0]?.position ?? 0),
    ],
  );
  return null;
}

export async function updateField(id: string, input: FieldInput) {
  const parsed = parseFieldInput(input);
  if (parsed.error || !parsed.value) return parsed.error ?? "That field could not be saved.";
  const rows = await sql<{ id: string }>(
    `update form_fields
     set label = $2, field_type = $3, required = $4, placeholder = $5, options = $6::jsonb
     where id = $1
     returning id`,
    [
      id,
      parsed.value.label,
      parsed.value.fieldType,
      parsed.value.required,
      parsed.value.placeholder,
      JSON.stringify(parsed.value.options),
    ],
  );
  return rows.length === 0 ? "That field is no longer on the form." : null;
}

export async function deleteField(id: string) {
  return transaction(async (query) => {
    const counts = await query<{ count: number }>(`select count(*)::int as count from form_fields`);
    if (Number(counts[0]?.count ?? 0) <= 1) return "Keep at least one field on the form.";
    const rows = await query<{ id: string }>(`delete from form_fields where id = $1 returning id`, [id]);
    return rows.length === 0 ? "That field is no longer on the form." : null;
  });
}

export async function moveField(id: string, direction: -1 | 1) {
  const fields = await listFields();
  const index = fields.findIndex((field) => field.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= fields.length) return null;
  const current = fields[index];
  const neighbor = fields[target];
  if (!current || !neighbor) return null;
  await transaction(async (query) => {
    await query(`update form_fields set position = $1 where id = $2`, [neighbor.position, current.id]);
    await query(`update form_fields set position = $1 where id = $2`, [current.position, neighbor.id]);
  });
  return null;
}

export async function registerGuest(raw: Record<string, unknown>, ip: string): Promise<RegisterResult> {
  if (!takeToken(`register:${ip}`, 20, 10 * 60 * 1000)) {
    return {
      ok: false,
      message: "Too many registrations from this network. Wait a few minutes and try again.",
      fieldErrors: {},
    };
  }
  const settings = await getSettings();
  if (!isRegistrationOpen(settings.registrationClosesAt, settings.eventStatus)) {
    return {
      ok: false,
      message: "Registration is closed. The event timer has ended or the host turned it off.",
      fieldErrors: {},
    };
  }
  const fields = await listFields();
  if (fields.length === 0) {
    return { ok: false, message: "Registration is not open yet.", fieldErrors: {} };
  }
  const validated = validateAnswers(fields, raw);
  if (!validated.ok) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: validated.fieldErrors };
  }
  await sql(`insert into registrations (id, answers) values ($1, $2::jsonb)`, [
    randomUUID(),
    JSON.stringify(validated.answers),
  ]);
  const nameField = fields.find((field) => field.fieldType === "text" && validated.answers[field.id]);
  return { ok: true, name: nameField ? validated.answers[nameField.id] ?? "your place" : "your place" };
}

export async function searchRegistrations(queryText: string, page: number) {
  const term = queryText.trim().slice(0, 80);
  const escaped = term.replace(/[\\%_]/g, (char) => `\\${char}`);
  const pattern = term ? `%${escaped}%` : "";
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;
  const [rows, counts] = await Promise.all([
    sql<{ id: string; answers: unknown; created_at: Date | string }>(
      `select id, answers, created_at
       from registrations
       where ($1 = '' or answers::text ilike $2 escape '\\')
       order by created_at desc
       limit $3 offset $4`,
      [pattern, pattern, PAGE_SIZE, offset],
    ),
    sql<{ count: number }>(
      `select count(*)::int as count
       from registrations
       where ($1 = '' or answers::text ilike $2 escape '\\')`,
      [pattern, pattern],
    ),
  ]);
  return {
    rows: rows.map(mapRegistration),
    total: Number(counts[0]?.count ?? 0),
    page: safePage,
    query: term,
  };
}

export async function listRegistrationsForExport(queryText: string) {
  const term = queryText.trim().slice(0, 80);
  const escaped = term.replace(/[\\%_]/g, (char) => `\\${char}`);
  const pattern = term ? `%${escaped}%` : "";
  const rows = await sql<{ id: string; answers: unknown; created_at: Date | string }>(
    `select id, answers, created_at
     from registrations
     where ($1 = '' or answers::text ilike $2 escape '\\')
     order by created_at desc
     limit 10000`,
    [pattern, pattern],
  );
  return rows.map(mapRegistration);
}

export async function deleteRegistration(id: string) {
  const rows = await sql<{ id: string }>(`delete from registrations where id = $1 returning id`, [id]);
  return rows.length > 0;
}

export async function clearRegistrations() {
  const rows = await sql<{ count: number }>(
    `with removed as (delete from registrations returning 1)
     select count(*)::int as count from removed`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function countOwners() {
  const rows = await sql<{ count: number }>(
    `select count(*)::int as count from staff where role = 'owner'`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function createOwner(name: string, email: string, password: string) {
  const parsed = parseAccount(name, email, password);
  if (parsed.error || !parsed.value) return parsed.error ?? "The owner account could not be created.";
  if ((await countOwners()) > 0) return "An owner account already exists. Sign in instead.";
  try {
    await sql(
      `insert into staff (id, name, email, password_hash, role) values ($1, $2, $3, $4, 'owner')`,
      [randomUUID(), parsed.value.name, parsed.value.email, await hashPassword(parsed.value.password)],
    );
  } catch (error) {
    if (isUniqueViolation(error)) return "An owner account already exists. Sign in instead.";
    throw error;
  }
  return null;
}

export async function verifyLogin(email: string, password: string): Promise<Staff | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await sql<{ id: string; name: string; email: string; role: string; password_hash: string }>(
    `select id, name, email, role, password_hash from staff where email = $1`,
    [normalized],
  );
  const row = rows[0];
  const match = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !match || !isRole(row.role)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function listStaff(): Promise<Staff[]> {
  const rows = await sql<{ id: string; name: string; email: string; role: string }>(
    `select id, name, email, role from staff order by created_at asc`,
  );
  return rows.flatMap((row) =>
    isRole(row.role) ? [{ id: row.id, name: row.name, email: row.email, role: row.role }] : [],
  );
}

export async function createStaff(name: string, email: string, password: string, role: Role) {
  if (role === "owner") return "The owner account is created only once.";
  const parsed = parseAccount(name, email, password);
  if (parsed.error || !parsed.value) return parsed.error ?? "That person could not be added.";
  try {
    await sql(
      `insert into staff (id, name, email, password_hash, role) values ($1, $2, $3, $4, $5)`,
      [randomUUID(), parsed.value.name, parsed.value.email, await hashPassword(parsed.value.password), role],
    );
  } catch (error) {
    if (isUniqueViolation(error)) return "That email is already used by a staff account.";
    throw error;
  }
  return null;
}

export async function deleteStaff(id: string) {
  const rows = await sql<{ id: string }>(
    `delete from staff where id = $1 and role <> 'owner' returning id`,
    [id],
  );
  return rows.length === 0 ? "That account cannot be removed." : null;
}

export function toCsv(fields: FormField[], rows: Registration[]) {
  const header = ["Registered", ...fields.map((field) => field.label)];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    const cells = [formatStamp(row.createdAt), ...fields.map((field) => displayAnswer(field, row.answers[field.id]))];
    lines.push(cells.map(csvCell).join(","));
  }
  return `\uFEFF${lines.join("\n")}\n`;
}

export function displayAnswer(field: FormField, value: string | undefined) {
  if (field.fieldType === "boolean") {
    if (value === "yes") return "Yes";
    if (value === "no") return "No";
    return "";
  }
  return value ?? "";
}

export function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

type FieldInput = {
  label: string;
  fieldType: string;
  required: boolean;
  placeholder: string;
  optionsText: string;
};

function parseFieldInput(input: FieldInput) {
  const label = cleanText(input.label, 80);
  if (!label) return { error: "Give the field a label." };
  if (!isFieldType(input.fieldType)) return { error: "Choose a field type." };
  const placeholder = cleanText(input.placeholder, 120);
  const parsedOptions = parseOptions(input.optionsText);
  if (input.fieldType === "select") {
    if (parsedOptions.error) return { error: parsedOptions.error };
    if (parsedOptions.options.length < 2) return { error: "A dropdown needs at least two options, one per line." };
  }
  return {
    error: null,
    value: {
      label,
      fieldType: input.fieldType as FieldType,
      required: input.required,
      placeholder,
      options: input.fieldType === "select" ? parsedOptions.options : [],
    },
  };
}

function parseAccount(name: string, email: string, password: string) {
  const cleanName = cleanText(name, 80);
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName) return { error: "Enter a name." };
  if (!EMAIL.test(cleanEmail) || cleanEmail.length > 200) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password.length > 200) return { error: "Use a password of 200 characters or fewer." };
  return { error: null, value: { name: cleanName, email: cleanEmail, password } };
}

function mapSettings(row: SettingsRow): EventSettings {
  return {
    eventName: row.event_name,
    eventDate: row.event_date,
    eventPlace: row.event_place,
    eventStatus: row.event_status,
    registrationClosesAt: row.registration_closes_at ? asIso(row.registration_closes_at) : null,
    bannerEyebrow: row.banner_eyebrow,
    bannerTitle: row.banner_title,
    bannerBody: row.banner_body,
    bannerButtonLabel: row.banner_button_label,
    bannerButtonUrl: row.banner_button_url,
    bannerImageUrl: row.banner_image_url,
    hasBannerImage: row.has_banner_image === true || row.has_banner_image === "t" || row.has_banner_image === "true",
    hasSiteLogo: row.has_site_logo === true || row.has_site_logo === "t" || row.has_site_logo === "true",
    socialDiscord: row.social_discord ?? "",
    socialInstagram: row.social_instagram ?? "",
    socialYoutube: row.social_youtube ?? "",
    socialFacebook: row.social_facebook ?? "",
    updatedAt: asIso(row.updated_at),
  };
}

function mapField(row: FieldRow): FormField {
  return {
    id: row.id,
    label: row.label,
    fieldType: row.field_type as FieldType,
    required: row.required === true || row.required === "t" || row.required === "true",
    placeholder: row.placeholder,
    options: asStringList(row.options),
    position: Number(row.position),
  };
}

function mapRegistration(row: { id: string; answers: unknown; created_at: Date | string }): Registration {
  return { id: row.id, answers: asRecord(row.answers), createdAt: asIso(row.created_at) };
}

function asIso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function asRecord(value: unknown): Record<string, string> {
  const source = typeof value === "string" ? parseJson(value) : value;
  if (!source || typeof source !== "object") return {};
  const answers: Record<string, string> = {};
  for (const [key, entry] of Object.entries(source)) {
    answers[key] = entry == null ? "" : String(entry);
  }
  return answers;
}

function asStringList(value: unknown) {
  const source = typeof value === "string" ? parseJson(value) : value;
  if (!Array.isArray(source)) return [];
  return source.filter((entry): entry is string => typeof entry === "string");
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function csvCell(value: string) {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${guarded.replaceAll('"', '""')}"`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function sniffImage(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function toBytes(value: unknown): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") {
    if (value.startsWith("\\x")) return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
    return null;
  }
  return null;
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
