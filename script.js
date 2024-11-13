// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const airtableBaseId = 'appi4QZE0SrWI6tt2';
const airtableTableName = 'tblQo2148s04gVPq1';
let bidNameSuggestions = [];

// Fetch data from Airtable without caching
async function fetchAirtableData(fieldName, filterFormula = '') {
    let allRecords = [];
    let offset = null;
    do {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (filterFormula) url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
        if (offset) url += `${filterFormula ? '&' : '?'}offset=${offset}`;

        try {
            const response = await fetch(url, { headers: { Authorization: `Bearer ${airtableApiKey}` } });
            const data = await response.json();
            allRecords = allRecords.concat(data.records);
            offset = data.offset;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    } while (offset);

    return allRecords;
}

// Fetch "Bid Name" suggestions
async function fetchBidNameSuggestions() {
    const records = await fetchAirtableData('Bid Name', "NOT({Outcome}='Win')");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
}

// Fetch builder and GM Email by "Bid Name"
async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData('Builder', filterFormula);

    if (records.length) {
        const builder = records[0].fields['Builder'];
        const gmEmail = records[0].fields['GM Email'] || "Branch Staff@Vanir.com"; // Fallback if GM Email is missing
        return { builder, gmEmail };
    } else {
        return { builder: '', gmEmail: 'Branch Staff@Vanir.com' };
    }
}

// Function to create autocomplete input
function createAutocompleteInput(placeholder, suggestions, onSelection) {
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
        dropdown.innerHTML = ''; // Clear suggestions

        if (inputValue) {
            suggestions
                .filter(item => item.toLowerCase().includes(inputValue))
                .forEach(suggestion => {
                    const option = document.createElement("div");
                    option.classList.add("autocomplete-option");
                    option.textContent = suggestion;
                    option.onclick = async () => {
                        input.value = suggestion;
                        dropdown.innerHTML = '';
                        const { builder, gmEmail } = await onSelection(suggestion);
                        updateTemplateText(suggestion, builder, gmEmail);
                    };
                    dropdown.appendChild(option);
                });
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    return wrapper;
}

// Function to update "Subdivision", "Builder", and "GM Email" in the template
function updateTemplateText(subdivision, builder, gmEmail) {
    document.querySelectorAll('.subdivisionContainer').forEach(el => (el.textContent = subdivision));
    document.querySelectorAll('.builderContainer').forEach(el => (el.textContent = builder));
    document.querySelectorAll('.gmEmailContainer').forEach(el => (el.textContent = gmEmail));
}

// Display the email content immediately
function displayEmailContent() {
    const emailContent = `
        <h2>To: <span class="gmEmailContainer">Branch Staff@Vanir.com</span>, purchasing@vanirinstalledsales.com, hunter@vanirinstalledsales.com</h2>
        <p>CC: Vendor</p>
        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Dear Team,</p>
        <p>We are excited to announce that we have won a new project in <strong><span class="subdivisionContainer"></span></strong> for <strong><span class="builderContainer"></span></strong>. Let's coordinate with the relevant vendors and ensure a smooth project initiation.</p><br>
        
        <!-- Subcontractors -->
        <h2>To: Subcontractors@example.com</h2>
        <p><strong>Subject:</strong> New Community | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
        
        <!-- Spanish -->
        <p><strong>Asunto:</strong> Nueva Comunidad | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>Nos complace informarles que hemos sido galardonados con una nueva comunidad, <strong><span class="subdivisionContainer"></span></strong>, en colaboración con <strong><span class="builderContainer"></span></strong>. Esperamos trabajar juntos y mantener altos estándares para este proyecto.</p>
        
        <!-- Portuguese -->
        <p><strong>Assunto:</strong> Nova Comunidade | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>Estamos entusiasmados em informar que fomos premiados com uma nova comunidade, <strong><span class="subdivisionContainer"></span></strong>, em colaboração com <strong><span class="builderContainer"></span></strong>. Esperamos trabalhar juntos e manter altos padrões para este projeto.</p>
        
       <p>Kind regards,<br>Vanir Installed Sales Team</p>
       <img src="/Logo.jpg" alt="Vanir Installed Sales Logo" style="width: 150px; margin-top: 10px;">
    `;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;

    // Add an empty autocomplete input initially
    const subdivisionInputWrapper = createAutocompleteInput("Enter Bid Name", [], fetchDetailsByBidName);
    emailContainer.prepend(subdivisionInputWrapper);
}

// Fetch bid names and update autocomplete input
async function fetchAndUpdateAutocomplete() {
    await fetchBidNameSuggestions();
    
    // Replace the empty autocomplete input with the populated one
    const emailContainer = document.getElementById('emailTemplate');
    const newAutocompleteInput = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, fetchDetailsByBidName);
    emailContainer.replaceChild(newAutocompleteInput, emailContainer.firstChild);
}

// On DOMContentLoaded, display email content first, then fetch data in the background
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent(); // Display static content and empty input immediately
    fetchAndUpdateAutocomplete(); // Fetch data and update input in the background
});
