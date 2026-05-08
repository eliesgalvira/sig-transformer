import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const sourceDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": sourceDir,
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
