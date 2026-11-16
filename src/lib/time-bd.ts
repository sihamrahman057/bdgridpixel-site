/** Bangladesh Standard Time is permanently UTC+6 (no daylight saving). */
export const BD_TIME_ZONE = "Asia/Dhaka";
export const BD_OFFSET = "+06:00";

const LOCAL_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseBangladeshLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!LOCAL_INPUT.test(trimmed)) return null;
  const date = new Date(`${trimmed}:00${BD_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toBangladeshLocalInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function bangladeshParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"),
  };
}

export function formatBangladeshStamp(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const { year, month, day, hour, minute } = bangladeshParts(date);
  const monthName = MONTHS[month - 1] ?? String(month);
  return `${day} ${monthName} ${year}, ${hour}:${minute} BST`;
}

export function isRegistrationOpen(closesAt: string | null, statusText: string, now = new Date()) {
  if (closesAt) {
    const end = new Date(closesAt);
    if (!Number.isNaN(end.getTime()) && now.getTime() >= end.getTime()) return false;
  }
  return statusText.toLowerCase().includes("open");
}

export function remainingMs(closesAt: string | null, now = new Date()) {
  if (!closesAt) return null;
  const end = new Date(closesAt);
  if (Number.isNaN(end.getTime())) return null;
  return end.getTime() - now.getTime();
}
