// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const bidBaseName = 'appK9gZS77OmsIK50';
const bidTableName = 'tblQo2148s04gVPq1';
const subcontractorBaseName = 'applsSm4HgPspYfrg';
const subcontractorTableName = 'tblX03hd5HX02rWQu';
const VendorBaseName = 'appeNSp44fJ8QYeY5';
const VendorTableName = 'tblLEYdDi0hfD9fT3';

let bidNameSuggestions = [];
let subcontractorSuggestions = []; // Stores { companyName, email } for mapping
let city = [];
let subcontractors = []; // Initialize an empty array for subcontractors
let vendorData = [];
let currentBidName = "";

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
            name: record.fields['Name'] || "Unknown Vendor",
            email: record.fields['Email'] || null,
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

async function fetchACMInfoForBranch(branchName) {
    const url = `https://api.airtable.com/v0/appK9gZS77OmsIK50/tblIgxx14Qom58kqK?view=viwtpaTQYhHYGsv1R`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch ACM info:", response.statusText);
            return;
        }

        const data = await response.json();

        const matchedRecord = data.records.find(record => {
            const office = record.fields["Office Name"];
            return office && office.trim().toLowerCase() === branchName.trim().toLowerCase();
        });

        if (matchedRecord) {
            const acmName = matchedRecord.fields["ACM Name"] || "";
            const acmEmail = matchedRecord.fields["ACM Email"] || "";
        
            const nameInput = document.querySelector('.acmName');
            const emailInput = document.querySelector('.acmEmail');
        
            if (nameInput) {
                nameInput.value = acmName;
                autoResizeInput(nameInput);
            }
            
            if (emailInput) {
                emailInput.value = acmEmail;
                autoResizeInput(emailInput);
            }
            
        
            console.log(`✅ Found ACM info for branch "${branchName}": ${acmName}, ${acmEmail}`);
        }
         else {
            console.warn(`⚠️ No ACM record found for branch "${branchName}"`);
        }
    } catch (error) {
        console.error("Error fetching ACM data:", error);
    }
}


function appendEmailsForSelectedBid(selectedBid) {
    console.log("🔧 appendEmailsForSelectedBid triggered");
    
    if (!selectedBid) {
        console.error("❌ No bid selected.");
        return;
    }

    console.log("✅ Selected bid:", selectedBid);

    // Extract the first word from the selected bid
    const firstWord = selectedBid.split(/\s+/)[0].toLowerCase();
    console.log("🔍 First word extracted from bid:", firstWord);

    if (!firstWord) {
        console.error("❌ Invalid bid name provided. Could not extract first word.");
        return;
    }

    // Filter vendor data to match the first word
    const matchingVendors = vendorData.filter(vendor =>
        vendor.name && vendor.name.toLowerCase().startsWith(firstWord)
    );

    console.log(`🔎 Found ${matchingVendors.length} matching vendor(s):`, matchingVendors);

    if (matchingVendors.length > 0) {
        const emails = [];

        // Collect all primary and secondary emails
        matchingVendors.forEach((vendor, index) => {
            console.log(`➡️ Vendor #${index + 1}:`, vendor.name);
            if (vendor.email) {
                emails.push(vendor.email);
                console.log(`📬 Added email: ${vendor.email}`);
            } else {
                console.warn(`⚠️ Vendor "${vendor.name}" has no email.`);
            }
        });

        // Ensure emails are unique
        const uniqueEmails = [...new Set(emails)];
        console.log("🧹 Unique emails to append:", uniqueEmails);

        // Find or create the <p> and <span> container dynamically
        let ccContainer = document.querySelector('.cc-email-container');
        if (!ccContainer) {
            console.log("⚠️ .cc-email-container not found. Creating it dynamically...");

            const emailSection = document.createElement('p');
            emailSection.innerHTML = `CC: <span class="cc-email-container"></span>`;
            document.body.appendChild(emailSection); // You might want to place this elsewhere

            ccContainer = emailSection.querySelector('.cc-email-container');
        }

        // Append emails to the container
        const existingEmails = ccContainer.textContent.split(/[\s,;]+/).filter(Boolean);
        console.log("📥 Existing emails in CC:", existingEmails);

        const updatedEmails = [...new Set([...existingEmails, ...uniqueEmails])];
        console.log("📤 Updated CC email list:", updatedEmails);

        ccContainer.textContent = updatedEmails.join(', ');

        console.log("✅ Emails successfully appended to the CC container.");
    } else {
        console.warn("⚠️ No matching vendors found for bid:", selectedBid);
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
    if (!bidName || bidName.length < 3) {
        console.warn("Ignoring bid fetch for short input:", bidName);
        return;
    }
    const filterFormula = `SEARCH("${bidName.replace(/"/g, '\\"')}", {Bid Name})`;
    const records = await fetchAirtableData(
        bidBaseName,
        bidTableName,
        'Bid Name, GM Email, Attachments, Number of Lots, Anticipated Start Date, Bid Value, vendor, Anticipated Duration, Builder, Branch, Project Type, Material Type, GM Named',
        filterFormula
    );

    console.log("📃 Records returned from Airtable for bid search:", records.map(r => r.fields["Bid Name"]));

    let vendoremail = '';

    if (records.length > 0) {
        const fields = records[0].fields;

        const builder = fields['Builder'] || 'Unknown Builder';
        const gmEmail = fields['GM Email'] ? fields['GM Email'][0] : 'Branch Staff@Vanir.com';
        const branch = fields['Branch'] || 'Unknown Branch';

        if (branch) {
          await fetchSubcontractorSuggestions(branch);
        } else {
          console.warn("⚠️ No branch found in bid details, skipping subcontractor fetch.");
        }
                const projectType = fields['Project Type'] || '';
        const materialType = fields['Material Type'] || '';
        const numberOfLots = fields['Number of Lots'] || '';
        const anticipatedStartDate = fields['Anticipated Start Date'] || '';

        // 🔁 NEW LOGIC: match vendor name to vendorData
        let vendorRaw = fields['vendor'] || '';
        if (Array.isArray(vendorRaw)) {
            vendorRaw = vendorRaw[0] || ''; // take the first entry
        }
        const vendorNormalized = typeof vendorRaw === 'string' ? vendorRaw.toLowerCase().trim() : '';
        
        
        // Get all close matches
        const matchingVendors = vendorData.filter(v =>
            v.name?.toLowerCase().includes(vendorNormalized) ||
            v.email?.toLowerCase().includes(vendorNormalized)
        );
        
        console.log(`🔍 Found ${matchingVendors.length} matching vendors for "${vendorRaw}"`, matchingVendors);
        
        // If only one match, proceed automatically
        if (matchingVendors.length === 1) {
            const matched = matchingVendors[0];
            window.currentVendorEmail = matched.email;
        
            document.querySelectorAll('.vendorNameContainer').forEach(el => el.textContent = matched.name);
            document.querySelectorAll('.vendorEmailWrapper').forEach(el => el.textContent = ` <${matched.email}>`);
        } else if (matchingVendors.length > 1) {
            const branch = document.querySelector('.branchContainer')?.textContent.trim().toLowerCase();
        
            if (branch) {
                // Try to refine match based on branch in name or email
                const narrowedMatches = matchingVendors.filter(vendor =>
                    vendor.name?.toLowerCase().includes(branch) ||
                    vendor.email?.toLowerCase().includes(branch)
                );
        
                if (narrowedMatches.length === 1) {
                    const matched = narrowedMatches[0];
                    window.currentVendorEmail = matched.email;
        
                    document.querySelectorAll('.vendorNameContainer').forEach(el => el.textContent = matched.name);
                    document.querySelectorAll('.vendorEmailWrapper').forEach(el => el.textContent = ` <${matched.email}>`);
                    return; // ✅ Done
                } else if (narrowedMatches.length > 1) {
                    // Multiple matches even after narrowing — show dropdown
                    showVendorSelectionDropdown(narrowedMatches);
                    return;
                }
            }
        
            // Fallback: show all loose matches
            showVendorSelectionDropdown(matchingVendors);
        }
         else {
            console.warn(`⚠️ No close vendor matches for "${vendorRaw}"`);
        }
        
        
        
        

        console.log("Available fields:", Object.keys(fields));

        window.currentVendorEmail = vendoremail;
        console.log("Full fetched record:", records[0]);

        const AnticipatedDuration = fields['Anticipated Duration'];
        const gm = fields['GM Named']
            ? (Array.isArray(fields['GM Named']) ? fields['GM Named'][0] : fields['GM Named'])
            : deriveNameFromEmail(gmEmail);

        updateTemplateText(
            bidName,
            builder,
            gmEmail,
            branch,
            projectType,
            materialType,
            numberOfLots,
            anticipatedStartDate,
            vendorRaw, // ✅ Correct variable
            AnticipatedDuration,
            gm,
            vendoremail
        );

        await fetchSubcontractorSuggestions(fields['Branch']);
        updateSubcontractorAutocomplete();

        return {
            builder,
            gmEmail,
            branch,
            projectType,
            materialType,
            numberOfLots,
            anticipatedStartDate,
            vendorRaw, // ✅ Correct variable
            AnticipatedDuration,
            gm,
            vendoremail,
        };
    } else {
        console.warn("No bid found for the given name:", bidName);
        return {};
    }
}

function showVendorSelectionDropdown(vendorMatches) {
    const container = document.getElementById("vendorEmailContainer");
    if (!container) {
        console.error("No #vendorEmailContainer found.");
        return;
    }

    // Clear existing
    container.innerHTML = "<p><strong>Multiple vendor matches found. Please choose:</strong></p>";

    const list = document.createElement("div");
    list.className = "vendor-select-dropdown";

    vendorMatches.forEach(vendor => {
        const option = document.createElement("div");
        option.className = "vendor-select-option";
        option.innerHTML = `<strong>${vendor.name}</strong><br><small>${vendor.email}</small>`;

        option.addEventListener("click", () => {
            window.currentVendorEmail = vendor.email;

            document.querySelectorAll('.vendorNameContainer').forEach(el => el.textContent = vendor.name);
            document.querySelectorAll('.vendorEmailWrapper').forEach(el => el.textContent = ` <${vendor.email}>`);

            list.remove(); // remove dropdown
        });

        list.appendChild(option);
    });

    container.appendChild(list);
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

function setupCopySubEmailsButton() {
    const button = document.getElementById("copySubEmailsBtn");
    if (!button) {
        console.warn("Copy Sub Emails button not found.");
        return;
    }

    button.addEventListener("click", () => {
        const emails = subcontractorSuggestions.map(sub => sub.email).filter(Boolean);
        const emailList = emails.join(', ');
    
        console.log("🔍 Subcontractor emails to copy:", emails); // <-- ADD THIS
    

        if (!emails.length) {
            alert("No subcontractor emails loaded yet.");
            return;
        }

        navigator.clipboard.writeText(emailList)
            .then(() => {
                alert("Subcontractor emails copied to clipboard!");
            })
            .catch(err => {
                console.error("Failed to copy emails:", err);
                alert("Failed to copy emails. Please try again.");
            });
    });
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

input.addEventListener("input", () => {
    if (input.value.trim() === "") {
      input.classList.add("marching-ants");
      console.log("🟡 Input is empty — marching ants added");
    } else {
      input.classList.remove("marching-ants");
      console.log("✅ Input has value — marching ants removed");
    }
  });
  
  if (input.value.trim() === "") {
    input.classList.add("marching-ants");
    console.log("⚠️ Initially empty — marching ants added");
  }
  
  


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
 
    if (gmEmail) {
      document.querySelectorAll('.gmEmailContainer').forEach(el => (el.textContent = gmEmail));
    }
  
    if (branch) {
      document.querySelectorAll('.branchContainer').forEach(el => (el.textContent = branch));
    }
    fetchACMInfoForBranch(branch);

    if (projectType) {
      document.querySelectorAll('.briqProjectTypeContainer').forEach(el => (el.textContent = projectType));
    }
  
    if (materialType) {
        let formatted = materialType;
      
        // If materialType is a string with two comma-separated values
        if (typeof materialType === "string" && materialType.includes(",")) {
          const parts = materialType.split(",").map(p => p.trim());
          if (parts.length === 2) {
            formatted = `${parts[0]} and ${parts[1]}`;
          }
        }
      
        // Apply the formatted value to each element
        document.querySelectorAll('.materialTypeContainer').forEach(el => {
          el.textContent = formatted;
        });
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
  
 //   if (vendoremail) {
    //  const ccSpan = document.querySelector('.cc-email-container');
    //  if (ccSpan) {
    //    ccSpan.textContent = vendoremail;
    //    console.log("✅ Updated CC field with vendor email:", vendoremail);
   //   }
  //  }
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
    setupCopySubEmailsButton(); // 👈 setup click listener

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

function splitIntoChunks(array, chunkSize = 30) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

async function sendEmailData() {
    const apiUrl = "https://script.googleapis.com/v1/scripts/AKfycbz0XLL8bTtFPiRPRz9HNgHD1KknnMwtgbUUonbH0_OWfSg9_SH3u6SmFErHL4SHbwsBBA:run"; 
    const vendorEmail = window.currentVendorEmail || ""; // 👈 PULL vendor email here
    const gmEmail = document.querySelector('.gmEmailContainer')?.textContent.trim() || '';


    const subcontractorChunks = splitIntoChunks(
        subcontractorSuggestions.map(sub => sub.email).filter(email => typeof email === "string" && email.includes('@')),
        30
    );
    
    // Then, create subcontractorGmailLinks
    const subcontractorGmailLinks = subcontractorChunks.map(chunk => {
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmEmail)}&bcc=${encodeURIComponent(chunk.join(','))}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;
    });
    
    // NOW safely build your data object
    const data = {
        branch,
        subdivision,
        builder,
        projectType: document.querySelector('.briqProjectTypeContainer')?.textContent.trim(),
        materialType: document.querySelector('.materialTypeContainer')?.textContent.trim(),
        anticipatedStartDate: document.querySelector('.anticipatedStartDateContainer')?.textContent.trim(),
        numberOfLots: document.querySelector('.numberOfLotsContainer')?.textContent.trim(),
        managementEmails: [
            "maggie@vanirinstalledsales.com",
            "jason.smith@vanirinstalledsales.com",
            "hunter@vanirinstalledsales.com",
            "rick.jinkins@vanirinstalledsales.com",
            gmEmail
        ].filter(email => typeof email === "string" && email.includes('@')),
        vendorEmails: vendorEmail && vendorEmail.includes('@') ? [vendorEmail] : [],
        subcontractorGmailLinks // <-- You can include this array now
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

   // <p>CC: <span class="cc-email-container">Vendor</span></p>

   function autoResizeInput(input) {
    if (!input) return;
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.font = getComputedStyle(input).font;
    tempSpan.textContent = input.value || input.placeholder || '';
    document.body.appendChild(tempSpan);
    input.style.width = `${tempSpan.offsetWidth + 12}px`; // Add some padding
    document.body.removeChild(tempSpan);
}


   function displayEmailContent() {
    const emailContent = `
        <h2>
            To: maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com, rick.jinkins@vanirinstalledsales.com,
            <span class="gmEmailContainer"></span>
        </h2>
        <p><strong>CC:</strong> <span class="cc-email-container"></span></p>

        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Go <strong><span class="branchContainer"></span></strong>,</p>

        <h4>Major Win with <strong> <span class="builderContainer"></span></strong></h4>
   

        <h2>Here's the breakdown:</h2>
        <span class="subdivisionContainer"></span> :
        <p><strong>Field Contact:</strong> <input class="cname" placeholder="Enter contact name" /></p>
        <p><strong>Product Being Built:</strong> <span class="briqProjectTypeContainer"></span></p>
<p><strong>Expected Pace:</strong> <input class="epace" type="number" placeholder="Days" /> days</p>
        <p><strong>Expected Start Date:</strong> <span class="anticipatedStartDateContainer"></span></p>
        <p><strong>Number of Lots:</strong> <span class="numberOfLotsContainer"></span></p>

        <p><strong>Do they have special pricing?</strong></p>
        <label><input type="radio" name="sprice" value="Yes" class="sprice" /> Yes</label>
        <label><input type="radio" name="sprice" value="No" class="sprice" /> No</label>

        <p><strong>PO Customer?</strong></p>
        <label><input type="radio" name="poCustomer" value="Yes" class="pcustomer" /> Yes</label>
        <label><input type="radio" name="poCustomer" value="No" class="pcustomer" /> No</label>

        <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project requiring <strong><span class="materialTypeContainer"></span></strong> installation.</p>

        <hr>

        <!-- Subcontractor Email -->
        <div id="subcontractorCompanyContainer"></div>
        <button id="copySubEmailsBtn" style="margin-top: 10px;">Copy All <strong><span class="branchContainer"></span></strong> Subcontractors Emails</button>

        <p><strong>Subject:</strong> Vanir | New Opportunity | <span class="subdivisionContainer"></span></p>

        <p>Greetings from Vanir Installed Sales,</p>
            <p>Vanir has officially secured the<strong><span class="subdivisionContainer"></span></strong> with <strong><span class="builderContainer"></span></strong> in 
        <input class="city" placeholder="Enter city" /></p>. We’re eager to get started and ensure excellence throughout the build.

        <p>This will be a <strong><span class="briqProjectTypeContainer"></span></strong> project requiring <strong><span class="materialTypeContainer"></span></strong> installation.</p>

      <p>
  If you're interested in working with us on this exciting opportunity, please reach out to our general manager 
  <strong><span class="gmNameContainer"></span></strong> at 
  <strong><span class="gmEmailContainer"></span></strong> or our Area Construction Manager 
  <input type="text" class="acmName" placeholder="ACM Name" style="margin-left: 4px; margin-right: 4px;" /> at 
  <input type="text" class="acmEmail" placeholder="ACM Email" style="margin-left: 4px;" />.
</p>


        <hr>

        <!-- ✅ Vendor Email Section -->
        <div id="vendorEmailContainer" style="margin-top: 10px;"></div>

        <h2>To: <span class="vendorNameContainer"></span> <span class="vendorEmailWrapper"></span></h2>

        <p><strong>Subject:</strong> Vendor Notification | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Hello <strong><span class="vendorNameContainer"></span></strong>,</p>
        <p>We wanted to notify you that <strong>Vanir Installed Sales</strong> <strong><span class="branchContainer"></span></strong> has secured the bid for the <strong><span class="subdivisionContainer"></span></strong> project with <strong><span class="builderContainer"></span></strong> in <strong><span class="branchContainer"></span></strong>.</p>

        <p><strong>Project Summary:</strong></p>
        <ul>
            <li>Project Type: <span class="briqProjectTypeContainer"></span></li>
            <li>Material Type: <span class="materialTypeContainer"></span></li>
            <li>Expected Start Date: <span class="anticipatedStartDateContainer"></span></li>
            <li>Number of Lots: <span class="numberOfLotsContainer"></span></li>
            <li>Location: <input class="city" placeholder="Enter city" /></li>
        </ul>
<p>We look forward to another successful project with you.</p>
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

    document.addEventListener('DOMContentLoaded', () => {
        const cityObserver = new MutationObserver(() => { 
            const cityInputs = document.querySelectorAll('input.city');
            if (cityInputs.length >= 2) {
                syncCityInputs();
                cityObserver.disconnect();
            }
        });
    
        cityObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
    

    const emailContainer = document.getElementById('emailTemplate');
    if (emailContainer) {
        emailContainer.innerHTML = emailContent;

        // 🔄 Observe for city inputs after they're injected
        const cityObserver = new MutationObserver(() => { 
            const cityInputs = document.querySelectorAll('input.city');
            if (cityInputs.length >= 2) {
                syncCityInputs();
                cityObserver.disconnect();
            }
        });
        cityObserver.observe(emailContainer, {
            childList: true,
            subtree: true,
        });
        
        // ✅ Attach the click listener immediately after creating the button
        const changeVendorBtn = document.getElementById('changeVendorBtn');
        if (changeVendorBtn) {
            changeVendorBtn.addEventListener('click', () => {
                let vendorRaw = document.querySelector('.vendorContainer')?.textContent?.trim().toLowerCase();

                if (!vendorRaw) {
                  vendorRaw = document.querySelector('.vendorNameContainer')?.textContent?.trim().toLowerCase();
                }
                
                if (!vendorRaw) {
                  vendorRaw = vendorData.find(v => v.email === window.currentVendorEmail)?.name?.toLowerCase();
                }
                
        
                                const branch = document.querySelector('.branchContainer')?.textContent?.trim().toLowerCase();
        
                if (!vendorRaw) {
                    alert("Original vendor name not found.");
                    return;
                }
        
                // Re-filter the vendor list based on vendorRaw
                const matches = vendorData.filter(v =>
                    v.name?.toLowerCase().includes(vendorRaw) ||
                    v.email?.toLowerCase().includes(vendorRaw)
                );
        
                // Further narrow down by branch
                const narrowed = matches.filter(v =>
                    v.name?.toLowerCase().includes(branch) ||
                    v.email?.toLowerCase().includes(branch)
                );
        
                const finalMatches = narrowed.length > 0 ? narrowed : matches;
        
                if (finalMatches.length > 1) {
                    // Clear current vendor info
                    document.querySelectorAll('.vendorNameContainer').forEach(el => el.textContent = '');
                    document.querySelectorAll('.vendorEmailWrapper').forEach(el => el.textContent = '');
                    window.currentVendorEmail = '';
        
                    // Show the dropdown again
                    showVendorSelectionDropdown(finalMatches);
                } else {
                    alert("No alternate vendors found for this selection.");
                }
            });
        }
        
                setupCopySubEmailsButton(); // Re-attach button listener
    } else {
        console.error("Email template container not found in the DOM.");
    }
}
// Sync city inputs once both are loaded and observed
function syncCityInputs() {
    const cityInputs = document.querySelectorAll('input.city');

    if (cityInputs.length < 2) return;

    // Avoid duplicate listeners
    cityInputs.forEach(input => {
        input.removeEventListener('input', handleInput);
        input.addEventListener('input', handleInput);
    });

    function handleInput(e) {
        const value = e.target.value;
        cityInputs.forEach(el => {
            if (el !== e.target) el.value = value;
        });
    }

    console.log("✅ City inputs synced and listeners attached");
}

// Trigger the display of email content once vendor emails are fetched
document.addEventListener('DOMContentLoaded', () => {
    displayEmailContent();
});

document.addEventListener('DOMContentLoaded', () => {
    const changeVendorBtn = document.getElementById('changeVendorBtn');

    if (changeVendorBtn) {
        changeVendorBtn.addEventListener('click', () => {
            const vendorNameRaw = document.querySelector('.vendorNameContainer')?.textContent.trim().toLowerCase();

            if (!vendorNameRaw) {
                alert("No vendor name available.");
                return;
            }

            // Use only the first word for fuzzy matching
            const firstWord = vendorNameRaw.split(/\s+/)[0]; // e.g., "Summit" from "Summit Stairs"

            // Get all vendor matches using first word and exclude the exact original name
            const matches = vendorData.filter(vendor => {
                const name = vendor.name?.toLowerCase() || '';
                return name.includes(firstWord) && name !== vendorNameRaw;
            });

            if (matches.length > 0) {
                // Clear current
                document.querySelectorAll('.vendorNameContainer').forEach(el => el.textContent = '');
                document.querySelectorAll('.vendorEmailWrapper').forEach(el => el.textContent = '');
                window.currentVendorEmail = '';

                // Show dropdown with options
                showVendorSelectionDropdown(matches);
            } else {
                alert("No alternate vendors found for this selection.");
            }
        });
    }
});




document.addEventListener('DOMContentLoaded', () => {
    const gmEmailElement = document.querySelector('.gmEmailContainer');
    const gm = document.querySelector('.gmNameContainer')?.textContent || 'GM named';

    const gmEmail = gmEmailElement ? (gmEmailElement.value || gmEmailElement.textContent || 'Not Specified') : 'Not Specified';
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
     //   if (!ccEmailContainer) {
      //      console.error('Element with class "cc-email-container" not found.');
    //        return;
     //   }

        // Fetch dynamic data from the DOM
        const branch = document.querySelector('.branchContainer')?.textContent.trim() || 'Unknown Branch';
        const subdivision = document.querySelector('.subdivisionContainer')?.textContent.trim() || 'Unknown Subdivision';
        const builder = document.querySelector('.builderContainer')?.textContent.trim() || 'Unknown Builder';
        const projectType = document.querySelector('.briqProjectTypeContainer')?.textContent.trim() || 'Default Project Type';
        const materialType = document.querySelector('.materialTypeContainer')?.textContent.trim() || 'General Materials';
        const anticipatedStartDate = document.querySelector('.anticipatedStartDateContainer')?.textContent.trim() || 'Unknown Start Date';
        const numberOfLots = document.querySelector('.numberOfLotsContainer')?.textContent.trim() || 'Unknown Number of Lots';
        const acmNameEl = document.querySelector('.acmName');
const acmEmailEl = document.querySelector('.acmEmail');
const acmName = acmNameEl && acmNameEl.value ? acmNameEl.value.trim() : 'Your ACM';
const acmEmail = acmEmailEl && acmEmailEl.value ? acmEmailEl.value.trim() : 'acm@example.com';

        const cityEl = document.querySelector('.city');
const city = cityEl && cityEl.value ? cityEl.value.trim() : '';

const cnameEl = document.querySelector('.cname');
const cname = cnameEl && cnameEl.value ? cnameEl.value.trim() : 'Unknown Customer Name';

const whatbuildEl = document.querySelector('.whatbuild');
const whatbuild = whatbuildEl && whatbuildEl.value ? whatbuildEl.value.trim() : 'Unknown Product';

const epaceEl = document.querySelector('.epace');
const epace = epaceEl && epaceEl.value ? epaceEl.value.trim() : 'Unknown Pace';

        const sprice = document.querySelector('input[name="sprice"]:checked')?.value || 'Not Specified';
        const poCustomer = document.querySelector('input[name="poCustomer"]:checked')?.value || 'Not Specified';

        // Fetch GM Email
        const gmEmailElement = document.querySelector('.gmEmailContainer');
        const gmEmail = gmEmailElement ? (gmEmailElement.value || gmEmailElement.textContent || 'Not Specified') : 'Not Specified';
        const gm = document.querySelector('.gmNameContainer')?.textContent.trim() || 'Unknown GM';
        const vendorEmail = window.currentVendorEmail || 'Not Specified';


const vendorEmailWrapper = document.querySelector('.vendorEmailWrapper');
if (vendorEmailWrapper) {
    if (vendorEmail !== 'Not Specified' && vendorEmail.includes('@')) {
        vendorEmailWrapper.textContent = ` <${vendorEmail}>`;
    } else {
        vendorEmailWrapper.textContent = '';
    }
}

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
        
        Major Win for with ${builder}!
        
        Here's the breakdown:

        Community Name: 
        - Field Contact: Unknown Customer Name

     Purchasing Contact:  

        - ${projectType}
        - Expected Pace: ${epace} ${epace > 1 ? 'days' : 'day'}
        - Expected Start Date: ${anticipatedStartDate}
        - Number of Lots: ${numberOfLots}
        - Special Pricing: ${sprice}
        - PO Customer: ${poCustomer}
        - Material Type: ${materialType}
        
        Vanir assignments will be:

- Field:
- Account Administrator:
    
        Kind regards,  
        ${userName}  
        Vanir Installed Sales, LLC  
        Phone: ${userPhone}  
        https://www.vanirinstalledsales.com  
        Better Look. Better Service. Best Choice.
        `.trim();
        
        const subcontractorSubject = `Vanir Project Opportunity: ${branch} - ${builder}`;
        const subcontractorBody = `
Greetings from Vanir Installed Sales,
        
       Vanir ${branch} secured the ${subdivision} with ${builder}. We’re eager to get started and ensure excellence throughout the build.
        This will be a ${projectType} project, requiring ${materialType} installation.
        
        Project Details:
        - Product Built: ${whatbuild}
        - Project Type: ${projectType}
        - Material Type: ${materialType}
        - Expected Pace: ${epace} ${epace > 1 ? 'days' : 'day'}
        - Number of Lots: ${numberOfLots}
        - Anticipated Start Date: ${anticipatedStartDate}
        
        If you're interested in partnering with us on this opportunity, please contact our General Manager, ${gm}, at ${gmEmail} or our Area Construction Manager ${acmName} at ${acmEmail} to discuss next steps.
        
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

We're excited to share that Vanir ${branch} will be partnering with ${builder} in ${subdivision}.

Project Summary:
- Project Type: ${projectType}
- Material Type: ${materialType}
- Expected Start Date: ${anticipatedStartDate}
- Number of Lots: ${numberOfLots}
- Address or city of project 

We look forward to another successful project with you.

Best,  
${userName}  
Vanir Installed Sales, LLC  
Phone: ${userPhone}  
https://www.vanirinstalledsales.com  
Better Look. Better Service. Best Choice.
`.trim();

        // Combine emails for the "To" and "CC" sections
        const teamEmails = "maggie@vanirinstalledsales.com, jason.smith@vanirinstalledsales.com, hunter@vanirinstalledsales.com, rick.jinkins@vanirinstalledsales.com";
        const bccEmails = subcontractorSuggestions
        .map(sub => sub.email)
        .filter(Boolean)
        .join(', ');
      
              const vendorToEmail = (vendorEmail && vendorEmail.includes('@')) ? vendorEmail : '';
              const dummyToEmail = "vanir@vanirinstalledsales.com"; 

        // Generate Gmail links for both Management and Subcontractor emails
        const managementGmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(teamEmails)}&cc=${encodeURIComponent(ccEmailsString)}&su=${encodeURIComponent(managementSubject)}&body=${encodeURIComponent(managementBody)}`;
       // 💥 Properly split into chunks
const subcontractorEmailChunks = splitIntoChunks(
    subcontractorSuggestions.map(sub => sub.email).filter(email => typeof email === "string" && email.includes('@')),
    30 // 30 emails per chunk
  );
  
  // 🔥 Now generate multiple subcontractor Gmail links
  const subcontractorGmailLinks = subcontractorEmailChunks.map(chunk => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmEmail)}&bcc=${encodeURIComponent(chunk.join(','))}&su=${encodeURIComponent(subcontractorSubject)}&body=${encodeURIComponent(subcontractorBody)}`;
  });
  
        console.log("Management Gmail Link:", managementGmailLink);
        console.log("Subcontractor Gmail Link:", subcontractorGmailLinks);
        const vendorGmailLink = vendorToEmail
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(vendorToEmail)}&su=${encodeURIComponent(vendorSubject)}&body=${encodeURIComponent(vendorBody)}`
        : gmEmail
          ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmEmail)}&su=${encodeURIComponent(vendorSubject)}&body=${encodeURIComponent(vendorBody)}`
          : null;
      
      
          console.log("Using vendorToEmail:", vendorToEmail);
          console.log("Fallback gmEmail (if needed):", gmEmail);
          
    
        console.log("Vendor Email:", vendorEmail);
        console.log("Vendor Gmail Link:", vendorGmailLink);
        
        return {
            managementGmailLink,
            subcontractorGmailLinks, // <-- now an array of multiple links
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
       sendManagementEmailButton.addEventListener('click', async function () {
    showRedirectAnimation();

    // Open all windows immediately to beat the popup blocker
    const vendorWindow = window.open("about:blank", "_blank");
    const managementWindow = window.open("about:blank", "_blank");
    const subcontractorWindows = [];

    // Pre-open one window for each subcontractor chunk
    const chunkCount = Math.ceil(subcontractorSuggestions.length / 30);
    for (let i = 0; i < chunkCount; i++) {
        subcontractorWindows.push(window.open("about:blank", "_blank"));
    }

    const links = await generateMailtoLinks();

    if (links) {
        const { managementGmailLink, subcontractorGmailLinks, vendorGmailLink } = links;

        if (vendorGmailLink) vendorWindow.location.href = vendorGmailLink;
        else vendorWindow.close();

        if (managementGmailLink) managementWindow.location.href = managementGmailLink;
        else managementWindow.close();

        subcontractorGmailLinks.forEach((link, index) => {
            if (subcontractorWindows[index]) {
                subcontractorWindows[index].location.href = link;
            }
        });
    } else {
        vendorWindow.close();
        managementWindow.close();
        subcontractorWindows.forEach(win => win.close());
            }
        });
    }
}); // ✅ closes the first DOMContentLoaded listener



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
    await fetchAllVendorData(); // Add this before fetchDetailsByBidName
    createVendorAutocompleteInput();

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

function createVendorAutocompleteInput() {
    const container = document.getElementById("vendorEmailContainer");
    if (!container) {
        console.error("❌ vendorEmailContainer not found.");
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "vendor-autocomplete-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter Vendor Name or Email";
    input.className = "vendor-autocomplete-input";

    const dropdown = document.createElement("div");
    dropdown.className = "vendor-autocomplete-dropdown";

    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        dropdown.innerHTML = "";

        const filteredVendors = vendorData.filter(vendor => {
            return (
                vendor.name?.toLowerCase().includes(query) ||
                vendor.email?.toLowerCase().includes(query)
            );
        });

        filteredVendors.forEach(vendor => {
            const option = document.createElement("div");
            option.className = "vendor-autocomplete-option";
            option.innerHTML = `<strong>${vendor.name}</strong><br><small>${vendor.email}</small>`;
            option.addEventListener("click", () => {
                input.value = vendor.name;
                window.currentVendorEmail = vendor.email;

                // Update in DOM
                document.querySelectorAll('.vendorNameContainer').forEach(el => {
                    el.textContent = vendor.name;
                });
                document.querySelectorAll('.vendorEmailWrapper').forEach(el => {
                    el.textContent = ` <${vendor.email}>`;
                });

                dropdown.innerHTML = "";
            });

            dropdown.appendChild(option);
        });

        dropdown.style.display = filteredVendors.length ? 'block' : 'none';
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    container.appendChild(wrapper);
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
 //   await fetchBidNameSuggestions();
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

        // Extract bid names from records
        const newSuggestions = data.records
            .map(record => record.fields["Bid Name"])
            .filter(Boolean);

        if (isInitialLoad) bidNameSuggestions = []; // Clear only if initial load

        // Add new suggestions to global list (avoiding duplicates)
        bidNameSuggestions.push(...newSuggestions);

        offset = data.offset || null;

        console.log("Fetched suggestions:", newSuggestions);

        return newSuggestions; // ✅ Return only new bid names as strings
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

document.addEventListener('DOMContentLoaded', () => {
  const sendSelectedBtn = document.getElementById('sendSelectedEmails');

  sendSelectedBtn.addEventListener('click', async () => {
    showRedirectAnimation(); // Optional

    const { vendorGmailLink, managementGmailLink, subcontractorGmailLinks } = await generateMailtoLinks();

    if (document.getElementById('optionVendor').checked && vendorGmailLink) {
      window.open(vendorGmailLink, '_blank');
    }

    if (document.getElementById('optionManagement').checked && managementGmailLink) {
      window.open(managementGmailLink, '_blank');
    }

    if (document.getElementById('optionSubcontractor').checked && subcontractorGmailLinks.length) {
      subcontractorGmailLinks.forEach(link => {
        window.open(link, '_blank');
      });
    }
  });
});


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
        bidInput.addEventListener("input", debounce(async function () {
            const query = bidInput.value.toLowerCase();
            dropdown.innerHTML = ""; // Clear existing dropdown
        
            const newSuggestions = await fetchLazyBidSuggestions(query, true);
        
            const filtered = newSuggestions.filter(s =>
                s.toLowerCase().includes(query)
            );
        
            filtered.forEach(suggestion => {
                const option = document.createElement("div");
                option.classList.add("autocomplete-option");
                option.textContent = suggestion;
                option.addEventListener("click", () => {
                    bidInput.value = suggestion;
                    currentBidName = suggestion;
                    dropdown.innerHTML = "";
                    fetchDetailsByBidName(suggestion); // ✅ only triggers after click
                });
                
                dropdown.appendChild(option);
            });
        
            dropdown.style.display = filtered.length > 0 ? "block" : "none";
        }, 300));
        

        // Lazy load on scroll
        dropdown.addEventListener("scroll", async function () {
            if (dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight && offset) {
                console.log("Fetching more suggestions...");
                const query = bidInput.value.toLowerCase();
                const newSuggestions = await fetchLazyBidSuggestions(query);
        
                const filtered = newSuggestions.filter(s =>
                    s.toLowerCase().includes(query)
                );
        
                filtered.forEach(suggestion => {
                    const option = document.createElement("div");
                    option.classList.add("autocomplete-option");
                    option.textContent = suggestion;
                    option.addEventListener("click", () => {
                        bidInput.value = suggestion;
                        currentBidName = suggestion;
                        dropdown.innerHTML = "";
                        fetchDetailsByBidName(suggestion); // ✅ only triggers after click
                    });
                    
                    dropdown.appendChild(option);
                });
            }
        });
        
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