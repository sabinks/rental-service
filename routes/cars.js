import express from 'express'
import path, { dirname } from 'path'
import multer from 'multer';
import fs from 'fs'
import { Car, validateCar } from "../model/car.js";
import authMiddleware from '../middleware/authMiddleware.js';
import admin from '../middleware/admin.js';
import { validateReview } from '../model/product.js';
import validateObjectID from '../middleware/validateObjectId.js';
const router = express.Router()

import validate from '../middleware/validate.js';
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
const __dirname = dirname("./index.js")

const storage = multer.diskStorage({
    destination: path.join(__dirname, "uploads"),
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname)
        cb(null, filename)
    }
})
const allowedFileType = ['image/jpeg', 'image/png', 'image/jpg']

const fileFilter = (req, file, cb) => {
    if (!allowedFileType.includes(file.mimetype)) {
        return cb(new Error("Invalid file type. Only JPEG, PNG, JPG allowed"))
    }
    cb(null, true)
}
const maxFileSize = 2 * 1024 * 1024

const upload = multer({
    storage, fileFilter, limits: { fileSize: maxFileSize }
})

const uploadHandle = upload.array('images', 4)

router.get('/', async (req, res) => {
    try {
        const cars = await Car.find({ isAvailable: true });
        if (!cars) {
            return res.status(404).send('No record found!')
        }
        res.status(200).send(cars);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch cars.' });
    }
});

router.post('/', [authMiddleware, admin], async (req, res) => {
    uploadHandle(req, res, async (err) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('No files uploaded')
        }
        if (err) {
            return res.status(500).send('File upload failed')
        }
        const { error } = validateCar(req.body)
        if (error) {
            const errors = error.details.map(err => ({
                message: err.message,
                key: err.context.key
            }))
            if (req.files || req.files.length !== 0) {
                req.files.forEach(file => {
                    fs.unlink('../uploads/' + file.filename)
                })
            }
            return res.status(422).send(errors)
        }
        const { model, make, year, licensePlate, category, pricePerDay, features, description } = req.body
        let carExists = await Car.findOne({ licensePlate })
        if (carExists) {
            return res.status(400).send('Car already exists!')
        }

        let car = new Car({ model, make, year, licensePlate, category, pricePerDay, features, description });

        await car.save();
        req.files.forEach(file => {
            car.images.push('/uploads/' + file.filename)
        })
        await car.save()
        res.status(201).send('Car created!')
    })
});

router.get('/:id', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const carExists = await Car.findById(id);
        if (!carExists) {
            return res.status(404).send({ error: 'Record not found.' });
        }
        res.send(carExists).status(200);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});

router.put('/:id', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Record not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});

router.post('/:id/make-available', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Car not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.get('/:id/available-history', [authMiddleware, validateObjectID, admin], async (req, res) => {
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

router.post('/:id/available-history', [authMiddleware, validateObjectID, admin], async (req, res) => {
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

router.delete('/:id/available-history/:historyId', [authMiddleware, validateObjectID, admin], async (req, res) => {
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

router.post('/:id/reviews', validateObjectID, async (req, res) => {
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
