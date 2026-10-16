import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	base: "./",
	build: {
		outDir: "build",
	},
	test: {
        include: ["src/**/*.test.{ts,tsx}"],
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/setupTests.ts",
		css: true,
	},
});
