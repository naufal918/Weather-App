import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🧭 Buat marker default manual (karena import kadang gagal di Vite)
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Map({ lat, lon, city }) {
  const position = lat && lon ? [lat, lon] : [-6.2, 106.816]; // default Jakarta

  return (
    <div className="h-72 w-full rounded-lg overflow-hidden border border-white/20 shadow-md">
      <MapContainer
        center={position}
        zoom={10}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={defaultIcon}>
          <Popup>{city || "Lokasi Anda"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
