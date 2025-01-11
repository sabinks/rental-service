import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import { User } from './model/user.js'
import users from './data/user.js'

connectDB()

const runSeeder = async () => {
    try {
        await User.insertMany(users)

        console.log('Data Imported');
        process.exit()

    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

runSeeder();
