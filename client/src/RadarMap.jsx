import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RadarMap({ lat, lon }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  // 🗺️ Inisialisasi peta setelah elemen benar-benar render
  useEffect(() => {
    if (!lat || !lon || !containerRef.current) return;

    // Hapus map lama dulu
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Tambahkan delay kecil supaya container sudah pasti siap di mobile
    const timeout = setTimeout(() => {
      mapRef.current = L.map(containerRef.current, {
        center: [lat, lon],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      });

      // Tile dasar
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Ambil data radar
      fetch("https://api.rainviewer.com/public/weather-maps.json")
        .then((res) => res.json())
        .then((data) => {
          const allFrames = [...data.radar.past, ...data.radar.nowcast];
          setFrames(allFrames);
        })
        .catch((err) => console.error("❌ Gagal ambil radar:", err));
    }, 300); // delay 300ms

    return () => {
      clearTimeout(timeout);
      if (mapRef.current) mapRef.current.remove();
      clearInterval(intervalRef.current);
    };
  }, [lat, lon]);

  // 🌧️ Ganti frame radar
  useEffect(() => {
    if (!frames.length || !mapRef.current) return;

    let layer = null;
    const showFrame = (index) => {
      if (layer) mapRef.current.removeLayer(layer);
      const frame = frames[index];
      layer = L.tileLayer(
        `https://tilecache.rainviewer.com/v2/radar/${frame.path}/256/{z}/{x}/{y}/3/0_0.png?hide_now=1`,
        { tileSize: 256, opacity: 0.65, zIndex: 10 }
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
      }, 700);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, frames]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        id="radarMap"
        className="w-full h-[300px] sm:h-[400px] rounded-2xl border border-white/30 shadow-lg overflow-hidden"
        style={{ minHeight: "300px" }}
      ></div>

      {/* Kontrol animasi */}
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
