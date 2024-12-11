const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 6008;

// Enable CORS
app.use(cors());

app.get('/api/placeSearch', async (req, res) => {
    try {
        const query = req.query.query;
        console.log(`Received query: ${query}`); // Log received query

        const googleApiKey = "AIzaSyAe4p3dK30Kb3YHK5cnz8CQMS18wKeCOeM";
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`;
        console.log(`Text Search API URL: ${url}`); // Log Text Search API URL

        const response = await axios.get(url);
        const data = response.data;
        console.log(`Text Search API Response:`, JSON.stringify(data, null, 2)); // Log response from Text Search API

        if (data.results && data.results.length > 0) {
            const place = data.results[0];
            console.log(`Selected Place: ${JSON.stringify(place, null, 2)}`); // Log the selected place

            // Request additional details for the place, including address components
            const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${googleApiKey}`;
            console.log(`Place Details API URL: ${placeDetailsUrl}`); // Log Place Details API URL

            const detailsResponse = await axios.get(placeDetailsUrl);
            const details = detailsResponse.data.result;
            console.log(`Place Details API Response:`, JSON.stringify(details, null, 2)); // Log response from Place Details API

            // Extract ZIP code, state abbreviation, and city
            const zipCode = details.address_components.find(comp => comp.types.includes("postal_code"))?.long_name || "N/A";
            const stateAbbreviation = details.address_components.find(comp => comp.types.includes("administrative_area_level_1"))?.short_name || "N/A";
            const city = details.address_components.find(comp => comp.types.includes("locality"))?.long_name || "N/A";

            console.log(`Extracted ZIP Code: ${zipCode}`);
            console.log(`Extracted State Abbreviation: ${stateAbbreviation}`);
            console.log(`Extracted City: ${city}`);

            res.json({
                formatted_address: place.formatted_address,
                city,
                state: stateAbbreviation,
                zip_code: zipCode,
            });
        } else {
            console.log(`No results found for query: ${query}`);
            res.json({ message: 'No results found' });
        }
    } catch (error) {
        console.error('Error fetching data from Google Places API:', error.message);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
