import express from 'express'
import 'dotenv/config'
import connectDB from './config/db.js'
import users from './routes/users.js'
import products from './routes/products.js'
import rentals from './routes/rentals.js'
import rentalReviews from './routes/rental-reviews.js'
import rentalBooking from './routes/rental-bookings.js'
import ratings from './routes/ratings.js'
import maintenances from './routes/maintenances.js'
import auth from './routes/auth.js'
import cars from './routes/cars.js'
import stripe from './routes/stripe.js'
import general from './routes/general.js'
import authMiddleware from './middleware/authMiddleware.js'
const port = process.env.PORT

connectDB()

const app = express()
app.use(express.json())
app.use(express.urlencoded())
// app.use(authMiddleware)

app.use('/api/auth', auth)
app.use('/api/users', users)
app.use('/api/products', products)
app.use('/api/rentals', rentals)
app.use('/api/rental-bookings', rentalBooking)
app.use('/api/rental-reviews', rentalReviews)
app.use('/api/ratings', ratings)
app.use('/api/maintenances', maintenances)
app.use('/api/cars', cars)
app.use('/api', general)
app.use('/api/stripe', stripe)


app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
})
