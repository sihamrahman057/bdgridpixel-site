const Module = require("node:module");
const original = Module.prototype.require;
Module.prototype.require = function requireStub(id) {
  if (id === "server-only") return {};
  return original.apply(this, arguments);
};
