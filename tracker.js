import express from 'express'
import 'dotenv/config';
import connectDB from './config/db.js'
import tracker from './routes/trackers.js'
import validateObjectID from './middleware/validateObjectId.js'
import cors from 'cors'

connectDB()
const app = express()
// const corsOptions = {
//     origin: 'http://localhost:5173', // Match your frontend's address
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
// };
// app.use(cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/tracker', tracker)
// app.use(validateObjectID)

const port = process.env.TRACKER_PORT
const server = app.listen(port, () => {
    console.log(`Tracker server running in ${process.env.NODE_ENV} mode on port ${port}`)
})
export default server
