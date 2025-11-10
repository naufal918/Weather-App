import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import WeatherBackground from "./WeatherBackground";
import Map from "./Map";
import RadarMap from "./RadarMap";
import WeatherScene from "./WeatherScene";
import "./index.css";

export default function App() {
  const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  // 🔹 Ambil data cuaca berdasar koordinat
  const fetchWeatherByCoords = async (latVal, lonVal) => {
    setLoading(true);
    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latVal}&lon=${lonVal}&units=metric&appid=${apiKey}`
      );
      const currentData = await currentRes.json();

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latVal}&lon=${lonVal}&units=metric&appid=${apiKey}`
      );
      const forecastData = await forecastRes.json();

      // Simpan cuaca saat ini
      setData({
        temp: currentData.main?.temp ?? 0,
        feels_like: currentData.main?.feels_like ?? 0,
        humidity: currentData.main?.humidity ?? 0,
        wind_speed: currentData.wind?.speed ?? 0,
        pressure: currentData.main?.pressure ?? 0,
        visibility: currentData.visibility ?? 0,
        weather: currentData.weather ?? [],
      });

      // ✅ FIX: kelompokkan berdasarkan tanggal (bukan setiap 8 item)
      const groupedByDay = {};
      forecastData.list.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        if (!groupedByDay[dayKey]) groupedByDay[dayKey] = [];
        groupedByDay[dayKey].push(item);
      });

      const daily = Object.keys(groupedByDay)
        .slice(0, 7)
        .map((key) => {
          const items = groupedByDay[key];
          const temps = items.map((i) => i.main.temp);
          const min = Math.min(...temps);
          const max = Math.max(...temps);
          const mid = items[Math.floor(items.length / 2)];
          const icon = mid.weather[0].icon;
          const description = mid.weather[0].description;
          const dateLabel = new Date(key).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          return {
            dateLabel,
            temp_min: Math.round(min),
            temp_max: Math.round(max),
            temp_avg: Math.round((min + max) / 2),
            icon,
            description,
          };
        });

      setForecast(daily);
      setHourly(forecastData.list);

      if (daily.length > 0) setSelectedDay(daily[0].dateLabel);
    } catch (err) {
      console.error("❌ Gagal ambil data cuaca:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cari lokasi manual
  const fetchWeatherByLocation = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          query
        )}&limit=1&appid=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error("Lokasi tidak ditemukan!");
      const { lat, lon, name } = geoData[0];
      setLat(lat);
      setLon(lon);
      setCity(name);
      await fetchWeatherByCoords(lat, lon);
    } catch (err) {
      alert("Gagal menemukan lokasi. Coba nama lain.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Gunakan lokasi pengguna
  const handleUseMyLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLon(longitude);
        setCity("Lokasi Anda");
        await fetchWeatherByCoords(latitude, longitude);
      },
      (err) => setLoading(false)
    );
  };

  // 🔹 Background gradient
  const getBackgroundClass = () => {
    if (!data?.weather) return "from-slate-900 via-slate-950 to-sky-950";
    const cond = data.weather[0].main.toLowerCase();
    if (cond.includes("clear")) return "from-yellow-200 via-sky-400 to-blue-600";
    if (cond.includes("rain")) return "from-blue-900 via-sky-700 to-gray-800";
    if (cond.includes("thunder")) return "from-indigo-900 via-purple-800 to-black";
    if (cond.includes("cloud")) return "from-gray-500 via-slate-700 to-sky-900";
    return "from-slate-800 via-gray-900 to-slate-950";
  };

  return (
    <motion.div
      className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} text-white flex flex-col justify-between`}
    >
      <WeatherScene condition={data?.weather?.[0]?.main || "clear"} />
      <WeatherBackground condition={data?.weather?.[0]?.main?.toLowerCase() || ""} />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
        {/* HEADER */}
        <motion.header
  initial={{ opacity: 0, y: -15 }}
  animate={{ opacity: 1, y: 0 }}
  className="flex flex-col items-center justify-center min-h-[80vh] sm:min-h-[60vh] 
             text-center px-4 py-10 bg-gradient-to-b from-white/5 to-transparent 
             rounded-3xl backdrop-blur-sm"
>
  {/* Logo */}
  <img
    src="/logo.png"
    alt="WeatherFo logo"
    className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 drop-shadow-lg"
  />

  {/* Judul */}
  <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-sky-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
    WeatherFo
  </h1>
  <p className="text-xs sm:text-sm text-blue-100 tracking-wide mt-1 mb-6">
    Real-Time Weather Application
  </p>

  {/* Search bar dan tombol */}
  <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm gap-3">
    <input
      type="text"
      value={manualCity}
      onChange={(e) => setManualCity(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && fetchWeatherByLocation(manualCity)}
      placeholder="🔍 Cari kota (misal: Bandung)"
      className="px-4 py-2 w-full rounded-lg text-gray-800 border border-sky-400 
                 focus:ring-2 focus:ring-sky-300 outline-none shadow-sm"
    />
    <button
      onClick={() => fetchWeatherByLocation(manualCity)}
      className="bg-sky-500 hover:bg-sky-600 w-full px-4 py-2 rounded-lg font-semibold shadow-md text-white"
    >
      Cari
    </button>
    <button
      onClick={handleUseMyLocation}
      className="bg-gray-500 hover:bg-gray-600 w-full px-4 py-2 rounded-lg font-semibold shadow-md text-white"
    >
      📍 Lokasi Saya
    </button>
  </div>
</motion.header>

        {/* BODY */}
        {loading && (
          <div className="text-center mt-10 text-base sm:text-lg animate-pulse">
            📡 Mengambil data cuaca...
          </div>
        )}

        {!loading && data && data.weather && data.weather.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* CUACA SAAT INI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/15 p-6 sm:p-8 rounded-3xl backdrop-blur-lg border border-white/25 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`}
                  alt="icon"
                  className="w-24 h-24 sm:w-32 sm:h-32 mb-3 drop-shadow-lg"
                />
                <h2 className="text-5xl sm:text-7xl font-bold">{Math.round(data.temp)}°C</h2>
                <p className="capitalize text-base sm:text-lg opacity-90">
                  {data.weather[0].description}
                </p>
                <p className="opacity-80 mt-2 text-sm sm:text-base">📍 {city}</p>
              </div>

              {/* Info grid */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs sm:text-sm opacity-90">
                <div>🌡️ <b>{Math.round(data.feels_like)}°C</b><br />Feels</div>
                <div>💧 <b>{data.humidity}%</b><br />Humidity</div>
                <div>💨 <b>{data.wind_speed} m/s</b><br />Wind</div>
                <div>🔆 <b>{data.uv ?? "–"}</b><br />UV Index</div>
                <div>🎈 <b>{data.pressure} hPa</b><br />Pressure</div>
                <div>👁️ <b>{(data.visibility / 1000).toFixed(1)} km</b><br />Visibility</div>
              </div>
            </motion.div>

{/* 🌦️ PRAKIRAAN 5 HARI KE DEPAN (DESAIN BARU) */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl"
>
  {/* Header */}
  <div className="flex justify-center items-center gap-2 mb-6">
    <span className="text-2xl">📅</span>
    <h3 className="text-xl sm:text-2xl font-semibold text-center">
      Perkiraan 5 Hari ke Depan
    </h3>
  </div>

  {/* Card Container */}
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
  {forecast.slice(0, 5).map((d, i) => (
    <motion.div
      key={i}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: "spring", stiffness: 180, damping: 14 }}
      className="relative bg-gradient-to-br from-sky-600/50 to-sky-900/40 
                 rounded-[1.8rem] border border-white/20 shadow-xl 
                 p-6 flex flex-col justify-between items-center text-center 
                 overflow-hidden min-h-[270px] w-full max-w-[160px]
                 hover:shadow-sky-400/30 backdrop-blur-lg transition-all duration-300"
    >
      {/* Overlay halus */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-40 rounded-3xl"></div>

      {/* 🗓️ Tanggal */}
      <div className="text-sm font-medium text-white/90 z-10 tracking-wide">
        {d.dateLabel}
      </div>

{/* 🌦️ Ikon Cuaca */}
<div className="relative z-10 my-3 flex items-center justify-center">
  {d.icon ? (
    <img
      src={`https://openweathermap.org/img/wn/${d.icon}.png`}
      alt={d.description}
      className="w-16 h-13 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-105"
      loading="lazy"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/fallback-weather.png"; // optional: buat gambar cadangan di public/
      }}
    />
  ) : (
    <span className="text-3xl">🌤️</span> // fallback emoji kalau gak ada icon
  )}
</div>

      {/* 🌡️ Suhu */}
      <div className="z-10 flex flex-col items-center">
        <p className="text-3xl font-extrabold text-white leading-none drop-shadow-sm">
          {d.temp_avg}°
        </p>
        <p className="text-xs sm:text-sm capitalize text-blue-100/90 mt-1 leading-tight">
          {d.description}
        </p>
      </div>

      {/* 🔺🔻 Suhu Maks-Min */}
      <div className="z-10 flex justify-center gap-4 text-xs sm:text-sm text-blue-200/80 mt-2">
        <span>⬆ {d.temp_max}°</span>
        <span>⬇ {d.temp_min}°</span>
      </div>
    </motion.div>
  ))}
</div>

  {/* Garis Pembatas */}
  <div className="w-full h-[1px] bg-white/10 my-6"></div>

  {/* Ringkasan Hari Ini */}
  <div className="text-center text-sm sm:text-base text-blue-100/90 leading-relaxed">
    Hari ini di <b>{city}</b>, suhu rata-rata sekitar{" "}
    <b>{Math.round(data.temp)}°C</b> dengan kondisi{" "}
    <b>{data.weather[0].description}</b>. Kelembapan{" "}
    <b>{data.humidity}%</b> dan kecepatan angin{" "}
    <b>{data.wind_speed} m/s</b>.
  </div>

  {/* Update Waktu */}
  <p className="mt-3 text-center text-xs text-blue-200/70 italic">
    Terakhir diperbarui:{" "}
    {new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>
</motion.div>


            {/* RADAR & MAP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 bg-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-lg border border-white/20 shadow-lg"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">
                🌧️ Radar & Peta Cuaca
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Map lat={lat} lon={lon} city={city} />
                <RadarMap lat={lat} lon={lon} />
              </div>
              <p className="text-[10px] sm:text-xs text-blue-100 mt-3 text-center opacity-70">
                Data dari OpenWeatherMap & RainViewer API
              </p>
            </motion.div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs sm:text-sm text-blue-100 bg-white/5 backdrop-blur-md border-t border-white/10 mt-10">
        🌤️ Dibuat oleh <b className="text-white">Naufal Abdullah</b> • React + Tailwind + OpenWeatherMap
      </footer>
    </motion.div>
  );
}
