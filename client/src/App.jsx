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

  // Ambil data cuaca berdasar koordinat
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

      setData({
        temp: currentData.main?.temp ?? 0,
        feels_like: currentData.main?.feels_like ?? 0,
        humidity: currentData.main?.humidity ?? 0,
        wind_speed: currentData.wind?.speed ?? 0,
        pressure: currentData.main?.pressure ?? 0,
        visibility: currentData.visibility ?? 0,
        weather: currentData.weather ?? [],
      });

      const grouped = [];
      for (let i = 0; i < forecastData.list.length; i += 8)
        grouped.push(forecastData.list[i]);
      setForecast(grouped);
      setHourly(forecastData.list);

      const firstDay = new Date(forecastData.list[0].dt * 1000).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      setSelectedDay(firstDay);
    } catch (err) {
      console.error("❌ Gagal ambil data cuaca:", err);
    } finally {
      setLoading(false);
    }
  };

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
          className="text-center mb-8 sm:mb-10"
        >
          <img
            src="/logo.png"
            alt="WeatherFo logo"
            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto drop-shadow-md"
          />
          <h1 className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-sky-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            WeatherFo
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 tracking-wide mt-1">
            Real-Time Weather Application
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row justify-center mt-6 gap-3">
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeatherByLocation(manualCity)}
              placeholder="🔍 Cari kota (misal: Bandung)"
              className="px-4 py-2 w-full sm:w-72 rounded-lg text-gray-800 border border-sky-400 focus:ring-2 focus:ring-sky-300 outline-none shadow-sm"
            />
            <button
              onClick={() => fetchWeatherByLocation(manualCity)}
              className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg font-semibold shadow-md"
            >
              Cari
            </button>
            <button
              onClick={handleUseMyLocation}
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold shadow-md"
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

        {/* 🌤️ Hanya tampilkan card jika data sudah ada */}
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
                <div>🔆 <b>{data.uv}</b><br />UV Index</div>
                <div>🎈 <b>{data.pressure} hPa</b><br />Pressure</div>
                <div>👁️ <b>{(data.visibility / 1000).toFixed(1)} km</b><br />Visibility</div>
              </div>
            </motion.div>

            {/* PRAKIRAAN 5 HARI */}
{/* PRAKIRAAN 7 HARI */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-lg border border-white/20 shadow-lg"
>
  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center">
    📅 Perkiraan 7 Hari ke Depan
  </h3>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4 place-items-center">
    {forecast.slice(0, 7).map((d, i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.07, y: -3 }}
        transition={{ type: "spring", stiffness: 180, damping: 15 }}
        className="bg-white/20 hover:bg-white/30 transition-all duration-300 p-4 rounded-2xl text-center border border-white/30 backdrop-blur-sm shadow-md w-full max-w-[120px]"
      >
        <div className="text-sm opacity-90 mb-1">
          {new Date(d.dt * 1000).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
          })}
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${d.weather[0].icon}.png`}
          alt=""
          className="mx-auto w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md"
        />
        <p className="text-xl sm:text-2xl font-bold mt-1">
          {Math.round(d.main.temp)}°
        </p>
        <p className="text-[10px] sm:text-xs capitalize text-blue-100 mt-1 leading-tight">
          {d.weather[0].description}
        </p>
      </motion.div>
    ))}
  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
