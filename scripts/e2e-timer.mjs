import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const OUT = "/opt/cursor/artifacts";

function bdLocal(offsetMs) {
  const d = new Date(Date.now() + offsetMs);
  // Format as Asia/Dhaka local for datetime-local
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await desktop.goto(BASE, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(2200); // boot speed sweep
  await desktop.screenshot({ path: `${OUT}/public_desktop_hero.png`, fullPage: false });
  await desktop.screenshot({ path: `${OUT}/public_desktop_full.png`, fullPage: true });
  const desktopText = await desktop.locator("body").innerText();
  results.push({
    check: "desktop_public",
    hasHero: /Evening Register|Green flag|Race HUD/i.test(desktopText),
    hasForm: /Tell the host|Guest console|Register/i.test(desktopText),
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(BASE, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(2200);
  await mobile.screenshot({ path: `${OUT}/public_mobile_hero.png`, fullPage: false });
  await mobile.screenshot({ path: `${OUT}/public_mobile_full.png`, fullPage: true });
  const mobileText = await mobile.locator("body").innerText();
  results.push({
    check: "mobile_public",
    hasHero: /Evening Register|Green flag|Race HUD/i.test(mobileText),
    hasForm: /Tell the host|Guest console|Register/i.test(mobileText),
  });

  // Admin setup / Form / timer
  const admin = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await admin.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const setupEmail = admin.locator("#setup-email");
  const loginEmail = admin.locator("#login-email");
  if (await setupEmail.count()) {
    await admin.fill("#setup-name", "Amina Rahman");
    await admin.fill("#setup-email", "owner@example.com");
    await admin.fill("#setup-password", "night-drive");
    await admin.getByRole("button", { name: /Create owner/i }).click();
    await admin.waitForURL(/\/admin/, { timeout: 15000 });
  } else if (await loginEmail.count()) {
    await admin.fill("#login-email", "owner@example.com");
    await admin.fill("#login-password", "night-drive");
    await admin.getByRole("button", { name: /Enter the panel/i }).click();
    await admin.waitForTimeout(1500);
    if (admin.url().includes("/admin") && (await admin.locator("#login-email").count())) {
      // wrong password / no account — create via setup if redirected somehow failed
      throw new Error("Could not sign in as owner@example.com");
    }
  }

  await admin.goto(`${BASE}/admin/fields`, { waitUntil: "networkidle" });
  await admin.waitForSelector("#closes-at", { timeout: 10000 });
  await admin.fill("#event-name", "Dhaka Night Circuit");
  await admin.fill("#event-status", "Registration open");
  await admin.fill("#event-date", "Tonight");
  await admin.fill("#event-place", "Bashundhara");
  const future = bdLocal(3 * 60 * 1000);
  await admin.fill("#closes-at", future);
  await admin.getByRole("button", { name: /Save event and timer/i }).click();
  await admin.waitForSelector("text=Event saved", { timeout: 10000 }).catch(() => null);
  await admin.waitForTimeout(800);
  await admin.screenshot({ path: `${OUT}/admin_form_timer.png`, fullPage: true });
  const formText = await admin.locator("body").innerText();
  results.push({
    check: "admin_form",
    hasEventSetup: /Event and timer|Bangladesh/i.test(formText),
    hasFields: /Fields guests fill|Name|Phone|Email/i.test(formText),
    hasTimerInput: (await admin.locator("#closes-at").count()) === 1,
  });

  await desktop.goto(BASE, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1500);
  const openText = await desktop.locator("body").innerText();
  const hasCountdown = /Closes in Bangladesh time/i.test(openText);
  await desktop.screenshot({ path: `${OUT}/public_countdown.png`, fullPage: true });
  results.push({ check: "public_countdown", hasCountdown, openTextSnippet: openText.slice(0, 400) });

  // Close immediately with past timer
  await admin.goto(`${BASE}/admin/fields`, { waitUntil: "networkidle" });
  await admin.fill("#closes-at", bdLocal(-2 * 60 * 1000));
  await admin.getByRole("button", { name: /Save event and timer/i }).click();
  await admin.waitForTimeout(1000);

  await desktop.goto(BASE, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1500);
  const closedText = await desktop.locator("body").innerText();
  const isClosed = /Registration is off|Closed/i.test(closedText);
  await desktop.screenshot({ path: `${OUT}/public_closed.png`, fullPage: true });
  results.push({ check: "auto_close", isClosed, closedSnippet: closedText.slice(0, 400) });

  // Quick overlap heuristics: form section should be below hero (y position)
  await desktop.goto(BASE, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(500);
  // reopen by clearing timer for future checks optional — skip

  console.log(JSON.stringify({ ok: true, results }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
