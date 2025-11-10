import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
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
  const [city, setCity] = useState("Lokasi Anda");
  const [loading, setLoading] = useState(true);
  const [manualCity, setManualCity] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    if (!manualCity && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
        },
        (err) => setLoading(false)
      );
    }
  }, [manualCity]);

  useEffect(() => {
    if (lat && lon) fetchWeatherByCoords(lat, lon);
  }, [lat, lon]);

  const handleUseMyLocation = () => {
    setManualCity("");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setCity("Lokasi Anda");
      },
      (err) => setLoading(false)
    );
  };

  const fetchWeatherByCity = async (cityName) => {
    if (!cityName.trim()) return;
    setLoading(true);
    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error("Kota tidak ditemukan!");
      const { lat: gLat, lon: gLon, name: geoName } = geoData[0];
      setLat(gLat);
      setLon(gLon);
      setCity(geoName || cityName);
    } catch {
      alert("Kota tidak ditemukan.");
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (latVal, lonVal) => {
    setLoading(true);
    try {
      // 🌡️ Cuaca Saat Ini
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latVal}&lon=${lonVal}&units=metric&appid=${apiKey}`
      );
      const currentData = await currentRes.json();
  
      // 🌦️ Prakiraan 5 Hari
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latVal}&lon=${lonVal}&units=metric&appid=${apiKey}`
      );
      const forecastData = await forecastRes.json();
  
      // 🌬️ Kualitas Udara
      let airQuality = null;
      try {
        const airRes = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latVal}&lon=${lonVal}&appid=${apiKey}`
        );
        const airData = await airRes.json();
        airQuality = airData.list?.[0]?.main?.aqi || null;
      } catch {
        airQuality = null;
      }
  
      // 🧠 Set data utama
      setData({
        temp: currentData.main?.temp ?? 0,
        feels_like: currentData.main?.feels_like ?? 0,
        humidity: currentData.main?.humidity ?? 0,
        wind_speed: currentData.wind?.speed ?? 0,
        pressure: currentData.main?.pressure ?? 0,
        visibility: currentData.visibility ?? 0,
        weather: currentData.weather ?? [],
        sunrise: currentData.sys?.sunrise ?? null,
        sunset: currentData.sys?.sunset ?? null,
        name: currentData.name,
        uv: "N/A", // fallback karena OneCall nggak gratis
        aqi: airQuality,
      });
  
      // 📅 Group data forecast
      const groupedForecast = [];
      for (let i = 0; i < forecastData.list.length; i += 8)
        groupedForecast.push(forecastData.list[i]);
      setForecast(groupedForecast);
      setHourly(forecastData.list);
  
      // 🕐 Pilih hari pertama untuk hourly
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
    <motion.div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} text-white`}>
      <WeatherBackground condition={data?.weather?.[0]?.main?.toLowerCase() || ""} />

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* HEADER */}
        <motion.header initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-sky-200 to-sky-400 bg-clip-text text-transparent mb-2">
            WeatherFo
          </h1>
          <p className="text-sm text-blue-100">Data dari OpenWeatherMap — Real-Time Weather</p>

          <div className="flex flex-wrap justify-center mt-5 gap-2">
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeatherByCity(manualCity)}
              placeholder="Cari kota (misal: Bandung)"
              className="px-4 py-2 w-64 rounded-lg text-gray-800 border border-sky-400 focus:ring-2 focus:ring-sky-300"
            />
            <button
              onClick={() => fetchWeatherByCity(manualCity)}
              className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg font-semibold"
            >
              Cari
            </button>
            <button
              onClick={handleUseMyLocation}
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
            >
              📍 Lokasi Saya
            </button>
          </div>
        </motion.header>

        {loading ? (
          <div className="text-center mt-20 text-lg animate-pulse">📡 Mengambil data cuaca...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* CUACA SAAT INI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/20 p-6 rounded-3xl backdrop-blur-lg border border-white/30 shadow-xl"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src={`https://openweathermap.org/img/wn/${data?.weather?.[0]?.icon}@4x.png`}
                  alt="icon"
                  className="w-32 h-32 mb-2"
                />
                <h2 className="text-6xl font-bold">{Math.round(data?.temp)}°C</h2>
                <p className="capitalize text-lg">{data?.weather?.[0]?.description}</p>
                <p className="opacity-80 mt-2">📍 {city}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm opacity-90">
  <div>🌡️ <b>{Math.round(data?.feels_like)}°C</b><br/>Feels</div>
  <div>💧 <b>{data?.humidity}%</b><br/>Humidity</div>
  <div>💨 <b>{data?.wind_speed} m/s</b><br/>Wind</div>
  <div>🔆 <b>{data?.uv}</b><br/>UV Index</div>
  <div>🎈 <b>{data?.pressure} hPa</b><br/>Pressure</div>
  <div>👁️ <b>{(data?.visibility / 1000).toFixed(1)} km</b><br/>Visibility</div>
</div>

<div className="mt-4 text-center text-sm opacity-90">
  <div>🌅 <b>{new Date(data?.sunrise * 1000).toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"})}</b>  
    &nbsp; | &nbsp; 🌇 <b>{new Date(data?.sunset * 1000).toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"})}</b>
  </div>
</div>

<div className="mt-3 text-center text-sm">
  <span className={`px-3 py-1 rounded-full ${
    data?.aqi === 1 ? "bg-green-500/50" :
    data?.aqi === 2 ? "bg-yellow-500/50" :
    data?.aqi === 3 ? "bg-orange-500/50" :
    data?.aqi === 4 ? "bg-red-500/50" :
    "bg-purple-700/50"
  }`}>
    🌫️ Kualitas Udara: {["Baik","Sedang","Kurang Sehat","Buruk","Berbahaya"][data?.aqi - 1] || "N/A"}
  </span>
</div>

            </motion.div>

            {/* PRAKIRAAN 5 HARI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 p-6 rounded-3xl backdrop-blur-lg border border-white/20 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4 text-center">📅 Prakiraan 5 Hari</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {forecast.map((d, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/20 p-3 rounded-2xl text-center border border-white/30"
                  >
                    <div className="text-sm opacity-90 font-medium">
                      {new Date(d.dt * 1000).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" })}
                    </div>
                    <img src={`https://openweathermap.org/img/wn/${d.weather[0].icon}.png`} alt="" className="mx-auto w-10 h-10" />
                    <p className="text-lg font-bold">{Math.round(d.main.temp)}°</p>
                    <p className="text-xs opacity-80 capitalize">{d.weather[0].description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* PRAKIRAAN 3 JAM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 bg-white/10 p-6 rounded-3xl backdrop-blur-lg border border-white/20 shadow-lg"
            >
              <h4 className="text-md font-semibold mb-4 text-center">
                ⏰ Prakiraan Cuaca Tiap 3 Jam (5 Hari)
              </h4>
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {Array.from(
                  new Set(
                    hourly.map((h) =>
                      new Date(h.dt * 1000).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                    )
                  )
                )
                  .slice(0, 5)
                  .map((day, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedDay === day
                          ? "bg-sky-500 text-white shadow-md"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
              </div>

              <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-white/30">
                {hourly
                  .filter(
                    (h) =>
                      new Date(h.dt * 1000).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }) === selectedDay
                  )
                  .map((h, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="min-w-[100px] bg-white/20 p-3 rounded-xl text-center border border-white/30 shadow-md"
                    >
                      <div className="text-sm opacity-90 font-medium">
                        {new Date(h.dt * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <img src={`https://openweathermap.org/img/wn/${h.weather[0].icon}.png`} alt="" className="mx-auto w-10 h-10" />
                      <div className="text-sm font-semibold">{Math.round(h.main.temp)}°C</div>
                      <div className="text-xs capitalize opacity-80">{h.weather[0].description}</div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>

            {/* RADAR & MAP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 bg-white/10 p-6 rounded-3xl backdrop-blur-lg border border-white/20 shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-2">🌧️ Radar & Peta Cuaca</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Map lat={lat} lon={lon} city={city} />
                <RadarMap lat={lat} lon={lon} />
              </div>
              <p className="text-xs text-blue-100 mt-2 text-center opacity-70">
                Data dari OpenWeatherMap & RainViewer API
              </p>
            </motion.div>
          </div>
        )}
      </div>
      <footer className="mt-10 text-sm text-center text-blue-100">
        🌤️ Dibuat oleh <b>Naufal Abdullah</b> • React + Tailwind + OpenWeatherMap
              <div></div>
      </footer>

    </motion.div>
  );
}
