import express from 'express'
import 'dotenv/config'
import connectDB from './config/db.js'
import users from './routes/users.js'
import products from './routes/products.js'
import reviews from './routes/reviews.js'
import auth from './routes/auth.js'
import cars from './routes/cars.js'
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
app.use('/api/reviews', reviews)
app.use('/api/cars', cars)
app.use('/api', general)


app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
})
