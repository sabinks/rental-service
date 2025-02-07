import express from 'express'
const router = express.Router()
import { Vehicle } from "../model/vehicle.js";
import { Rental, validateRental } from "../model/rental.js";
import authMiddleware from '../middleware/authMiddleware.js';
import { Payment } from '../model/payment.js';

router.post('', authMiddleware, async (req, res) => {
    const { error } = validateRental(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))

        return res.status(422).send(errors)
    }
    try {
        const { vehicleId, rentalStart, rentalEnd } = req.body;
        const vehicle = await Vehicle.findOne({ _id: vehicleId, isAvailable: true });
        if (!vehicle || !Vehicle.isAvailable) {

            return res.status(400).send({ error: 'Vehicle is not available.' });
        }
        const totalDays = Math.ceil((new Date(rentalEnd) - new Date(rentalStart)) / (1000 * 60 * 60 * 24));

        const baseCost = totalDays * Vehicle.pricePerDay;
        const rental = new Rental({
            userId: req.user._id,
            vehicleId,
            rentalStart,
            rentalEnd,
            totalDays,
            baseCost,
            finalCost: baseCost,
        });
        await rental.save();

        Vehicle.isAvailable = false;
        await Vehicle.save();

        const payment = new Payment({
            userId: req.user._id,
            rentalId: rental._id,
            stripePaymentId: "",
            amount: baseCost,
            status: "pending",
        })
        await payment.save()

        rental.paymentId = payment._id
        await rental.save()
        res.status(201).send(rental);
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: 'Failed to create rental.' });
    }
});

router.post('/:id/cancel', [authMiddleware], async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findById(id);
        if (!rental || rental.status !== 'pending') {
            return res.status(400).send({ error: 'Rental cannot be cancelled.' });
        }

        rental.status = 'cancelled';
        await rental.save();

        const vehicle = await Vehicle.findById(rental.vehicleId);
        if (vehicle) {
            Vehicle.isAvailable = true;
            await Vehicle.save();
        }

        res.send({ message: 'Rental cancelled successfully.' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to cancel rental.' });
    }
});
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const rentals = await Rental.find({ userId }).populate('vehicleId');
        res.send(rentals);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch rental history.' });
    }
});

export default router
