import _ from 'lodash'
import express from 'express'
import { Product } from '../model/product.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { Vehicle, validateRating } from '../model/vehicle.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { vehicleId } = req.body
    const vehicles = await Vehicle.findById(vehicleId).select('ratings rating numRating')
    if (!vehicles) {
        return res.status(400).send('Record not found!')
    }
    res.send(vehicles)
})

router.post('/', authMiddleware, async (req, res) => {
    const { error } = validateRating(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { rating, comment, vehicleId } = req.body

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) {
        return res.status(400).send('Record not found!')
    }
    const isRated = Vehicle.ratings.some(rating => rating.userId.toString() === req.user._id.toString())

    if (isRated) {
        return res.send('Vehicle rating added already!')
    }
    const ratingObj = {
        userId: req.user._id,
        rating,
        comment,
    }
    Vehicle.ratings.push(ratingObj)
    Vehicle.numRating = Vehicle.ratings.length
    Vehicle.rating = Vehicle.ratings.reduce((acc, item) => item.rating + acc, 0) /
        Vehicle.ratings.length;
    await Vehicle.save()
    res
        .send(_.pick(vehicle, ['_id', 'name']));
})
router.delete("/:id", authMiddleware, async (req, res) => {
    const { vehicleId } = req.body
    const { id } = req.params

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) {
        return res.status(400).send('Record not found!')
    }
    const userRating = Vehicle.ratings.some((rating) => {
        if (req.user._id == rating.userId && rating._id == id) {
            return true
        }
        return false
    })
    if (!userRating) {
        return res.status(403).send('Access denied!')
    }
    Vehicle.ratings.pull({ _id: id })
    Vehicle.numRating = Vehicle.numRating - 1
    Vehicle.rating = Vehicle.ratings.length > 0 ? (Vehicle.ratings.reduce((acc, item) => item.rating + acc, 0) /
        Vehicle.ratings.length) : 0;

    await Vehicle.save()

    res.send('Review deleted!')
})

export default router