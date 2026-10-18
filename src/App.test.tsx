import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, beforeEach, vi } from "vitest";
import App from "./App";

// Mock react-leaflet since it uses ES modules
vi.mock("react-leaflet", () => ({
	MapContainer: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="map-container">{children}</div>
	),
	TileLayer: () => <div data-testid="tile-layer" />,
	useMap: () => ({
		setView: vi.fn(),
		invalidateSize: vi.fn(),
	}),
}));

// Mock matchMedia for theme detection
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock geolocation
const mockGeolocation = {
	getCurrentPosition: vi.fn(),
};
Object.defineProperty(globalThis, "navigator", {
	value: { geolocation: mockGeolocation },
	writable: true,
});

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
	mockGeolocation.getCurrentPosition.mockReset();
});
afterEach(cleanup);

test("renders PostcardPop app", () => {
	const { getByTestId } = render(<App />);
	const appElement = getByTestId("home");
	expect(appElement).toBeInTheDocument();
});

test("does not request location permission on load", () => {
	render(<App />);
	expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
});

test("names tutorial progress and advances its current value", () => {
	render(<App />);
	const progress = screen.getByRole("progressbar", {
		name: "Tutorial progress",
	});
	expect(progress).toHaveAttribute("aria-valuemin", "1");
	expect(progress).toHaveAttribute("aria-valuemax", "3");
	expect(progress).toHaveAttribute("aria-valuenow", "1");
	fireEvent.click(screen.getByRole("button", { name: "Next →" }));
	expect(progress).toHaveAttribute("aria-valuenow", "2");
});

test("keyboard flip exposes the map and explicit location control", async () => {
	localStorage.setItem("pc:seenTutorial", "true");
	render(<App />);
	fireEvent.keyDown(
		screen.getByRole("button", { name: "Click to flip postcard" }),
		{ key: "Enter" },
	);
	expect(await screen.findByTestId("map-container")).toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
	expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
	expect(
		screen.getByRole("textbox", { name: "Your message" }),
	).toBeInTheDocument();
});

test("typing Enter in an input does not flip the card", () => {
	localStorage.setItem("pc:seenTutorial", "true");
	render(<App />);
	fireEvent.keyDown(
		screen.getByRole("textbox", { name: "Postcard image URL" }),
		{ key: "Enter" },
	);
	expect(
		screen.queryByRole("textbox", { name: "Your message" }),
	).not.toBeInTheDocument();
});

test("keeps a custom photo URL intact without applying default-photo variants", () => {
	localStorage.setItem("pc:seenTutorial", "true");
	render(<App />);
	const url = "https://example.com/my-photo.png";
	fireEvent.change(
		screen.getByRole("textbox", { name: "Postcard image URL" }),
		{ target: { value: url } },
	);
	expect(screen.getByAltText("Postcard front")).toHaveAttribute("src", url);
	expect(screen.getByAltText("Postcard front")).not.toHaveAttribute("srcset");
});

test("location denial leaves manual city entry available", () => {
	localStorage.setItem("pc:seenTutorial", "true");
	mockGeolocation.getCurrentPosition.mockImplementation((_success, error) =>
		error({ code: 1 }),
	);
	render(<App />);
	fireEvent.keyDown(
		screen.getByRole("button", { name: "Click to flip postcard" }),
		{ key: " " },
	);
	fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
	expect(screen.getByRole("status")).toHaveTextContent("Enter a city instead");
	expect(screen.getByRole("textbox", { name: "Location" })).toBeEnabled();
});
