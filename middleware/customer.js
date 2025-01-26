export default function customer(req, res, next) {
    if (req.user.role !== 'customer') {
        return res.status(403).send('Access Denied!')
    }
    next()
}