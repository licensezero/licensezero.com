var crypto = require('crypto')

module.exports = function randomNonce () {
  return crypto.randomBytes(32).toString('hex')
}

