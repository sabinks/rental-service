import { model, Schema } from "mongoose";

const notificationSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Vehicle = model('Notification', notificationSchema);
export { Vehicle, notificationSchema }