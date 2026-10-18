import type { LatLngTuple } from "leaflet";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
const StampMap = lazy(() => import("./StampMap"));

import "./App.css";

interface URLData {
	frontImage: string;
	latitude: number;
	longitude: number;
	message: string;
	to: string;
	address: string;
	sender: string;
	isDefaultCard: boolean;
}

const defaultImage = new URL(`${import.meta.env.BASE_URL}images/alps-840.avif`, window.location.href).href;
const defaultImageVariants = [400, 700, 840, 1680].map(
	(width) => `${new URL(`${import.meta.env.BASE_URL}images/alps-${width}.avif`, window.location.href).href} ${width}w`,
).join(", ");

// Geocoding function using Nominatim
async function geocodeAddress(
	address: string,
): Promise<{ lat: number; lon: number } | null> {
	if (!address.trim()) return null;

	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
		);
		const data = await response.json();

		if (data && data.length > 0) {
			return {
				lat: parseFloat(data[0].lat),
				lon: parseFloat(data[0].lon),
			};
		}
	} catch (error) {
		console.error("Geocoding error:", error);
	}
	return null;
}

function useTheme() {
	const [theme, setTheme] = useState<"light" | "dark">(() => {
		const stored = localStorage.getItem("pc:theme");
		if (stored === "light" || stored === "dark") return stored;
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	});

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("pc:theme", theme);
	}, [theme]);

	const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

	return { theme, toggleTheme };
}

function App() {
	const { theme, toggleTheme } = useTheme();

	const urlParams = new URLSearchParams(window.location.search);
	const urlDataString = atob(urlParams.get("card") || "");

	const messagePlaceholder = "Write your message here...";
	const defaultUrlData: URLData = {
		frontImage: defaultImage,
		latitude: 42.3528,
		longitude: -83.1421,
		message: "",
		to: "",
		address: "",
		sender: "",
		isDefaultCard: true,
	};

	const [flip, setFlip] = useState(false);
	const [copied, setCopied] = useState(false);
	const [isGeocoding, setIsGeocoding] = useState(false);
	const [locationError, setLocationError] = useState("");
	const [flipHintHidden, setFlipHintHidden] = useState(false);

	const [state, setState] = useState(defaultUrlData);

	useEffect(() => {
		if (!urlDataString) return;
		try {
			const urlData: URLData = JSON.parse(urlDataString);
			setState({ ...urlData, isDefaultCard: false });
		} catch (e) {
			console.log("could not parse data", e);
		}
	}, [urlDataString]);

	const useMyLocation = () => {
		setLocationError("");
		if (!navigator.geolocation) {
			setLocationError("Location is unavailable. Enter a city instead.");
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setState((s) => ({
					...s,
					longitude: position.coords.longitude,
					latitude: position.coords.latitude,
				}));
			},
			() =>
				setLocationError(
					"Could not access your location. Enter a city instead.",
				),
		);
	};

	const alreadySeenTutorial =
		localStorage.getItem("pc:seenTutorial") === "true";

	const alreadySeenFlipHint =
		localStorage.getItem("pc:seenFlipHint") === "true";

	const [tutorialOpen, setTutorialOpen] = useState(
		state.isDefaultCard && !alreadySeenTutorial,
	);

	const [flipHintOpen, setFlipHintOpen] = useState(
		!state.isDefaultCard && !alreadySeenFlipHint,
	);

	const showTutorial = (shouldShow: boolean) => {
		setTutorialOpen(shouldShow);
		localStorage.setItem("pc:seenTutorial", !shouldShow ? "true" : "false");
	};

	const handleFlip = () => {
		setFlip(!flip);
		if (!flipHintHidden) {
			setFlipHintHidden(true);
			localStorage.setItem("pc:seenFlipHint", "true");
		}
	};

	const position: LatLngTuple = [state.latitude, state.longitude];
	const steps = [
		{
			content:
				"Welcome to PostcardPop! Pick a front image, then tap the card to flip it over.",
			// flip to back so the next step's content matches what's visible
			action: () => {
				setFlip(true);
			},
		},
		{
			content:
				"On the back, write your message and add a location, recipient, and your name.",
			// flip back to front for the final step
			action: () => {
				setFlip(false);
			},
		},
		{
			content:
				"When you're done, copy the share link and send it to someone special!",
			action: () => {
				setFlip(false);
			},
		},
	];

	const [currentStep, setCurrentStep] = useState(0);

	const linkTextRef = useRef<HTMLInputElement>(null);
	const imageTextRef = useRef<HTMLInputElement>(null);

	const cardData = btoa(JSON.stringify(state));

	const handleNextStep = () => {
		if (currentStep < steps.length - 1) {
			steps[currentStep].action?.();
			setCurrentStep(currentStep + 1);
		} else {
			showTutorial(false);
			setCurrentStep(0);
		}
	};

	const handlePrevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleCloseTutorial = () => {
		showTutorial(false);
		setCurrentStep(0);
	};

	const handleCloseFlipHint = () => {
		setFlipHintOpen(false);
		localStorage.setItem("pc:seenFlipHint", "true");
	};

	const handleCopyLink = () => {
		if (linkTextRef.current) {
			linkTextRef.current.select();
			navigator.clipboard.writeText(linkTextRef.current.value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	// Handle address input with geocoding
	const handleAddressChange = async (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Enter") {
			const address = e.currentTarget.value;
			if (address.trim()) {
				setIsGeocoding(true);
				const result = await geocodeAddress(address);
				if (result) {
					setState((s) => ({
						...s,
						latitude: result.lat,
						longitude: result.lon,
					}));
				}
				setIsGeocoding(false);
			}
		}
	};

	return (
		<div className="App" data-testid="home">
			{tutorialOpen && (
				<div
					className="tutorial-overlay"
					onClick={handleCloseTutorial}
					role="dialog"
					aria-modal="true"
					aria-label="Tutorial"
				>
					<div
						className="tutorial-content"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="tutorial-close"
							onClick={handleCloseTutorial}
							aria-label="Close tutorial"
						>
							×
						</button>

						<div className="tutorial-step">
							<div className="tutorial-step-number">{currentStep + 1}</div>
							<span className="tutorial-step-label">
								Step {currentStep + 1} of {steps.length}
							</span>
						</div>

						<div className="tutorial-text">{steps[currentStep].content}</div>

						<div className="tutorial-buttons">
							{currentStep > 0 ? (
								<button
									className="tutorial-btn tutorial-btn-prev"
									onClick={handlePrevStep}
								>
									← Back
								</button>
							) : (
								<div />
							)}

							{currentStep < steps.length - 1 ? (
								<button
									className="tutorial-btn tutorial-btn-next"
									onClick={handleNextStep}
								>
									Next →
								</button>
							) : (
								<button
									className="tutorial-btn tutorial-btn-done"
									onClick={handleCloseTutorial}
								>
									Get Started ✨
								</button>
							)}
						</div>

						<div
							className="tutorial-progress"
							role="progressbar"
							aria-label="Tutorial progress"
							aria-valuemin={1}
							aria-valuemax={steps.length}
							aria-valuenow={currentStep + 1}
						>
							{steps.map((_, idx) => (
								<div
									key={idx}
									className={`tutorial-progress-dot ${idx <= currentStep ? "active" : ""}`}
								/>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Simple flip hint for received postcards */}
			{flipHintOpen && (
				<div
					className="tutorial-overlay"
					onClick={handleCloseFlipHint}
					role="dialog"
					aria-modal="true"
					aria-label="Flip hint"
				>
					<div
						className="tutorial-content flip-hint-content"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="tutorial-close"
							onClick={handleCloseFlipHint}
							aria-label="Close hint"
						>
							×
						</button>

						<div className="flip-hint-icon-large">🎴</div>

						<div
							className="tutorial-text"
							style={{ textAlign: "center", fontSize: "1.2rem" }}
						>
							<strong>You've received a postcard!</strong>
							<br />
							<br />
							Click the card to flip it over and read the message.
						</div>

						<div
							className="tutorial-buttons"
							style={{ justifyContent: "center" }}
						>
							<button
								className="tutorial-btn tutorial-btn-done"
								onClick={handleCloseFlipHint}
							>
								Got it! 👍
							</button>
						</div>
					</div>
				</div>
			)}

			<button
				className="theme-toggle"
				onClick={toggleTheme}
				aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
				title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
			>
				{theme === "light" ? "🌙" : "☀️"}
			</button>

			<div className="post-card-container">
				<div
					className="flip-card"
					onClick={handleFlip}
					onKeyDown={(e) => {
						if (
							e.target === e.currentTarget &&
							(e.key === "Enter" || e.key === " ")
						) {
							e.preventDefault();
							handleFlip();
						}
					}}
					role="button"
					aria-label="Click to flip postcard"
					tabIndex={0}
				>
					<div
						className={`flip-card-inner ${flip ? "flip-card-toggle-on" : "flip-card-toggle-off"}`}
					>
						{/* Front Side */}
						<div className="flip-card-front">
							<figure className="front-image-container">
								<img
									className="front-img"
									src={state.frontImage}
									srcSet={
										state.frontImage === defaultImage
											? defaultImageVariants
											: undefined
									}
									sizes="(min-width: 900px) 840px, calc(100vw - 18px)"
									fetchPriority="high"
									alt="Postcard front"
								/>
								{state.isDefaultCard && !flip && (
									<>
										<input
											type="text"
											className="front-image-input"
											value={state.frontImage}
											ref={imageTextRef}
											placeholder="Paste image URL here..."
											onChange={(e) => {
												setState({ ...state, frontImage: e.target.value });
											}}
											onClick={(e) => {
												e.stopPropagation();
											}}
											aria-label="Postcard image URL"
										/>
										<div className="image-hint">💡 Tap to edit image URL</div>
									</>
								)}
							</figure>
						</div>

						{/* Back Side */}
						<div className="flip-card-back">
							{flip && (
								<div className="back-content">
									{/* Left Section - Message */}
									<div className="left-section">
										<div className="message-area">
											<label className="message-label">Message</label>
											{state.isDefaultCard ? (
												<textarea
													className="message-textarea"
													placeholder={messagePlaceholder}
													value={state.message}
													onChange={(e) => {
														setState({ ...state, message: e.target.value });
													}}
													onClick={(e) => {
														e.stopPropagation();
													}}
													aria-label="Your message"
												/>
											) : (
												<div className="message-display">
													{state.message || "No message written"}
												</div>
											)}
										</div>
									</div>

									<div className="divider" />

									{/* Right Section - Stamp & Address */}
									<div className="right-section">
										<div className="stamp-section">
											<div
												className="stamp-container"
												onClick={(e: React.MouseEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												<div className="stamp-border" />
												<Suspense
													fallback={
														<div className="stamp-map" role="status">
															Loading map…
														</div>
													}
												>
													<StampMap position={position} />
												</Suspense>
												{isGeocoding && (
													<div className="stamp-loading">
														<div className="loading-spinner" />
													</div>
												)}
											</div>
										</div>

										<div className="address-section">
											{state.isDefaultCard && (
												<span className="address-label">Address</span>
											)}
											{state.isDefaultCard ? (
												<input
													type="text"
													className="address-input"
													placeholder="To: Recipient name"
													value={state.to}
													onChange={(e) => {
														setState({ ...state, to: e.target.value });
													}}
													onClick={(e) => {
														e.stopPropagation();
													}}
													aria-label="Recipient name"
												/>
											) : (
												<div className="address-display">
													{state.to && `To: ${state.to}`}
												</div>
											)}

											{state.isDefaultCard ? (
												<div className="location-input-wrapper">
													<input
														type="text"
														className="address-input"
														placeholder="Location (type city & press Enter)"
														value={state.address}
														onChange={(e) => {
															setState({
																...state,
																address: e.target.value,
															});
														}}
														onKeyDown={handleAddressChange}
														onClick={(e) => {
															e.stopPropagation();
														}}
														aria-label="Location"
													/>
													<span className="location-hint">↵</span>
													<button
														type="button"
														className="location-button"
														onClick={(e) => {
															e.stopPropagation();
															useMyLocation();
														}}
													>
														Use my location
													</button>
													{locationError && (
														<span role="status">{locationError}</span>
													)}
												</div>
											) : (
												<div className="address-display">{state.address}</div>
											)}

											{state.isDefaultCard ? (
												<input
													type="text"
													className="address-input"
													placeholder="From: Your name"
													value={state.sender}
													onChange={(e) => {
														setState({
															...state,
															sender: e.target.value,
														});
													}}
													onClick={(e) => {
														e.stopPropagation();
													}}
													aria-label="Sender name"
												/>
											) : (
												<div className="address-display">
													{state.sender && `From: ${state.sender}`}
												</div>
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className={`flip-hint ${flipHintHidden ? "hidden" : ""}`}>
					Tap card to flip
				</div>
			</div>

			<div className="actions">
				<div className="action-row">
					{!state.isDefaultCard ? (
						<a className="btn btn-primary" href="./">
							✨ Create Your Own
						</a>
					) : (
						<button
							className="btn btn-secondary"
							onClick={() => showTutorial(true)}
						>
							❓ Show Tutorial
						</button>
					)}
				</div>

				{state.isDefaultCard && (
					<div className="share-section">
						<label className="share-label">Share your postcard</label>
						<div className="share-input-wrapper">
							<input
								type="text"
								className="share-input"
								ref={linkTextRef}
								value={`${window.location.origin}${window.location.pathname}?card=${cardData}`}
								readOnly
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								aria-label="Share link"
							/>
							<button
								className={`btn-copy ${copied ? "copied" : ""}`}
								onClick={handleCopyLink}
								aria-label={copied ? "Link copied" : "Copy link"}
							>
								{copied ? "✓ Copied!" : "📋 Copy Link"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
