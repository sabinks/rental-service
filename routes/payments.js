import Stripe from 'stripe';
import 'dotenv/config'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
router.post('/api/payments', async (req, res) => {
    try {
        const { rentalId, amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe uses cents
            currency: 'usd',
            payment_method_types: ['card'],
        });

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).send({ error: 'Payment processing failed.' });
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
