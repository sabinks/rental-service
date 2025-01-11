import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
    const token = req.header('x-auth-token')
    if (!token) {
        return res.status(401).send('Access denied. No token provided')
    }
    try {
        const decoded = jwt.verify(token, process.env.SALT)
        req.user = decoded
        next()
    } catch (error) {
        res.status(400).send('Invalid token!')
    }
}