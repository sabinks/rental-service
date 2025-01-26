function validate(validator) {
    return (req, res, next) => {
        const { error } = validator(req.body, { abortEarly: false })
        if (error) {
            const errors = error.details.map(err => ({
                message: err.message,
                key: err.context.key
            }))
            return res.status(422).send(errors)
        }
        next()
    }
}
export default validate