import * as dbModule from "../db.js"
import * as mailModule from "../mail.js"
import { absolute, applyDiscount, fizzBuzz, getCurrencies, getProduct, greet, notifyCustomer, registerUser } from "../lib.js"

describe('absolute', () => {
    it('absolute - should return positive if input is positive', () => {
        const result = absolute(10)
        expect(result).toBe(10)
    })
    it('absolute - should return positive if input is negative', () => {
        const result = absolute(-10)
        expect(result).toBe(10)
    })
    it('absolute - should return zero if input is zero', () => {
        const result = absolute(0)
        expect(result).toBe(0)
    })
})

describe('greet', () => {
    it('should return the greeting message', () => {
        const result = greet('Sabin')
        expect(result).toMatch(/welcome sabin/i)
    })
})

describe('currencies', () => {
    it('should return supported currencies', () => {
        const result = getCurrencies()
        expect(result.length).toBe(3)
        expect(result).toContain('CAD')
        expect(result).toContain('NP')
        expect(result).toContain('AUS')
        expect(result).toEqual(expect.arrayContaining(['NP', 'CAD', 'AUS']))
    })
})

describe('getProduct', () => {
    it('should return the product with the given id', () => {
        const result = getProduct(1)
        expect(result).toEqual({ id: 1, price: 10, category: "a" })
        expect(result).toMatchObject({ id: 1 })
        expect(result).toHaveProperty('id', 1)
    })
})
describe('getUser', () => {
    it('should throw if username is falsy', () => {
        const args = [null, undefined, NaN, '', 0, false]
        args.forEach(arg => {
            expect(() => { registerUser(arg) }).toThrow()
        })
    })
    it('should return a user object if valid username is passed', () => {
        const result = registerUser("Sabin")
        expect(result).toHaveProperty('username', "Sabin")
        expect(result.id).toBeGreaterThan(0)
    })
})
describe('fizzBuzz', () => {
    it('should return error if number is not of type number', () => {
        expect(() => fizzBuzz("a")).toThrow
    })
    it('should return error if number is not of type number', () => {
        expect(() => fizzBuzz(null)).toThrow
    })
    it('should return FizzBuzz if number is divisible by both 3 and 5', () => {
        const result = fizzBuzz(15)
        expect(result).toBe('FizzBuzz')
    })
    it('should return FizzBuzz if number is divisible by 3', () => {
        const result = fizzBuzz(3)
        expect(result).toBe('Fizz')
    })
    it('should return FizzBuzz if number is divisible by 5', () => {
        const result = fizzBuzz(5)
        expect(result).toBe('Buzz')
    })
    it('should return original if number is not divisible by 3 or 5 or both', () => {
        const result = fizzBuzz(22)
        expect(result).toBe(22)
    })
})
describe('applyDiscount', () => {
    it('should apply 10% discount if customer has more than 10 points ', () => {
        dbModule.getCustomerSync = jest.fn().mockReturnValue({ id: 1, points: 11, email: 'test@test.com' })
        const order = { customerId: 1, totalPrice: 20 }
        const result = applyDiscount(order)
        expect(result.totalPrice).toBe(18)
    })
    it('should apply 0% discount if customer has less than 10 points ', () => {
        dbModule.getCustomerSync = jest.fn().mockReturnValue({ id: 1, points: 10, email: 'test@test.com' })
        const order = { customerId: 1, totalPrice: 20 }
        const result = applyDiscount(order)
        expect(result.totalPrice).toBe(20)
    })
})
describe('notifyCustomer', () => {
    it('should send an email to the customer', () => {
        dbModule.getCustomerSync = jest.fn().mockReturnValue({ id: 1, points: 11, email: 'test1@test.com' })
        mailModule.send = jest.fn()
        const order = { customerId: 1 }
        notifyCustomer(order)
        expect(mailModule.send).toHaveBeenCalled()
        expect(mailModule.send.mock.calls[0][0]).toBe('test1@test.com')
    })
})
