import express from 'express'
const router = express.Router()
import { Car } from "../model/car.js";
import { Rental, rentalSchema } from "../model/rental.js";
import authMiddleware from '../middleware/authMiddleware.js';

router.get('/', [authMiddleware], async (req, res) => {
    try {
        const { _id, name, role } = req.user
        let rentals = []
        if (role == 'customer') {
            rentals = await Rental.find({ userId: _id }).populate('carId paymentId')
        } else {
            rentals = await Rental.find({}).populate('carId paymentId')
        }
        res.status(200).send(rentals);
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: 'Failed to create rental.' });
    }
});
router.post('/:id/return', [authMiddleware], async (req, res) => {
    try {
        const { id } = req.params
        const rental = await Rental.findById(id)
        if (!rental) {
            return res.status(404).send('Rental not found!');
        }
        rental.status = 'returned'
        await rental.save()
        const car = await Car.findById(rental.carId)
        car.isAvailable = true
        await car.save()
        res.status(200).send('Rental updated');
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: 'Failed to create rental.' });
    }
});

export default router
