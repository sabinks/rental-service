import express from 'express'
import path, { dirname } from 'path'
import multer from 'multer';
import fs from 'fs'
import { Vehicle, validateVehicle } from "../model/vehicle.js";
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
        const vehicles = await Vehicle.find({ isAvailable: true });
        if (!vehicles) {
            return res.status(404).send('No record found!')
        }
        res.status(200).send(vehicles);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch vehicles.' });
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
        const { error } = validateVehicle(req.body)
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
        let vehicleExists = await Vehicle.findOne({ licensePlate })
        if (vehicleExists) {
            return res.status(400).send('Vehicle already exists!')
        }

        let vehicle = new Vehicle({ model, make, year, licensePlate, category, pricePerDay, features, description });

        await vehicle.save();
        req.files.forEach(file => {
            vehicle.images.push('/uploads/' + file.filename)
        })
        await vehicle.save()
        res.status(201).send('Vehicle created!')
    })
});

router.get('/:id', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleExists = await Vehicle.findById(id);
        if (!vehicleExists) {
            return res.status(404).send({ error: 'Record not found.' });
        }
        res.send(vehicleExists).status(200);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update Vehicle.' });
    }
});

router.put('/:id', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedVehicle) return res.status(404).send({ error: 'Record not found.' });
        res.send(updatedVehicle);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update Vehicle.' });
    }
});

router.post('/:id/make-available', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedVehicle) return res.status(404).send({ error: 'Vehicle not found.' });
        res.send(updatedVehicle);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update Vehicle.' });
    }
})

router.get('/:id/available-history', [authMiddleware, validateObjectID, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id).select('availabilityHistory');
        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }
        res.send(vehicle);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update Vehicle.' });
    }
})

router.post('/:id/available-history', [authMiddleware, validateObjectID, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date } = req.body
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }
        const historyObj = {
            date: date ? date : (new Date()).toISOString(),
            status
        }
        Vehicle.availabilityHistory.push(historyObj)
        await Vehicle.save()
        res.send('Record updated!');
    } catch (err) {
        res.status(500).send({ error: 'Failed to update Vehicle.' });
    }
})

router.delete('/:id/available-history/:historyId', [authMiddleware, validateObjectID, admin], async (req, res) => {
    try {
        const { id, historyId } = req.params;
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }
        Vehicle.availabilityHistory.pull({ _id: historyId })
        await Vehicle.save()
        res.send('Record updated!');
    } catch (err) {
        res.status(500).send({ error: 'Failed to update Vehicle.' });
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

    const vehicle = await Vehicle.findById(id)
    if (!vehicle) {
        return res.status(400).send('Record not found!')
    }
    const isReviewed = Vehicle.reviews.some(review => review.user.toString() === req.user._id.toString())

    if (isReviewed) {
        return res.send('Vehicle already reviewed!')
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
