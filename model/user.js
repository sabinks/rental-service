import { Schema, model } from "mongoose";
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import JoiObjectId from "joi-objectid";
const myJoiObjectId = JoiObjectId(Joi);
import config from 'config'
import passwordComplexity from 'joi-password-complexity'

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    customerId: { type: String },
    address: {
        street: String,
        city: String,
        state: String,
        zip: {
            type: String, uppercase: true
        },
        country: { type: String, default: 'Canada' },
    },
    preferences: {
        preferredCarTypes: [{ type: String }],
        notificationEnabled: { type: Boolean, default: true },
    },
    resetToken: { type: String, default: '' },
    emailVerifiedAt: { type: String, default: null },
    isActive: { type: Boolean, default: false },
    verificationToken: { type: String, default: '' },
}, { timestamps: true });

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().alphanum().min(5).max(50).required(),
        email: Joi.string().email().required(),
        password: passwordComplexity({
            min: 8,
            max: 25,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            symbol: 1,
        }),
        phone: Joi.string().required(),
    })
    return schema.validate(user, { abortEarly: false })
}

function validateForgotPassword(data) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
    })
    return schema.validate(data, { abortEarly: false })
}
function validateResetPassword(data) {
    const schema = Joi.object({
        _id: myJoiObjectId().required(),
        token: Joi.string().required(),
        email: Joi.string().email().required(),
        password: passwordComplexity({
            min: 8,
            max: 25,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            symbol: 1,
        }),
    })
    return schema.validate(data, { abortEarly: false })
}
function validatProfileUpdate(userData) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        phone: Joi.string().required(),
        address: Joi.object().keys({
            street: Joi.string().allow(''),
            city: Joi.string().allow(''),
            state: Joi.string().allow(''),
            zip: Joi.string().allow(''),
        }),
        preferences: Joi.object().keys({
            preferredCarTypes: Joi.array().items(Joi.string()),
            notificationEnabled: Joi.boolean()
        })
    })
    return schema.validate(userData, { abortEarly: false })
}

function validateLogin(user) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    })
    return schema.validate(user, { abortEarly: false })
}

userSchema.methods.generateAuthToken = function () {
    const key = config.get('jwtPrivateKey') || process.env.JWT_SECRET
    return jwt.sign({ _id: this._id, name: this.name, role: this.role }, key)
}

const User = model('User', userSchema)

export { User, userSchema, validateUser, validateLogin, validatProfileUpdate, validateForgotPassword, validateResetPassword }