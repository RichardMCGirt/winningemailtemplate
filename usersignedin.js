console.log("Hello, world!");

let GoogleAuth;

function initGoogleAPI() {
  console.log("Initializing Google API...");
  gapi.load('client:auth2', function () {
    console.log("Google API loaded successfully.");
    gapi.auth2.init({
      client_id: '882687108659-vqkr605rdsgesl5h348l07o0um11rjjg.apps.googleusercontent.com',
    }).then(function () {
      console.log("Google API initialized.");
      checkUserSignedIn();
    }).catch(function (error) {
      console.error("Error initializing Google API: ", error);
      if (error.error === 'idpiframe_initialization_failed') {
        console.error("Details: ", error.details);
        console.log("Ensure your origin is registered in Google Cloud Console.");
      }
    });
  });
}


// Check if the user is signed in
function checkUserSignedIn() {
  console.log("Checking if the user is signed in...");
  GoogleAuth = gapi.auth2.getAuthInstance();
  
  if (GoogleAuth.isSignedIn.get()) {
    console.log("User is signed in.");
    const user = GoogleAuth.currentUser.get();
    const email = user.getBasicProfile().getEmail();  // Fetch email from the Google profile
    console.log("User email: ", email);  // Log the user's email
    autoPopulateSignature(email);
  } else {
    console.log('User is not signed in');
    // Optionally, show a sign-in button
    signIn();
  }
}

// Sign in the user if they are not signed in
function signIn() {
  console.log("Signing in the user...");
  GoogleAuth.signIn().then(function () {
    console.log("User signed in.");
    checkUserSignedIn();
  });
}

function autoPopulateSignature(email) {
  console.log("Auto-populating signature for email: ", email);

  // Check if the email domain matches '@vanirinstalledsales.com'
  if (email.endsWith('@vanirinstalledsales.com')) {
    console.log("Email domain matches '@vanirinstalledsales.com'");
    const name = email.split('@')[0];  // Use part of the email as name, or fetch full name if needed
    const signature = `
      Best regards,  
      ${name}  
      Email: ${email}
      Title: [Your Title Here]  
      Phone: [Your Phone Number Here]  
    `;
    
    // Set this signature to a text area or any other element in your email template
    document.getElementById('signatureField').value = signature;
    console.log("Signature populated in the signature field.");
  } else {
    console.log('Not a valid email domain for signature auto-population.');
  }
}

// Run the script on startup
document.addEventListener('DOMContentLoaded', function () {
  console.log("Document loaded, starting initialization...");
  initGoogleAPI();
});
