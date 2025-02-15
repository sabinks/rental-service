import { Schema, model } from "mongoose";
import Joi from 'joi'
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);

const vehicleSchema = new Schema({
    make: { type: String, required: true, },
    model: { type: String, required: true },
    year: { type: String, required: true, },
    licensePlate: { type: String, unique: true, required: true },
    category: { type: String, enum: ['SUV', 'Sedan', 'Truck'], required: true },
    pricePerDay: { type: Number, required: true },
    features: [{ type: String }],
    ratings: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
    }],
    rating: { type: String, default: 0 },
    numRating: { type: String, default: 0 },
    maintenance: [{
        date: { type: Date },
        details: { type: String },
        cost: { type: Number },
    }],
    availabilityHistory: [{
        date: { type: Date },
        status: { type: String, enum: ['rented', 'available', 'maintenance'] },
    }],
    images: [{ type: String }],
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
    },
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

function validateVehicle(data) {
    const schema = Joi.object({
        make: Joi.string().required(),
        model: Joi.string().required(),
        year: Joi.string().required(),
        licensePlate: Joi.string().required(),
        category: Joi.string().required(),
        pricePerDay: Joi.number().required(),
        features: Joi.array().items(Joi.string())
    })
    return schema.validate(data, { abortEarly: false })
}
function validateRating(data) {
    const schema = Joi.object({
        vehicleId: myJoiObjectId().required(),
        rating: Joi.number().required(),
        comment: Joi.string().required(),
    })
    return schema.validate(data, { abortEarly: false })
}
function validateMaintenance(data) {
    const schema = Joi.object({
        vehicleId: myJoiObjectId().required(),
        date: Joi.string().required(),
        details: Joi.string().required(),
        cost: Joi.number().required(),
    })
    return schema.validate(data, { abortEarly: false })
}

const Vehicle = model('Vehicle', vehicleSchema)

export { Vehicle, vehicleSchema, validateVehicle, validateRating, validateMaintenance }