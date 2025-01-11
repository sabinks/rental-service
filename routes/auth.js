import express from 'express'
import { User, validateLogin } from '../model/user.js'
import { comparePassword } from '../../express-demo/hash.js'
import auth from '../middleware/authMiddleware.js'
const router = express.Router()

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password')
    res.send(user)
})

router.post('/login', async (req, res) => {
    const { error } = validateLogin(req.body)
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { email, password } = req.body
    const userExists = await User.findOne({ email })
    if (!userExists) {
        return res.status(400).send('Invalid email or password')
    }
    const result = comparePassword(password, userExists.password)
    if (!result) {
        return res.status(400).send('Invalid email or password')
    }
    const token = userExists.generateAuthToken()
    res.send({ access_token: token })
})

router.post('/logout', auth, async (req, res) => {
    res.clearCookie('x-auth-token');
    res.status(200).send({ message: 'Logged out successfully' });
})


export default router