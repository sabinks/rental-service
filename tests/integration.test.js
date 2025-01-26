import mongoose from "mongoose";
import supertest from "supertest";
import server from '../index.js'
import { Rental } from "../model/rental.js";
import { Car } from "../model/car.js";
import { User } from "../model/user.js";
import { Payment } from "../model/payment.js";
describe('/api/rental-booking', () => {

    let userId;
    let paymentId;
    let rental;
    let rentalNew;
    let rentalStart, rentalEnd;
    let car;
    let token;
    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId()
        paymentId = new mongoose.Types.ObjectId()
        car = await Car.findOne({ isAvailable: true })
        token = new User().generateAuthToken()

        rentalStart = '2025-01-20T00:00:00.000'
        rentalEnd = '2025-01-22T00:00:00.000'
        const totalDays = Math.ceil((new Date(rentalEnd) - new Date(rentalStart)) / (1000 * 60 * 60 * 24));
        const baseCost = parseInt(totalDays) * car.pricePerDay;

        rental = new Rental({
            userId, paymentId,
            carId: car._id,
            rentalStart,
            rentalEnd,
            totalDays,
            baseCost,
            finalCost: baseCost,
        })
        await rental.save()

    })
    afterEach(async () => {
        await Rental.deleteOne({ _id: rental._id })
        if (rentalNew?._id) {
            const car = await Car.findOne({ _id: rentalNew.carId })
            await Payment.deleteOne({ _id: rentalNew.paymentId })
            await Rental.deleteOne({ _id: rentalNew._id })
            car.isAvailable = true
            await car.save()
        }
    })
    it('should work!', async () => {
        const result = await Rental.findById(rental._id)
        expect(result).not.toBeNull()
    });
    it('should return 401 if customerId is not provided', async () => {
        const res = await supertest(server).post('/api/rental-bookings')
            // .set('x-auth-token', token)
            .send({
                carId: car._id.toString(),
                rentalStart,
                rentalEnd,
            })
        expect(res.status).toBe(401)
    });
    it('should return 422 if carId, rentalStart or rentalEnd is not provided ', async () => {
        const newCar = await Car.findById(car._id)

        const res = await supertest(server).post('/api/rental-bookings')
            .set('x-auth-token', token)
            .send({
                // carId: newCar._id.toString(),
                // rentalStart,
                // rentalEnd
            })
        expect(res.status).toBe(422)
    });
    it('should return 400 if car not found or unavailable ', async () => {
        const newCar = await Car.findOne({ isAvailable: true })
        // newCar.isAvailable = false
        await newCar.save()

        const res = await supertest(server).post('/api/rental-bookings')
            .set('x-auth-token', token)
            .send({
                carId: newCar._id,
                rentalStart,
                rentalEnd
            })
        expect(res.status).toBe(400)
    });

    it('should return 201 if rental booking success ', async () => {

        const res = await supertest(server).post('/api/rental-bookings')
            .set('x-auth-token', token)
            .send({
                carId: car._id.toString(),
                rentalStart,
                rentalEnd
            })
        rentalNew = res.body
        expect(res.status).toBe(201)
    });

    it('should return 200 if rental return success ', async () => {
        const res = await supertest(server).post('/api/rental-bookings')
            .set('x-auth-token', token)
            .send({
                carId: car._id.toString(),
                rentalStart,
                rentalEnd
            })
        rentalNew = res.body
        const anotherResponse = await supertest(server).post(`/api/rentals/${rentalNew._id}/return`)
            .set('x-auth-token', token)
            .send()
        expect(anotherResponse.status).toBe(200)
    });
})