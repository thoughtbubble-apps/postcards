import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), {
        name: "initial-page-css", apply: "build", enforce: "post",
        generateBundle(_options, bundle) {
            const html = bundle["index.html"];
            if (!html || html.type !== "asset") return;
            let source = String(html.source);
            source = source.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (tag, href: string) => {
                const css = bundle[href.replace(/^\.\//, "")];
                return css?.type === "asset" ? `<style>${String(css.source)}</style>` : tag;
            });
            source = source.replace('<script async type="module"', '<script async fetchpriority="low" type="module"');
            html.source = source;
        },
    }],
    resolve: {alias: [
        {find:"react-dom/test-utils",replacement:"preact/test-utils"},
        {find:"react-dom/client",replacement:"preact/compat/client"},
        {find:"react-dom",replacement:"preact/compat"},
        {find:"react/jsx-runtime",replacement:"preact/jsx-runtime"},
        {find:"react/jsx-dev-runtime",replacement:"preact/jsx-dev-runtime"},
        {find:"react",replacement:"preact/compat"},
    ]},
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
