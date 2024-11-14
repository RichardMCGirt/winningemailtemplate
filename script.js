// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const bidBaseName = 'appi4QZE0SrWI6tt2';
const bidTableName = 'tblQo2148s04gVPq1';
const subcontractorBaseName = 'applsSm4HgPspYfrg';
const subcontractorTableName = 'tblX03hd5HX02rWQu';

let bidNameSuggestions = [];
let subcontractorSuggestions = []; // Stores { companyName, email } for mapping


// Display Loading Animation
function showLoadingAnimation() {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loadingOverlay";
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <p>Loading... </p>
            <p id="loadingPercentage">0%</p>
            <div class="loading-bar">
                <div class="loading-progress" id="loadingProgress"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

// Update Loading Progress
function updateLoadingProgress(percentage) {
    const loadingPercentage = document.getElementById("loadingPercentage");
    const loadingProgress = document.getElementById("loadingProgress");
    loadingPercentage.textContent = `${percentage}%`;
    loadingProgress.style.width = `${percentage}%`;
}

// Hide Loading Animation
function hideLoadingAnimation() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Fetch data from Airtable with loading progress
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

// Fetch "Subcontractor Company Name" and "Subcontractor Email" suggestions
async function fetchSubcontractorSuggestions() {
    const records = await fetchAirtableData(subcontractorBaseName, subcontractorTableName, 'Subcontractor Company Name');
    subcontractorSuggestions = records
        .map(record => ({
            companyName: record.fields['Subcontractor Company Name'],
            email: record.fields['Subcontractor Email']
        }))
        .filter(suggestion => suggestion.companyName && suggestion.email);
}

// Fetch builder and GM Email by "Bid Name"
async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Builder', filterFormula);

    if (records.length) {
        const builder = records[0].fields['Builder'];
        const gmEmail = records[0].fields['GM Email'] || "Branch Staff@Vanir.com";
        return { builder, gmEmail };
    } else {
        return { builder: '', gmEmail: 'Branch Staff@Vanir.com' };
    }
}

// Update function for handling selection of company name and displaying the corresponding email
function updateSubcontractorEmail(companyName) {
    const subcontractor = subcontractorSuggestions.find(sub => sub.companyName.toLowerCase() === companyName.toLowerCase());
    document.getElementById('subcontractorEmailInput').textContent = subcontractor ? subcontractor.email : "Email not found";
}

// Modified createAutocompleteInput function to use the new update function
function createAutocompleteInput(placeholder, suggestions, onSelection) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("autocomplete-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.classList.add("autocomplete-input");
    input.disabled = true; // Disable initially, enabled later

    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    // Display dropdown suggestions on input
    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        if (inputValue) {
            const filteredSuggestions = suggestions.filter(item => {
                const text = typeof item === 'string' ? item : item.companyName;
                return text.toLowerCase().includes(inputValue);
            });

            filteredSuggestions.forEach(suggestion => {
                const option = document.createElement("div");
                option.classList.add("autocomplete-option");
                option.textContent = typeof suggestion === 'string' ? suggestion : suggestion.companyName;

                // On click, select suggestion and update the email display
                option.onclick = async () => {
                    input.value = option.textContent; // Set input value to selected suggestion
                    dropdown.innerHTML = ''; // Clear dropdown

                    if (typeof suggestion !== 'string') {
                        updateSubcontractorEmail(option.textContent); // Populate email in the h2 tag
                    }

                    // Fetch and update additional details for bid name suggestions
                    if (onSelection && typeof suggestion === 'string') {
                        const details = await onSelection(suggestion);
                        updateTemplateText(suggestion, details.builder, details.gmEmail);
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


// Select suggestion to update email field
function selectSuggestion(suggestion, input, dropdown) {
    input.value = suggestion.companyName;
    document.getElementById('subcontractorEmailInput').value = suggestion.email; // Populate the email input field
    dropdown.innerHTML = ''; // Clear dropdown after selection
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
        <h2>To: <span class="gmEmailContainer"></span>, purchasing@vanirinstalledsales.com, hunter@vanirinstalledsales.com</h2>
        <p>CC: Vendor</p>
        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Dear Team,</p>
        <p>We are excited to announce that we have won a new project in <strong><span class="subdivisionContainer"></span></strong> for <strong><span class="builderContainer"></span></strong>. Let's coordinate with the relevant vendors and ensure a smooth project initiation.</p><br>
        <hr>
<div class="email-row">
    <h2>To:</h2>
    <h2 id="subcontractorEmailInput" class="autocomplete-input">Subcontractor Email</h2>
</div>

        <div id="subcontractorCompanyContainer"></div>
        
        <p><strong>Subject:</strong> New Community | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
        
        <p>Kind regards,<br>Vanir Installed Sales Team</p>
    `;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;

    const subdivisionInputWrapper = createAutocompleteInput("Enter Bid Name", [], fetchDetailsByBidName);
    emailContainer.prepend(subdivisionInputWrapper);
}

async function sendEmail() {
    const emailContent = document.getElementById('emailTemplate').innerHTML; // HTML content from the template
    const recipientEmail = document.getElementById('subcontractorEmailInput').value;

    try {
        const response = await fetch('http://localhost:5001/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: recipientEmail,
                subject: 'Your Email Subject Here',
                htmlContent: emailContent,
            }),
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send email');
    }
}

document.getElementById('sendEmailButton').addEventListener('click', sendEmail);

function generateMailtoLink() {
    const emailContent = document.getElementById('emailTemplate').innerHTML;

    // Split content at <hr> or provide fallback
    const contentParts = emailContent.split('<hr>');
    const managementContent = contentParts[0] ? contentParts[0] : "Management email content missing";
    const subcontractorContent = contentParts[1] ? contentParts[1] : "Subcontractor email content missing";

    // Management team email details
    const gmEmail = document.querySelector('.gmEmailContainer').textContent.trim() || "purchasing@vanirinstalledsales.com";
    const ccEmails = "purchasing@vanirinstalledsales.com,hunter@vanirinstalledsales.com";
    const subdivision = document.querySelector('.subdivisionContainer').textContent.trim();
    const builder = document.querySelector('.builderContainer').textContent.trim();
    const managementSubject = `WINNING! | ${subdivision} | ${builder}`;
    
    // Subcontractor email details
    const subcontractorEmail = document.getElementById('subcontractorEmailInput').value || "purchasing@vanirinstalledsales.com";
    const subcontractorSubject = `New Community | ${builder} | ${subdivision}`;

    // Format content for each email
    const managementBody = `
    Dear Team,

    We are excited to announce that we have won a new project in ${subdivision} for ${builder}. 

    Let's coordinate with the relevant vendors and ensure a smooth project initiation.

    Best regards,
    
    Vanir Installed Sales Team
    `.replace(/\n\s+/g, '\n\n'); 

    const subcontractorBody = `
    We are thrilled to inform you that we have been awarded a new community, ${subdivision}, in collaboration with ${builder}. 

    We look forward to working together and maintaining high standards for this project.

    Best regards,
    
    Vanir Installed Sales Team
    `.replace(/\n\s+/g, '\n\n'); 

    // Construct Gmail URLs
    const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmEmail)}&cc=${encodeURIComponent(ccEmails)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;
    const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(subcontractorEmail)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;

    // Open two Gmail windows
    window.open(managementGmailLink);
    setTimeout(() => window.open(subcontractorGmailLink), 1000); // Small delay for user experience
}

document.getElementById('sendEmailButton2').addEventListener('click', generateMailtoLink);


// Fetch all data concurrently and update autocomplete inputs with a single loading bar
async function fetchAndUpdateAutocomplete() {
    showLoadingAnimation();

    // Fetch both bid names and subcontractors concurrently
    const fetchTasks = [fetchBidNameSuggestions(), fetchSubcontractorSuggestions()];

    // Update loading progress as each fetch completes (50% on each)
    await Promise.all(fetchTasks.map((task, index) =>
        task.then(() => {
            const percentage = (index + 1) * 50;
            updateLoadingProgress(percentage);
        })
    ));

    hideLoadingAnimation(); // Hide loading animation after data is fetched

    const emailContainer = document.getElementById('emailTemplate');

    const bidAutocompleteInput = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, fetchDetailsByBidName);
    emailContainer.replaceChild(bidAutocompleteInput, emailContainer.firstChild);

    const subcontractorAutocompleteInput = createAutocompleteInput("Enter Subcontractor Company Name", subcontractorSuggestions, () => {});
    document.getElementById("subcontractorCompanyContainer").appendChild(subcontractorAutocompleteInput);

    // Enable both inputs after data is fetched
    bidAutocompleteInput.querySelector('input').disabled = false;
    subcontractorAutocompleteInput.querySelector('input').disabled = false;
}


// Load the email content and start fetching data with loading animation on page load
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
    fetchAndUpdateAutocomplete();
});

// Styles for the loading animation
const style = document.createElement("style");
style.innerHTML = `
    #loadingOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .loading-content {
        text-align: center;
        font-size: 18px;
    }
    .loading-bar {
        width: 100%;
        height: 10px;
        background: #ddd;
        margin-top: 10px;
        border-radius: 5px;
    }
    .loading-progress {
        height: 100%;
        background: #4caf50;
        width: 0;
        border-radius: 5px;
    }
`;
document.head.appendChild(style);