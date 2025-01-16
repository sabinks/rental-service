import express from 'express'
import Stripe from 'stripe';
const router = express.Router()

import 'dotenv/config'
import { Payment, validateRentalPayment } from '../model/payment.js';
import authMiddleware from '../middleware/authMiddleware.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.get('/', [authMiddleware], async (req, res) => {
    const payments = await Payment.find().populate('userId rentalId')
    res.send(payments)
});

router.post('/', [authMiddleware], async (req, res) => {
    const { error } = validateRentalPayment(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    try {
        const { rentalId, paymentId, stripePaymentId, amount, currency, status } = req.body;

        const payment = await Payment.updateOne({ rentalId, _id: paymentId, userId: req.user._id }, {

            stripePaymentId, amount, currency, status
        })
        // await payment.save()

        res.send('Payment successed!');
    } catch (err) {
        console.log(err);

        res.status(500).send({ error: 'Payment processing failed!' });
    }
});
router.post('/api/payments/:id/status-changge', async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);
        if (!payment || payment.status !== 'succeeded') {
            return res.status(400).send({ error: 'Payment cannot be refunded.' });
        }

        const stripeRefund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
        });

        payment.status = 'refunded';
        payment.refund = {
            amount: stripeRefund.amount / 100,
            reason: stripeRefund.reason,
            initiatedAt: new Date(),
        };
        await payment.save();

        res.send(payment);
    } catch (err) {
        res.status(500).send({ error: 'Failed to process refund.' });
    }
});

router.post('/api/payments/:id/refund', async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);
        if (!payment || payment.status !== 'succeeded') {
            return res.status(400).send({ error: 'Payment cannot be refunded.' });
        }

        const stripeRefund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
        });

        payment.status = 'refunded';
        payment.refund = {
            amount: stripeRefund.amount / 100,
            reason: stripeRefund.reason,
            initiatedAt: new Date(),
        };
        await payment.save();

        res.send(payment);
    } catch (err) {
        res.status(500).send({ error: 'Failed to process refund.' });
    }
});


export default router
