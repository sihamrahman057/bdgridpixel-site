import assert from "node:assert/strict";
import {
  clearBannerImage,
  clearRegistrations,
  createField,
  createOwner,
  createStaff,
  deleteField,
  deleteRegistration,
  getBannerImage,
  getSettings,
  listFields,
  registerGuest,
  searchRegistrations,
  setBannerImage,
  updateHero,
  verifyLogin,
} from "../src/lib/event-store";
import { resetRateLimit, takeToken } from "../src/lib/rate-limit";
import { canClearRegistrations, canDeleteRegistration, canEditContent } from "../src/lib/types";
import { safeHref } from "../src/lib/validation";

const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

async function main() {
  resetRateLimit();
  const settings = await getSettings();
  assert.equal(settings.eventName, "Evening Register");
  const fields = await listFields();
  assert.equal(fields.length, 3);

  assert.equal(await createOwner("Amina Rahman", "owner@example.com", "short"), "Use a password of at least 8 characters.");
  assert.equal(await createOwner("Amina Rahman", "owner@example.com", "night-drive"), null);
  assert.match(String(await createOwner("Other", "other@example.com", "night-drive")), /already exists/);

  const owner = await verifyLogin("owner@example.com", "night-drive");
  assert.equal(owner?.role, "owner");
  assert.equal(await verifyLogin("owner@example.com", "wrong-password"), null);

  assert.equal(await createStaff("Mina", "mina@example.com", "manager-pass", "manager"), null);
  assert.equal(await createStaff("Adil", "adil@example.com", "assistant-pass", "assistant"), null);
  const manager = await verifyLogin("mina@example.com", "manager-pass");
  const assistant = await verifyLogin("adil@example.com", "assistant-pass");
  assert.equal(canEditContent(manager!.role), true);
  assert.equal(canDeleteRegistration(assistant!.role), false);
  assert.equal(canClearRegistrations(assistant!.role), false);
  assert.equal(canClearRegistrations(owner!.role), true);

  assert.equal(await updateHero({
    eventName: "After Dark",
    eventDate: "Saturday",
    eventPlace: "The Conservatory",
    eventStatus: "Registration open",
  }), null);
  assert.equal((await getSettings()).eventName, "After Dark");

  assert.equal(await createField({
    label: "Seat",
    fieldType: "select",
    required: true,
    placeholder: "Choose",
    optionsText: "Floor",
  }), "A dropdown needs at least two options, one per line.");
  assert.equal(await createField({
    label: "Seat",
    fieldType: "select",
    required: true,
    placeholder: "Choose",
    optionsText: "Floor\nBalcony",
  }), null);

  const name = fields.find((field) => field.id === "fld_name");
  const phone = fields.find((field) => field.id === "fld_phone");
  const email = fields.find((field) => field.id === "fld_email");
  assert.ok(name && phone && email);

  const invalid = await registerGuest({
    [name.id]: "",
    [phone.id]: "12",
    [email.id]: "not-an-email",
  }, "smoke");
  assert.equal(invalid.ok, false);

  const seat = (await listFields()).find((field) => field.label === "Seat");
  assert.ok(seat);
  const saved = await registerGuest({
    [name.id]: "Leila Hasan",
    [phone.id]: "+880 1712 000000",
    [email.id]: "Leila@gmail.com",
    [seat.id]: "Balcony",
  }, "smoke");
  assert.equal(saved.ok, true);
  if (saved.ok) assert.equal(saved.name, "Leila Hasan");

  const found = await searchRegistrations("leila@gmail.com", 1);
  assert.equal(found.total, 1);
  assert.equal(found.rows[0]?.answers[email.id], "leila@gmail.com");

  assert.equal(await deleteRegistration(found.rows[0]!.id), true);
  assert.equal((await searchRegistrations("", 1)).total, 0);

  const again = await registerGuest({
    [name.id]: "Noah",
    [phone.id]: "01700000000",
    [email.id]: "noah@gmail.com",
    [seat.id]: "Floor",
  }, "smoke-2");
  assert.equal(again.ok, true);
  assert.equal(await clearRegistrations(), 1);

  assert.equal(await setBannerImage(png, "image/png"), null);
  const image = await getBannerImage();
  assert.equal(image?.type, "image/png");
  assert.ok(image && image.bytes[0] === 0x89);
  await clearBannerImage();
  assert.equal(await getBannerImage(), null);
  assert.equal((await getSettings()).hasBannerImage, false);

  const current = await listFields();
  for (const field of current.slice(1)) {
    assert.equal(await deleteField(field.id), null);
  }
  assert.match(String(await deleteField(current[0]!.id)), /at least one/);

  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("#register"), "#register");
  assert.equal(takeToken("burst", 2, 1000), true);
  assert.equal(takeToken("burst", 2, 1000), true);
  assert.equal(takeToken("burst", 2, 1000), false);

  console.log("smoke: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
