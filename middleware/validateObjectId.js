import mongoose from "mongoose"

function validateObjectID(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Invalid parameter id')
    }
    next()
}
export default validateObjectID 