import _ from 'lodash'
import express from 'express'
import { User, validateUser, validatProfileUpdate } from '../model/user.js'
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
        <p>This link expires in 1 hour.</p>
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
    const { name: newName, phone, address: { street, city, state, zip }, preferences: { preferredCarTypes, notificationEnabled } } = req.body
    const { _id, name } = req.user
    console.log(preferredCarTypes);
    console.log(typeof preferredCarTypes);

    const user = await User.findOne({ _id, name })
    user.name = newName
    user.phone = phone
    user.set({ address: { street, city, state, zip } })
    user.set({ preferences: { notificationEnabled, preferredCarTypes } })
    await user.save()
    // const token = user.generateAuthToken()
    res
        // .header('x-auth-token', token)
        .send(_.pick(user, ['_id', 'name', 'email']));
})

export default router