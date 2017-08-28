var ordersPath = require('../paths/orders')
var deleteExpired = require('./delete-expired')

module.exports = deleteExpired(ordersPath)
