import mongoose from "mongoose"
import supertest from "supertest"
import server from '../../index'
import { User } from "../../model/user";
import { Rental } from "../../model/rental";
import { Car } from "../../model/car";

describe('rentals api', () => {
    let car;
    let rental;
    let token;
    let userId;
    let rentalStart, rentalEnd;
    let paymentId;
    beforeEach(async () => {
        token = new User().generateAuthToken()
        userId = new mongoose.Types.ObjectId()
        paymentId = new mongoose.Types.ObjectId()
        car = await Car.findOne({ isAvailable: false })
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
        car.isAvailable = true
        await rental.save()
        await car.save()
    })
    afterEach(async () => {
        // car.isAvailable = false
        await car.save()
        if (rental) {
            await Rental.deleteOne({ _id: rental._id })
        }
    })
    test('should work', async () => {
        const rentals = await Rental.find()
        expect(rentals.length).toBeGreaterThan(0)
    });
    test('should return 401 for unauthorized user', async () => {
        const res = await supertest(server)
            .get('/api/rentals')
        expect(res.status).toBe(401)
    })
    test('should return 500', async () => {
        const res = await supertest(server)
            .get('/api/rentals')
            .set('x-auth-token', token)
        expect(res.status).toBe(200)
    })
})