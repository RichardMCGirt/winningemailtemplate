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
        const data = response.data;

        if (data.results && data.results.length > 0) {
            const place = data.results[0];

            // Request additional details for the place, including address components
            const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${googleApiKey}`;
            const detailsResponse = await axios.get(placeDetailsUrl);
            const details = detailsResponse.data.result;

            // Extract ZIP code and state abbreviation
            const zipCode = details.address_components.find(comp => comp.types.includes("postal_code"))?.long_name || "N/A";
            const stateAbbreviation = details.address_components.find(comp => comp.types.includes("administrative_area_level_1"))?.short_name || "N/A";

            res.json({
                formatted_address: place.formatted_address,
                city: place.name,
                zip_code: zipCode,
                state: stateAbbreviation
            });
        } else {
            res.json({ message: 'No results found' });
        }
    } catch (error) {
        console.error('Error fetching data from Google Places API:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});