// client/api/weather.js
export default async function handler(req, res) {
    const { lat, lon, q } = req.query;
    const key = process.env.OPENWEATHER_KEY;

    console.log("DEBUG OPENWEATHER_KEY:", key ? "✅ ada" : "❌ tidak ada");
    console.log("DEBUG query:", req.query);

    if (!key) {
        return res.status(500).json({ error: "Missing OpenWeather key on server" });
    }

    try {
        let curUrl, foreUrl;

        if (lat && lon) {
            curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
            foreUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
        } else if (q) {
            // geocoding + weather
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${key}`;
            const geoRes = await fetch(geoUrl);
            const geoBody = await geoRes.json();

            if (!geoRes.ok || !geoBody || geoBody.length === 0) {
                return res.status(geoRes.status || 500).json({
                    error: "Geocoding failed",
                    details: geoBody || await geoRes.text()
                });
            }

            const geo = geoBody[0];
            curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&units=metric&appid=${key}`;
            foreUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${geo.lat}&lon=${geo.lon}&units=metric&appid=${key}`;
        } else {
            return res.status(400).json({ error: "Missing parameters (lat+lon or q)" });
        }

        // parallel fetch
        const [curRes, foreRes] = await Promise.all([fetch(curUrl), fetch(foreUrl)]);
        const curText = await curRes.text();
        const foreText = await foreRes.text();

        // parse but handle non-json gracefully
        let current, forecast;
        try { current = JSON.parse(curText); } catch { current = { raw: curText }; }
        try { forecast = JSON.parse(foreText); } catch { forecast = { raw: foreText }; }

        // jika OpenWeather balas error (mis. 401), forward status + body
        if (!curRes.ok) {
            return res.status(curRes.status).json({ error: "Current weather fetch failed", status: curRes.status, body: current });
        }
        if (!foreRes.ok) {
            return res.status(foreRes.status).json({ error: "Forecast fetch failed", status: foreRes.status, body: forecast });
        }

        return res.status(200).json({ current, forecast });
    } catch (err) {
        console.error("Weather API Error:", err);
        return res.status(500).json({ error: "Internal server error", message: err.message });
    }
}