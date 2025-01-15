import _ from 'lodash'
import express from 'express'
import { Product } from '../model/product.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { Car, validateRating } from '../model/car.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { carId } = req.body
    const cars = await Car.findById(carId).select('ratings rating numRating')
    if (!cars) {
        return res.status(400).send('Record not found!')
    }
    res.send(cars)
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
    const { rating, comment, carId } = req.body

    const car = await Car.findById(carId)
    if (!car) {
        return res.status(400).send('Record not found!')
    }
    const isRated = car.ratings.some(rating => rating.userId.toString() === req.user._id.toString())

    if (isRated) {
        return res.send('Car rating added already!')
    }
    const ratingObj = {
        userId: req.user._id,
        rating,
        comment,
    }
    car.ratings.push(ratingObj)
    car.numRating = car.ratings.length
    car.rating = car.ratings.reduce((acc, item) => item.rating + acc, 0) /
        car.ratings.length;
    await car.save()
    res
        .send(_.pick(car, ['_id', 'name']));
})
router.delete("/:id", authMiddleware, async (req, res) => {
    const { carId } = req.body
    const { id } = req.params

    const car = await Car.findById(carId)
    if (!car) {
        return res.status(400).send('Record not found!')
    }
    const userRating = car.ratings.some((rating) => {
        if (req.user._id == rating.userId && rating._id == id) {
            return true
        }
        return false
    })
    if (!userRating) {
        return res.status(403).send('Access denied!')
    }
    car.ratings.pull({ _id: id })
    car.numRating = car.numRating - 1
    car.rating = car.ratings.length > 0 ? (car.ratings.reduce((acc, item) => item.rating + acc, 0) /
        car.ratings.length) : 0;

    await car.save()

    res.send('Review deleted!')
})

export default router