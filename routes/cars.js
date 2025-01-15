import express from 'express'
const router = express.Router()
import { Car, validateCar } from "../model/car.js";
import authMiddleware from '../middleware/authMiddleware.js';
import admin from '../middleware/admin.js';
import { validateReview } from '../model/product.js';

router.get('/', async (req, res) => {
    try {
        const cars = await Car.find({ isAvailable: true });
        res.send(cars);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch cars.' });
    }
});

router.post('/', [authMiddleware, admin], async (req, res) => {
    const { error } = validateCar(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    try {
        const car = new Car(req.body);
        await car.save();
        res.status(201).send(car);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const carExists = await Car.findById(id);
        if (!carExists) return res.status(404).send({ error: 'Record not found.' });
        res.send(carExists);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Record not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});

router.post('/:id/make-available', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Car not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.get('/:id/available-history', [authMiddleware, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const car = await Car.findById(id).select('availabilityHistory');
        if (!car) {
            return res.status(404).send('Car not found');
        }
        res.send(car);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.post('/:id/available-history', [authMiddleware, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date } = req.body
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).send('Car not found');
        }
        const historyObj = {
            date: date ? date : (new Date()).toISOString(),
            status
        }
        car.availabilityHistory.push(historyObj)
        await car.save()
        res.send('Record updated!');
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.delete('/:id/available-history/:historyId', [authMiddleware, admin], async (req, res) => {
    try {
        const { id, historyId } = req.params;
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).send('Car not found');
        }
        car.availabilityHistory.pull({ _id: historyId })
        await car.save()
        res.send('Record updated!');
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.post('/:id/reviews', async (req, res) => {
    const { error } = validateReview(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { id } = req.params
    const { _id } = req.user
    const { rating, comment } = req.body

    const car = await Car.findById(id)
    if (!car) {
        return res.status(400).send('Record not found!')
    }
    const isReviewed = car.reviews.some(review => review.user.toString() === req.user._id.toString())

    if (isReviewed) {
        return res.send('Car already reviewed!')
    }
    const review = {
        userId: _id,
        rating,
        comment,
    }
    product.ratings.push(review)
    product.numReviews = product.reviews.length
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    await product.save()
    res
        .send(_.pick(product, ['_id', 'name']));
})

export default router
