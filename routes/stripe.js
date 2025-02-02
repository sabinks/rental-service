import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router()
import Stripe from "stripe";
import { sendPaymentRequest } from '../producer.js'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    typescript: false,
});

router.post('/create-payment-intent', authMiddleware, async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency
        });
        res.status(200).send(paymentIntent);
    } catch (err) {
        console.log(err);

        res.status(500).send({ error: 'Error in creating payment intent.' });
    }
});
router.post('/delete-payment-intent', async (req, res) => {
    try {
        const { intent } = req.body;
        const paymentIntent = await stripe.paymentIntents.cancel(intent);
        res.status(200).send('Payment intent cancelled');
    } catch (err) {
        res.status(500).send({ error: 'Error in cancelling payment intent.' });
    }
});
router.post('/create-confirm-intent', async (req, res) => {
    const { confirmationTokenId, paymentId, amount, currency } = req.body;
    await sendPaymentRequest({ confirmationTokenId, paymentId });
    res.status(200).send('Payment request sent');
});
router.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === "payment_intent.succeeded") {
            console.log("✅ Payment Succeeded:", event.data.object.id);
            await Payment.findOneAndUpdate(
                { paymentIntentId: event.data.object.id },
                { status: "completed" }
            );
        }

        res.status(200).send();
    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

export default router
