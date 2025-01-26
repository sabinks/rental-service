import winston from 'winston'

function errorMiddleware(err, req, res, next) {
    winston.error(err.message, err)
    res.send(500).send('Something failed!')
}
export default errorMiddleware