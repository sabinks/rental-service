import { model, Schema } from "mongoose";

const paymentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
    stripePaymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CAD' },
    status: { type: String, enum: ['succeeded', 'failed', 'pending', 'refunded'], required: true },
    refund: {
        amount: { type: Number },
        reason: { type: String },
        initiatedAt: { type: Date },
    },
}, { timestamps: true });

const Payment = model('Payment', paymentSchema)

export { Payment, paymentSchema }
