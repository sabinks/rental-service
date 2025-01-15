import Joi from "joi";
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);
import { Schema, model } from 'mongoose'

const rentalSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    totalDays: { type: Number },
    baseCost: { type: Number, required: true },
    discount: {
        code: { type: String },
        amount: { type: Number, default: 0 },
    },
    extras: [{
        type: { type: String },
        cost: { type: Number },
    }],
    finalCost: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

function validateRental(data) {
    const schema = Joi.object({
        carId: myJoiObjectId().required(),
        rentalStart: Joi.string().required(),
        rentalEnd: Joi.string().required(),
    })
    return schema.validate(data, { abortEarly: false })
}

const Rental = model('Rental', rentalSchema)

export { Rental, rentalSchema, validateRental }
