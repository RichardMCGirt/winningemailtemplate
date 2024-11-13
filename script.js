const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const airtableBaseId = 'appi4QZE0SrWI6tt2';
const airtableTableName = 'tblQo2148s04gVPq1';
let bidNameSuggestions = [];

// Fetch data from Airtable with a filter and pagination
async function fetchAirtableData(fieldName, filterFormula = '') {
    let allRecords = [];
    let offset = null;

    do {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (filterFormula) url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
        if (offset) url += `${filterFormula ? '&' : '?'}offset=${offset}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                }
            });
            
            if (!response.ok) {
                console.error(`Error fetching data: ${response.status} ${response.statusText}`);
                return [];
            }

            const data = await response.json();
            if (data.records && data.records.length > 0) {
                allRecords = allRecords.concat(data.records);
            }

            offset = data.offset; // Set offset for next batch (if exists)
        } catch (error) {
            console.error("Error during fetch operation:", error);
            return [];
        }
    } while (offset);

    return allRecords;
}

// Fetch bid names for autocomplete suggestions
async function fetchBidNameSuggestions() {
    const records = await fetchAirtableData('Bid Name', "NOT({Outcome}='Win')");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
}

// Function to fetch the builder based on the selected subdivision
async function fetchBuilderBySubdivision(subdivision) {
    const sanitizedSubdivision = subdivision.replace(/"/g, '\\"');
    const filterFormula = `{Subdivision}="${sanitizedSubdivision}"`;

    const records = await fetchAirtableData('Builder', filterFormula);
    return records.length > 0 ? records[0].fields['Builder'] : '';
}

// Function to create an autocomplete input box with dropdown suggestions
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
                    input.value = suggestion; // Populate the input field with the clicked suggestion
                    dropdown.innerHTML = ''; // Clear suggestions after selection
                    if (onSubdivisionSelect) {
                        const builder = await onSubdivisionSelect(suggestion); // Fetch builder based on subdivision
                        document.getElementById('builderInput').value = builder; // Update the Builder input
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

// Populate email template with data in sections to allow lazy loading
async function populateEmailTemplate() {
    await fetchBidNameSuggestions(); // Fetch bid name suggestions before populating template

    const subdivisionInputWrapper = createAutocompleteInput("Enter Subdivision", bidNameSuggestions, fetchBuilderBySubdivision);

    // Create Builder input field
    const builderInput = document.createElement("input");
    builderInput.type = "text";
    builderInput.placeholder = "Enter Builder";
    builderInput.id = "builderInput";
    builderInput.classList.add("autocomplete-input");

    // Split the email content into sections
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

    // Display email content in HTML
    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;

    // Insert the subdivision and builder input boxes in appropriate locations within the template
    document.getElementById('subdivisionContainer').appendChild(subdivisionInputWrapper);
    document.getElementById('subdivisionContainer2').appendChild(createAutocompleteInput("Enter Subdivision", bidNameSuggestions, fetchBuilderBySubdivision));
    document.getElementById('subdivisionContainer3').appendChild(createAutocompleteInput("Enter Subdivision", bidNameSuggestions, fetchBuilderBySubdivision));
    document.getElementById('subdivisionContainer4').appendChild(createAutocompleteInput("Enter Subdivision", bidNameSuggestions, fetchBuilderBySubdivision));

    // Insert builder input in the relevant places
    document.getElementById('builderContainer').appendChild(builderInput);
    document.getElementById('builderContainer2').appendChild(builderInput.cloneNode(true));
    document.getElementById('builderContainer3').appendChild(builderInput.cloneNode(true));
    document.getElementById('builderContainer4').appendChild(builderInput.cloneNode(true));
}

// Initialize email template generation
document.addEventListener('DOMContentLoaded', populateEmailTemplate);
