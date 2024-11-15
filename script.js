// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const bidBaseName = 'appi4QZE0SrWI6tt2';
const bidTableName = 'tblQo2148s04gVPq1';
const subcontractorBaseName = 'applsSm4HgPspYfrg';
const subcontractorTableName = 'tblX03hd5HX02rWQu';
const VendorBaseName = 'appeNSp44fJ8QYeY5';
const VendorTableName = 'tblLEYdDi0hfD9fT3';
// Google API Key
const googleApiKey = "AIzaSyAe4p3dK30Kb3YHK5cnz8CQMS18wKeCOeM";
let bidNameSuggestions = [];
let subcontractorSuggestions = []; // Stores { companyName, email } for mapping
let vendorSuggestions = []; // Store vendor names


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

    // Update the text and width dynamically
    if (loadingPercentage) {
        loadingPercentage.textContent = `${percentage}%`; // Use backticks for template literals
    }

    if (loadingProgress) {
        loadingProgress.style.width = `${percentage}%`; // Use backticks for template literals
    }
}


// Hide Loading Animation
function hideLoadingAnimation() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Fetch "Vendor Name" suggestions
async function fetchVendorSuggestions() {
    console.log("Starting fetch for vendor suggestions...");
    
    try {
        const records = await fetchAirtableData(VendorBaseName, VendorTableName, 'Name');
        console.log("Fetched records from Airtable:", records);
        
        vendorSuggestions = records.map(record => record.fields['Name']).filter(Boolean);
        console.log("Extracted vendor names:", vendorSuggestions);
        
    } catch (error) {
        console.error("Error fetching vendor suggestions:", error);
    }
    
    console.log("Vendor suggestions fetch complete.");
}

// Function to create an autocomplete input with dropdown suggestions for vendor names
function createVendorAutocompleteInput() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("vendor-input-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter Vendor Name";
    input.classList.add("vendor-input");

    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    // Delete button for the input box
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");
    deleteButton.onclick = () => {
        wrapper.remove();
        console.log("Vendor input box removed.");
    };

    // Event listener to show suggestions in the dropdown as user types
    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        console.log("User input:", inputValue); // Debugging input value

        if (inputValue) {
            const filteredSuggestions = vendorSuggestions.filter(vendor =>
                vendor.toLowerCase().includes(inputValue)
            );

            console.log("Filtered suggestions:", filteredSuggestions); // Debugging filtered suggestions

            filteredSuggestions.forEach(suggestion => {
                const option = document.createElement("div");
                option.classList.add("autocomplete-option");
                option.textContent = suggestion;

                // Set selected suggestion to input and add to container on click
                option.onclick = () => {
                    input.value = suggestion; // Set input value to selected suggestion
                    console.log("Selected suggestion:", suggestion); // Debugging selected suggestion
                    dropdown.innerHTML = ''; // Clear dropdown after selection
                    addVendorToContainer(suggestion); // Add selected vendor to container
                    input.value = ''; // Clear input for additional entries
                };

                dropdown.appendChild(option);
            });

            // Show dropdown if suggestions are available, otherwise hide it
            dropdown.style.display = filteredSuggestions.length > 0 ? 'block' : 'none';
        } else {
            dropdown.style.display = 'none';
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    wrapper.appendChild(deleteButton);
    return wrapper;
}


// Function to add the selected vendor to the display container
function addVendorToContainer(vendorName) {
    const vendorContainer = document.querySelector('.VendoeContainer');
    const vendorEntry = document.createElement("p");
    vendorEntry.classList.add("vendor-entry");
    vendorEntry.textContent = vendorName;
    vendorContainer.appendChild(vendorEntry);

    console.log("Vendor added to container:", vendorName); // Debugging added vendor
}

// Initialize vendor input area with one input field and a button to add more
function initializeVendorInputArea() {
    const vendorContainer = document.getElementById('vendorInputContainer');
    vendorContainer.appendChild(createVendorAutocompleteInput());

    const addButton = document.createElement("button");
    addButton.textContent = "Add Another Vendor";
    addButton.onclick = () => vendorContainer.appendChild(createVendorAutocompleteInput());
    vendorContainer.appendChild(addButton);
}


// Fetch data from Airtable with detailed logging and loading progress
async function fetchAirtableData(baseId, tableName, fieldName, filterFormula = '') {
    let allRecords = [];
    let offset = null;
    let iteration = 0;

    console.log(`Fetching data from Airtable: Base ID: ${baseId}, Table Name: ${tableName}, Field: ${fieldName}`);
    console.log(`Filter Formula: ${filterFormula ? filterFormula : 'None'}`);

    do {
        let url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        if (filterFormula) url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
        if (offset) url += `${filterFormula ? '&' : '?'}offset=${offset}`;

        console.log(`Iteration ${++iteration}: Fetching from URL: ${url}`);

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                },
            });

            if (!response.ok) {
                console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
                console.error(`Failed URL: ${url}`);
                return [];
            }

            const data = await response.json();
            console.log(`Iteration ${iteration}: Retrieved ${data.records.length} records.`);
            allRecords = allRecords.concat(data.records);

            if (data.offset) {
                console.log(`Iteration ${iteration}: More records available, moving to next offset.`);
            } else {
                console.log(`Iteration ${iteration}: No more records. Fetch complete.`);
            }

            offset = data.offset; // Continue pagination if offset exists
        } catch (error) {
            console.error(`Iteration ${iteration}: Error occurred during fetch: ${error.message}`);
            console.error(`Failed URL: ${url}`);
            console.error(error);
            return [];
        }
    } while (offset);

    console.log(`Total records fetched: ${allRecords.length}`);
    console.log(`Field Data Extracted (${fieldName}):`, allRecords.map(record => record.fields[fieldName]));

    return allRecords;
}



// Fetch "Bid Name" suggestions
async function fetchBidNameSuggestions() {
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Bid Name', "{Outcome}='Win'");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
}

// Modify fetchSubcontractorSuggestions to accept a branch filter
async function fetchSubcontractorSuggestions(branchFilter) {
    const filterFormula = {Branch} = "${branchFilter}";
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

    if (records.length > 0) {
        const fields = records[0].fields;
        const builder = fields['Builder'] || 'Unknown Builder';
        const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : "Branch Staff@Vanir.com";
        const branch = fields['Branch'] || fields['Vanir Offices copy'] || 'Unknown Branch';
        const briqProjectType = fields['Project Type'] ? fields['Project Type'][0] : 'Single Family';

        // Update the email template
        updateTemplateText(bidName, builder, gmEmail, branch, briqProjectType);

        // Fetch and update subcontractor suggestions
        await fetchSubcontractorSuggestions(branch);
        updateSubcontractorAutocomplete();

        // Update city information
        await updateCityForSubdivision();

        return { builder, gmEmail, branch, briqProjectType };
    } else {
        console.warn("No records found for bid:", bidName);
        return {
            builder: 'Unknown Builder',
            gmEmail: 'Branch Staff@Vanir.com',
            branch: 'Unknown Branch',
            briqProjectType: 'Single Family'
        };
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
        nameColonSpan.textContent = `${sub.companyName} : `;

        const emailSpan = document.createElement("span");
        emailSpan.classList.add("email");
        emailSpan.textContent = sub.email;

        // Append the spans to the list item
        emailItem.appendChild(nameColonSpan);
        emailItem.appendChild(emailSpan);

        // Append the list item to the email list
        emailList.appendChild(emailItem);
    });

    // Append the complete email list to the container
    subcontractorContainer.appendChild(emailList);
}

// Function to create a unified autocomplete input
function createAutocompleteInput(placeholder, suggestions, type, onSelection) {
    // Check if type is valid
    if (typeof type !== "string" || !type.trim()) {
        console.error("Invalid type provided for createAutocompleteInput:", type);
        return null;
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add(`${type}-autocomplete-wrapper`, "autocomplete-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.classList.add(`${type}-autocomplete-input`, "autocomplete-input");

    const dropdown = document.createElement("div");
    dropdown.classList.add(`${type}-autocomplete-dropdown`, "autocomplete-dropdown");

    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        const filteredSuggestions = suggestions.filter(item => {
            const text = typeof item === 'string' ? item : item.companyName;
            return text.toLowerCase().includes(inputValue);
        });

        filteredSuggestions.forEach(suggestion => {
            const option = document.createElement("div");
            option.classList.add(`${type}-autocomplete-option`, "autocomplete-option");
            option.textContent = typeof suggestion === 'string' ? suggestion : suggestion.companyName;

            option.onclick = () => {
                input.value = option.textContent;
                dropdown.innerHTML = '';
                if (onSelection) onSelection(suggestion);
            };

            dropdown.appendChild(option);
        });

        dropdown.style.display = filteredSuggestions.length > 0 ? 'block' : 'none';
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
            if (data.results && data.results.length > 0) {
                const formattedAddress = data.results[0].formatted_address;
                const city = formattedAddress.split(", ")[1] || "Unknown City";
                console.log("City extracted:", city);
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




function displayEmailContent() {
    const emailContent = `
        <h2>To: purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, hunter@vanirinstalledsales.com, <span class="gmEmailContainer"></span></h2>
        <p>CC: Vendor</p>
        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Dear Team,</p>
        <p>All - I am excited to announce that we have been awarded <strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>.</p>
        <p>This will be <strong><span class="briqProjectTypeContainer"></span></strong>.</p>
        <h3>Here's the breakdown:</h3>
        <div id="vendorInputContainer"></div>
        <div class="VendoeContainer"></div>
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

    const subcontractorEmails = subcontractorSuggestions.map(suggestion => suggestion.email).join(',');

    const subdivision = document.querySelector('.subdivisionContainer').textContent.trim();
    const builder = document.querySelector('.builderContainer').textContent.trim();
    const gmEmail = document.querySelector('.gmEmailContainer').textContent.trim() || "purchasing@vanirinstalledsales.com";
    const ccEmails = "purchasing@vanirinstalledsales.com,hunter@vanirinstalledsales.com";

    const managementSubject = `WINNING! | ${subdivision} | ${builder}`;
    const subcontractorSubject = `New Community | ${builder} | ${subdivision}`;

    const managementBody = `
    Dear Team,

    We are excited to announce that we have won a new project in ${subdivision} for ${builder}. 

    Let's coordinate with the relevant vendors and ensure a smooth project initiation.

    Best regards,
    
    Vanir Installed Sales Team
    `.trim();

    const subcontractorBody = `
    We are thrilled to inform you that we have been awarded a new community, ${subdivision}, in collaboration with ${builder}. 

    We look forward to working together and maintaining high standards for this project.

    Best regards,
    
    Vanir Installed Sales Team
    `.trim();

    const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmEmail)}&cc=${encodeURIComponent(ccEmails)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;
    const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(subcontractorEmails)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;

    window.open(managementGmailLink);
    setTimeout(() => window.open(subcontractorGmailLink), 1000);
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

    // Correctly pass "bid" as the type
    const bidAutocompleteInput = createAutocompleteInput(
        "Enter Bid Name",
        bidNameSuggestions,
        "bid", // Pass a string as type
        fetchDetailsByBidName
    );
    emailContainer.prepend(bidAutocompleteInput);

    // Enable bid name input after loading
    bidAutocompleteInput.querySelector('input').disabled = false;
}


// Initialize bid and vendor autocomplete
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch suggestions
    await fetchBidNameSuggestions();
    await fetchVendorSuggestions();
        initializeVendorInputArea(); // Set up initial input area


    // Initialize autocomplete for bid names
    const bidContainer = document.getElementById('bidInputContainer');
    if (bidContainer) {
        const bidInput = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, "bid", fetchDetailsByBidName);
        bidContainer.appendChild(bidInput);
    } else {
        console.error("Bid container not found.");
    }

    // Initialize autocomplete for vendor names
    const vendorContainer = document.getElementById('vendorInputContainer');
    if (vendorContainer) {
        const vendorInput = createAutocompleteInput("Enter Vendor Name", vendorSuggestions, "vendor", addVendorToContainer);
        vendorContainer.appendChild(vendorInput);
    } else {
        console.error("Vendor container not found.");
    }
});

// Fetch vendors on page load and initialize input area
document.addEventListener('DOMContentLoaded', async () => {
    initializeVendorInputArea(); // Set up initial input area
});

// Load the email content and start fetching bid name suggestions on page load
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
    fetchAndUpdateAutocomplete();
    
});