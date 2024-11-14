// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const bidBaseName = 'appi4QZE0SrWI6tt2';
const bidTableName = 'tblQo2148s04gVPq1';
const subcontractorBaseName = 'applsSm4HgPspYfrg';
const subcontractorTableName = 'tblX03hd5HX02rWQu';
// Google API Key
const googleApiKey = "AIzaSyAe4p3dK30Kb3YHK5cnz8CQMS18wKeCOeM";
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
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Bid Name', "{Outcome}='Win'");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
}

// Modify fetchSubcontractorSuggestions to accept a branch filter
async function fetchSubcontractorSuggestions(branchFilter) {
    const filterFormula = `{Branch} = "${branchFilter}"`;
    const records = await fetchAirtableData(subcontractorBaseName, subcontractorTableName, 'Subcontractor Company Name', filterFormula);
    subcontractorSuggestions = records
        .map(record => ({
            companyName: record.fields['Subcontractor Company Name'],
            email: record.fields['Subcontractor Email']
        }))
        .filter(suggestion => suggestion.companyName && suggestion.email);
}

// Function to update the city in the branchContainer after subdivision changes
async function updateCityForSubdivision() {
    const subdivisionElement = document.querySelector('.subdivisionContainer');
    const subdivisionName = subdivisionElement ? subdivisionElement.textContent.trim() : "";

    if (subdivisionName) {
        const city = await fetchCityBySubdivision(subdivisionName);
        const branchContainer = document.querySelector('.branchContainer');
        
        if (branchContainer) {
            branchContainer.textContent = city;
            console.log("Branch container updated with city:", city); // For debugging
        } else {
            console.error("Branch container element not found.");
        }
    }
}


// Fetch bid details and update city based on subdivision
async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Builder', filterFormula);

    if (records.length) {
        const fields = records[0].fields;
        const builder = fields['Builder'] || 'Unknown Builder';
        const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : "Branch Staff@Vanir.com";
        const branch = fields['Branch'] || fields['Vanir Offices copy'] || 'Unknown Branch';
        const briqProjectType = fields['Project Type'] ? fields['Project Type'][0] : 'Single Family';

        // Update email template with bid details
        updateTemplateText(bidName, builder, gmEmail, branch, briqProjectType);

        // Fetch subcontractors based on branch and update suggestions
        await fetchSubcontractorSuggestions(branch);
        updateSubcontractorAutocomplete();

        // Update city in branchContainer
        await updateCityForSubdivision();

        return { builder, gmEmail, branch, briqProjectType };
    } else {
        return { builder: '', gmEmail: 'Branch Staff@Vanir.com', branch: 'Unknown Branch', briqProjectType: 'Single Family' };
    }
}



// Function to update subcontractor autocomplete input and display all emails in UI
function updateSubcontractorAutocomplete() {
    const subcontractorContainer = document.getElementById("subcontractorCompanyContainer");
    subcontractorContainer.innerHTML = ''; // Clear previous content


    // Display all subcontractor emails in a formatted list
    const emailList = document.createElement("ul");
    subcontractorSuggestions.forEach(sub => {
        const emailItem = document.createElement("li");

        // Create separate spans for alignment
        const nameColonSpan = document.createElement("span");
        nameColonSpan.classList.add("name-colon");
        nameColonSpan.textContent = `${sub.companyName} :`;

        const emailSpan = document.createElement("span");
        emailSpan.classList.add("email");
        emailSpan.textContent = sub.email;

        emailItem.appendChild(nameColonSpan);
        emailItem.appendChild(emailSpan);
        emailList.appendChild(emailItem);
    });
    subcontractorContainer.appendChild(emailList);

    // Enable the subcontractor input field
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

// In the updateTemplateText function:
function updateTemplateText(subdivision, builder, gmEmail, branch, briqProjectType) {
    console.log('Updating Template Text:', { subdivision, builder, gmEmail, branch, briqProjectType }); // Debugging log
    
    if (subdivision) {
        document.querySelectorAll('.subdivisionContainer').forEach(el => el.textContent = subdivision);
    }
    if (builder) {
        document.querySelectorAll('.builderContainer').forEach(el => el.textContent = builder);
    }
    if (gmEmail) {
        document.querySelectorAll('.gmEmailContainer').forEach(el => el.textContent = gmEmail);
    }
  
    if (briqProjectType) {
        document.querySelectorAll('.briqProjectTypeContainer').forEach(el => el.textContent = briqProjectType);
    }

    console.log('Template updated with:', { subdivision, builder, gmEmail, branch, briqProjectType });
}

async function fetchCityBySubdivision(subdivisionName) {
    try {
        const response = await fetch(`http://localhost:6005/api/placeSearch?query=${encodeURIComponent(subdivisionName)}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Google Places API response:", data); // For debugging
            
            if (data.results && data.results.length > 0) {
                // Extract city from the formatted address
                const formattedAddress = data.results[0].formatted_address;
                const addressComponents = formattedAddress.split(", ");
                const city = addressComponents.length >= 2 ? addressComponents[1] : "Unknown City";
                
                console.log("City extracted:", city); // For debugging
                return city;
            } else {
                console.warn("No results found for subdivision:", subdivisionName);
                return "Unknown City";
            }
        } else {
            console.error("Error fetching city:", response.statusText);
            return "Unknown City";
        }
    } catch (error) {
        console.error("Error fetching city:", error);
        return "Unknown City";
    }
}





// Monitor subdivisionContainer for changes and trigger city lookup
function monitorSubdivisionChanges() {
    const subdivisionElement = document.querySelector('.subdivisionContainer');
    
    // Check if subdivisionElement exists before setting up observer
    if (subdivisionElement) {
        const observer = new MutationObserver(async () => {
            await updateCityForSubdivision();
        });
        
        observer.observe(subdivisionElement, { childList: true, characterData: true, subtree: true });
    } else {
        console.error("Element '.subdivisionContainer' not found. Cannot observe changes.");
    }
}

// Initialize monitoring on page load
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
    monitorSubdivisionChanges();
});




// Updated email content display function
function displayEmailContent() {
    const emailContent = `
        <h2>To:  purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, hunter@vanirinstalledsales.com, <span class="gmEmailContainer"></span></h2>
        <p>CC: Vendor</p>
        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Dear Team,</p>
        <p>All - I am excited to announce that we have been awarded <strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>.</p>
        <p>This will be <strong><span class="briqProjectTypeContainer"></span></strong>.</p>
        <hr>

        <div id="subcontractorCompanyContainer"></div>

      

        <p><strong>Subject:</strong> New Community | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>

        <p>Kind regards,<br>Vanir Installed Sales Team</p>
    `;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;


    
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

    // Gather all subcontractor emails
    const subcontractorEmails = subcontractorSuggestions.map(suggestion => suggestion.email).join(',');

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
    const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(subcontractorEmails)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;

    // Open two Gmail windows
    window.open(managementGmailLink);
    setTimeout(() => window.open(subcontractorGmailLink), 1000); // Small delay for user experience
}

document.getElementById('sendEmailButton2').addEventListener('click', generateMailtoLink);


// Fetch all bid names on page load, but subcontractors only after a bid is chosen
async function fetchAndUpdateAutocomplete() {
    showLoadingAnimation();

    // Fetch bid names only (no subcontractors yet)
    await fetchBidNameSuggestions();
    updateLoadingProgress(50);

    hideLoadingAnimation();

    const emailContainer = document.getElementById('emailTemplate');
    const bidAutocompleteInput = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, fetchDetailsByBidName);
    emailContainer.prepend(bidAutocompleteInput);

    // Enable bid name input after loading
    bidAutocompleteInput.querySelector('input').disabled = false;
}


// Load the email content and start fetching bid name suggestions on page load
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