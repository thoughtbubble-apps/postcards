import type { LatLngTuple } from "leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ position }: { position: LatLngTuple }) {
	const map = useMap();
	useEffect(() => {
		map.setView(position, 9);
	}, [map, position]);

	useEffect(() => {
		const invalidate = () => {
			// Tiles can mis-render after viewport size or orientation change.
			setTimeout(() => map.invalidateSize(), 150);
		};
		window.addEventListener("resize", invalidate);
		window.addEventListener("orientationchange", invalidate);
		return () => {
			window.removeEventListener("resize", invalidate);
			window.removeEventListener("orientationchange", invalidate);
		};
	}, [map]);
	return null;
}

export default function StampMap({ position }: { position: LatLngTuple }) {
	return (
		<MapContainer
			className="stamp-map"
			center={position}
			zoom={9}
			zoomControl={false}
			scrollWheelZoom={false}
		>
			<MapUpdater position={position} />
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
			/>
		</MapContainer>
	);
}
