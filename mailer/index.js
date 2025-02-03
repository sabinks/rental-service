import nodemailer from 'nodemailer'
import 'dotenv/config'

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(data) {
    const { subject, html, email, attachments } = data
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Rental Service 👻" <info@rental-service.com>', // sender address
        to: email, // list of receivers
        subject: subject ? subject : "Rental Service Mail", // Subject line
        html: html, // html body, 
        attachments: attachments
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}
export default sendMail