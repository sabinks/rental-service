import { model, Schema } from "mongoose";
import Joi from "joi";
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);
const paymentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: false },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
    stripePaymentId: { type: String, required: false },
    amount: { type: Number },
    currency: { type: String, default: 'CAD' },
    status: { type: String, enum: ['succeeded', 'failed', 'pending', 'refunded'], required: true },
    refund: {
        amount: { type: Number },
        reason: { type: String },
        initiatedAt: { type: Date },
    },
}, { timestamps: true });
function validateRentalPayment(data) {
    const schema = Joi.object({
        rentalId: myJoiObjectId().required(),
        paymentId: myJoiObjectId().required(),
        stripePaymentId: Joi.string().required(),
        amount: Joi.number().required(),
        currency: Joi.string().required(),
        status: Joi.string().required(),
    })
    return schema.validate(data, { abortEarly: false })
}
const Payment = model('Payment', paymentSchema)

export { Payment, paymentSchema, validateRentalPayment }
