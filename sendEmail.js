const fs = require('fs');
const { google } = require('googleapis');
const { authorize } = require('./authorize');

// Function to create email body
function makeBody(to, subject, message) {
    const str = [
        `Content-Type: text/plain; charset="UTF-8"\n`,
        `MIME-Version: 1.0\n`,
        `Content-Transfer-Encoding: 7bit\n`,
        `to: ${to}\n`,
        `subject: ${subject}\n\n`,
        `${message}`,
    ].join('');
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Function to send email
function sendEmail(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Replace these with your logic to get dynamic data
    const to = getEmailFromDOM(); // Replace with a function to get recipient emails
    const subject = generateEmailSubject(); // Replace with your subject generation logic
    const message = generateEmailBody(); // Replace with your dynamic email body

    const email = makeBody(to, subject, message);

    gmail.users.messages.send(
        {
            userId: 'me',
            requestBody: {
                raw: email,
            },
        },
        (err, res) => {
            if (err) {
                console.error('The API returned an error:', err);
                return;
            }
            console.log('Email sent:', res.data);
        }
    );
}

// Read credentials and authorize
fs.readFile('credentials.json', (err, content) => {
    if (err) {
        console.log('Error loading client secret file:', err);
        return;
    }
    authorize(JSON.parse(content), sendEmail);
});
