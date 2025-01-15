import express from 'express'
const router = express.Router()
import { Car } from "../model/car.js";
import { Rental } from "../model/rental.js";
import authMiddleware from '../middleware/authMiddleware.js';

router.get('/', [authMiddleware], async (req, res) => {
    try {
        const { _id, name, role } = req.user
        let rentals = []
        if (role == 'customer') {
            rentals = await Rental.find({ userId: _id }).populate('carId')
        } else {
            rentals = await Rental.find({}).populate('carId')
        }
        res.status(201).send(rentals);
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: 'Failed to create rental.' });
    }
});

export default router
