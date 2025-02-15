import mongoose from "mongoose"
import supertest from "supertest"
import server from '../../index'
import { User } from "../../model/user";
import { Vehicle } from "../../model/vehicle";
import FormData from "form-data";

describe('vehicles api', () => {
    let vehicle;
    let rental;
    let token;
    let adminToken;
    let userId;
    let rentalStart, rentalEnd;
    let paymentId;
    let filteredData = [];
    let randomArray = ['random1', 'random2', 'random3']
    beforeAll(async () => {
        token = new User().generateAuthToken()
        adminToken = new User({ _id: new mongoose.Types.ObjectId().toHexString(), name: 'Admin', role: 'admin' })
            .generateAuthToken()
        userId = new mongoose.Types.ObjectId()
        paymentId = new mongoose.Types.ObjectId()
        vehicle = await Vehicle.findOne({ isAvailable: false })
        await Vehicle.insertMany([
            {
                make: '2021',
                model: 'Honda Civic',
                year: '2021',
                licensePlate: 'random1',
                category: 'Sedan',
                pricePerDay: 20,
                features: 'perfect in condition'
            },
            {
                make: '2021',
                model: 'Honda Civic',
                year: '2021',
                licensePlate: 'random2',
                category: 'Sedan',
                pricePerDay: 20,
                features: 'perfect in condition'
            }
        ])
    })
    afterAll(async () => {
        randomArray.map(async (name) => {
            await Vehicle.deleteOne({ licensePlate: name })
        })
        await server.close()
        // await mongoose.disconnect()
    })
    describe('GET /', () => {
        it('should return all vehicles', async () => {
            const res = await supertest(server).get('/api/vehicles')
            filteredData = res.body.filter(i => randomArray.includes(i.licensePlate));

            expect(res.status).toBe(200)
            expect(filteredData.length).toBe(2)
        })
        it('should return 400 for invalid id params', async () => {
            const id = 'abc'
            const res = await supertest(server).get('/api/vehicles/' + id)
            expect(res.status).toBe(404)
        })
        it('should return not found vehicle', async () => {
            const id = new mongoose.Types.ObjectId()
            const res = await supertest(server).get('/api/vehicles/' + id)
            expect(res.status).toBe(404)
        })
        it('should return a vehicle', async () => {
            const id = filteredData[0]._id
            const res = await supertest(server).get('/api/vehicles/' + id)
            expect(res.status).toBe(200)
            expect(res.body).toMatchObject(filteredData[0])
        })
    })

    describe('POST /api/vehicles', () => {
        it('should return 401 if user is not logged in', async () => {
            const formData = new FormData()
            const data = {
                model: 'Honda Civic',
                make: '2021',
                year: '2021',
                licensePlate: 'random3',
                category: 'Sedan',
                pricePerDay: 20,
                features: ['perfect in condition', 'feature one']
            }
            for (const key in data) {
                formData.append(key, data[key])
            }

            const res = await supertest(server).post('/api/vehicles')
                .attach(formData)
            expect(res.status).toBe(401)
        })
        it('should return 201 for new vehicle created', async () => {
            const formData = new FormData()
            const data = {
                model: 'Honda Civic',
                make: '2021',
                year: '2021',
                licensePlate: 'random3',
                category: 'Sedan',
                pricePerDay: 20,
                features: ['perfect in condition', 'another feature']
            }

            const req = supertest(server).post('/api/vehicles')
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => req.field(key, item));
                } else {
                    req.field(key, value);
                }
            });
            const res = await req.set('x-auth-token', adminToken)
            expect(res.status).toBe(201)
        })
        it('should return 422 if vehicle input not provided', async () => {
            const formData = new FormData()
            const data = {
                model: 'Honda Civic',
                make: '2021',
                year: '2021',
                licensePlate: 'random3',
                category: 'Sedan',
                // pricePerDay: 20,
                features: ['perfect in condition', 'another feature']
            }
            const req = supertest(server).post('/api/vehicles')
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => req.field(key, item));
                } else {
                    req.field(key, value);
                }
            });
            const res = await req.set('x-auth-token', adminToken)
            expect(res.status).toBe(422)
        })
    })
})