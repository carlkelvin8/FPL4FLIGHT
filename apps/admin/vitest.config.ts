import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@pilotforms/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
