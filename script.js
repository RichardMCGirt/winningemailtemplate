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
            <p>Fetching Winning Bids </p>
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
    const loadingOverlay = document.getElementById("loadingOverlay");

    // Ensure percentage is within bounds (0 - 100)
    const safePercentage = Math.min(100, Math.max(0, percentage));

    if (loadingPercentage) {
        loadingPercentage.textContent = `${safePercentage}%`;
    }

    if (loadingProgress) {
        loadingProgress.style.width = `${safePercentage}%`;
        loadingProgress.style.transition = "width 0.3s ease-in-out";
    }

    // Remove loading overlay when progress reaches 100%
    if (safePercentage === 100 && loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = "0";
            setTimeout(() => {
                loadingOverlay.remove();
            }, 300); // Allow fade-out effect
        }, 500); // Delay to ensure progress bar reaches 100%
    }
}

function deriveNameFromEmail(email) {
    if (!email || typeof email !== "string") return "Unknown Name";

    const [namePart] = email.split("@");
    const [first, last] = namePart.split(".");
    if (!first || !last) return "Unknown Name";

    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

    return `${capitalize(first)} ${capitalize(last)}`;
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
        const vendoremail = fields['vendor email'] || '';
        console.log("📧 Vendor email from Airtable:", vendoremail);

        console.log("🔍 Raw vendor value from Airtable:", vendor);

        if (vendor && typeof vendor === 'string') {
            const vendorMatch = vendorData.find(v => v.name.toLowerCase().includes(vendor.toLowerCase()));
            if (vendorMatch) {
                console.log("✅ Matched vendor name:", vendorMatch.name);
                setVendorName(vendorMatch.name);
            } else {
                console.warn("⚠️ No vendor match found. Using raw vendor string:", vendor);
                setVendorName(vendor); // Fallback if no match
            }
        } else {
            console.warn("⚠️ Vendor value is missing or not a string.");
        }
    window.currentVendorEmail = vendoremail;

        const AnticipatedDuration = fields['Anticipated Duration'];
        const gm = fields['GM Named']
            ? Array.isArray(fields['GM Named']) ? fields['GM Named'][0] : fields['GM Named']
            : deriveNameFromEmail(gmEmail);

        console.log("🧾 All field keys from Airtable:", Object.keys(fields));
        console.log("👤 Raw GM name field:", fields['GM name']);
        console.log("📦 Fetched record fields:", fields);

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
            AnticipatedDuration,
            gm, 
            vendoremail
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
            gm,
            vendoremail,
        };
    } else {
        console.warn('⚠️ No records found for bid:', bidName);
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
            gm: 'Unknown GM',
            vendoremail: 'unknown@example.com',
        };
    }
}

  
  function updateSubcontractorAutocomplete() {
    const subcontractorContainer = document.getElementById("subcontractorCompanyContainer");
    subcontractorContainer.innerHTML = ''; // Clear previous content

    // Collect all emails into an array
    const emailArray = subcontractorSuggestions.map(sub => sub.email);

    // Join the emails with commas
    const formattedEmails = emailArray.join(', ');

    if (formattedEmails.trim() === '') {
        subcontractorContainer.style.border = "none"; // Hide border if empty
    } else {
        subcontractorContainer.style.border = "1px solid #ccc"; // Show border if content exists

        // Create a single text node with formatted emails
        const emailTextNode = document.createElement("div");
        emailTextNode.textContent = formattedEmails;

        // Append the formatted emails to the container
        subcontractorContainer.appendChild(emailTextNode);
    }
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
    gm,
    vendoremail
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
      gm,
      vendoremail
    });
  
    if (subdivision) {
      document.querySelectorAll('.subdivisionContainer').forEach(el => (el.textContent = subdivision));
    }
  
    if (gm) {
      document.querySelectorAll('.gmNameContainer').forEach(el => (el.textContent = gm));
    }
  
    if (builder) {
      document.querySelectorAll('.builderContainer').forEach(el => (el.textContent = builder));
    }
  
    if (bvalue) {
      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(bvalue);
      document.querySelectorAll('.valueContainer').forEach(el => (el.textContent = formattedValue));
    }
  
    if (gmEmail) {
      document.querySelectorAll('.gmEmailContainer').forEach(el => (el.textContent = gmEmail));
    }
  
    if (branch) {
      document.querySelectorAll('.branchContainer').forEach(el => (el.textContent = branch));
    }
  
    if (projectType) {
      document.querySelectorAll('.briqProjectTypeContainer').forEach(el => (el.textContent = projectType));
    }
  
    if (materialType) {
      document.querySelectorAll('.materialTypeContainer').forEach(el => (el.textContent = materialType));
    }
  
    if (numberOfLots) {
      document.querySelectorAll('.numberOfLotsContainer').forEach(el => (el.textContent = numberOfLots));
    }
  
    if (AnticipatedDuration) {
      document.querySelectorAll('.AnticipatedDurationContainer').forEach(el => (el.textContent = AnticipatedDuration));
    }
  
    if (vendor) {
      document.querySelectorAll('.vendorContainer').forEach(el => (el.textContent = vendor));
    }
  
    if (anticipatedStartDate) {
      const date = new Date(anticipatedStartDate);
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        document.querySelectorAll('.anticipatedStartDateContainer').forEach(el => (el.textContent = formattedDate));
      } else {
        console.error('Invalid date format for anticipatedStartDate:', anticipatedStartDate);
      }
    }
  
    if (vendoremail) {
      const ccSpan = document.querySelector('.cc-email-container');
      if (ccSpan) {
        ccSpan.textContent = vendoremail;
        console.log("✅ Updated CC field with vendor email:", vendoremail);
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

    function setVendorName(name) {
        const vendorSpan = document.querySelector('.vendorNameContainer');
        
        console.log("Setting vendor name to:", name);
        
        if (vendorSpan) {
            vendorSpan.textContent = name;
            console.log("✅ Vendor name updated in .vendorNameContainer span.");
        } else {
            console.warn("⚠️ Could not find .vendorNameContainer element in the DOM.");
        }
    }
    
    
  
    function displayEmailContent() {
        const emailContent = `
            <h2>To: purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com, <span class="gmEmailContainer"></span></h2>
            <p>CC: <span class="cc-email-container">Vendor</span></p>
            <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
            <p>Go <strong><span class="branchContainer"></span></strong>,</p>
    
            <h4>Major Win for Team <strong><span class="branchContainer"></span></strong></h4>
            <p>We have been awarded <strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in 
            <input type="text" class="city" placeholder="    Enter city"></p>
    
            <h2>Here's the breakdown:</h2>
            <p><strong>Customer Name:</strong> <span class="builderContainer"></span></p>
            <p><strong><span class="briqProjectTypeContainer"></span></strong></p>
            <p><strong>Expected Pace:</strong> <strong><span class="AnticipatedDurationContainer"></span> days</strong></p>
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
    
            <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong> installation.</p>
    
            <hr>
    
            <!-- Subcontractor Email -->
            <div id="subcontractorCompanyContainer"></div>
            <p><strong>Subject:</strong> Vanir | New Opportunity | <span class="subdivisionContainer"></span></p>
            <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with 
            <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
            <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong> installation.</p>
            <p>If you're interested in working with us on this exciting opportunity, please reach out to the <strong><span class="branchContainer"></span></strong> general manager 
            <strong><span class="gmNameContainer"></span></strong> at <strong><span class="gmEmailContainer"></span></strong>.</p>
    
            <hr>
    
            <!-- ✅ Vendor Email Section -->
                        <h2>To: <span class="vendorNameContainer"></span></h2>

            <p><strong>Subject:</strong> Vanir | 
            <p>Hello <strong><span class="vendorNameContainer"></span></strong>,</p>
            <p>We wanted to notify you that <strong>Vanir Installed Sales</strong> has secured the bid for the <strong><span class="subdivisionContainer"></span></strong> project with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>.</p>
            <p><strong>Project Summary:</strong></p>
            <ul>
                <li>Material Type: <span class="materialTypeContainer"></span></li>
            </ul>
    
            <p>Best regards,<br><strong>Vanir Installed Sales <span class="branchContainer"></span></strong></p>
    
            <div class="signature-container">
                <img src="VANIR-transparent.png" alt="Vanir Logo" class="signature-logo"> 
                <div class="signature-content">
                    <p><input type="text" id="inputUserName" placeholder=""> | Vanir Installed Sales, LLC</p>
                    <p>Phone: <input type="text" id="inputUserPhone" placeholder=""></p>
                    <p><a href="https://www.vanirinstalledsales.com">www.vanirinstalledsales.com</a></p>
                    <p><strong>Better Look. Better Service. Best Choice.</strong></p>
                </div>
            </div>
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

document.addEventListener('DOMContentLoaded', () => {
    const gmEmailElement = document.querySelector('.gmEmailContainer');
    const gm = document.querySelector('.gmNameContainer')?.textContent || 'GM named';

    const gmEmail = gmEmailElement ? (gmEmailElement.value || gmEmailElement.textContent || 'Not Specified') : 'Not Specified';
    console.log('GM Email Value:', gmEmail);
});


async function validateAndExportBidDetails(bidName) {
    const bidDetails = await fetchDetailsByBidName(bidName);
    console.log('Validated bid details for export:', bidDetails);
    exportData(bidDetails);
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
        const city = document.querySelector('.city')?.value.trim() || 'Unknown City';
        const cname = document.querySelector('.cname')?.value.trim() || 'Unknown Customer Name';
        const whatbuild = document.querySelector('.whatbuild')?.value.trim() || 'Unknown Product';
        const epace = document.querySelector('.epace')?.value.trim() || 'Unknown Pace';
        const sprice = document.querySelector('input[name="sprice"]:checked')?.value || 'Not Specified';
        const poCustomer = document.querySelector('input[name="poCustomer"]:checked')?.value || 'Not Specified';

        // Fetch GM Email
        const gmEmailElement = document.querySelector('.gmEmailContainer');
        const gmEmail = gmEmailElement ? (gmEmailElement.value || gmEmailElement.textContent || 'Not Specified') : 'Not Specified';
        const gm = document.querySelector('.gmNameContainer')?.textContent.trim() || 'Unknown GM';
        const vendorEmail = gmEmailElement ? (gmEmailElement.value || gmEmailElement.textContent || 'Not Specified') : 'Not Specified';

       
        // Fetch user signature inputs
        const userNameInput = await waitForElement('#inputUserName');
        const userPhoneInput = await waitForElement('#inputUserPhone');
        const userName = userNameInput.value.trim() || 'Your Name';
        const userPhone = userPhoneInput.value.trim() || 'Your Phone';
        const logoURL = "https://raw.githubusercontent.com/RichardMCGirt/winningemailtemplate/main/VANIR-transparent.png";

        

        console.log('GM Email Value:', gmEmail);
        console.log('User Info:', { userName, userPhone });

        // Extract CC emails from the cc-email-container
        const ccEmails = ccEmailContainer.textContent
            .split(/[\s,;]+/) // Split by spaces, commas, or semicolons
            .filter(email => email.includes("@")); // Filter valid email addresses

        const ccEmailsString = ccEmails.join(',');

        // Management Email
        const managementSubject = `Another WIN for Vanir - ${branch} - ${subdivision} - ${builder}`;
        const gmName = document.querySelector('.gmNameContainer')?.textContent.trim() || 'Unknown GM';

        const managementBody = `
        Go ${branch},
        
        Major Win for Team ${branch}!
        
        We have been awarded ${subdivision} with ${builder} in ${city}.
        
        Here's the breakdown:
        - Customer Name: ${cname}
        - ${projectType}
        - Expected Pace: ${epace} ${epace > 1 ? 'days' : 'day'}
        - Expected Start Date: ${anticipatedStartDate}
        - Number of Lots: ${numberOfLots}
        - Special Pricing: ${sprice}
        - PO Customer: ${poCustomer}
        - Material Type: ${materialType}
        
        This will be a ${projectType} project, requiring ${materialType} installation.
    
        Kind regards,  
        ${userName}  
        Vanir Installed Sales, LLC  
        Phone: ${userPhone}  
        https://www.vanirinstalledsales.com  
        Better Look. Better Service. Best Choice.
        `.trim();
        
        const subcontractorSubject = `Vanir Project Opportunity: ${branch} - ${builder}`;
        const subcontractorBody = `
        Dear Subcontractor,
        
        We are thrilled to inform you that we have been awarded a new community, ${subdivision}, in collaboration with ${builder} in ${branch}. We look forward to working together and maintaining high standards for this project.
        
        This will be a ${projectType} project, requiring ${materialType} installation.
        
        Project Details:
        - Product Built: ${whatbuild}
        - Project Type: ${projectType}
        - Material Type: ${materialType}
        - Expected Pace: ${epace} ${epace > 1 ? 'days' : 'day'}
        - Number of Lots: ${numberOfLots}
        - Anticipated Start Date: ${anticipatedStartDate}
        
        If you're interested in working with us on this exciting opportunity, please reach out to the ${branch} general manager ${gm} at ${gmEmail}.

        
        Best regards,  
        ${userName}  
        Vanir Installed Sales, LLC  
        Phone: ${userPhone}  
        https://www.vanirinstalledsales.com  
        Better Look. Better Service. Best Choice.
        `.trim();
        console.log("📨 Vendor email to send to:", vendorEmail);

      // Define these before you use them
const vendorSubject = `Vendor Notification | ${subdivision} | ${builder}`;
const vendorBody = `
Hello,

We wanted to inform you that Vanir has secured the bid for the ${subdivision} project with ${builder} in ${branch}.

Project Summary:
- Project Type: ${projectType}
- Material Type: ${materialType}
- Expected Start Date: ${anticipatedStartDate}
- Number of Lots: ${numberOfLots}

Best,  
${userName}  
Vanir Installed Sales, LLC  
Phone: ${userPhone}  
https://www.vanirinstalledsales.com  
Better Look. Better Service. Best Choice.
`.trim();

// ✅ Now it's safe to use


        // Combine emails for the "To" and "CC" sections
        const teamEmails = "purchasing@vanirinstalledsales.com, maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com";
        const toEmails = [teamEmails].filter(Boolean).join(', ');

        // Generate Gmail links for both Management and Subcontractor emails
        const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(teamEmails)}&cc=${encodeURIComponent(ccEmailsString)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;
        const subcontractorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmails)}&cc=${encodeURIComponent(ccEmailsString)}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;

        console.log("Management Gmail Link:", managementGmailLink);
        console.log("Subcontractor Gmail Link:", subcontractorGmailLink);
        if (!vendorEmail || !vendorEmail.includes('@')) {
            console.warn("⚠️ No valid vendor email found. Skipping vendor email link.");
        } else {
            const vendorGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(vendorEmail)}&su=${encodeURIComponent(vendorSubject)}&body=${encodeURIComponent(vendorBody)}`;
            const vendorWindow = window.open(vendorGmailLink);
        }
        
        // Open the Gmail links
        const managementWindow = window.open(managementGmailLink);
        const subcontractorWindow = window.open(subcontractorGmailLink);
        const vendorWindow = window.open(vendorGmailLink);

        if (!managementWindow || !subcontractorWindow || !vendorWindow) {
            alert("Pop-ups were blocked. Please enable pop-ups for this site.");
        }
        
        return {
            managementGmailLink,
            subcontractorGmailLink,
            vendorGmailLink
        };
        

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

document.addEventListener('DOMContentLoaded', () => {
    const userNameInput = document.getElementById('inputUserName');

    if (userNameInput) {
        userNameInput.addEventListener('input', updateSignature);
    }

    function updateSignature() {
        const name = userNameInput?.value || "Your Name";
        const firstLine = document.querySelector('.signature-content p:first-child');
        if (firstLine) {
            firstLine.innerHTML = `${name} | Vanir Installed Sales, LLC`;
        }
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
        "    Enter Bid Name",
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

let offset = null; // Offset for Airtable pagination
const PAGE_SIZE = 20; // Adjust as needed

// Function to fetch paginated bid names from Airtable
async function fetchLazyBidSuggestions(query = "", isInitialLoad = false) {
    try {
        let url = `https://api.airtable.com/v0/${bidBaseName}/${bidTableName}?pageSize=${PAGE_SIZE}`;
        if (offset) url += `&offset=${offset}`;
        if (query) url += `&filterByFormula=SEARCH("${query}", {Bid Name})`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`,
            },
        });

        if (!response.ok) {
            console.error("Error fetching bid suggestions:", response.statusText);
            return [];
        }

        const data = await response.json();
        if (isInitialLoad) bidNameSuggestions = []; // Clear suggestions on initial load
        bidNameSuggestions.push(...data.records.map(record => record.fields["Bid Name"]).filter(Boolean));

        offset = data.offset || null; // Update offset for next fetch
        console.log("Fetched suggestions:", bidNameSuggestions);

        return data.records;
    } catch (error) {
        console.error("Error during lazy loading of bid suggestions:", error);
        return [];
    }
}

// Debounce utility to limit API calls
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}

function initializeBidAutocomplete() {
    const bidContainer = document.getElementById("bidInputContainer");

    if (bidContainer) {
        const autocompleteWrapper = document.createElement("div");
        autocompleteWrapper.classList.add("autocomplete-wrapper");

        const bidInput = document.createElement("input");
        bidInput.type = "text";
        bidInput.placeholder = "Enter Bid Name";
        bidInput.classList.add("autocomplete-input");
        autocompleteWrapper.appendChild(bidInput);

        const dropdown = document.createElement("div");
        dropdown.classList.add("autocomplete-dropdown");
        autocompleteWrapper.appendChild(dropdown);

        bidContainer.appendChild(autocompleteWrapper);

        // Handle input with debounce
        bidInput.addEventListener(
            "input",
            debounce(async function () {
                const query = bidInput.value.toLowerCase();
                dropdown.innerHTML = ""; // Clear existing dropdown

                await fetchLazyBidSuggestions(query, true);

                // Populate dropdown
                bidNameSuggestions.forEach(suggestion => {
                    const option = document.createElement("div");
                    option.classList.add("autocomplete-option");
                    option.textContent = suggestion;

                    

                    option.addEventListener("click", () => {
                        bidInput.value = suggestion; // Set input value
                        dropdown.innerHTML = ""; // Clear dropdown
                        fetchDetailsByBidName(suggestion); // Fetch details for the bid
                    });

                    dropdown.appendChild(option);
                });

                dropdown.style.display = bidNameSuggestions.length > 0 ? "block" : "none";
            }, 300)
        );
 // Lazy load on scroll within the dropdown
 dropdown.addEventListener("scroll", async function () {
    if (dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight && offset) {
        console.log("Fetching more suggestions...");
        await fetchLazyBidSuggestions(bidInput.value);

        bidNameSuggestions.forEach(suggestion => {
            const option = document.createElement("div");
            option.classList.add("autocomplete-option");
            option.textContent = suggestion;

            dropdown.appendChild(option);
        });
    }
});
} else {
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
        fetchAndUpdateAutocomplete();
        await fetchLazyBidSuggestions("", true); // Initial load with no query
        initializeBidAutocomplete();
        // Wait for bidInputContainer to be dynamically created
        await waitForElement('#bidInputContainer');

        // Initialize bid autocomplete
        initializeBidAutocomplete();
    } catch (error) {
    }
});