import * as path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    base: process.env.VITE_BASE_PATH || "/",
    test: {
        setupFiles: "./src/vitest.setup.ts"
    },
    resolve: {
        alias: {
            paper: "paper/dist/paper-core",
            "@": path.resolve(__dirname, "src")
        }
    }
})
