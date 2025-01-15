import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);
import passwordComplexity from 'joi-password-complexity'
const reviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
},
    {
        timestamps: true
    }
)
const productSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            require: true,
            ref: 'User'
        },
        name: { type: String, required: true },
        image: { type: String, require: false },
        brand: { type: String, required: true },
        category: { type: String, require: true },
        description: { type: String, required: true },
        reviews: [reviewSchema],
        rating: { type: Number, required: true, default: 0 },
        numReviews: { type: Number, required: true, default: 0 },
        price: { type: Number, required: true, default: 0 },
        countInStock: { type: Number, required: true, default: 0 }
    }, {
    timestamps: true
})


function validateProduct(product) {
    const schema = Joi.object({
        name: Joi.string().required(),
        category: Joi.string().required(),
        brand: Joi.string().required(),
        description: Joi.string().required(),
        rating: Joi.number().required(),
        price: Joi.number().required(),
        countInStock: Joi.number().required(),
    })
    return schema.validate(product, { abortEarly: false })
}

function validateReview(product) {
    const schema = Joi.object({
        carId: myJoiObjectId().required(),
        rating: Joi.number().required(),
        comment: Joi.string().required(),
    })
    return schema.validate(product, { abortEarly: false })
}
const Product = mongoose.model('Product', productSchema)
export { Product, productSchema, validateProduct, validateReview }