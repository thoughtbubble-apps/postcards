import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
import manifest from "../public/manifest.json";

// The small manifest shares the application bundle instead of adding a request
// to the initial render. Absolute URLs keep installation working on previews
// and on GitHub Pages, where the application can live below a path prefix.
const appBase = new URL(import.meta.env.BASE_URL, window.location.href);
const manifestLink = document.createElement("link");
manifestLink.rel = "manifest";
manifestLink.href = `data:application/manifest+json,${encodeURIComponent(JSON.stringify({
	...manifest,
	id: appBase.href,
	start_url: appBase.href,
	scope: appBase.href,
	icons: manifest.icons.map((icon) => ({
		...icon,
		src: new URL(icon.src, appBase).href,
	})),
}))}`;
document.head.append(manifestLink);

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

createRoot(container).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
