const nodemailer = require('nodemailer');

async function sendTestEmail() {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'rmcgirt55@gmail.com',
            pass: 'Haleygbop1',  // or 'your_password' if two-factor authentication is off and less secure apps are allowed
        },
    });

    const mailOptions = {
        from: 'rmcgirt55@gmail.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Hello! This is a test email.',
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendTestEmail();
