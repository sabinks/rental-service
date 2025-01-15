import { Schema, model } from "mongoose"
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);
const reviewSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
}, { timestamps: true });

function validateRentalReview(data) {
    const schema = Joi.object({
        userId: myJoiObjectId().required(),
        carId: myJoiObjectId().required(),
        rating: Joi.number().required(),
        comment: Joi.string().required(),
    })
    return schema.validate(data, { abortEarly: false })
}

const Review = model('Review', reviewSchema)

export { Review, reviewSchema, validateRentalReview }
