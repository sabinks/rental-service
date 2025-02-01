const bcrypt = require('bcrypt');
const saltRounds = 12; // Typically a value between 10 and 12

async function genHash(password) {
    const salt = await bcrypt.genSalt(saltRounds)
    return bcrypt.hash(password, salt)
}
async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword)
}

exports.genHash = genHash
exports.comparePassword = comparePassword