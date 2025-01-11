import _ from 'lodash'
import express from 'express'
import { User, validateUser } from '../model/user.js'
import { genHash } from '../hash.js'
import { Product, validateProduct } from '../model/product.js'
import authMiddleware from '../middleware/authMiddleware.js'
import 'dotenv/config'
const router = express.Router()
router.get('/', async (req, res) => {
    const { limit, page } = req.query
    const pageSize = Number(limit) || process.env.PAGINATION_LIMIT;
    const pageNumber = Number(page) || 1;

    const keyword = req.query.keyword
        ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        }
        : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (pageNumber - 1));

    res.send({ products, pageNumber, pages: Math.ceil(count / pageSize) });
})
router.post('/', authMiddleware, async (req, res) => {
    const { error } = validateProduct(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { name, category, brand, description, rating, price, countInStock } = req.body
    const productExists = await Product.findOne({ name })
    if (productExists) {
        return res.status(400).send('Product already registered!')
    }

    const product = new Product({
        name, category, brand, description, rating, price, countInStock
    })
    product.user = req.user._id
    await product.save()
    res
        .send(_.pick(product, ['_id', 'name']));
})
export default router