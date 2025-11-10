import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Map({ lat, lon, city }) {
  const position = lat && lon ? [lat, lon] : [-6.2, 106.816];
  return (
    <div className="h-72 w-full rounded-lg overflow-hidden border border-white/20">
      <MapContainer center={position} zoom={10} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>{city || "Current Location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
