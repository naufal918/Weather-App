// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());


// Example route using Open-Meteo (no API key)
// GET /api/weather?lat=-6.2&lon=106.8
app.get('/api/weather/open-meteo', async(req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ error: 'lat & lon required' });


        // Open-Meteo current & hourly example
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&hourly=temperature_2m,relativehumidity_2m&timezone=auto`;
        const r = await axios.get(url);
        return res.json(r.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});


// Example route using OpenWeatherMap (requires API key)
app.get('/api/weather/openweather', async(req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ error: 'lat & lon required' });
        const key = process.env.OPENWEATHER_API_KEY;
        if (!key) return res.status(500).json({ error: 'Missing OPENWEATHER_API_KEY in .env' });


        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&appid=${key}`;
        const r = await axios.get(url);
        return res.json(r.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));