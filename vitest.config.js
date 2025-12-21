import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/standards_audit/**/*.test.js"],
    environment: "node",
    reporters: "basic"
  }
});
