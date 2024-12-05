const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web; // Use the `web` key
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    console.log('Starting authorization process...');
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            console.log('Token file not found, initiating new token request...');
            return getNewToken(oAuth2Client, callback);
        }
        console.log('Token file found, using existing token.');
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
    
}

function getNewToken(oAuth2Client, callback) {
    console.log('Generating new token...');
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving access token:', err);
                return;
            }
            console.log('Token retrieved successfully:', token);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error('Error writing token to file:', err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}


module.exports = { authorize };
