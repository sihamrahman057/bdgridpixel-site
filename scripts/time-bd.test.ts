import assert from "node:assert/strict";
import {
  formatBangladeshStamp,
  isRegistrationOpen,
  parseBangladeshLocal,
  remainingMs,
  toBangladeshLocalInput,
} from "../src/lib/time-bd";

const noonBd = parseBangladeshLocal("2026-11-15T12:00");
assert.ok(noonBd);
assert.equal(noonBd.toISOString(), "2026-11-15T06:00:00.000Z");
assert.equal(toBangladeshLocalInput(noonBd), "2026-11-15T12:00");
assert.equal(formatBangladeshStamp(noonBd), "15 Nov 2026, 12:00 BST");

assert.equal(isRegistrationOpen(null, "Registration open"), true);
assert.equal(isRegistrationOpen(null, "Closed"), false);
assert.equal(isRegistrationOpen("2026-11-15T05:00:00.000Z", "Registration open", new Date("2026-11-15T06:00:00.000Z")), false);
assert.equal(isRegistrationOpen("2026-11-15T07:00:00.000Z", "Registration open", new Date("2026-11-15T06:00:00.000Z")), true);
assert.ok((remainingMs("2026-11-15T07:00:00.000Z", new Date("2026-11-15T06:00:00.000Z")) ?? 0) > 0);
assert.equal(remainingMs("2026-11-15T05:00:00.000Z", new Date("2026-11-15T06:00:00.000Z")), -3_600_000);

console.log("time-bd: ok");
