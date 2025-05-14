import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: "./src/vitest.setup.ts",
  },
  resolve: {
    alias: {
      paper: "paper/dist/paper-core",
    }
  }
});
