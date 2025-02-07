import { Schema, model } from "mongoose"
import Joi from "joi";
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);
const reviewSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    publish: { type: Boolean, default: false }
}, { timestamps: true });

function validateRentalReview(data) {
    const schema = Joi.object({
        rentalId: myJoiObjectId().required(),
        rating: Joi.number().required(),
        comment: Joi.string().required(),
    })
    return schema.validate(data, { abortEarly: false })
}
reviewSchema.static('isReviewed', function (rentalId, userId) {
    return this.findOne({ rentalId, userId })
})
const Review = model('Review', reviewSchema)

export { Review, reviewSchema, validateRentalReview }
