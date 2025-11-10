import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RadarMap({ lat, lon }) {
  const mapRef = useRef(null);
  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  // 🔁 Ambil data radar dari RainViewer API
  useEffect(() => {
    if (!lat || !lon) return;

    // Buat map
    mapRef.current = L.map("radarMap", {
      center: [lat, lon],
      zoom: 6,
      zoomControl: true,
    });

    // Tambahkan peta dasar
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    // Ambil data RainViewer
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((res) => res.json())
      .then((data) => {
        const allFrames = [...data.radar.past, data.radar.nowcast].flat();
        setFrames(allFrames);
      })
      .catch((err) => console.error("❌ Gagal ambil radar:", err));

    return () => {
      mapRef.current?.remove();
      clearInterval(intervalRef.current);
    };
  }, [lat, lon]);

  // 🔄 Ganti layer tiap frame
  useEffect(() => {
    if (!frames.length || !mapRef.current) return;

    let layer = null;
    const showFrame = (index) => {
      if (layer) mapRef.current.removeLayer(layer);
      const frame = frames[index];
      layer = L.tileLayer(
        `https://tilecache.rainviewer.com/v2/radar/${frame.path}/256/{z}/{x}/{y}/1/1_1.png`,
        { tileSize: 256, opacity: 0.6, zIndex: 10 }
      ).addTo(mapRef.current);
    };

    showFrame(currentFrame);

    return () => {
      if (layer) mapRef.current.removeLayer(layer);
    };
  }, [frames, currentFrame]);

  // ▶️ Play / Pause animasi
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, 700); // 700ms per frame
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, frames]);

  return (
    <div className="relative">
      <div
        id="radarMap"
        className="w-full h-[400px] rounded-2xl border border-white/30 shadow-lg"
      ></div>

      {/* Tombol kontrol animasi */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-lg rounded-full px-4 py-2 flex items-center gap-3 shadow-lg border border-white/30">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-sky-500 hover:bg-sky-600 px-3 py-1 rounded-full font-semibold text-white shadow-md"
        >
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>
        <span className="text-sm text-white/90">
          Frame: {currentFrame + 1} / {frames.length}
        </span>
      </div>
    </div>
  );
}
