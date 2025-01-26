export default function staff(req, res, next) {
    if (req.user.role !== 'staff') {
        return res.status(403).send('Access Denied!')
    }
    next()
}