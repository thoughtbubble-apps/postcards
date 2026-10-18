import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), {
		name: "initial-page-assets",
		apply: "build",
		enforce: "post",
		generateBundle(_options, bundle) {
			const html = bundle["index.html"];
			if (!html || html.type !== "asset") return;
			let source = String(html.source);
			// Inline the small initial stylesheet to avoid a render-blocking trip.
			source = source.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (tag, href: string) => {
				const css = bundle[href.replace(/^\.\//, "")];
				return css?.type === "asset" ? `<style>${String(css.source)}</style>` : tag;
			});
			// Vite preserves async but strips the source script's fetchpriority.
			// Keep it low so it does not compete with the preloaded postcard.
			source = source.replace('<script async type="module"', '<script async fetchpriority="low" type="module"');
			html.source = source;
		},
	}],
	base: "./",
	// Keep the React component API with a smaller browser runtime.
	resolve: {
		alias: [
			{ find: "react-dom/test-utils", replacement: "preact/test-utils" },
			{ find: "react-dom/client", replacement: "preact/compat/client" },
			{ find: "react-dom", replacement: "preact/compat" },
			{ find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
			{ find: "react/jsx-dev-runtime", replacement: "preact/jsx-dev-runtime" },
			{ find: "react", replacement: "preact/compat" },
		],
	},
	build: {
		outDir: "build",
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/setupTests.ts",
		css: true,
	},
});
