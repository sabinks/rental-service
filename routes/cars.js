import express from 'express'
const router = express.Router()
import { Car } from "../model/car.js";

router.get('', async (req, res) => {
    try {
        const cars = await Car.find({ isAvailable: true });
        res.send(cars);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch cars.' });
    }
});
router.post('', async (req, res) => {
    try {
        const car = new Car(req.body);
        await car.save();
        res.status(201).send(car);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Car not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});


export default router
