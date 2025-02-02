import mongoose from "mongoose";
import amqp from "amqplib";
import 'dotenv/config';
import Stripe from 'stripe';
import { Payment } from "./model/payment.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function processPayments() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const queue = "paymentQueue";
        await channel.assertQueue(queue, { durable: true });

        console.log("Payment Processor is Waiting for Messages...");

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const paymentData = JSON.parse(msg.content.toString());
                console.log("Processing Payment:", paymentData);

                try {
                    // Simulating payment processing via Stripe
                    const { confirmationTokenId, paymentId } = paymentData
                    const payment = await Payment.findById(paymentId);
                    const intent = await stripe.paymentIntents.create({
                        confirm: true,
                        amount: payment.amount * 100,
                        currency: payment.currency,
                        automatic_payment_methods: {
                            enabled: true,
                            allow_redirects: 'never'
                        },
                        confirmation_token: confirmationTokenId, // the ConfirmationToken ID sent by your client
                        description: `Payment Id: ${paymentId} & Car Rental Payment:${payment.rentalId} `,

                    });
                    // Save successful payment to DB
                    payment.status = "succeeded"
                    payment.currency = intent.currency.toUpperCase()
                    payment.stripePaymentId = intent.id
                    await payment.save()

                    console.log("✅ Payment Successful:");

                    // Acknowledge the message after successful processing
                    channel.ack(msg);
                } catch (error) {
                    console.error("❌ Payment Failed:", error);
                    await Payment.findByIdAndUpdate(paymentData._id, { status: "failed" });

                    // Reject message, can be requeued if needed
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (err) {
        console.error("Error Processing Payments:", err);
    }
}

mongoose.connect(process.env.MONGO_URI, {}).then(() => {
    console.log("MongoDB Connected for Payment Processing");
    processPayments();
});