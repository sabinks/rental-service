import _ from 'lodash'
import express from 'express'
import { User, validateUser } from '../model/user.js'
import { genHash } from '../hash.js'

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
    user.active = false
    user.isAdmin = false
    await user.save()
    // const token = user.generateAuthToken()
    res
        // .header('x-auth-token', token)
        .send(_.pick(user, ['_id', 'name', 'email']));
})
export default router