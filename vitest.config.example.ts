import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Vitest Configuration for Vacation Planner Unit Tests
 *
 * This is an example configuration ready to use when unit tests are implemented.
 *
 * To enable:
 * 1. Install dependencies: npm install -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
 * 2. Rename this file to vitest.config.ts
 * 3. Create tests/unit/setup.ts file
 * 4. Uncomment unit test sections in .github/workflows/pull-request.yml
 */

export default defineConfig({
  plugins: [react()],
  test: {
    // Use globals like describe, it, expect without importing
    globals: true,

    // Simulate browser environment
    environment: "jsdom",

    // Setup file to run before tests
    setupFiles: "./tests/unit/setup.ts",

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "*.config.{js,ts}",
        "dist/",
        ".astro/",
        "public/",
        "src/env.d.ts",
        "src/types.ts", // Type definitions
        "**/*.d.ts",
        "supabase/",
      ],
      // Coverage thresholds
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // Include patterns
    include: ["tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".astro", "**/*.example.{test,spec}.{js,ts,jsx,tsx}"],

    // Test timeout
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@db": resolve(__dirname, "./src/db"),
    },
  },
});
