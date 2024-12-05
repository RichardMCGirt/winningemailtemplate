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
let city = [];
let subcontractors = []; // Initialize an empty array for subcontractors
let selectedVendorEmails = [];


let bidLoadingProgress = 0;
let vendorLoadingProgress = 0;
let totalLoadingProgress = 0;
let mailtoOpened = false;
let vendorNames = [];  // Initialize vendorNames as an empty array




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
    } catch (error) {
        console.error("Error fetching vendor suggestions:", error);
    }
}

// Function to create vendor autocomplete input
function createVendorAutocompleteInput() {
    // Check if the input field already exists
    const existingInput = document.querySelector('.vendor-autocomplete-input');
    if (existingInput) {
        return;  // If the input already exists, do nothing
    }

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

                // When a user clicks on a suggestion, select it and fetch emails
                option.onclick = () => {
                    // Fetch vendor emails after selecting the vendor
                    fetchVendorEmails(suggestion);

                    // Optionally, you can add the vendor to a list or perform any other action

                    // Clear input field after selection
                    input.value = '';
                    dropdown.style.display = 'none';  // Hide the dropdown
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

// Function to clear vendor emails
function clearVendorEmails() {
    selectedVendorEmails = [];  // Clear the selected vendor emails array
    updateEmailCC();  // Update the CC section to reflect the cleared emails
}

// Function to update the CC section with vendor emails
function updateEmailCC() {
    const ccContainer = document.querySelector('.cc-email-container');
    if (ccContainer) {
        const allEmails = selectedVendorEmails.map(vendor => vendor.emails).flat();
        ccContainer.textContent = allEmails.join(', ');
        console.log("CC Email Container Updated:", ccContainer.textContent);
    } else {
        console.error("CC container not found.");
    }
}


/// Add the selected vendor to the container and update the CC section
function addVendorToContainer(vendorName) {
    console.log("Adding vendor:", vendorName);

    const vendorContainer = document.querySelector('.VendoeContainer');

    // Check if the container exists
    if (!vendorContainer) {
        console.error("Vendor container not found.");
        return;
    }

    // Create a container for the vendor entry
    const vendorEntryWrapper = document.createElement("div");
    vendorEntryWrapper.classList.add("vendor-entry-wrapper");

    // Create a paragraph for the vendor name
    const vendorEntry = document.createElement("p");
    vendorEntry.classList.add("vendor-entry");
    vendorEntry.textContent = vendorName;

    // Create a delete button for the vendor entry
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-vendor-button");
    
    deleteButton.onclick = () => {
        console.log("Delete button clicked for vendor:", vendorName);
    
        // Remove the vendor entry from the container
        vendorEntryWrapper.remove();
    
        // Remove vendor from the selectedVendorEmails array
        selectedVendorEmails = selectedVendorEmails.filter(vendor => vendor.name !== vendorName);
    
        // Remove vendor from the vendorNames array
        vendorNames = vendorNames.filter(name => name !== vendorName);  // Correctly remove from vendorNames
    
        // Update the CC section
        updateEmailCC();
    
        // Add the vendor back to suggestions list (if needed)
        vendorSuggestions.push(vendorName);
        updateVendorDisplay();

    };
    

    // Append vendor entry and delete button
    vendorEntryWrapper.appendChild(vendorEntry);
    vendorEntryWrapper.appendChild(deleteButton);

    // Append to vendor container
    vendorContainer.appendChild(vendorEntryWrapper);

    // Fetch and add vendor emails to the CC section
    fetchVendorEmails(vendorName);

    // Add the vendor name to the list of vendorNames
    vendorNames.push(vendorName);


    // Clear the input field after selection
    const inputField = document.querySelector('.vendor-autocomplete-input');
    if (inputField) {
        inputField.value = '';
        inputField.placeholder = 'Enter Vendor Name';
    } else {
        console.error("Input field not found for clearing.");
    }


    // Check if the input field is still holding the old value and log it after a delay
    setTimeout(() => {
        const postClearInputField = document.querySelector('.vendor-autocomplete-input');
        console.log("After clearing input, current value (after delay):", postClearInputField ? postClearInputField.value : "Input field not found");
    }, 100);
}

// Function to handle vendor removal
function removeVendor(vendorEmail) {
    selectedVendorEmails = selectedVendorEmails.filter(email => email !== vendorEmail);
    console.log(`Removed vendor email: ${vendorEmail}`);
    updateCCEmailContainer(); // Update the email container
    generateManagementGmailLink(); // Regenerate the Gmail link
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

// Ensure vendor input is added only once
function initializeVendorInputArea() {
    const vendorContainer = document.getElementById('vendorInputContainer');

    if (!vendorContainer) {
        console.error("Vendor container not found.");
        return;
    }


}


// Simulate loading step by step, showing progress incrementally
async function startLoadingProcess() {

    // Step 1: Load bids
    await fetchBidSuggestions();
    
    // Step 2: Load vendors (after bids are loaded)
    await fetchVendorSuggestions();
    await fetchVendorEmails

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


    do {
        let url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        if (filterFormula) url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
        if (offset) url += `${filterFormula ? '&' : '?'}offset=${offset}`;


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
            allRecords = allRecords.concat(data.records);

            if (data.offset) {
            } else {
            }

            offset = data.offset; 
        } catch (error) {
          
            console.error(error);
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

async function fetchSubcontractorSuggestions(branchFilter) {
    if (!branchFilter) {
        console.error("Branch filter is missing.");
        return;
    }

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

        console.log("Subcontractor suggestions (filtered by branch):", subcontractorSuggestions);
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

async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData(bidBaseName, bidTableName, 'Bid Name, GM Email, Attachments, Number of Lots, Anticipated Start Date', filterFormula);

    if (records.length > 0) {
        const fields = records[0].fields;
        
        // Log the entire fields object to inspect all data
        console.log("Fetched fields from Airtable:", fields);
        
        const builder = fields['Builder'] || 'Unknown Builder';
        const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : "Branch Staff@Vanir.com";
        const branch = fields['Branch'] || 'Unknown Branch';
        const projectType = fields['Project Type'] || ''; // Define projectType
        const materialType = fields['Material Type'] || '';
        const attachments = fields['Attachments'] || []; // Directly use the URLs array
        const numberOfLots = fields['Number of Lots'] || '';
        const anticipatedStartDate = fields['Anticipated Start Date'] || '';

        // Check if attachments are an array and log their details
        if (Array.isArray(attachments)) {
            attachments.forEach((attachment, index) => {
                console.log(`Attachment ${index + 1}:`);
                console.log(`ID: ${attachment.id}`);
                console.log(`URL: ${attachment.url}`);
                console.log(`Filename: ${attachment.filename}`);
                console.log(`Width: ${attachment.width}`);
                console.log(`Height: ${attachment.height}`);
            });
        } else {
            console.log("No attachments found.");
        }

        // Update the email template with new fields
        updateTemplateText(bidName, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate);

        // Fetch and update subcontractor suggestions
        await fetchSubcontractorSuggestions(branch);
        updateSubcontractorAutocomplete();

        // Update city information
        await updateCityForSubdivision();

        return { builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate };
    } else {
        console.warn("No records found for bid:", bidName);
        return {
            builder: 'Unknown Builder',
            gmEmail: 'Branch Staff@Vanir.com',
            branch: 'Unknown Branch',
            projectType: 'Default Project Type',
            materialType: 'General Materials',
            attachments: [],
            numberOfLots: 'Unknown',
            anticipatedStartDate: 'Unknown'
        };
    }
}

function updateSubcontractorAutocomplete() {
    const subcontractorContainer = document.getElementById("subcontractorCompanyContainer");
    subcontractorContainer.innerHTML = ''; // Clear previous content

    // Collect all emails into an array
    const emailArray = subcontractorSuggestions.map(sub => sub.email);

    // Join the emails with commas for a formatted "email to" field style
    const formattedEmails = emailArray.join(', ');

    // Create a single text node with formatted emails
    const emailTextNode = document.createElement("div");
    emailTextNode.textContent = formattedEmails;

    // Append the formatted emails to the container
    subcontractorContainer.appendChild(emailTextNode);
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

function updateTemplateText(subdivision, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate, additionalDetails) {
    console.log('Updating Template Text:', { subdivision, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate, additionalDetails });

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

    // Display attachment links or image previews in the UI
    if (attachments && attachments.length > 0) {
        const attachmentLinks = attachments.map(att => `<a href="${att.url}" target="_blank">${att.filename}</a>`).join('<br>');
        document.querySelector('.attachmentsContainer').innerHTML = attachmentLinks;
    } else {
        document.querySelector('.attachmentsContainer').textContent = 'No attachments available';
    }

    if (numberOfLots) {
        document.querySelectorAll('.numberOfLotsContainer').forEach(el => el.textContent = numberOfLots);
    }

    if (anticipatedStartDate) {
        // Parse the anticipatedStartDate into a Date object
        const date = new Date(anticipatedStartDate);

        // Check if the date is valid
        if (!isNaN(date.getTime())) {
            // Format the date as "Month day, yyyy"
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Update the UI with the formatted date
            document.querySelectorAll('.anticipatedStartDateContainer').forEach(el => el.textContent = formattedDate);
        } else {
            console.error("Invalid date format:", anticipatedStartDate);
        }
    }

    // Update the "Additional Details" section
    if (additionalDetails) {
        document.querySelectorAll('.additionalDetailsContainer').forEach(el => el.textContent = additionalDetails);
    } else {
        document.querySelectorAll('.additionalDetailsContainer').forEach(el => el.textContent = "No additional details provided.");
    }

    console.log('Template updated with:', { subdivision, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate, additionalDetails });
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
    fetchVendorEmails
});

// Function to fetch vendor emails for only the selected vendor
async function fetchVendorEmails(vendorName) {
    try {
        // Fetch all vendor records from Airtable
        const records = await fetchAirtableData(VendorBaseName, VendorTableName, 'Name, Email, Secondary Email');
        
        // Find the vendor record that matches the selected vendor name
        const selectedVendor = records.find(record => record.fields['Name'] === vendorName);

        if (selectedVendor) {
            // Get both the primary and secondary emails
            const email = selectedVendor.fields['Email'];
            const secondaryEmail = selectedVendor.fields['Secondary Email'];

            // Check if the vendor is already in the selectedVendorEmails array
            if (!selectedVendorEmails.some(vendor => vendor.name === vendorName)) {
                selectedVendorEmails.push({ name: vendorName, emails: [email, secondaryEmail].filter(Boolean) });
            } else {
                // If the vendor is already added, update their email list
                const vendor = selectedVendorEmails.find(vendor => vendor.name === vendorName);
                if (vendor && secondaryEmail && !vendor.emails.includes(secondaryEmail)) {
                    vendor.emails.push(secondaryEmail); // Add the secondary email if it's missing
                }
            }

            // Update the CC section with the selected vendor's emails
            updateEmailCC();
        } else {
            console.log("Vendor not found.");
        }
    } catch (error) {
        console.error("Error fetching vendor emails:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    function updateVendorDisplay() {
        console.log("updateVendorDisplay called");

        // Select the vendor container and header
        const vendorContainer = document.querySelector('.VendoeContainer');
        const vendorsHeader = document.getElementById('vendorsHeader');

        // Check if vendorsHeader exists
        if (vendorsHeader) {
            vendorsHeader.textContent = 'Vendor'; // Default text on page startup
            console.log("Initialized vendorsHeader to 'Vendor'");
        } else {
            console.error("vendorsHeader element not found");
            return; // Exit if vendorsHeader is missing
        }

        // Get the number of vendors
        const vendorCount = vendorContainer ? vendorContainer.children.length : 0;
        console.log("Vendor Count:", vendorCount);

        // Update the header based on the number of vendors
        if (vendorCount === 0) {
            console.log("No vendors found, keeping header as 'Vendor'");
        } else if (vendorCount === 1) {
            console.log("One vendor found, keeping header as 'Vendor'");
            vendorsHeader.textContent = 'Vendor';
        } else {
            console.log("Multiple vendors found, setting header to 'Vendors'");
            vendorsHeader.textContent = 'Vendors';
        }

        // Hide or show the container based on the vendor count
        if (vendorContainer) {
            if (vendorCount === 0) {
                console.log("Hiding vendor container");
                vendorContainer.style.display = 'none';
            } else {
                console.log("Showing vendor container");
                vendorContainer.style.display = 'block';
            }
        } else {
            console.error("Vendor container not found");
        }
    }

    // Call the function every five minutes (100,000 milliseconds)
    setInterval(updateVendorDisplay, 50000);
});


document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                // Iterate through added nodes to find textareas
                Array.from(mutation.addedNodes).forEach((node) => {
                    if (node.tagName === "TEXTAREA" && (node.id === "additionalInfoInput" || node.id === "additionalInfoInputSub")) {
                        // Attach the dynamic height adjustment event listener
                        node.addEventListener("input", function () {
                            this.style.height = "auto"; // Reset height
                            this.style.height = `${this.scrollHeight}px`; // Adjust to content height
                        });
                        console.log(`Dynamic height adjustment enabled for ${node.id}`);
                    }
                });
            }
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
});


async function waitForElement(selector, timeout = 5000, interval = 100) {
    return new Promise((resolve, reject) => {
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
                reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
            }
        }, interval);
    });
}

async function exportTextareaToEmail() {
    const textarea = document.getElementById('additionalInfoInput');
    const additionalDetails = textarea.value.trim();

    // Check if textarea has content
    if (!additionalDetails) {
        console.log("No additional details provided.");
        return;
    }

    // Find the email body section
    const emailBodyContainer = document.getElementById('emailTemplate');
    if (!emailBodyContainer) {
        console.error("Email template container not found.");
        return;
    }
}
// Function to add event listeners to dynamically created inputs
function addDynamicInputListeners() {
    // Get input fields and signature spans
    const userPhoneInput = document.getElementById('userPhone');
    const userEmailInput = document.getElementById('userEmail');
    const signaturePhone1 = document.getElementById('signaturePhone1');
    const signatureEmail1 = document.getElementById('signatureEmail1');
    const signaturePhone2 = document.getElementById('signaturePhone2');
    const signatureEmail2 = document.getElementById('signatureEmail2');

    if (!userPhoneInput || !userEmailInput) {
        console.error('User input fields not found. Ensure they are created before calling this function.');
        return;
    }

    // Event listener to update signatures dynamically
    userPhoneInput.addEventListener('input', () => {
        signaturePhone1.textContent = userPhoneInput.value;
        signaturePhone2.textContent = userPhoneInput.value;
    });

    userEmailInput.addEventListener('input', () => {
        signatureEmail1.textContent = userEmailInput.value;
        signatureEmail2.textContent = userEmailInput.value;
    });
}



function displayEmailContent() {
    const emailContent = `
        <h2>To: purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com, <span class="gmEmailContainer"></span></h2>
        <p>CC: <span class="cc-email-container">Vendor</span></p>
        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Dear Team,</p>

        <h4> Major Wins for Team <strong><span class="branchContainer"></span></strong></h4>
        <p>All - I am excited to announce that we have been awarded <strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>.</p>
        <p>This will be <strong><span class="briqProjectTypeContainer"></span></strong>.</p>
        <div id="vendorInputContainer"></div>

        <h2>Here's the breakdown:</h2>
<h4 id="vendorsHeader">Vendor</h4>
        <div class="VendoeContainer"></div>
         <p><strong>Attachments:</strong> <span class="attachmentsContainer"></span></p>
    <p><strong>Number of Lots:</strong> <span class="numberOfLotsContainer"></span></p>
    <p><strong>Anticipated Start Date:</strong> <span class="anticipatedStartDateContainer"></span></p>
        <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>
        <br>
                            <div style="display: flex; align-items: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
                                                    <img src="logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">
                                                    <div>
                                                    <strong>Vanir Installed Sales, LLC</strong><br>
                                                     Phone: <span id="signaturePhone1"></span><br>
                                                     Email: <span id="signatureEmail1"></span><br>
                                                    <a href="https://www.vanirinstalledsales.com" style="text-decoration: none; color: #000;">www.vanirinstalledsales.com</a><br>
                                                    <em>Better Look. Better Service. Best Choice.</em>
  </div>
</div>
<hr>
 <div class="input-container">
      <label for="userPhone">Phone:</label>
      <input type="text" id="userPhone" placeholder="Enter your phone number">
    </div>
    <div class="input-container">
      <label for="userEmail">Email:</label>
      <input type="text" id="userEmail" placeholder="Enter your email">
    </div>
  </div>

<div>


            <hr>
        <div id="subcontractorCompanyContainer"></div>
        <p><strong>Subject:</strong> Vanir | New Opportunity | <span class="subdivisionContainer"></span></p>
       <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
<p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>
<p>If you're interested in working with us on this exciting opportunity, please reach out to <strong><span class="gmEmailContainer"></span></strong>.</p>

        <p>Kind regards,<br>Vanir Installed Sales Team</p>


        <div style="display: flex; align-items: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
                                                    <img src="logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">
                                                    <div>
                                                    <strong>Vanir Installed Sales, LLC</strong><br>
                                                    Phone: <span id="signaturePhone2"></span><br>
                                                    Email: <span id="signatureEmail2"></span><br>
                                                    <a href="https://www.vanirinstalledsales.com" style="text-decoration: none; color: #000;">www.vanirinstalledsales.com</a><br>
                                                    <em>Better Look. Better Service. Best Choice.</em>
  </div>
</div>


<div>
    `;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;

        // Add event listeners after the content is added
        addDynamicInputListeners();
    
}

// Trigger the display of email content once vendor emails are fetched
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
});


// Function to handle vendor selection
function selectVendor(vendorName, vendorEmail) {
    if (!selectedVendorEmails.includes(vendorEmail)) {
        selectedVendorEmails.push(vendorEmail);
        console.log(`Added vendor email: ${vendorEmail}`);
    }
    generateManagementGmailLink(); // Regenerate the Gmail link
}

const textarea = document.getElementById('additionalInfoInput');
const additionalDetails = textarea ? textarea.value.trim() : null;

// Define generateMailtoLinks
async function generateMailtoLinks() {
    try {
        // Wait for the cc-email-container to be available
        const ccEmailContainer = await waitForElement('.cc-email-container');
        if (!ccEmailContainer) {
            console.error('Element with class "cc-email-container" not found.');
            return;
        }

        // Fetch dynamic data from the DOM
        const branch = document.querySelector('.branchContainer')?.textContent.trim() || 'Unknown Branch';
        const subdivision = document.querySelector('.subdivisionContainer')?.textContent.trim() || 'Unknown Subdivision';
        const builder = document.querySelector('.builderContainer')?.textContent.trim() || 'Unknown Builder';
        const projectType = document.querySelector('.briqProjectTypeContainer')?.textContent.trim() || 'Default Project Type';
        const materialType = document.querySelector('.materialTypeContainer')?.textContent.trim() || 'General Materials';
        const anticipatedStartDate = document.querySelector('.anticipatedStartDateContainer')?.textContent.trim() || 'Unknown Start Date';
        const numberOfLots = document.querySelector('.numberOfLotsContainer')?.textContent.trim() || 'Unknown Number of Lots';

        // Extract CC emails from the cc-email-container
        const ccEmails = ccEmailContainer.textContent
            .split(/[\s,;]+/) // Split by spaces, commas, or semicolons
            .filter(email => email.includes("@")); // Filter valid email addresses

        const ccEmailsString = ccEmails.join(',');

        // Log the extracted CC emails and the formatted string
        console.log("Extracted CC emails:", ccEmails);
        console.log("Formatted CC emails string:", ccEmailsString);

        // Subcontractor container logic
        const subcontractorContainer = document.getElementById("subcontractorCompanyContainer");
        if (!subcontractorContainer) {
            console.error("Subcontractor container not found.");
            alert("Subcontractor information is missing.");
            return;
        }

        // Extract subcontractor emails
        const subcontractorEmails = Array.from(subcontractorContainer.querySelectorAll(".email"))
            .map(emailElement => emailElement.textContent.trim())
            .join(", ");

        console.log("Extracted subcontractor emails:", subcontractorEmails);

        const subcontractorEmailsFromSuggestions = subcontractorSuggestions
            .map(suggestion => suggestion.email)  // Extract the email addresses
            .join(', ');  // Join them into a comma-separated string

        console.log("Subcontractor emails from suggestions:", subcontractorEmailsFromSuggestions);

        // Combine both the extracted emails (from the container and suggestions)
        const allSubcontractorEmails = [subcontractorEmails, subcontractorEmailsFromSuggestions]
            .filter(Boolean)  // Filter out any empty values
            .join(', ');  // Join them into a single string

        // Fetch and format the attachments into a mailto-friendly format
        const attachments = await fetchAttachments();
        
        // Log the fetched attachments to ensure correct structure
        console.log("Fetched attachments:", attachments);

        // Format the attachments properly
        const formattedAttachments = attachments
            .map(att => {
                // Ensure the attachment object contains a filename and URL
                if (att && att.filename && att.url) {
                    return `${att.filename}: ${att.url}`;  // Format as "filename: url"
                } else {
                    console.warn("Attachment missing filename or url", att);
                    return null;  // Return null for invalid attachments
                }
            })
            .filter(Boolean)  // Remove null or undefined entries
            .join('\n');  // Join the formatted attachments into a string

        // Management Email
        const teamEmails = "purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com";

// Replace unwanted symbols and decode if needed
const managementSubject = `New Project Awarded: ${branch} - ${subdivision} - ${builder}`
  .replace(/[:@\-]/g, ' ') // Replace problematic symbols with spaces
  .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
  .trim();

console.log(managementSubject);
  
const managementBody = `
Dear Team,

We are thrilled to share that our team has secured a new project in ${subdivision} with ${builder}. This is an excellent opportunity to showcase our expertise and drive further growth.

Project Details:
- Project Type: ${projectType}
- Material Type: ${materialType}
- Number of Lots: ${numberOfLots}
- Anticipated Start Date: ${anticipatedStartDate}

Let's continue this momentum and deliver exceptional results.

Best regards,  
Vanir Installed Sales Team

<div style="display: flex; align-items: center; margin-top: 20px;">
<img src="logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">
  <div>
    <strong>Vanir Installed Sales, LLC</strong><br>
    Phone: <br>
    Email: contact@vanirinstalledsales.com<br>
    <a href="https://www.vanirinstalledsales.com" style="text-decoration: none; color: #000;">www.vanirinstalledsales.com</a><br>
    <em>Better Look. Better Service. Best Choice.</em>
  </div>
</div>
`.trim();

// Define a maximum size for the email body (e.g., 2000 characters)
const MAX_BODY_SIZE = 2000;

// Truncate the body if it exceeds the maximum size
const truncatedManagementBody = managementBody.length > MAX_BODY_SIZE 
    ? managementBody.slice(0, MAX_BODY_SIZE) + '... (truncated)' 
    : managementBody;

// Replace line breaks with '%0A' for URL encoding
const formattedManagementBody = truncatedManagementBody.replace(/\n/g, '%0A');

// For the subject, there is no need to change anything, just encode it.
const formattedManagementSubject = encodeURIComponent(managementSubject);

// Define the "mailto" link with formatted body and subject
const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(teamEmails)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;

console.log("Management Gmail Link:", managementGmailLink);

        // Subcontractor Email
        const subcontractorSubject = `Project Opportunity: ${branch} - ${builder}`;
        const subcontractorBody = `

We are pleased to announce a new project in ${subdivision}, partnering with ${builder}. We are seeking your expertise to deliver exceptional results.

Project Details:
- Branch: ${branch}
- Project Type: ${projectType}
- Material Type: ${materialType}
- Number of Lots: ${numberOfLots}
- Anticipated Start Date: ${anticipatedStartDate}

Please review the details and let us know if you have any questions or require additional information.
If you're interested in working with us on this exciting opportunity, please reach out to <strong><span class="gmEmailContainer"></span></strong>.

Best regards,  

<div style="display: flex; align-items: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
                                                    <img src="logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">
                                                    <div>
                                                    <strong>Vanir Installed Sales, LLC</strong><br>
                                                    Phone: <br>
                                                    Email: <br>
                                                    <a href="https://www.vanirinstalledsales.com" style="text-decoration: none; color: #000;">www.vanirinstalledsales.com</a><br>
                                                    <em>Better Look. Better Service. Best Choice.</em>
  </div>
</div>


<div>
`.trim();

        // Combine emails for the "To" and "CC" sections
        const toEmails = [teamEmails, subcontractorEmails].filter(Boolean).join(', ');

        // Generate Gmail links for both Management and Subcontractor emails
        const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmails)}&cc=${encodeURIComponent(allSubcontractorEmails)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;

        console.log("Management Gmail Link:", managementGmailLink);
        console.log("Subcontractor Gmail Link:", subcontractorGmailLink);

        // Open the Gmail links
        const managementWindow = window.open(managementGmailLink);
        const subcontractorWindow = window.open(subcontractorGmailLink);

        if (!managementWindow || !subcontractorWindow) {
            alert("Pop-ups were blocked. Please enable pop-ups for this site.");
        }

        return managementGmailLink; // Return the link for further use

    } catch (error) {
        console.error("Error generating mailto links:", error.message);
    }
}

// Function to fetch attachments from Airtable (make sure this returns an array of attachment objects)
async function fetchAttachments() {
    try {
        // Fetch the data from Airtable (adjusting field name based on your Airtable setup)
        const records = await fetchAirtableData(bidBaseName, bidTableName, 'Attachments');

        // Flatten the array and extract only the attachment objects
        const attachments = records
            .map(record => record.fields['Attachments'])
            .flat();  // Flatten in case multiple attachments are returned per record

        // Log the structure of attachments to check the data
        console.log("Fetched Attachments:", attachments);

        return attachments;  // Return the list of attachments
    } catch (error) {
        console.error("Error fetching attachments:", error);
        return [];  // Return an empty array in case of failure
    }
}


let ccObserver = null;

function observeCCContainer() {
    const ccEmailContainer = document.querySelector('.cc-email-container');

    if (!ccEmailContainer) {
        console.error('CC email container not found.');
        return;
    }

    // Disconnect existing observer if any
    if (ccObserver) {
        ccObserver.disconnect();
    }

    // Create a new observer
    ccObserver = new MutationObserver(() => {
        console.log("CC Email Container Updated:", ccEmailContainer.textContent);
        const ccEmails = ccEmailContainer.textContent.trim().split(',').filter(Boolean);
        console.log("Updated CC Emails:", ccEmails);
    });

    ccObserver.observe(ccEmailContainer, { childList: true, characterData: true, subtree: true });
}



document.addEventListener('DOMContentLoaded', () => {

    // Initial call to observe the CC container
    observeCCContainer();

    // Schedule it to run every minute
    setInterval(() => {
        observeCCContainer();
    }, 60000); // 60000 milliseconds = 1 minute
});

document.addEventListener('DOMContentLoaded', () => {
    const sendManagementEmailButton = document.getElementById('sendManagementEmailButton');

    if (sendManagementEmailButton) {
        sendManagementEmailButton.addEventListener('click', function () {
            console.log("Redirecting to Gmail...");
            showRedirectAnimation(); // Trigger animation
            generateMailtoLinks(); // Trigger the mailto generation
        });
    } else {
        console.error("Button with ID 'sendManagementEmailButton' not found.");
    }
});

// Function to show the redirect animation
function showRedirectAnimation() {
    const animationOverlay = document.createElement('div');
    animationOverlay.id = 'redirectOverlay';
    animationOverlay.style.position = 'fixed';
    animationOverlay.style.top = '0';
    animationOverlay.style.left = '0';
    animationOverlay.style.width = '100%';
    animationOverlay.style.height = '100%';
    animationOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    animationOverlay.style.zIndex = '9999';
    animationOverlay.style.display = 'flex';
    animationOverlay.style.justifyContent = 'center';
    animationOverlay.style.alignItems = 'center';
    animationOverlay.innerHTML = `
        <div style="text-align: center; color: white; font-size: 20px;">
            <p>Redirecting to Gmail...</p>
            <div class="spinner"></div>
        </div>
    `;

    document.body.appendChild(animationOverlay);

    // Spinner animation styles
    const style = document.createElement('style');
    style.innerHTML = `
        .spinner {
            margin: 20px auto;
            width: 40px;
            height: 40px;
            border: 4px solid white;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Remove the animation after a few seconds (optional)
    setTimeout(() => {
        document.body.removeChild(animationOverlay);
    }, 15000); // Adjust duration as needed
}



// Function to get subcontractor emails by branch
function getSubcontractorsByBranch(subcontractors, branch) {
    return subcontractors
        .filter(sub => sub.fields.branch === branch)  // Filter by branch
        .map(sub => sub.fields.email)  // Map to get just the emails
        .join(', ');  // Join emails by commas to pass in the URL
}

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

// Function to wait for the cc-email-container to exist in the DOM
async function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const interval = 100;
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
                reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
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

