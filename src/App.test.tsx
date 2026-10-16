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

test("renders PostcardPop app", () => {
	const { getByTestId } = render(<App />);
	const appElement = getByTestId("home");
	expect(appElement).toBeInTheDocument();
});

beforeEach(()=>{localStorage.clear();vi.clearAllMocks();mockGeolocation.getCurrentPosition.mockReset()});
afterEach(cleanup);
test("location is requested only by the explicit location action",()=>{
 localStorage.setItem("pc:seenTutorial","true");render(<App/>);
 expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button",{name:"Click to flip postcard"}));
 fireEvent.click(screen.getByRole("button",{name:"Use my location"}));
 expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
});
test("tutorial progress has a name and the current step",()=>{
 render(<App/>);const progress=screen.getByRole("progressbar",{name:"Tutorial progress"});
 expect(progress).toHaveAttribute("aria-valuemin","1");expect(progress).toHaveAttribute("aria-valuemax","3");expect(progress).toHaveAttribute("aria-valuenow","1");
 fireEvent.click(screen.getByRole("button",{name:"Next →"}));expect(progress).toHaveAttribute("aria-valuenow","2");
});
test("custom photo URLs retain their source without default-image variants",()=>{
 localStorage.setItem("pc:seenTutorial","true");render(<App/>);
 fireEvent.change(screen.getByRole("textbox",{name:"Postcard image URL"}),{target:{value:"https://example.com/fixture.png"}});
 expect(screen.getByAltText("Postcard front")).toHaveAttribute("src","https://example.com/fixture.png");expect(screen.getByAltText("Postcard front")).not.toHaveAttribute("srcset");
});

test("postcard front reserves its layout dimensions and decodes asynchronously",()=>{
 render(<App/>);const image=screen.getByAltText("Postcard front");
 expect(image).toHaveAttribute("width","840");expect(image).toHaveAttribute("height","530");expect(image).toHaveAttribute("decoding","async");
});

test("keyboard activates the postcard with Enter and Space",async()=>{
 localStorage.setItem("pc:seenTutorial","true");render(<App/>);
 const card=screen.getByRole("button",{name:"Click to flip postcard"});
 fireEvent.keyDown(card,{key:"Enter"});
 expect(await screen.findByRole("textbox",{name:"Your message"})).toBeInTheDocument();
 fireEvent.keyDown(card,{key:" "});
 fireEvent.keyUp(card,{key:" "});
 expect(await screen.findByRole("textbox",{name:"Postcard image URL"})).toBeInTheDocument();
});

test("Enter in a postcard input does not activate the card",()=>{
 localStorage.setItem("pc:seenTutorial","true");render(<App/>);
 fireEvent.keyDown(screen.getByRole("textbox",{name:"Postcard image URL"}),{key:"Enter"});
 expect(screen.queryByRole("textbox",{name:"Your message"})).not.toBeInTheDocument();
});

test("denied location leaves manual city input available",()=>{
 localStorage.setItem("pc:seenTutorial","true");mockGeolocation.getCurrentPosition.mockImplementation((_success,error)=>error({code:1}));render(<App/>);
 fireEvent.click(screen.getByRole("button",{name:"Click to flip postcard"}));fireEvent.click(screen.getByRole("button",{name:"Use my location"}));
 expect(screen.getByText("Could not access your location. Enter a city instead.")).toHaveAttribute("role","status");expect(screen.getByRole("textbox",{name:"Location"})).toBeEnabled();
});
