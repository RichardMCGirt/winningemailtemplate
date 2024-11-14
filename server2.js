const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 6005;

// Enable CORS
app.use(cors());

app.get('/api/placeSearch', async (req, res) => {
    try {
        const query = req.query.query;
        const googleApiKey = "AIzaSyAe4p3dK30Kb3YHK5cnz8CQMS18wKeCOeM"; // Replace with your Google API Key
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`;
        
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Google Places API:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
