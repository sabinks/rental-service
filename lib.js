import { getCustomerSync } from "./db.js";
import { send } from "./mail.js";

function absolute(number) {
    if (number >= 0) return number;
    return -number;
}

function greet(name) {
    return `Welcome ${name}!`
}

function getCurrencies() {
    return ['CAD', 'NP', 'AUS']
}

function getProduct(productId) {
    return { id: productId, price: 10, category: "a" }
}

function registerUser(username) {
    if (!username) throw new Error('Username is required.')

    return {
        id: new Date().getTime(), username
    }
}

function fizzBuzz(input) {
    if (typeof input !== 'number') {
        throw new Error('Input should be number.')
    }
    if (input % 3 === 0 && input % 5 === 0) {
        return 'FizzBuzz'
    }
    if (input % 3 === 0) {
        return 'Fizz'
    }
    if (input % 5 === 0) {
        return 'Buzz'
    }
    return input
}

function applyDiscount(order) {
    const customer = getCustomerSync(order.customerId)

    if (customer.points > 10) {
        order.totalPrice *= 0.9
    }
    return order
}

function notifyCustomer(order) {
    const customer = getCustomerSync(order.customerId)
    send(customer.email, 'Your order was placed successfully.')
}

export {
    absolute, greet, getCurrencies, getProduct, registerUser, fizzBuzz,
    applyDiscount, notifyCustomer
}