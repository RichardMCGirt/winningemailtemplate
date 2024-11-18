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

let bidLoadingProgress = 0;
let vendorLoadingProgress = 0;
let totalLoadingProgress = 0;

const MAX_PROGRESS = 100;

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

    if (loadingPercentage) {
        loadingPercentage.textContent = `${percentage}%`;
    }

    if (loadingProgress) {
        loadingProgress.style.width = `${percentage}%`;
    }
}

// Hide Loading Animation
function hideLoadingAnimation() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Simulate Live Progress Updates (e.g., for data loading)
function simulateLiveProgressUpdates() {
    let percentage = 0;

    const interval = setInterval(() => {
        percentage += 10; // Increase progress by 5%
        
        // Update loading progress
        updateLoadingProgress(percentage);

        // If the progress reaches 100%, stop the interval and hide the loading overlay
        if (percentage >= 100) {
            clearInterval(interval);
            hideLoadingAnimation();
        }
    }, 500); // Update every 500ms
}

// Start the process on page load or when you want to trigger it
document.addEventListener('DOMContentLoaded', () => {
    showLoadingAnimation();  // Show the loading animation
    simulateLiveProgressUpdates();  // Start live progress updates
});

// Fetch "Bid Name" suggestions
async function fetchBidSuggestions() {
    try {
        const records = await fetchAirtableData(bidBaseName, bidTableName, 'Bid Name', "{Outcome}='Win'");
        bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
        
        // Simulate progress update for bid fetching
        bidLoadingProgress = 55;
        totalLoadingProgress = Math.round((bidLoadingProgress + vendorLoadingProgress) / 2);  // Average of both progress
        updateLoadingProgress(totalLoadingProgress);
        console.log("Bid suggestions fetched", bidNameSuggestions);
    } catch (error) {
        console.error("Error fetching bid suggestions:", error);
    }
}

// Fetch "Vendor Name" suggestions
async function fetchVendorSuggestions() {
    try {
        const records = await fetchAirtableData(VendorBaseName, VendorTableName, 'Name');
        vendorSuggestions = records.map(record => record.fields['Name']).filter(Boolean);
        
        // Simulate progress update for vendor fetching
        vendorLoadingProgress = 45;  // After fetching bids, vendor progress is set to 45%
        totalLoadingProgress = Math.round((bidLoadingProgress + vendorLoadingProgress) / 2);  // Average progress
        updateLoadingProgress(totalLoadingProgress);
        console.log("Vendor suggestions fetched", vendorSuggestions);
    } catch (error) {
        console.error("Error fetching vendor suggestions:", error);
    }
}

// Function to create vendor autocomplete input
function createVendorAutocompleteInput() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("vendor-input-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter Vendor Name";
    input.classList.add("vendor-autocomplete-input", "autocomplete-input");

    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    // Event listener for showing suggestions in the dropdown as the user types
    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        if (inputValue) {
            const filteredSuggestions = vendorSuggestions.filter(vendor =>
                vendor.toLowerCase().includes(inputValue)
            );

            filteredSuggestions.forEach(suggestion => {
                const option = document.createElement("div");
                option.classList.add("autocomplete-option");
                option.textContent = suggestion;

                // When a user clicks on a suggestion, add it to the vendor list and clear input
                option.onclick = () => {
                    // Check if the vendor is already in the container
                    const existingVendor = document.querySelectorAll('.vendor-entry').some(entry => entry.textContent === suggestion);

                    if (!existingVendor) {
                        // Add selected vendor to container
                        addVendorToContainer(suggestion);

                        // Remove the selected vendor from the suggestions list
                        vendorSuggestions = vendorSuggestions.filter(vendor => vendor !== suggestion);

                        // Clear the input field
                        clearVendorInput(input);
                        refreshPage();

                    } else {
                        alert("This vendor is already added.");
                    }

                    // Save data to localStorage and refresh the page
                    saveDataToLocalStorage();
                    // Optionally you can trigger a page refresh here if needed
                     refreshPage();
                };

                dropdown.appendChild(option);
            });

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
    return wrapper;
}

// Trigger a page refresh after adding a vendor
function refreshPage() {
    location.reload(); // Reload the page to clear input fields and restore saved data
}


// Add the selected vendor to the container and clear the input
function addVendorToContainer(vendorName) {
    console.log("Adding vendor:", vendorName);

    const vendorContainer = document.querySelector('.VendoeContainer');

    // Check if the container exists
    if (!vendorContainer) {
        console.error("Vendor container not found.");
        return;
    }

    console.log("Vendor container found:", vendorContainer);

    // Create a container for the vendor entry
    const vendorEntryWrapper = document.createElement("div");
    vendorEntryWrapper.classList.add("vendor-entry-wrapper");

    // Create a paragraph for the vendor name
    const vendorEntry = document.createElement("p");
    vendorEntry.classList.add("vendor-entry");
    vendorEntry.textContent = vendorName;

    console.log("Created vendor entry element:", vendorEntry);

    // Create a delete button for the vendor entry
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-vendor-button");
    deleteButton.onclick = () => {
        console.log("Delete button clicked for vendor:", vendorName);

        // Remove the vendor entry
        vendorEntryWrapper.remove();

        // Add the vendor back to suggestions list (if needed)
        vendorSuggestions.push(vendorName);

        console.log("Vendor added back to suggestions:", vendorName);

        // Save updated data to localStorage
        saveDataToLocalStorage();
    };

    console.log("Delete button created:", deleteButton);

    // Append vendor entry and delete button
    vendorEntryWrapper.appendChild(vendorEntry);
    vendorEntryWrapper.appendChild(deleteButton);

    console.log("Appended vendor entry and delete button to wrapper:", vendorEntryWrapper);

    // Append to vendor container
    vendorContainer.appendChild(vendorEntryWrapper);
    console.log(`Vendor "${vendorName}" added to container.`);

    // Save data to localStorage after adding the vendor
    saveDataToLocalStorage();

    // Select the correct input field to clear (ensure we are targeting the right element)
    const inputField = document.querySelector('.vendor-autocomplete-input');

    if (inputField) {
        console.log("Input field value before clearing:", inputField.value);

        // Clear the input field
        inputField.value = '';

        // Log after clearing to confirm input value is reset
        console.log("Input field value after clearing:", inputField.value);

        // Reset the placeholder
        inputField.placeholder = 'Enter Vendor Name';

        // Log the placeholder value
        console.log("Input field placeholder after reset:", inputField.placeholder);
    } else {
        console.error("Input field not found for clearing.");
    }

    // Check if the input field is still holding the old value and log it after a delay
    setTimeout(() => {
        const postClearInputField = document.querySelector('.vendor-autocomplete-input');
        console.log("After clearing input, current value (after delay):", postClearInputField ? postClearInputField.value : "Input field not found");
    }, 100);
}




// Function to clear vendor input field
function clearVendorInput(inputField) {
    if (inputField) {
        inputField.value = ''; // Clear the input field
        inputField.placeholder = 'Enter Vendor Name'; // Reset the placeholder
        console.log("Vendor input field cleared successfully.");
    } else {
        console.error("Input field is null or undefined, cannot clear.");
    }
}







// Simulate loading step by step, showing progress incrementally
async function startLoadingProcess() {
    await fetchBidSuggestions();
    await fetchVendorSuggestions();

    // Once everything is loaded, enable the vendor input and populate from localStorage
    const vendorInput = document.querySelector('.vendor-input');
    if (vendorInput) {
        vendorInput.disabled = false;
    }

    // Load data from localStorage to populate the page
    loadDataFromLocalStorage();

    // Complete loading and hide the loading animation
    hideLoadingAnimation();
}

document.addEventListener('DOMContentLoaded', async () => {
    startLoadingProcess(); // Trigger loading process after page load
});

// Initialize the vendor input area with a new input field
function initializeVendorInputArea() {
    
    // Add the new input element for vendor name
    const vendorInputField = createVendorAutocompleteInput();
}

// Save bid name and added vendors to localStorage
function saveDataToLocalStorage() {
    const addedVendors = Array.from(document.querySelectorAll('.vendor-entry')).map(entry => entry.textContent); // Get the added vendors from the DOM

    localStorage.setItem('addedVendors', JSON.stringify(addedVendors)); // Store added vendors as JSON string
}

// Load saved bid name and vendors from localStorage
function loadDataFromLocalStorage() {
    const selectedBidName = localStorage.getItem('selectedBidName');
    const addedVendors = JSON.parse(localStorage.getItem('addedVendors')) || [];

    // Pre-fill bid name input
    if (selectedBidName) {
        document.querySelector('.bid-name-input').value = selectedBidName;
    }

    // Pre-fill the added vendors
    const vendorContainer = document.querySelector('.VendoeContainer');
    addedVendors.forEach(vendor => {
        const vendorEntry = document.createElement('div');
        vendorEntry.classList.add('vendor-entry-wrapper');
        
        const vendorText = document.createElement('p');
        vendorText.classList.add('vendor-entry');
        vendorText.textContent = vendor;

        vendorEntry.appendChild(vendorText);
        vendorContainer.appendChild(vendorEntry);
    });
}




// Clear input boxes and load new data
function refreshPage() {
    // Clear the input fields
    document.querySelector('.vendor-autocomplete-input').value = '';  // Clear the vendor input field

    // Save data to localStorage
    saveDataToLocalStorage();
    
    // Reload the page
    location.reload();  // Refresh the page to clear the inputs
}




// Simulate loading step by step, showing progress incrementally
async function startLoadingProcess() {

    // Step 1: Load bids
    await fetchBidSuggestions();
    
    // Step 2: Load vendors (after bids are loaded)
    await fetchVendorSuggestions();

    // Once everything is loaded, we can enable the vendor input
    const vendorInput = document.querySelector('.vendor-input');
    if (vendorInput) {
        vendorInput.disabled = false;  // Enable vendor input after all data is loaded
    }

    // Complete loading and hide the loading animation
    hideLoadingAnimation();
}

document.addEventListener('DOMContentLoaded', async () => {
    startLoadingProcess();  // Trigger loading process after page load
});



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
    if (!branchFilter) {
        console.error("Branch filter is missing.");
        return;
    }

    // Properly interpolate the branchFilter value
    const filterFormula = `{Branch} = "${branchFilter}"`;
    try {
        const records = await fetchAirtableData(
            subcontractorBaseName,
            subcontractorTableName,
            'Subcontractor Company Name, Subcontractor Email',
            filterFormula
        );

        subcontractorSuggestions = records
            .map(record => ({
                companyName: record.fields['Subcontractor Company Name'],
                email: record.fields['Subcontractor Email']
            }))
            .filter(suggestion => suggestion.companyName && suggestion.email);

        console.log("Subcontractor suggestions:", subcontractorSuggestions);
    } catch (error) {
        console.error("Error fetching subcontractor suggestions:", error);
    }
}


let cityUpdated = false;  // Flag to track if the city has been updated

async function updateCityForSubdivision() {
    const subdivisionElement = document.querySelector('.subdivisionContainer');
    const subdivisionName = subdivisionElement ? subdivisionElement.textContent.trim() : "";

    if (subdivisionName && !cityUpdated) {  // Check if city is not yet updated
        const branchContainer = document.querySelector('.branchContainer');

        if (branchContainer) {
            branchContainer.textContent = city;  // Set only the city
            console.log("Branch container updated with city:", city);
            cityUpdated = true;  // Mark that the city has been updated
        } else {
            console.error("Branch container element not found.");
        }
    }
}






// Fetch bid details and update city based on subdivision
async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Builder, Project Type', filterFormula);

    if (records.length > 0) {
        const fields = records[0].fields;
        const builder = fields['Builder'] || 'Unknown Builder';
        const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : "Branch Staff@Vanir.com";
        const branch = fields['Branch'] || fields['Vanir Offices copy'] || 'Unknown Branch';
        const projectType = fields['Project Type'] || 'Default Project Type'; // Define projectType

        const materialType = fields['Material Type'] || 'General Materials';

        // Update the email template
        updateTemplateText(bidName, builder, gmEmail, branch, projectType, materialType);

        // Fetch and update subcontractor suggestions
        await fetchSubcontractorSuggestions(branch);
        updateSubcontractorAutocomplete();

        // Update city information
        await updateCityForSubdivision();

        return { builder, gmEmail, branch, projectType, materialType };
    } else {
        console.warn("No records found for bid:", bidName);
        return {
            builder: 'Unknown Builder',
            gmEmail: 'Branch Staff@Vanir.com',
            branch: 'Unknown Branch',
            projectType: 'Default Project Type',
            materialType: 'General Materials'
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
function updateTemplateText(subdivision, builder, gmEmail, branch, projectType, materialType) {
    console.log('Updating Template Text:', { subdivision, builder, gmEmail, branch, projectType, materialType }); // Debugging log

    if (subdivision) {
        document.querySelectorAll('.subdivisionContainer').forEach(el => el.textContent = subdivision);
    }
    if (builder) {
        document.querySelectorAll('.builderContainer').forEach(el => el.textContent = builder);
    }
    if (gmEmail) {
        document.querySelectorAll('.gmEmailContainer').forEach(el => el.textContent = gmEmail);
    }
    if (branch) {
        document.querySelectorAll('.branchContainer').forEach(el => el.textContent = branch);
    }
    if (projectType) {
        document.querySelectorAll('.briqProjectTypeContainer').forEach(el => el.textContent = projectType);
    }
    if (materialType) {
        document.querySelectorAll('.materialTypeContainer').forEach(el => el.textContent = materialType);
    }

    console.log('Template updated with:', { subdivision, builder, gmEmail, branch, projectType, materialType });
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
        <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>

        <hr>
        <div id="subcontractorCompanyContainer"></div>
        <p><strong>Subject:</strong> New Community | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
        <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>

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
    // Get the email template content (used to generate the subject and body)
    const emailContent = document.getElementById('emailTemplate').innerHTML;

    // Collect dynamic data from UI elements
    const subcontractorEmails = subcontractorSuggestions.map(suggestion => suggestion.email).join(',');
    const vendorNames = subcontractorSuggestions.map(suggestion => suggestion.companyName).join(', '); // Vendor names

    // Fetch subdivision, builder, and other dynamic data from UI
    const subdivision = document.querySelector('.subdivisionContainer').textContent.trim();
    const builder = document.querySelector('.builderContainer').textContent.trim();
    const branch = document.querySelector('.branchContainer').textContent.trim();  // Get the branch
    const projectType = document.querySelector('.briqProjectTypeContainer').textContent.trim();  // Project type
    const materialType = document.querySelector('.materialTypeContainer').textContent.trim();  // Material type
    const gmEmail = document.querySelector('.gmEmailContainer').textContent.trim() || "purchasing@vanirinstalledsales.com";
    const ccEmails = "purchasing@vanirinstalledsales.com,hunter@vanirinstalledsales.com";

    // Create the subject for management and subcontractors
    const managementSubject = `WINNING! | ${subdivision} | ${builder}`;
    const subcontractorSubject = `New Community | ${builder} | ${subdivision}`;

    // Create the body content for the management email
    const managementBody = `
        Dear Team,

        We are excited to announce that we have won a new project in ${subdivision} for ${builder}. 
        Let's coordinate with the relevant vendors and ensure a smooth project initiation.

        This will be a ${projectType} project, requiring ${materialType}.
 Vendors involved: ${vendorNames}
        Best regards,
        
        Vanir Installed Sales Team
    `.trim();

    // Create the body content for the subcontractor email
    const subcontractorBody = `
        We are thrilled to inform you that we have been awarded a new community, ${subdivision}, in collaboration with ${builder}. 
        We look forward to working together and maintaining high standards for this project.

        The project will be a ${projectType} project, requiring ${materialType}.


        Best regards,
        
        Vanir Installed Sales Team
    `.trim();

    // Create the mailto links for both management and subcontractor emails
    const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmEmail)}&cc=${encodeURIComponent(ccEmails)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;
    const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(subcontractorEmails)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;
    

    // Open Gmail in two windows (management and subcontractor)
    window.open(managementGmailLink);
    setTimeout(() => window.open(subcontractorGmailLink), 3000); // Open second link after 3 seconds
    
}

// Attach the generateMailtoLink function to the 'sendEmailButton2' click event
document.getElementById('sendEmailButton2').addEventListener('click', generateMailtoLink);

document.getElementById('sendEmailButton2').addEventListener('click', function() {
    generateMailtoLink(); // Ensure this is triggered by user interaction
});

// Fetch all bid names on page load, but subcontractors only after a bid is chosen
async function fetchAndUpdateAutocomplete() {


    // Fetch bid names only (no subcontractors yet)
    await fetchBidNameSuggestions();

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

document.addEventListener('DOMContentLoaded', () => {
    // Dynamically create bidInputContainer
    const emailContainer = document.getElementById('emailTemplate');
    if (!emailContainer) {
        console.error("emailTemplate not found in the DOM.");
        return;
    }
    
    const bidContainer = document.createElement('div');
    bidContainer.id = 'bidInputContainer';
    emailContainer.appendChild(bidContainer);

    // Initialize autocomplete for bid names
    initializeBidAutocomplete();
});




// Initialize bid and vendor autocomplete
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch suggestions
    await fetchBidNameSuggestions();
    await fetchVendorSuggestions();
        initializeVendorInputArea(); // Set up initial input area



        
    // Initialize autocomplete for vendor names
    const vendorContainer = document.getElementById('vendorInputContainer');
    if (vendorContainer) {
        const vendorInput = createAutocompleteInput("Enter Vendor Name", vendorSuggestions, "vendor", addVendorToContainer);
        vendorContainer.appendChild(vendorInput);
    } else {
        console.error("Vendor container not found.");
    }
});

function initializeBidAutocomplete() {
    const bidContainer = document.getElementById('bidInputContainer');
    if (bidContainer) {
        const bidInput = createAutocompleteInput(
            "Enter Bid Name",
            bidNameSuggestions,
            "bid",
            fetchDetailsByBidName
        );
        bidContainer.appendChild(bidInput);
    } else {
        console.error("Bid container not found.");
    }
}

function waitForElement(selector, timeout = 9000) {
    return new Promise((resolve, reject) => {
        const interval = 100; // Check every 100ms
        let elapsed = 0;

        const intervalId = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(intervalId);
                resolve(element);
            }
            elapsed += interval;
            if (elapsed >= timeout) {
                clearInterval(intervalId);
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }
        }, interval);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ensure email template is displayed
        displayEmailContent();

        // Wait for bidInputContainer to be dynamically created
        await waitForElement('#bidInputContainer');

        // Initialize bid autocomplete
        initializeBidAutocomplete();
    } catch (error) {
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

// Toggle Dark Mode
const toggleDarkModeCheckbox = document.getElementById('toggleDarkMode');

// Check if dark mode is enabled in localStorage
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    toggleDarkModeCheckbox.checked = true; // Set the switch to 'on' position
}

// Event listener to toggle dark mode on checkbox change
toggleDarkModeCheckbox.addEventListener('change', () => {
    const body = document.body;
    body.classList.toggle('dark-mode');

    // Save the user's preference in localStorage
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.removeItem('darkMode');
    }
});

