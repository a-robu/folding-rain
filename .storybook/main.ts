import type { StorybookConfig } from "@storybook/html-vite"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: ["@storybook/addon-docs"],
    framework: {
        name: "@storybook/html-vite",
        options: {}
    },
    viteFinal: async (config, { configType }) => {
        const path = require("path")
        config.resolve = config.resolve || {}
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            "@": path.resolve(__dirname, "../src")
        }
        return config
    }
}
export default config
