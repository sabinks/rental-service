import mongoose from "mongoose";
import server from "../..";
import { Car } from "../../model/car";
import { Rental } from "../../model/rental";
import { Review } from "../../model/reviews";
import supertest from "supertest";
import { User } from "../../model/user";
describe('rental review', () => {
    let token, adminToken;
    let user = { _id: new mongoose.Types.ObjectId(), name: 'User100', role: 'customer' }
    let admin = { _id: new mongoose.Types.ObjectId(), name: 'Admin100', role: 'admin' }
    let car;
    let rentalId = new mongoose.Types.ObjectId()
    let rental;
    beforeEach(async () => {
        token = new User(user).generateAuthToken()
        adminToken = new User(admin).generateAuthToken()
        car = await Car.findOne({ isAvailable: true })
        let rentalStart = "2025-01-20T00:00:00.000"
        let rentalEnd = "2025-01-25T00:00:00.000"
        const totalDays = Math.ceil((new Date(rentalEnd) - new Date(rentalStart)) / (1000 * 60 * 60 * 24));
        const baseCost = totalDays * car.pricePerDay;
        rental = await Rental.create({
            _id: rentalId,
            userId: user._id,
            carId: car._id,
            rentalStart, rentalEnd,
            baseCost,
            finalCost: baseCost,
        })
    })
    afterEach(async () => {
        await Car.updateOne({ _id: car._id }, { isAvailable: true })
        await Rental.deleteOne({ _id: rentalId.toHexString() })
        await Review.deleteMany({ rentalId })
        await server.close()
    })
    describe('POST /', () => {
        it('should return 401 for unauthorized user', async () => {
            const res = await supertest(server).post('/api/rental-reviews')
                .send({
                    rentalId: '',
                    rating: '',
                    comment: ''
                })
            expect(res.status).toBe(401)
        });
        it('should validate rental review data', async () => {
            const res = await supertest(server).post('/api/rental-reviews')
                .set('x-auth-token', token).send({
                    rentalId: '',
                    rating: '',
                    comment: ''
                })
            expect(res.status).toBe(422)
        });

        it('should return 404 if no rental found', async () => {
            const res = await supertest(server).post('/api/rental-reviews')
                .set('x-auth-token', token).send({
                    rentalId: new mongoose.Types.ObjectId().toHexString(),
                    rating: '4',
                    comment: 'nice review'
                })
            expect(res.status).toBe(404)
        });
        it('should return 403 if rental user no match', async () => {
            let newUser = { _id: new mongoose.Types.ObjectId(), name: 'User200', role: 'customer' }
            const newToken = new User(newUser).generateAuthToken()
            const res = await supertest(server).post('/api/rental-reviews')
                .set('x-auth-token', newToken).send({
                    rentalId,
                    rating: '4',
                    comment: 'nice review'
                })
            expect(res.status).toBe(403)
        });
        it('should return 400 if rental is reviewed', async () => {
            const review = await Review.findOne({ rentalId, userId: user._id })

            if (!review) {
                const review = new Review({
                    userId: user._id,
                    rentalId,
                    carId: car._id,
                    rating: '4',
                    comment: 'nice review'
                })
                await review.save()
            }
            const res = await supertest(server).post('/api/rental-reviews')
                .set('x-auth-token', token).send({
                    rentalId,
                    rating: '4',
                    comment: 'nice review'
                })
            expect(res.status).toBe(400)
        });

        it('should return 200 for review created', async () => {
            await Review.deleteMany({ rentalId })
            const res = await supertest(server).post('/api/rental-reviews')
                .set('x-auth-token', token).send({
                    rentalId,
                    rating: '4',
                    comment: 'nice review'
                })
            expect(res.status).toBe(200)
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['_id', 'rating', 'comment']))
        });
    })
    describe('DELETE /:id', () => {
        let reviewId = new mongoose.Types.ObjectId()
        //validate param id
        //404 for review not found
        //access denied for unauthorized user
        //authorised customer user can delete reiew if not published
        //admin can delete review
        let review;

        beforeEach(async () => {
            token = new User(user).generateAuthToken()
            car = await Car.findOne({ isAvailable: true })
            review = await Review.create({
                _id: reviewId,
                userId: user._id,
                rentalId: rental._id,
                carId: car._id,
                rating: '4',
                comment: 'nice review'
            })
        })
        afterEach(async () => {
            await Review.deleteOne({ reviewId })
            await server.close()
        })
        it('should return 400 for invalid review id', async () => {
            const newReviewId = '123123'
            const res = await supertest(server).delete('/api/rental-reviews/' + newReviewId)
                .set('x-auth-token', token).send()
            expect(res.status).toBe(404)
        });
        it('should return 400 for invalid review id', async () => {
            reviewId = new mongoose.Types.ObjectId()
            const res = await supertest(server).delete('/api/rental-reviews/' + reviewId)
                .set('x-auth-token', token).send()
            expect(res.status).toBe(404)
        });
        it('should return 200 for review delete by admin', async () => {
            const res = await supertest(server).delete('/api/rental-reviews/' + reviewId)
                .set('x-auth-token', adminToken).send()
            expect(res.status).toBe(200)
        });
        it('should return 403 for review delete by other customer', async () => {
            const newUser = { ...user, _id: new mongoose.Types.ObjectId() }
            const newToken = new User(newUser).generateAuthToken()
            const res = await supertest(server).delete('/api/rental-reviews/' + reviewId)
                .set('x-auth-token', newToken).send()
            expect(res.status).toBe(403)
        });
        it('should return 403 if user tries to delete published review', async () => {
            const review = await Review.updateOne({ _id: reviewId }, { publish: true })
            const res = await supertest(server).delete('/api/rental-reviews/' + reviewId)
                .set('x-auth-token', token).send()
            expect(res.status).toBe(403)
        });
        it('should return 200 if user tries to delete not publish review', async () => {
            const res = await supertest(server).delete('/api/rental-reviews/' + reviewId)
                .set('x-auth-token', token).send()
            expect(res.status).toBe(200)
        });
    })

})

