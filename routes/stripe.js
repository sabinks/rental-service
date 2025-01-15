import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router()
import Stripe from "stripe";

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


export default router
