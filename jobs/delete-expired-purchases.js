var purchasesPath = require('../paths/purchases')
var deleteExpired = require('./delete-expired')

module.exports = deleteExpired(purchasesPath)
