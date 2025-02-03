import express from 'express'
import fs from 'fs'
import Stripe from "stripe";
import PDFDocument from 'pdfkit'
import { Payment } from '../model/payment.js';
import { User } from '../model/user.js';
import { transporter } from '../mailer/index.js';
const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    typescript: false,
});
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "payment_intent.succeeded") {
        try {
            let { id, amount, currency } = event.data.object
            id = 'pi_3QoE5KG7XkWd5N2y0Urw6fSg'
            const payment = await Payment.findOne({ stripePaymentId: id })
            const user = await User.findById(payment.userId)
            amount = amount / 100; // Convert from cents
            currency = currency.toUpperCase();

            // 🔹 Generate invoice PDF
            const invoicePath = `./invoices/invoice_${id}.pdf`;
            generateInvoice(invoicePath, id, amount, currency, user);

            // 🔹 Send email with invoice
            await sendInvoiceEmail(user.email, invoicePath, amount, currency);

            res.status(200).send();
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
});

// 🔹 Function to Generate Invoice PDF
function generateInvoice(filePath, paymentId, amount, currency, user) {
    const { name, email } = user
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(`Email: ${email}`, { align: "center" });
    doc.fontSize(20).text(`Name: ${name}`, { align: "center" });
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Invoice ID: ${paymentId}`);
    doc.text(`Amount: ${amount} ${currency}`);
    doc.text(`Payment Status: PAID`);
    doc.moveDown();
    doc.text("Thank you for your business!", { align: "center" });
    doc.end();
}

// 🔹 Function to Send Email with Invoice
async function sendInvoiceEmail(toEmail, invoicePath, amount, currency) {
    const mailOptions = {
        from: "your-email@gmail.com",
        to: toEmail,
        subject: "Payment Successful - Invoice Attached",
        text: `Dear Customer,\n\nYour payment of ${amount} ${currency} was successful. Please find the invoice attached.\n\nThank you for choosing us!`,
        attachments: [
            {
                filename: "Invoice.pdf",
                path: invoicePath,
            },
        ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Invoice sent to ${toEmail}`);
}
export default router