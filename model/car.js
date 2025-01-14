import { Schema, model } from "mongoose";

const carSchema = new Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    licensePlate: { type: String, unique: true, required: true },
    category: { type: String, enum: ['SUV', 'Sedan', 'Truck'], required: true },
    pricePerDay: { type: Number, required: true },
    features: [{ type: String }],
    ratings: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
    }],
    maintenance: [{
        date: { type: Date },
        details: { type: String },
        cost: { type: Number },
    }],
    availabilityHistory: [{
        date: { type: Date },
        status: { type: String, enum: ['rented', 'available', 'maintenance'] },
    }],
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
    },
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

function validateCar(user) {
    const schema = Joi.object({
        make: Joi.string().required(),
        model: Joi.string().required(),
        year: Joi.number().required(),
        licensePlate: Joi.string().required(),
        category: Joi.string().required(),
        pricePerDay: Joi.number().required(),
        features: Joi.string().required(),
    })
    return schema.validate(user, { abortEarly: false })
}
const Car = model('Car', carSchema)

export { Car, carSchema, validateCar }