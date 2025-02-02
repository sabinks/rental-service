import jwt from 'jsonwebtoken'
import config from 'config'
export default function authMiddleware(req, res, next) {
    const token = req.header('x-auth-token')
    if (!token) {
        return res.status(401).send('Access denied. No token provided')
    }
    try {
        const key = config.get('jwtPrivateKey') || process.env.JWT_SECRET
        const decoded = jwt.verify(token, key)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).send('Invalid token!')
    }
}