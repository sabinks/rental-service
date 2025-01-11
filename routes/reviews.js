import _ from 'lodash'
import express from 'express'
import { Product, validateReview } from '../model/product.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()
router.get('/', async (req, res) => {
    const { } = req.params
    const { } = req.query
    const products = await Product.find()
    res.send(products)
})
router.post('/', authMiddleware, async (req, res) => {
    const { error } = validateReview(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { rating, comment, productId } = req.body

    const product = await Product.findById(productId)
    if (!product) {
        return res.status(400).send('Record not found!')
    }
    const isReviewed = product.reviews.some(review => review.user.toString() === req.user._id.toString())

    if (isReviewed) {
        return res.send('Product alread reviewed!')
    }
    const review = {
        name: req.user.name,
        rating, comment,
        user: req.user._id
    }
    product.reviews.push(review)
    product.numReviews = product.reviews.length
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    await product.save()
    res
        .send(_.pick(product, ['_id', 'name']));
})
router.delete("/:id", authMiddleware, async (req, res) => {
    const { productId } = req.body
    const { id } = req.params

    const product = await Product.findById(productId)
    if (!product) {
        return res.status(400).send('Record not found!')
    }
    const userReview = product.reviews.some((review) => {
        if (req.user._id == review.user && review._id == id) {
            return true
        }
        return false
    })
    if (!userReview) {
        return res.status(403).send('Access denied!')
    }
    product.reviews.pull({ _id: id })
    product.numReviews = product.numReviews - 1
    product.rating = product.reviews.length > 0 ? (product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length) : 0;

    await product.save()

    res.send('Review deleted!')
})

export default router