import mongoose from "mongoose"
import authMiddleware from "../../middleware/authMiddleware"
import { User } from "../../model/user"

describe('auth middleware', () => {
    it('should populate req.user with the payload of a valid JWT', () => {
        const user = { _id: new mongoose.Types.ObjectId().toHexString(), name: 'Admin', role: 'admin' }
        const token = new User(user).generateAuthToken()
        const req = {
            header: jest.fn().mockReturnValue(token)
        }
        const res = {}
        const next = jest.fn()

        authMiddleware(req, res, next)

        expect(req.user).toBeDefined()
        expect(req.user).toMatchObject(user)
    })
})