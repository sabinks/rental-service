import express from 'express'
import path, { dirname } from 'path'
import config from 'config'
import connectDB from './config/db.js'
import users from './routes/users.js'
import products from './routes/products.js'
import rentals from './routes/rentals.js'
import rentalReviews from './routes/rental-reviews.js'
import rentalBooking from './routes/rental-bookings.js'
import ratings from './routes/ratings.js'
import payments from './routes/payments.js'
import maintenances from './routes/maintenances.js'
import auth from './routes/auth.js'
import vehicles from './routes/vehicles.js'
import stripe from './routes/stripe.js'
import webhooks from './routes/webhooks.js'
import general from './routes/general.js'
import authMiddleware from './middleware/authMiddleware.js'
import errorMiddleware from './error.js'
import validateObjectID from './middleware/validateObjectId.js'
import cors from 'cors'

if (process.env.NODE_ENV == 'test' && !config.get('jwtPrivateKey')) {
    console.log('Fatal Error: jwtPrivateKey is not defined.');
    process.exit(1)
}

connectDB()
const app = express()
const corsOptions = {
    origin: 'http://localhost:5173', // Match your frontend's address
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
};
app.use('/api/stripe/webhooks', webhooks)
app.use(cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(authMiddleware)
const __dirname = dirname('./index.js')
app.use('/public/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', auth)
app.use('/api/users', users)
app.use('/api/products', products)
app.use('/api/rentals', rentals)
app.use('/api/payments', payments)
app.use('/api/rental-bookings', rentalBooking)
app.use('/api/rental-reviews', rentalReviews)
app.use('/api/ratings', ratings)
app.use('/api/maintenances', maintenances)
app.use('/api/vehicles', vehicles)
app.use('/api', general)
app.use('/api/stripe', stripe)
app.use(validateObjectID)
app.use(errorMiddleware)

const port = process.env.PORT
const server = app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
})
export default server
