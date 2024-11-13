// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const bidBaseName = 'appi4QZE0SrWI6tt2';
const bidTableName = 'tblQo2148s04gVPq1';
const subcontractorBaseName = 'applsSm4HgPspYfrg';
const subcontractorTableName = 'tblX03hd5HX02rWQu';

let bidNameSuggestions = [];
let subcontractorEmailSuggestions = [];

// Fetch data from Airtable without caching, with specified base and table
async function fetchAirtableData(baseId, tableName, fieldName, filterFormula = '') {
    let allRecords = [];
    let offset = null;
    do {
        let url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
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
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Bid Name', "NOT({Outcome}='Win')");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
}

// Fetch "Subcontractor Email" suggestions
async function fetchSubcontractorEmailSuggestions() {
    const records = await fetchAirtableData(subcontractorBaseName, subcontractorTableName, 'Subcontractor Email');
    subcontractorEmailSuggestions = records.map(record => record.fields['Subcontractor Email']).filter(Boolean);
}


// Fetch builder and GM Email by "Bid Name"
async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData(bidTableName, 'Builder', filterFormula);

    if (records.length) {
        const builder = records[0].fields['Builder'];
        const gmEmail = records[0].fields['GM Email'] || "Branch Staff@Vanir.com";
        return { builder, gmEmail };
    } else {
        return { builder: '', gmEmail: 'Branch Staff@Vanir.com' };
    }
}

// Function to create autocomplete input
function createAutocompleteInput(placeholder, suggestions, onSelection = null) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("autocomplete-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.classList.add("autocomplete-input");
    input.disabled = true; // Disable initially

    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        if (inputValue) {
            suggestions
                .filter(item => item.toLowerCase().includes(inputValue))
                .forEach(suggestion => {
                    const option = document.createElement("div");
                    option.classList.add("autocomplete-option");
                    option.textContent = suggestion;

                    option.onclick = async () => {
                        input.value = suggestion;
                        dropdown.innerHTML = ''; // Clear suggestions after selection
                        if (onSelection) {
                            const { builder, gmEmail } = await onSelection(suggestion);
                            updateTemplateText(suggestion, builder, gmEmail);
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
        
        <h2>To: Subcontractors</h2>
        <div id="subcontractorEmailContainer"></div>
        <p><strong>Subject:</strong> New Community | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
        
        <p>Kind regards,<br>Vanir Installed Sales Team</p>
        <img src="/Logo.jpg" alt="Vanir Installed Sales Logo" style="width: 150px; margin-top: 10px;">
    `;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;

    const subdivisionInputWrapper = createAutocompleteInput("Enter Bid Name", [], fetchDetailsByBidName);
    const subcontractorInputWrapper = createAutocompleteInput("Enter Subcontractor Email", []);
    emailContainer.prepend(subdivisionInputWrapper);
    document.getElementById("subcontractorEmailContainer").appendChild(subcontractorInputWrapper);
}

// Fetch bid names and subcontractor emails, then update autocomplete inputs
async function fetchAndUpdateAutocomplete() {
    await fetchBidNameSuggestions();
    await fetchSubcontractorEmailSuggestions();
    
    const emailContainer = document.getElementById('emailTemplate');

    const bidAutocompleteInput = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, fetchDetailsByBidName);
    emailContainer.replaceChild(bidAutocompleteInput, emailContainer.firstChild);

    const subcontractorEmailInput = createAutocompleteInput("Enter Subcontractor Email", subcontractorEmailSuggestions);
    document.getElementById("subcontractorEmailContainer").replaceChild(subcontractorEmailInput, document.getElementById("subcontractorEmailContainer").firstChild);

    // Enable both inputs after data is fetched
    bidAutocompleteInput.querySelector('input').disabled = false;
    subcontractorEmailInput.querySelector('input').disabled = false;
}

// On DOMContentLoaded, display email content first, then fetch data in the background
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
    fetchAndUpdateAutocomplete();
});
