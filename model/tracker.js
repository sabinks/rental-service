import { model, Schema } from "mongoose";

const trackerSchema = new Schema({
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental' }, // Optional (if the vehicle is rented)
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    speed: { type: Number, default: 0 }, // in km/h
    fuelLevel: { type: Number, min: 0, max: 100, default: 100 }, // in percentage
    engineStatus: { type: Boolean, default: true }, // true = on, false = off
    lastUpdated: { type: Date, default: Date.now }
});
const Tracker = model('Tracker', trackerSchema);

export { Tracker, trackerSchema }