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
let city = [];
let subcontractors = []; // Initialize an empty array for subcontractors
let vendorData = [];

let bidLoadingProgress = 0;
let totalLoadingProgress = 0;
let mailtoOpened = false;

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

function addCitySpan() {
    const container = document.querySelector("#dynamicContainer"); // Parent container
    if (!container) {
        console.error("Container #dynamicContainer not found.");
        return;
    }
    const citySpan = document.createElement("span");
    citySpan.className = "city";
    container.appendChild(citySpan);
}

async function fetchAllVendorData() {
    try {
        console.log("Fetching all vendor data...");

        // Fetch all vendor records from Airtable
        const records = await fetchAirtableData(
            VendorBaseName,
            VendorTableName,
            'Vendor Name, Email, Secondary Email'
        );

        // Store vendor data globally
        vendorData = records.map(record => ({
            name: record.fields['Vendor Name'] || "Unknown Vendor",
            email: record.fields['Email'] || null,
            secondaryEmail: record.fields['Secondary Email'] || null
        }));

        console.log("All vendor data fetched and stored:", vendorData);
    } catch (error) {
        console.error("Error fetching vendor data:", error);
    }
}


async function ensureDynamicContainerExists() {
    try {
        await waitForElement("#dynamicContainer");
        addCitySpan();
    } catch (error) {
        console.error("Error ensuring #dynamicContainer exists:", error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    ensureDynamicContainerExists();
});



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
        totalLoadingProgress = Math.round((bidLoadingProgress) / 2);  // Average of both progress
        updateLoadingProgress(totalLoadingProgress);
    } catch (error) {
        console.error("Error fetching bid suggestions:", error);
    }
}




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

function appendEmailsForSelectedBid(selectedBid) {
    if (!selectedBid) {
        console.error("No bid selected.");
        return;
    }

    console.log("Appending emails for selected bid:", selectedBid);

    // Extract the first word from the selected bid
    const firstWord = selectedBid.split(/\s+/)[0].toLowerCase();
    console.log("First word extracted:", firstWord);

    if (!firstWord) {
        console.error("Invalid bid name provided.");
        return;
    }

    // Filter vendor data to match the first word
    const matchingVendors = vendorData.filter(vendor =>
        vendor.name.toLowerCase().startsWith(firstWord)
    );

    console.log("Matching vendors:", matchingVendors);

    if (matchingVendors.length > 0) {
        const emails = [];

        // Collect all primary and secondary emails
        matchingVendors.forEach(vendor => {
            if (vendor.email) emails.push(vendor.email);
            if (vendor.secondaryEmail) emails.push(vendor.secondaryEmail);
        });

        // Ensure emails are unique
        const uniqueEmails = [...new Set(emails)];
        console.log("Unique emails to append:", uniqueEmails);

        // Find or create the <p> and <span> container dynamically
        let ccContainer = document.querySelector('.cc-email-container');
        if (!ccContainer) {
            console.log("CC container not found. Creating dynamically...");
            const emailSection = document.createElement('p');
            emailSection.innerHTML = `CC: <span class="cc-email-container"></span>`;
            document.body.appendChild(emailSection); // Adjust to append in the correct location
            ccContainer = emailSection.querySelector('.cc-email-container');
        }

        // Append emails to the container
        const existingEmails = ccContainer.textContent.split(/[\s,;]+/).filter(Boolean);
        console.log("Existing emails in CC:", existingEmails);

        const updatedEmails = [...new Set([...existingEmails, ...uniqueEmails])];
        ccContainer.textContent = updatedEmails.join(', ');

        console.log("Updated CC emails with vendor details:", updatedEmails);
    } else {
        console.warn("No matching vendors found for bid:", selectedBid);
    }
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
document.addEventListener("DOMContentLoaded", () => {
    const dynamicContainer = document.querySelector("#dynamicContainer");
    if (!dynamicContainer) {
        console.warn("#dynamicContainer is missing. Check HTML structure or DOM load timing.");
    }
});

async function fetchPlaceDetails(query) {
    try {
        const response = await fetch(`http://localhost:6008/api/placeSearch?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`Server returned an error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched place details:", data);
        return data; // Use this data in your frontend logic
    } catch (error) {
        console.error("Error fetching place details:", error);
        return null;
    }
}

async function fetchDetailsByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData(
      bidBaseName,
      bidTableName,
      'Bid Name, GM Email, Attachments, Number of Lots, Anticipated Start Date, Bid Value, vendor, AnticipatedDuration',
      filterFormula
    );
  
    if (records.length > 0) {
      const fields = records[0].fields;
      const bvalue = fields['Bid Value'] || 'Unknown Value';
      const builder = fields['Builder'] || 'Unknown Builder';
      const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : 'Branch Staff@Vanir.com';
      const branch = fields['Branch'] || 'Unknown Branch';
      const projectType = fields['Project Type'] || '';
      const materialType = fields['Material Type'] || '';
      const numberOfLots = fields['Number of Lots'] || '';
      const anticipatedStartDate = fields['Anticipated Start Date'] || '';
      const vendor = fields['vendor'];
      const AnticipatedDuration = fields ['Anticipated Duration'];

  
      console.log('Fetched fields from Airtable:', fields);
  
      updateTemplateText(
        bidName,
        builder,
        bvalue,
        gmEmail,
        branch,
        projectType,
        materialType,
        numberOfLots,
        anticipatedStartDate,
        vendor,
        AnticipatedDuration

      );
  
      await fetchSubcontractorSuggestions(branch);
      updateSubcontractorAutocomplete();
  
      return {
        builder,
        bvalue,
        gmEmail,
        branch,
        projectType,
        materialType,
        numberOfLots,
        anticipatedStartDate,
        vendor,
        AnticipatedDuration,
      };
    } else {
      console.warn('No records found for bid:', bidName);
      return {
        builder: 'Unknown Builder',
        bvalue: 'Unknown Value',
        gmEmail: 'Branch Staff@Vanir.com',
        branch: 'Unknown Branch',
        projectType: 'Default Project Type',
        materialType: 'General Materials',
        numberOfLots: 'Unknown',
        anticipatedStartDate: 'Unknown',
        vendor: 'Unknown',
        AnticipatedDuration: 'Unknown days',

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


// Unified function to create an autocomplete input
function createAutocompleteInput(placeholder, suggestions, type, fetchDetailsCallback) {
    // Validate the `type` parameter
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
    input.dataset.type = type;

    const dropdown = document.createElement("div");
    dropdown.classList.add(`${type}-autocomplete-dropdown`, "autocomplete-dropdown");

    input.addEventListener("input", async function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear previous suggestions

        // Filter suggestions if a suggestion list is provided
        if (suggestions && Array.isArray(suggestions)) {
            const filteredSuggestions = suggestions.filter(item => {
                const text = typeof item === 'string' ? item : item.companyName;
                return text.toLowerCase().includes(inputValue);
            });

            // Populate the dropdown with filtered suggestions
            filteredSuggestions.forEach(suggestion => {
                const text = typeof suggestion === 'string' ? suggestion : suggestion.companyName;
                const option = document.createElement("div");
                option.classList.add(`${type}-autocomplete-option`, "autocomplete-option");
                option.textContent = text;

                option.onclick = () => {
                    input.value = text;
                    dropdown.innerHTML = '';
                    if (fetchDetailsCallback) {
                        fetchDetailsCallback(suggestion).then(details => {
                            if (details && details.city) {
                                const citySpan = document.querySelector(".city");
                                if (citySpan) {
                                    citySpan.innerText = details.city; // Update city span
                                }
                            }
                        });
                    }
                };

                dropdown.appendChild(option);
            });

            dropdown.style.display = filteredSuggestions.length > 0 ? 'block' : 'none';
        }

        // Fetch additional details dynamically
        if (fetchDetailsCallback && inputValue.length > 0) {
            const details = await fetchDetailsCallback(inputValue);
            if (details && details.city) {
                const citySpan = document.querySelector(".city");
                if (citySpan) {
                    citySpan.innerText = details.city; // Update city span
                }
            }
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

function updateTemplateText(
    subdivision,
    builder,
    bvalue,
    gmEmail,
    branch,
    projectType,
    materialType,
    numberOfLots,
    anticipatedStartDate,
    vendor,
    AnticipatedDuration,
  ) {
    console.log('Updating Template Text with the following parameters:', {
      subdivision,
      builder,
      bvalue,
      gmEmail,
      branch,
      projectType,
      materialType,
      numberOfLots,
      anticipatedStartDate,
      vendor,
      AnticipatedDuration,
    });
  
    if (subdivision) {
      console.log('Updating subdivision to:', subdivision);
      document.querySelectorAll('.subdivisionContainer').forEach(el => (el.textContent = subdivision));
    }
  
    if (builder) {
      console.log('Updating builder to:', builder);
      document.querySelectorAll('.builderContainer').forEach(el => (el.textContent = builder));
    }
  
    if (bvalue) {
      console.log('Formatting and updating bvalue:', bvalue);
      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(bvalue);
      console.log('Formatted bvalue:', formattedValue);
      document.querySelectorAll('.valueContainer').forEach(el => (el.textContent = formattedValue));
    }
  
    if (gmEmail) {
      console.log('Updating gmEmail to:', gmEmail);
      document.querySelectorAll('.gmEmailContainer').forEach(el => (el.textContent = gmEmail));
    }
  
    if (branch) {
      console.log('Updating branch to:', branch);
      document.querySelectorAll('.branchContainer').forEach(el => (el.textContent = branch));
    }
  
    if (projectType) {
      console.log('Updating projectType to:', projectType);
      document.querySelectorAll('.briqProjectTypeContainer').forEach(el => (el.textContent = projectType));
    }
  
    if (materialType) {
      console.log('Updating materialType to:', materialType);
      document.querySelectorAll('.materialTypeContainer').forEach(el => (el.textContent = materialType));
    }
  
    if (numberOfLots) {
      console.log('Updating numberOfLots to:', numberOfLots);
      document.querySelectorAll('.numberOfLotsContainer').forEach(el => (el.textContent = numberOfLots));
    }
  
    if (AnticipatedDuration) {
      console.log('Updating AnticipatedDuration to:', AnticipatedDuration);
      document.querySelectorAll('.AnticipatedDurationContainer').forEach(el => (el.textContent = AnticipatedDuration));
    }
  
    if (vendor) {
      console.log('Updating vendor to:', vendor);
      document.querySelectorAll('.vendorContainer').forEach(el => (el.textContent = vendor));
    }
  
    if (anticipatedStartDate) {
      console.log('Processing anticipatedStartDate:', anticipatedStartDate);
      const date = new Date(anticipatedStartDate);
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        console.log('Formatted anticipatedStartDate:', formattedDate);
        document.querySelectorAll('.anticipatedStartDateContainer').forEach(el => (el.textContent = formattedDate));
      } else {
        console.error('Invalid date format:', anticipatedStartDate);
      }
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


async function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        let elapsed = 0;
        const intervalId = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(intervalId);
                resolve(element);
            }
            elapsed += 100;
            if (elapsed >= timeout) {
                clearInterval(intervalId);
                reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
            }
        }, 100);
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


async function sendEmailData() {
    const apiUrl = "https://script.googleapis.com/v1/scripts/AKfycbz0XLL8bTtFPiRPRz9HNgHD1KknnMwtgbUUonbH0_OWfSg9_SH3u6SmFErHL4SHbwsBBA:run"; 
  

      const data = {
        branch: document.querySelector('.branchContainer')?.textContent.trim(),
        subdivision: document.querySelector('.subdivisionContainer')?.textContent.trim(),
        builder: document.querySelector('.builderContainer')?.textContent.trim(),
        projectType: document.querySelector('.briqProjectTypeContainer')?.textContent.trim(),
        materialType: document.querySelector('.materialTypeContainer')?.textContent.trim(),
        anticipatedStartDate: document.querySelector('.anticipatedStartDateContainer')?.textContent.trim(),
        numberOfLots: document.querySelector('.numberOfLotsContainer')?.textContent.trim(),
        managementEmails: [
          "purchasing@vanirinstalledsales.com",
          "maggie@vanirinstalledsales.com",
          "jason.smith@vanirinstalledsales.com",
          "hunter@vanirinstalledsales.com",
        ],
        subcontractorEmails: [
          "example1@subcontractor.com",
          "example2@subcontractor.com",
        ],
      };
    
      console.log("Prepared data for POST request:", data);
    
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
    
        console.log("Response from server:", response);
    
        const result = await response.json();
        console.log("Parsed response from server:", result);
    
        if (result.success) {
          alert("Emails sent successfully!");
        } else {
          console.error("Error response from server:", result.message);
          alert("Error sending emails: " + result.message);
        }
      } catch (error) {
        console.error("Error in fetch request:", error);
        alert("An error occurred while sending the data.");
      }
    }
  


    function displayEmailContent() {
        const emailContent = `
            <h2>To: purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com, <span class="gmEmailContainer"></span></h2>
            <p>CC: <span class="cc-email-container">Vendor</span></p>
            <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
            <p>Dear Team,</p>
    
            <h4>Major Wins for Team <strong><span class="branchContainer"></span></strong></h4>
            <p>We are excited to announce that we have been awarded <strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in 
            <input type="text" class="city" placeholder="Enter city"></p>
    
            <h2>Here's the breakdown:</h2>
            <p><strong>Customer Name:</strong> <span class="builderContainer"></span></p>
            <p><strong>What kind of product do they build:</strong> <strong><span class="briqProjectTypeContainer"></span></strong></p>
            <p><strong>Expected Pace:</strong> <strong><span class="AnticipatedDurationContainer"></span></strong></p>
            <p><strong>Expected Start Date:</strong> <strong><span class="anticipatedStartDateContainer"></span></strong></p>
            <p><strong>Number of Lots:</strong> <span class="numberOfLotsContainer"></span></p>
            <p><strong>Do they have special pricing:</strong> 
                <label>
                    <input type="radio" name="sprice" value="Yes" class="sprice" /> Yes
                </label>
                <label>
                    <input type="radio" name="sprice" value="No" class="sprice" /> No
                </label>
            </p>
            <p><strong>PO Customer:</strong> 
                <label>
                    <input type="radio" name="poCustomer" value="Yes" class="pcustomer" /> Yes
                </label>
                <label>
                    <input type="radio" name="poCustomer" value="No" class="pcustomer" /> No
                </label>
            </p>
            
            <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>. 
            Bid value is <strong><span class="valueContainer"></span></strong>.</p>
    
            <hr>
            <div id="subcontractorCompanyContainer"></div>
            <p><strong>Subject:</strong> Vanir | New Opportunity | <span class="subdivisionContainer"></span></p>
            <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with 
            <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
            <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>
            <p>If you're interested in working with us on this exciting opportunity, please reach out to <strong><span class="gmEmailContainer"></span></strong>.</p>
    
            <p>Kind regards,<br>Vanir Installed Sales Team</p>
        `;
    
        const emailContainer = document.getElementById('emailTemplate');
        if (emailContainer) {
            emailContainer.innerHTML = emailContent;
        } else {
            console.error("Email template container not found in the DOM.");
        }
    }
    

// Trigger the display of email content once vendor emails are fetched
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
});

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
        const city = document.querySelector('.city')?.value.trim() || 'Unknown City';
        const cname = document.querySelector('.cname')?.value.trim() || 'Unknown Customer Name';
        const whatbuild = document.querySelector('.whatbuild')?.value.trim() || 'Unknown Product';
        const epace = document.querySelector('.epace')?.value.trim() || 'Unknown Pace';
        const sprice = document.querySelector('input[name="sprice"]:checked')?.value || 'Not Specified';
        const poCustomer = document.querySelector('input[name="poCustomer"]:checked')?.value || 'Not Specified';

        // Extract CC emails from the cc-email-container
        const ccEmails = ccEmailContainer.textContent
            .split(/[\s,;]+/) // Split by spaces, commas, or semicolons
            .filter(email => email.includes("@")); // Filter valid email addresses

        const ccEmailsString = ccEmails.join(',');

        // Management Email
        const managementSubject = `New Project Awarded: ${branch} - ${subdivision} - ${builder}`;
        const managementBody = `
Dear Team,

We are thrilled to share that our team has secured a new project in ${subdivision} with ${builder}. This project is located in ${city}.

Project Details:
- Customer Name: ${cname}
- Product Built: ${whatbuild}
- Project Type: ${projectType}
- Material Type: ${materialType}
- Expected Pace: ${epace} ${epace > 1 ? 'days' : 'day'}
- Number of Lots: ${numberOfLots}
- Special Pricing: ${sprice}
- PO Customer: ${poCustomer}
- Anticipated Start Date: ${anticipatedStartDate}

Let's continue this momentum and deliver exceptional results.

Best regards,  
Vanir Installed Sales Team
        `.trim();

        // Subcontractor Email
        const subcontractorSubject = `Vanir Project Opportunity: ${branch} - ${builder}`;
        const subcontractorBody = `
Dear Subcontractor,

We are pleased to announce a new project in ${subdivision}, partnering with ${builder}. We are seeking your expertise to deliver exceptional results.

Project Details:
- Product Built: ${whatbuild}
- Project Type: ${projectType}
- Material Type: ${materialType}
- Expected Pace: ${epace} ${epace > 1 ? 'days' : 'day'}
- Number of Lots: ${numberOfLots}
- Anticipated Start Date: ${anticipatedStartDate}

If you're interested in working with us on this exciting opportunity, please reach out to [Insert Contact Information].

Best regards,  
Vanir Installed Sales Team
        `.trim();

        // Combine emails for the "To" and "CC" sections
        const teamEmails = "purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com";
        const toEmails = [teamEmails].filter(Boolean).join(', ');

        // Generate Gmail links for both Management and Subcontractor emails
        const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(teamEmails)}&cc=${encodeURIComponent(ccEmailsString)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;
        const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmails)}&cc=${encodeURIComponent(ccEmailsString)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;

        console.log("Management Gmail Link:", managementGmailLink);
        console.log("Subcontractor Gmail Link:", subcontractorGmailLink);

        // Open the Gmail links
        const managementWindow = window.open(managementGmailLink);
        const subcontractorWindow = window.open(subcontractorGmailLink);

        if (!managementWindow || !subcontractorWindow) {
            alert("Pop-ups were blocked. Please enable pop-ups for this site.");
        }

        return { managementGmailLink, subcontractorGmailLink }; // Return the links for further use

    } catch (error) {
        console.error("Error generating mailto links:", error.message);
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
  
  
});

function initializeBidAutocomplete() {
    const bidContainer = document.getElementById('bidInputContainer');

    if (bidContainer) {
        // Create autocomplete wrapper
        const autocompleteWrapper = document.createElement("div");
        autocompleteWrapper.classList.add("autocomplete-wrapper");

        // Create input field
        const bidInput = document.createElement("input");
        bidInput.type = "text";
        bidInput.placeholder = "Enter Bid Name";
        bidInput.classList.add("autocomplete-input");
        autocompleteWrapper.appendChild(bidInput);

        // Create dropdown container
        const dropdown = document.createElement("div");
        dropdown.classList.add("autocomplete-dropdown");
        autocompleteWrapper.appendChild(dropdown);

        // Add wrapper to container
        bidContainer.appendChild(autocompleteWrapper);

        // Populate dropdown dynamically
        bidInput.addEventListener("input", function () {
            const query = bidInput.value.toLowerCase();
            dropdown.innerHTML = ""; // Clear previous suggestions

            // Filter suggestions
            const filteredSuggestions = bidNameSuggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(query)
            );

            // Add filtered suggestions to dropdown
            filteredSuggestions.forEach(suggestion => {
                const option = document.createElement("div");
                option.classList.add("autocomplete-option");
                option.textContent = suggestion;

                option.addEventListener("click", () => {
                    bidInput.value = suggestion; // Set input value to selected suggestion
                    dropdown.innerHTML = ""; // Clear dropdown
                    fetchDetailsByBidName(suggestion); // Fetch details for selected suggestion
                });

                dropdown.appendChild(option);
            });

            // Show or hide the dropdown based on the filtered suggestions
            dropdown.style.display = filteredSuggestions.length > 0 ? "block" : "none";
        });
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


// Load the email content and start fetching bid name suggestions on page load
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
    fetchAndUpdateAutocomplete();
});

