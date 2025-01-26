function getCustomerSync(id) {
    console.log('Reading a customer from MongoDB')
    return { id: id, points: 9, email: "test@test.com" }
}
async function getCustomer(id) {
    return new Promise((res, rej) => {
        console.log('Reading a customer from MongoDB');
        res({ id: id, points: 11 })
    })
}

export { getCustomer, getCustomerSync }