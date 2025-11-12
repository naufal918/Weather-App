// api/weather.js
export default async function handler(req, res) {
    const { lat, lon, q } = req.query;
    const key = process.env.OPENWEATHER_KEY;

    if (!key) return res.status(500).json({ error: "Missing OpenWeather key" });

    try {
        // Mode 1: ambil cuaca langsung berdasarkan koordinat
        if (lat && lon) {
            const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
            const [curRes, foreRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
            const current = await curRes.json();
            const forecast = await foreRes.json();
            return res.status(200).json({ current, forecast });
        }

        // Mode 2: pencarian nama kota (geocoding)
        if (q) {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${key}`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (!geoData.length) return res.status(404).json({ error: "City not found" });

            const { lat, lon, name } = geoData[0];
            const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

            const [curRes, foreRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
            const current = await curRes.json();
            const forecast = await foreRes.json();
            return res.status(200).json({ current, forecast, city: name });
        }

        return res.status(400).json({ error: "Missing parameters" });
    } catch (err) {
        console.error("Weather API Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}