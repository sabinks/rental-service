import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import { User } from './model/user.js'
import users from './data/user.js'
import { Payment } from './model/payment.js'
import { Rental } from './model/rental.js'
import { Vehicle } from './model/vehicle.js'

connectDB()

const runSeeder = async () => {
    try {
        // await User.insertMany(users)
        await Vehicle.updateMany({}, { $set: { isAvailable: true } })
        await Payment.deleteMany()
        await Rental.deleteMany()

        console.log('Data Imported');
        process.exit()

    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

runSeeder();
