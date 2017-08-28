var resetTokensPath = require('../paths/reset-tokens')
var deleteExpired = require('./delete-expired')

module.exports = deleteExpired(resetTokensPath)
