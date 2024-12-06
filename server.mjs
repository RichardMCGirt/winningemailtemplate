function runScript() {
  const scriptId = '1YTrwcksN2afTCCOqz7g-OhDVcs3OVjM2oUzisQtHg23hpC-Xx4HPlLkp';
  const functionName = 'sendFormattedEmail';

  const service = getOAuthService();
  if (service.hasAccess()) {
    Logger.log('Access token found. Executing script...');
    executeScript(service, scriptId, functionName);
  } else {
    Logger.log('No access token found. Redirecting for authentication...');
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log(`Please visit this URL to authorize: ${authorizationUrl}`);
  }
}

function getOAuthService() {
  return OAuth2.createService('googleAppsScript')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setClientId('882687108659-lmbcqc7c9hk2p6jbidnlei43ecc1r4qv.apps.googleusercontent.com')
    .setRedirectUri('http://localhost:5503/')
    .setScopes([
      'https://www.googleapis.com/auth/script.projects',
      'https://www.googleapis.com/auth/script.scriptapp',
      'https://www.googleapis.com/auth/script.send_mail'
    ]);
}

function executeScript(service, scriptId, functionName) {
  const url = `https://script.googleapis.com/v1/scripts/${scriptId}:run`;
  const payload = {
    'function': functionName,
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + service.getAccessToken()
    },
    'payload': JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('Script response:', response.getContentText());
  } catch (error) {
    Logger.log('Error running the script:', error.message);
  }
}
