import _ from 'lodash'
import express from 'express'
import { Product } from '../model/product.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { Car, validateMaintenance, validateRating } from '../model/car.js'
import admin from '../middleware/admin.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { carId } = req.body
    const cars = await Car.findById(carId).select('maintenance')
    if (!cars) {
        return res.status(400).send('Record not found!')
    }
    res.send(cars)
})

router.post('/', [authMiddleware, admin], async (req, res) => {
    const { error } = validateMaintenance(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { date, details, cost, carId } = req.body

    const car = await Car.findById(carId)
    if (!car) {
        return res.status(400).send('Record not found!')
    }
    const maintenanceObj = {
        date, details, cost
    }
    car.maintenance.push(maintenanceObj)
    await car.save()
    res
        .send(_.pick(car, ['_id', 'name']));
})
router.delete("/:id", [authMiddleware, admin], async (req, res) => {
    const { carId } = req.body
    const { id } = req.params

    const car = await Car.findById(carId)
    if (!car) {
        return res.status(400).send('Record not found!')
    }
    car.maintenance.pull({ _id: id })

    await car.save()

    res.send('Maintenance deleted!')
})

export default router