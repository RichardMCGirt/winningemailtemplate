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
console.log("Vendor Data:", vendorData);


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
    console.log("Dynamic container found:", dynamicContainer !== null);
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
    try {
        const placeDetails = await fetchPlaceDetails(bidName);
        if (placeDetails) {
            console.log("Place details fetched from server:", placeDetails);

            // Wait for the city span to exist, then update it
            const citySpan = await waitForElement(".city");
            citySpan.innerText = placeDetails.city || "N/A"; // Update city

            // Wait for the zip code span to exist, then update it
            const zipSpan = await waitForElement(".zip_code");
            zipSpan.innerText = placeDetails.zip_code || "N/A"; // Update zip code
        } else {
            console.warn("No place details found for:", bidName);
        }
   

        // Fetch Airtable data
        const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
        const records = await fetchAirtableData(
            bidBaseName,
            bidTableName,
            'Bid Name, GM Email, Attachments, Number of Lots, Anticipated Start Date, vendor',
            filterFormula
        );

        if (records.length > 0) {
            const fields = records[0].fields;

            // Log the entire fields object to inspect all data
            console.log("Fetched fields from Airtable:", fields);

            const builder = fields['Builder'] || 'Unknown Builder';
            const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : "Branch Staff@Vanir.com";
            const branch = fields['Branch'] || 'Unknown Branch';
            const projectType = fields['Project Type'] || '';
            const materialType = fields['Material Type'] || '';
            const attachments = fields['Attachments'] || [];
            const numberOfLots = fields['Number of Lots'] || '';
            const anticipatedStartDate = fields['Anticipated Start Date'] || '';
            const vendor = fields['vendor'];
            console.log("Vendor field fetched:", vendor);

         

            // Check and log attachments
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
            updateTemplateText(
                bidName,
                builder,
                gmEmail,
                branch,
                projectType,
                materialType,
                attachments,
                numberOfLots,
                anticipatedStartDate,
                vendor
            );

            // Fetch and update subcontractor suggestions
            await fetchSubcontractorSuggestions(branch);
            updateSubcontractorAutocomplete();

            return {
                builder,
                gmEmail,
                branch,
                projectType,
                materialType,
                attachments,
                numberOfLots,
                anticipatedStartDate,
                vendor,
            };
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
                anticipatedStartDate: 'Unknown',
                vendor: 'Unknown',
            };
        }
    } catch (error) {
        console.error("Error in fetchDetailsByBidName:", error);
        return null;
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

function updateTemplateText(subdivision, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate, additionalDetails, vendor) {
    console.log('Updating Template Text:', { subdivision, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate, additionalDetails, vendor });

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

    if (vendor) {
        document.querySelectorAll('.vendorContainer').forEach(el => el.textContent = vendor);
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
    console.log("Vendor field value:", vendor);

    console.log('Template updated with:', { subdivision, builder, gmEmail, branch, projectType, materialType, attachments, numberOfLots, anticipatedStartDate, additionalDetails, vendor });
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

        <h4> Major Wins for Team <strong><span class="branchContainer"></span></strong></h4>
        <p>All - I am excited to announce that we have been awarded <strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in <strong><span class="city"></span></strong>, <strong><span class="zip_code"></span></strong>.</p>
        <p>This will be <strong><span class="briqProjectTypeContainer"></span></strong>.</p>

        <h2>Here's the breakdown:</h2>
         <p><strong>Attachments:</strong> <span class="attachmentsContainer"></span></p>
    <p><strong>Number of Lots:</strong> <span class="numberOfLotsContainer"></span></p>
        <p><strong>Vendor:</strong> <span class="vendorContainer"></span></p>

    <p><strong>Anticipated Start Date:</strong> <span class="anticipatedStartDateContainer"></span></p>
        <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>
        <br>
<div style="display: flex; align-items: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
<img src="https://chambermaster.blob.core.windows.net/images/customers/9572/members/204494/logos/MEMBER_PAGE_HEADER/Logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">


    <div style="border-left: 1px solid #ccc; height: 80px; margin: 0 10px;"></div>
    <div>
        <strong>Vanir Installed Sales, LLC</strong><br>
        <div class="input-container" style="display: flex; align-items: center; gap: 10px;">
            <label for="userPhone" style="min-width: 60px;">Phone:</label>
            <input type="text" id="userPhone" placeholder="Enter your phone number" style="flex: 1; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div class="input-container" style="display: flex; align-items: center; gap: 10px;">
            <label for="userEmail" style="min-width: 60px;">Email:</label>
            <input type="text" id="userEmail" placeholder="Enter your email" style="flex: 1; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            </div>
     <br>
                                                
                                                    <a href="https://www.vanirinstalledsales.com" style="text-decoration: none; color: #000;">www.vanirinstalledsales.com</a><br>
                                                    <em>Better Look. Better Service. Best Choice.</em>
  </div>
</div>
<hr>

            <hr>
        <div id="subcontractorCompanyContainer"></div>
        <p><strong>Subject:</strong> Vanir | New Opportunity | <span class="subdivisionContainer"></span></p>
       <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
<p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project, requiring <strong><span class="materialTypeContainer"></span></strong>.</p>
<p>If you're interested in working with us on this exciting opportunity, please reach out to <strong><span class="gmEmailContainer"></span></strong>.</p>

        <p>Kind regards,<br>Vanir Installed Sales Team</p>


      <div style="display: flex; align-items: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
<img src="https://chambermaster.blob.core.windows.net/images/customers/9572/members/204494/logos/MEMBER_PAGE_HEADER/Logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">
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
<img src="https://chambermaster.blob.core.windows.net/images/customers/9572/members/204494/logos/MEMBER_PAGE_HEADER/Logo.jpg" alt="Vanir Logo" style="height: 60px; margin-right: 10px;">
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
const MAX_BODY_SIZE = 2500;

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

Project Type: ${projectType}
Material Type: ${materialType}
Number of Lots: ${numberOfLots}
Anticipated Start Date: ${anticipatedStartDate}
Please review the details and let us know if you have any questions or require additional information.
If you're interested in working with us on this exciting opportunity, please reach out to [Insert Contact Information].

Best regards,  

<div style="margin-top: 20px; display: table;">
  <div style="display: table-cell; vertical-align: middle; padding-right: 10px;">
    <img src="https://chambermaster.blob.core.windows.net/images/customers/9572/members/204494/logos/MEMBER_PAGE_HEADER/Logo.jpg" 
         
         style="height: 60px;">
  </div>


  <div style="display: table-cell; vertical-align: middle; font-family: Arial, sans-serif; color: #000;">
    <strong style="font-size: 14px;">Vanir Installed Sales, LLC</strong><br>
    <span style="font-size: 12px;">Phone: [Insert Phone Number]</span><br>
    <span style="font-size: 12px;">Email: <a href="mailto:contact@vanirinstalledsales.com" 
                                               style="text-decoration: none; color: #000;">contact@vanirinstalledsales.com</a></span><br>
    <a href="https://www.vanirinstalledsales.com" 
       style="font-size: 12px; text-decoration: none; color: #000;">www.vanirinstalledsales.com</a><br>
    <em style="font-size: 12px; color: #555;">Better Look. Better Service. Best Choice.</em>
  </div>
</div>

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