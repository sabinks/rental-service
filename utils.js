import bcrypt from 'bcrypt'
const saltRounds = 12; // Typically a value between 10 and 12

async function genHash(password) {
    const salt = await bcrypt.genSalt(saltRounds)
    return bcrypt.hash(password, salt)
}
async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword)
}
function createRandomString(length = 50) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export { genHash, comparePassword, createRandomString }