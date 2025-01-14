import express from 'express'
const router = express.Router()
import { Car } from "../model/car.js";
import { Rental } from "../model/rental.js";
router.post('/api/rentals', async (req, res) => {
    try {
        const { userId, carId, rentalStart, rentalEnd } = req.body;
        const car = await Car.findById(carId);
        if (!car || !car.isAvailable) {
            return res.status(400).send({ error: 'Car is not available.' });
        }
        const totalDays = Math.ceil((new Date(rentalEnd) - new Date(rentalStart)) / (1000 * 60 * 60 * 24));
        const baseCost = totalDays * car.pricePerDay;

        const rental = new Rental({
            userId,
            carId,
            rentalStart,
            rentalEnd,
            totalDays,
            baseCost,
            finalCost: baseCost,
        });
        await rental.save();

        car.isAvailable = false;
        await car.save();

        res.status(201).send(rental);
    } catch (err) {
        res.status(500).send({ error: 'Failed to create rental.' });
    }
});

router.post('/api/rentals/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findById(id);
        if (!rental || rental.status !== 'pending') {
            return res.status(400).send({ error: 'Rental cannot be cancelled.' });
        }

        rental.status = 'cancelled';
        await rental.save();

        const car = await Car.findById(rental.carId);
        if (car) {
            car.isAvailable = true;
            await car.save();
        }

        res.send({ message: 'Rental cancelled successfully.' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to cancel rental.' });
    }
});
router.get('/api/rentals/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const rentals = await Rental.find({ userId }).populate('carId');
        res.send(rentals);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch rental history.' });
    }
});


export default router
