import _ from 'lodash'
import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { Review, validateRentalReview } from '../model/reviews.js'
import { Rental } from '../model/rental.js'
import validate from '../middleware/validate.js'
import validateObjectID from '../middleware/validateObjectId.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { rentalId } = req.body
    const reviews = await Review.find({ rentalId })
    if (!reviews) {
        return res.status(400).send('Record not found!')
    }
    res.send(reviews)
})

router.post('/', [authMiddleware, validate(validateRentalReview)], async (req, res) => {
    const { rating, comment, rentalId } = req.body
    const rental = await Rental.findById(rentalId)
    if (!rental) {
        return res.status(404).send('Record not found!')
    }
    if (rental.userId.toString() !== req.user._id.toString() && req.user.role == 'customer') {
        return res.status(403).send('Access Denied!')
    }
    const reviewExists = await Review.findOne({ userId: req.user._id, rentalId })
    if (reviewExists) {
        return res.status(400).send('Review already added!')
    }
    const review = new Review({
        userId: req.user._id,
        rentalId,
        carId: rental.carId,
        rating,
        comment
    })
    await review.save()
    res.status(200).send(_.pick(review, ['_id', 'comment', 'rating']));
})
router.delete("/:id", [authMiddleware, validateObjectID], async (req, res) => {
    const { id } = req.params
    const review = await Review.findById(id)
    if (!review) {
        return res.status(404).send('Record not found!')
    }
    if ((review.userId.toString() === req.user._id.toString() && review.publish == false)
        || req.user.role == 'admin') {
        await review.deleteOne()
        return res.status(200).send('Review deleted!')
    }
    res.status(403).send('Access Denied!')

})

export default router