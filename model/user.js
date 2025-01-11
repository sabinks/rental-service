import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import passwordComplexity from 'joi-password-complexity'
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        maxlength: 1024,
        required: true
    },
    active: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})
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
        })
    })
    return schema.validate(user, { abortEarly: false })
}
function validateLogin(user) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
    return schema.validate(user, { abortEarly: false })
}
userSchema.methods.generateAuthToken = function () {
    const key = process.env.SALT
    return jwt.sign({ _id: this._id, name: this.name, isAdmin: this.isAdmin }, key)
}
const User = mongoose.model('User', userSchema)
export { User, userSchema, validateUser, validateLogin }