import express from 'express'
import Stripe from "stripe";
import authMiddleware from '../middleware/authMiddleware.js';
import { sendPaymentRequest } from '../producer.js'

const router = express.Router()
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
export default router
