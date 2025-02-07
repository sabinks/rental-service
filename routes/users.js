import _ from 'lodash'
import express from 'express'
import { User, validateForgotPassword, validateResetPassword, validateUser, validatProfileUpdate } from '../model/user.js'
import { createRandomString, genHash } from '../utils.js'
import authMiddleware from '../middleware/authMiddleware.js'
import sendMail from '../mailer/index.js'

const router = express.Router()

router.post('/register', async (req, res) => {
    const { error } = validateUser(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { name, email, password } = req.body
    const userExists = await User.findOne({ email })
    if (userExists) {
        return res.status(400).send('User already registered!')
    }
    const hashedPassword = await genHash(password)
    const user = new User({
        name, email, password: hashedPassword
    })
    user.isActive = false
    user.role = 'customer'
    user.verificationToken = createRandomString()
    await user.save()
    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${user.verificationToken}&userId=${user._id}`;
    const data = {
        email: user.email,
        name: user.name,
        subject: "Email Verification",
        html: `
        <h3>Hello ${name},</h3>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>Thank you.</p>
          `,
    }
    sendMail(data)
    res
        .send(_.pick(user, ['_id', 'name', 'email']));
})
router.post('/forgot-password', async (req, res) => {
    const { error } = validateForgotPassword(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        return res.status(400).send('User record not found!')
    }
    user.isActive = false
    user.resetToken = createRandomString(16)
    await user.save()
    const passwordResetLink = `${process.env.BASE_URL}/reset-password?token=${user.resetToken}&userId=${user._id}`;
    const data = {
        email: user.email,
        name: user.name,
        subject: "Reset Password Mail",
        html: `
        <h3>Hello ${user.name},</h3>
        <p>Click the link below to reset the password.</p>
        <a href="${passwordResetLink}">Reset Password</a>
        <p>Thank you.</p>
      `,
    }
    sendMail(data)
    res
        .send(_.pick(user, ['_id', 'name', 'email']));
})
router.post('/reset-password', async (req, res) => {
    const { error } = validateResetPassword(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { _id, token, email, password } = req.body
    const user = await User.findOne({ _id, email, resetToken: token })
    if (!user) {
        return res.status(400).send('User record not found!')
    }
    user.password = await genHash(password)
    user.isActive = true
    user.resetToken = ''
    await user.save()
    const data = {
        email: user.email,
        name: user.name,
        subject: "Reset Password Success",
        html: `
        <h3>Hello ${user.name},</h3>
        <p>Password reset successful.</p>
        <p>Thank you.</p>
      `,
    }
    sendMail(data)
    res
        .send(_.pick(user, ['_id', 'name', 'email']));
})
router.post('/profile', authMiddleware, async (req, res) => {
    const { error } = validatProfileUpdate(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { name: newName, phone, address: { street, city, state, zip }, preferences: { preferredVehicleTypes, notificationEnabled } } = req.body
    const { _id, name } = req.user
    const user = await User.findOne({ _id, name })
    user.name = newName
    user.phone = phone
    user.set({ address: { street, city, state, zip } })
    user.set({ preferences: { notificationEnabled, preferredVehicleTypes } })
    await user.save()
    // const token = user.generateAuthToken()
    res
        // .header('x-auth-token', token)
        .send(_.pick(user, ['_id', 'name', 'email']));
})

export default router