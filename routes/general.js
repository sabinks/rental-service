import _ from 'lodash'
import express from 'express'
import { User, validateUser, validatProfileUpdate } from '../model/user.js'
import { createRandomString, genHash } from '../utils.js'
import authMiddleware from '../middleware/authMiddleware.js'
import sendMail from '../mailer/index.js'

const router = express.Router()

router.get('/verify-email', async (req, res) => {
    const { token, userId } = req.query

    const user = await User.findOneAndDelete({ verificationToken: token, _id: userId })
    if (!user) {
        return res.send('Token expired of mismatch').status(400)
    }
    user.emailVerifiedAt = new Date()
    user.isActive = true
    user.verificationToken = ''
    await user.save()
    res
        // .header('x-auth-token', token)
        .send(_.pick(user, ['_id', 'name', 'email']));
})

export default router