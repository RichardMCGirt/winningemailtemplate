const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const airtableBaseId = 'appi4QZE0SrWI6tt2';
const airtableTableName = 'tblQo2148s04gVPq1';
let bidNameSuggestions = [];
let builderCache = {}; // Cache for subdivision-to-builder mappings

// Helper functions for Base64 encoding and decoding
function encodeBase64(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeBase64(data) {
    return JSON.parse(decodeURIComponent(escape(atob(data))));
}

// Fetch data from Airtable with caching and compression
async function fetchAirtableDataWithCache(fieldName, filterFormula = '') {
    const cacheKey = filterFormula ? `airtable_${fieldName}_${filterFormula}` : `airtable_${fieldName}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        console.log(`Loading ${fieldName} data from localStorage cache.`);
        return decodeBase64(cachedData);
    }

    // Fetch from Airtable if not cached
    let allRecords = [];
    let offset = null;

    console.log(`Fetching ${fieldName} data from Airtable with filter: ${filterFormula}`);
    do {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (filterFormula) url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
        if (offset) url += `${filterFormula ? '&' : '?'}offset=${offset}`;

        console.log(`Fetching data from URL: ${url}`);
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
            if (!response.ok) {
                console.error(`Error fetching data: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            if (data.records && data.records.length > 0) {
                const filteredRecords = data.records.map(record => ({
                    id: record.id,
                    fields: {
                        [fieldName]: record.fields[fieldName],
                        Builder: record.fields['Builder'],
                        Subdivision: record.fields['Subdivision'] // Include Subdivision in cache
                    }
                }));
                allRecords = allRecords.concat(filteredRecords);
            }
            offset = data.offset;
        } catch (error) {
            console.error("Error during fetch operation:", error);
            return [];
        }
    } while (offset);

    // Cache and compress data in localStorage
    const compressedData = encodeBase64(allRecords);
    try {
        localStorage.setItem(cacheKey, compressedData);
        console.log(`Cached ${fieldName} data in localStorage under key: ${cacheKey}`);
    } catch (e) {
        console.error("Failed to cache data due to storage limit:", e);
    }
    
    return allRecords;
}

// Fetch bid name suggestions
async function fetchBidNameSuggestions() {
    console.log("Fetching bid name suggestions...");
    const records = await fetchAirtableDataWithCache('Bid Name', "NOT({Outcome}='Win')");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
    console.log("Bid name suggestions fetched:", bidNameSuggestions);
}

async function fetchBuilderByBidName(bidName) {
    console.log(`Fetching builder for bid name: ${bidName}`);
    
    // Escape any double quotes within the bid name and surround with double quotes in the filter formula
    const sanitizedBidName = bidName.replace(/"/g, '\\"');
    
    // Construct the filter formula to search by Bid Name
    const filterFormula = `{Bid Name} = "${sanitizedBidName}"`;
    console.log(`Generated Filter Formula: ${filterFormula}`);
    
    const encodedFormula = encodeURIComponent(filterFormula);
    console.log(`Encoded Filter Formula: ${encodedFormula}`);

    // Fetch builder from Airtable using the encoded filter formula
    const records = await fetchAirtableDataWithCache('Builder', filterFormula);
    if (records.length > 0) {
        console.log(`Builder found for bid name '${bidName}': ${records[0].fields['Builder']}`);
        return records[0].fields['Builder'];
    } else {
        console.log(`No builder found for bid name '${bidName}'`);
        return '';
    }
}



// Function to create autocomplete input with dropdown suggestions
function createAutocompleteInput(placeholder, suggestions, onSubdivisionSelect = null) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("autocomplete-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.classList.add("autocomplete-input");

    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        if (inputValue) {
            const matchedSuggestions = suggestions.filter(item => item.toLowerCase().includes(inputValue));
            matchedSuggestions.forEach(suggestion => {
                const option = document.createElement("div");
                option.classList.add("autocomplete-option");
                option.textContent = suggestion;
                option.onclick = async () => {
                    input.value = suggestion;
                    dropdown.innerHTML = ''; // Clear suggestions after selection
                    if (onSubdivisionSelect) {
                        console.log(`Selected subdivision: ${suggestion}`);
                        const builder = await onSubdivisionSelect(suggestion);
                        document.getElementById('builderInput').value = builder;
                    }
                };
                dropdown.appendChild(option);
            });
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    return wrapper;
}

// Populate email template
async function populateEmailTemplate() {
    console.log("Starting email template population...");
    await fetchBidNameSuggestions();

    const subdivisionInputWrapper = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, fetchBuilderByBidName);

    // Create Builder input field
    const builderInput = document.createElement("input");
    builderInput.type = "text";
    builderInput.placeholder = "Enter Builder";
    builderInput.id = "builderInput";
    builderInput.classList.add("autocomplete-input");

    const emailContent = `
        <h2>To: Branch Staff</h2>
        <p>CC: Vendor</p>
        <p><strong>Subject:</strong> WINNING! | <span id="subdivisionContainer"></span> | <span id="builderContainer"></span></p>
        <p>Dear Team,</p>
        <p>We are excited to announce that we have won a new project in <strong><span id="subdivisionContainer2"></span></strong> for <strong><span id="builderContainer2"></span></strong>. Let's coordinate with the relevant vendors and ensure a smooth project initiation.</p><br>
        <h2>To: Subcontractors</h2>
        <p><strong>Subject:</strong> New Community / Nueva Colonia | <span id="builderContainer3"></span> | <span id="subdivisionContainer3"></span></p>
        <p>Good morning/afternoon,</p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span id="subdivisionContainer4"></span></strong>, in collaboration with <strong><span id="builderContainer4"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
        <p>Kind regards,<br>Vanir Installed Sales Team</p>
    `;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;

    document.getElementById('subdivisionContainer').appendChild(subdivisionInputWrapper);
    document.getElementById('builderContainer').appendChild(builderInput);
}

document.addEventListener('DOMContentLoaded', populateEmailTemplate);
