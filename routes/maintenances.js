import _ from 'lodash'
import express from 'express'
import { Product } from '../model/product.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { Vehicle, validateMaintenance, validateRating } from '../model/vehicle.js'
import admin from '../middleware/admin.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { vehicleId } = req.body
    const vehicles = await Vehicle.findById(vehicleId).select('maintenance')
    if (!vehicles) {
        return res.status(400).send('Record not found!')
    }
    res.send(vehicles)
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
    const { date, details, cost, vehicleId } = req.body

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) {
        return res.status(400).send('Record not found!')
    }
    const maintenanceObj = {
        date, details, cost
    }
    Vehicle.maintenance.push(maintenanceObj)
    await Vehicle.save()
    res
        .send(_.pick(vehicle, ['_id', 'name']));
})
router.delete("/:id", [authMiddleware, admin], async (req, res) => {
    const { vehicleId } = req.body
    const { id } = req.params

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) {
        return res.status(400).send('Record not found!')
    }
    Vehicle.maintenance.pull({ _id: id })

    await Vehicle.save()

    res.send('Maintenance deleted!')
})

export default router